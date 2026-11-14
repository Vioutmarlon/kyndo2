import { createRouteHandlerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { checkRateLimit, applySecurityHeaders } from "../_middleware"

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
 // Rate limiting
 const rateLimitResponse = checkRateLimit(request)
 if (rateLimitResponse) return rateLimitResponse

 try {
 const body = await request.json()
 const validated = orderSchema.parse(body)

 const cookieStore = await cookies()
 const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

 // Verificar se o tenant existe e está aberto
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

 // Validar cupom se fornecido
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
 if (validated.subtotal < coupon.min_order) {
 return NextResponse.json(
 { error: `Pedido mínimo para este cupom: R$ ${coupon.min_order}` },
 { status: 400 }
 )
 }

 discount =
 coupon.discount_type === "percentage"
 ? validated.subtotal * (coupon.discount_value / 100)
 : coupon.discount_value

 // Incrementar uso do cupom
 await supabase
 .from("coupons")
 .update({ current_uses: coupon.current_uses + 1 })
 .eq("id", coupon.id)
 }
 }

 const deliveryFee = validated.delivery_type === "delivery" ? (tenant.delivery_fee ?? 0) : 0
	 const total = validated.subtotal - discount + deliveryFee

 const { data: order, error } = await supabase
 .from("orders")
 .insert({
 tenant_id: validated.tenant_id,
 customer_name: validated.customer_name,
 customer_phone: validated.customer_phone,
 items: validated.items,
 subtotal: validated.subtotal,
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
 const response = NextResponse.json({ error: err.errors }, { status: 400 })
 return applySecurityHeaders(response)
 }
 const response = NextResponse.json({ error: "Erro interno" }, { status: 500 })
 return applySecurityHeaders(response)
 }
}