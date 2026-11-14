import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { checkRateLimit, applySecurityHeaders } from "@/lib/api-middleware"

const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  selected_option: z.string().optional(),
  extras: z.array(z.string()).default([]),
  observations: z.string().optional(),
})

const orderSchema = z.object({
  tenant_id: z.string().uuid(),
  customer_name: z.string().min(1),
  customer_phone: z.string().min(1),
  items: z.array(orderItemSchema).min(1),
  subtotal: z.number().positive(),
  discount: z.number().min(0).default(0),
  total: z.number().positive(),
  address: z.string().optional(),
  payment_method: z.string().min(1),
  change_for: z.number().positive().optional().nullable(),
  delivery_type: z.enum(["delivery", "pickup"]),
  coupon_code: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  const rateLimitResponse = checkRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const validated = orderSchema.parse(body)

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    )

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .select("id, is_open, delivery_fee")
      .eq("id", validated.tenant_id)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: "Loja não encontrada" }, { status: 404 })
    }

    if (!tenant.is_open) {
      return NextResponse.json({ error: "Loja fechada no momento" }, { status: 400 })
    }

    // Server-side price validation: fetch real prices from DB
    const productIds = validated.items.map((i) => i.product_id)
    const { data: dbProducts, error: prodError } = await supabase
      .from("products")
      .select("id, price, is_available, tenant_id")
      .in("id", productIds)
      .eq("tenant_id", validated.tenant_id)

    if (prodError || !dbProducts || dbProducts.length !== productIds.length) {
      return NextResponse.json({ error: "Um ou mais produtos não foram encontrados nesta loja" }, { status: 400 })
    }

    const priceMap = new Map(dbProducts.map((p) => [p.id, p]))
    let serverSubtotal = 0
    for (const item of validated.items) {
      const dbProduct = priceMap.get(item.product_id)
      if (!dbProduct || !dbProduct.is_available) {
        return NextResponse.json({ error: `Produto indisponível: ${item.product_name}` }, { status: 400 })
      }
      serverSubtotal += Number(dbProduct.price) * item.quantity
    }

    let discount = validated.discount
    if (validated.coupon_code) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("tenant_id", validated.tenant_id)
        .eq("code", validated.coupon_code)
        .eq("is_active", true)
        .single()

      if (coupon) {
        if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
          return NextResponse.json({ error: "Cupom expirado" }, { status: 400 })
        }
        if (coupon.max_uses > 0 && coupon.current_uses >= coupon.max_uses) {
          return NextResponse.json({ error: "Cupom esgotado" }, { status: 400 })
        }
        if (serverSubtotal < coupon.min_order) {
          return NextResponse.json(
            { error: `Pedido mínimo para este cupom: R$ ${coupon.min_order}` },
            { status: 400 }
          )
        }

        discount =
          coupon.discount_type === "percentage"
            ? serverSubtotal * (coupon.discount_value / 100)
            : coupon.discount_value

        await supabase
          .from("coupons")
          .update({ current_uses: coupon.current_uses + 1 })
          .eq("id", coupon.id)
      }
    }

    const deliveryFee = validated.delivery_type === "delivery" ? (tenant.delivery_fee ?? 0) : 0
    const total = serverSubtotal - discount + deliveryFee

    const { data: order, error } = await supabase
      .from("orders")
      .insert({
        tenant_id: validated.tenant_id,
        customer_name: validated.customer_name,
        customer_phone: validated.customer_phone,
        items: validated.items,
        subtotal: serverSubtotal,
        discount,
        total,
        address: validated.address,
        payment_method: validated.payment_method,
        change_for: validated.change_for,
        delivery_type: validated.delivery_type,
        coupon_code: validated.coupon_code,
        status: "pending",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const response = NextResponse.json(order, { status: 201 })
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