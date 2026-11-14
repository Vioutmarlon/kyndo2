import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
 return createBrowserClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
 )
}

// Tipos para o schema multi-tenant
export interface Tenant {
 id: string
 slug: string
 name: string
 logo_url?: string
 banner_url?: string
 primary_color: string
 whatsapp_number: string
 address: string
 delivery_fee: number
 is_open: boolean
 opening_hours: Record<string, { open: string; close: string }>
 created_at: string
 updated_at: string
}

export interface Category {
 id: string
 tenant_id: string
 name: string
 sort_order: number
 is_active: boolean
}

export interface Product {
 id: string
 tenant_id: string
 category_id: string
 name: string
 description: string
 price: number
 image_url?: string
 is_available: boolean
 has_options: boolean
 options?: ProductOption[]
 extras?: ProductExtra[]
}

export interface ProductOption {
 id: string
 product_id: string
 name: string
 choices: string[] // ex: ["Mal passada", "Ao ponto", "Bem passada"]
 required: boolean
}

export interface ProductExtra {
 id: string
 product_id: string
 name: string
 price: number
}

export interface Coupon {
 id: string
 tenant_id: string
 code: string
 discount_type: "percentage" | "fixed"
 discount_value: number
 min_order: number
 max_uses: number
 current_uses: number
 expires_at?: string
 is_active: boolean
}

export interface Order {
 id: string
 tenant_id: string
 customer_name: string
 customer_phone: string
 items: OrderItem[]
 subtotal: number
 discount: number
 total: number
 address?: string
 payment_method: string
 change_for?: number
 delivery_type: "delivery" | "pickup"
 status: "pending" | "confirmed" | "preparing" | "delivering" | "completed" | "cancelled"
 coupon_code?: string
 created_at: string
}

export interface OrderItem {
 product_id: string
 product_name: string
 quantity: number
 unit_price: number
 selected_option?: string
 extras: string[]
 observations?: string
}