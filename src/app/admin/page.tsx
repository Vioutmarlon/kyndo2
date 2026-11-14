"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import { AdminDashboard } from "./dashboard"
import type { Tenant, Product } from "@/lib/supabase"

// Dados mock para modo demo
const DEMO_TENANT: Tenant = {
 id: "demo-ayrton",
 slug: "demo-burger",
 name: "Demo Burger 🍔",
 logo_url: undefined,
 banner_url: undefined,
 primary_color: "#f97316",
 whatsapp_number: "11999999999",
 address: "Rua das Flores, 123 - Centro",
 delivery_fee: 5.0,
 is_open: true,
 opening_hours: {},
 created_at: new Date().toISOString(),
 updated_at: new Date().toISOString(),
}

export default function AdminPage() {
 const [loading, setLoading] = useState(true)
 const [tenant, setTenant] = useState<Tenant | null>(null)
 const [products, setProducts] = useState<(Product & { categories?: { name: string } })[]>([])
 const router = useRouter()

 useEffect(() => {
 async function load() {
 // Verificar modo demo primeiro
 const demoSession = localStorage.getItem("deliverysaas_demo_session")
 if (demoSession === "true") {
 const demoAccount = JSON.parse(localStorage.getItem("deliverysaas_demo_account") || "{}")
 setTenant({
 ...DEMO_TENANT,
 name: demoAccount.storeName || DEMO_TENANT.name,
 whatsapp_number: demoAccount.whatsapp || DEMO_TENANT.whatsapp_number,
 })
 setProducts([]) // O dashboard carrega os produtos demo internamente
 setLoading(false)
 return
 }

 // Tentar autenticação Supabase
 try {
 const supabase = createClient()
 const { data: { session } } = await supabase.auth.getSession()

 if (!session) {
 router.push("/admin/login")
 return
 }

 const { data: tenantData } = await supabase
 .from("tenants")
 .select("*")
 .eq("owner_id", session.user.id)
 .single()

 if (!tenantData) {
 router.push("/admin/onboarding")
 return
 }

 setTenant(tenantData)

 const { data: productsData } = await supabase
 .from("products")
 .select("*, categories(name)")
 .eq("tenant_id", tenantData.id)
 .order("created_at", { ascending: false })

 setProducts(productsData ?? [])
 } catch {
 router.push("/admin/login")
 return
 }

 setLoading(false)
 }

 load()
 }, [router])

 if (loading) {
 return (
 <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
 <div className="text-center space-y-4">
 <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
 <p className="text-zinc-400 text-sm">Carregando painel...</p>
 </div>
 </div>
 )
 }

 if (!tenant) {
 return null // Redirecionando...
 }

 return <AdminDashboard tenant={tenant} products={products} />
}