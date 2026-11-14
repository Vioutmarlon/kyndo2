
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { applySecurityHeaders } from "@/lib/api-middleware"

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["preparing", "cancelled"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["delivering", "cancelled"],
  delivering: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
}

const updateSchema = z.object({
  status: z.enum(["pending", "confirmed", "preparing", "delivering", "completed", "cancelled"]),
})

async function getTenantId() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null

  const { data: tenant } = await supabase
    .from("tenants")
    .select("id")
    .eq("owner_id", session.user.id)
    .single()

  return tenant?.id ?? null
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const tenantId = await getTenantId()
  if (!tenantId) {
    const response = NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    return applySecurityHeaders(response)
  }

  try {
    const { id } = await params
    const body = await request.json()
    const validated = updateSchema.parse(body)

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    // Fetch current order to validate transition
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("status, tenant_id")
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .single()

    if (fetchError || !order) {
      const response = NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 })
      return applySecurityHeaders(response)
    }

    // Validate state transition
    const allowedNext = VALID_TRANSITIONS[order.status] || []
    if (!allowedNext.includes(validated.status)) {
      const response = NextResponse.json(
        { error: `Transição inválida: ${order.status} → ${validated.status}` },
        { status: 400 }
      )
      return applySecurityHeaders(response)
    }

    const { data: updated, error: updateError } = await supabase
      .from("orders")
      .update({ status: validated.status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("tenant_id", tenantId)
      .select()
      .single()

    if (updateError) {
      const response = NextResponse.json({ error: updateError.message }, { status: 500 })
      return applySecurityHeaders(response)
    }

    const response = NextResponse.json(updated)
    return applySecurityHeaders(response)
  } catch (err) {
    if (err instanceof z.ZodError) {
      const response = NextResponse.json({ error: err.issues }, { status: 400 })
      return applySecurityHeaders(response)
    }
    const response = NextResponse.json({ error: "Erro interno" }, { status: 500 })
    return applySecurityHeaders(response)
  }
}

