"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Storefront } from "./storefront"
import type { Tenant, Category, Product } from "@/lib/supabase"

export default function TenantPage({
 params,
}: {
 params: Promise<{ tenant: string }>
}) {
 const [slug, setSlug] = useState<string>("")
 const [store, setStore] = useState<Tenant | null>(null)
 const [categories, setCategories] = useState<(Category & { products: Product[] })[]>([])
 const [loading, setLoading] = useState(true)
 const [error, setError] = useState(false)

 useEffect(() => {
 params.then((p) => setSlug(p.tenant))
 }, [params])

 useEffect(() => {
 if (!slug) return

 const supabase = createClient()

 async function load() {
 const { data: tenantData, error: tenantError } = await supabase
 .from("tenants")
 .select("*")
 .eq("slug", slug)
 .single()

 if (tenantError || !tenantData) {
 setError(true)
 setLoading(false)
 return
 }

 setStore(tenantData)

 const { data: cats } = await supabase
 .from("categories")
 .select("*, products(*)")
 .eq("tenant_id", tenantData.id)
 .eq("is_active", true)
 .order("sort_order", { ascending: true })

 setCategories(cats ?? [])
 setLoading(false)
 }

 load()
 }, [slug])

 if (loading) {
 return (
 <div className="min-h-screen bg-zinc-950 text-zinc-100">
 <div className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur border-b border-zinc-800">
 <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-zinc-800 animate-pulse" />
 <div className="space-y-2">
 <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />
 <div className="h-3 w-20 bg-zinc-800 rounded animate-pulse" />
 </div>
 </div>
 </div>
 <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
 {[1, 2, 3].map((i) => (
 <div key={i} className="space-y-3">
 <div className="h-6 w-40 bg-zinc-800 rounded animate-pulse" />
 <div className="bg-zinc-900 rounded-xl p-4 flex gap-4 border border-zinc-800">
 <div className="w-24 h-24 rounded-lg bg-zinc-800 animate-pulse flex-shrink-0" />
 <div className="flex-1 space-y-2">
 <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse" />
 <div className="h-3 w-1/2 bg-zinc-800 rounded animate-pulse" />
 <div className="h-4 w-20 bg-zinc-800 rounded animate-pulse mt-3" />
 </div>
 </div>
 </div>
 ))}
 </main>
 </div>
 )
 }

 if (error || !store) {
 return (
 <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4">
 <div className="text-center">
 <h1 className="text-4xl font-bold mb-4">404</h1>
 <p className="text-zinc-400 text-lg">Loja não encontrada</p>
 </div>
 </div>
 )
 }

 return <Storefront store={store} categories={categories} />
}