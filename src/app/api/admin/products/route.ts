
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
 import { checkRateLimit, applySecurityHeaders } from "@/lib/api-middleware"

const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().optional(),
  price: z.number().positive("Preço deve ser positivo"),
  category_id: z.string().uuid().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
  is_available: z.boolean().default(true),
  has_options: z.boolean().default(false),
  options: z.array(z.object({
    name: z.string(),
    choices: z.array(z.string()),
    required: z.boolean(),
  })).default([]),
  extras: z.array(z.object({
    name: z.string(),
    price: z.number().positive(),
  })).default([]),
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

export async function GET(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return applySecurityHeaders(rateLimitResponse)

  const tenantId = await getTenantId()
  if (!tenantId) {
    const response = NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    return applySecurityHeaders(response)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: products, error } = await supabase
    .from("products")
    .select("*, categories(name)")
    .eq("tenant_id", tenantId)
    .order("sort_order", { ascending: true })

  if (error) {
    const response = NextResponse.json({ error: error.message }, { status: 500 })
    return applySecurityHeaders(response)
  }

  const response = NextResponse.json(products)
  return applySecurityHeaders(response)
}

export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return applySecurityHeaders(rateLimitResponse)

  const tenantId = await getTenantId()
  if (!tenantId) {
    const response = NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    return applySecurityHeaders(response)
  }

  try {
    const body = await request.json()
    const validated = productSchema.parse(body)

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: product, error } = await supabase
      .from("products")
      .insert({ ...validated, tenant_id: tenantId })
      .select()
      .single()

    if (error) {
      const response = NextResponse.json({ error: error.message }, { status: 500 })
      return applySecurityHeaders(response)
    }

    const response = NextResponse.json(product, { status: 201 })
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

