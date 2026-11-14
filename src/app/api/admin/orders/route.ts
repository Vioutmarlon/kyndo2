
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import { applySecurityHeaders } from "@/lib/api-middleware"

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

export async function GET(request: NextRequest) {
  const tenantId = await getTenantId()
  if (!tenantId) {
    const response = NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    return applySecurityHeaders(response)
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get("status")
  const limit = parseInt(searchParams.get("limit") || "50", 10)

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  let query = supabase
    .from("orders")
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (status && status !== "all") {
    query = query.eq("status", status)
  }

  const { data: orders, error } = await query

  if (error) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return applySecurityHeaders(response)
  }

  const response = NextResponse.json(orders)
  return applySecurityHeaders(response)
}

