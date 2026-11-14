"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { LogIn, Sparkles } from "lucide-react"

export default function AdminLoginPage() {
 const [email, setEmail] = useState("")
 const [password, setPassword] = useState("")
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState("")
 const router = useRouter()
 const supabase = createClient()

 const handleLogin = async (e: React.FormEvent) => {
 e.preventDefault()
 setLoading(true)
 setError("")

 const { error } = await supabase.auth.signInWithPassword({ email, password })

 if (error) {
 setError(error.message)
 setLoading(false)
 return
 }

 router.push("/admin")
 router.refresh()
 }

 const handleDemoLogin = () => {
 document.cookie = "deliverysaas_demo_session=true; path=/; max-age=86400; SameSite=Lax"
 localStorage.setItem("deliverysaas_demo_session", "true")
 localStorage.setItem("deliverysaas_demo_account", JSON.stringify({
 id: "demo-ayrton",
 storeName: "Demo Burger 🍔",
 email: "ayrton@kyndoorder.com.br",
 whatsapp: "11999999999",
 createdAt: new Date().toISOString(),
 }))
 router.push("/admin")
 router.refresh()
 }

 return (
 <div className="min-h-screen bg-kyndo-ice flex items-center justify-center px-4">
 <div className="w-full max-w-sm space-y-8">
 <div className="text-center">
 <div className="w-16 h-16 bg-kyndo-orange rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
 <LogIn className="w-8 h-8 text-white" />
 </div>
 <h1 className="text-2xl font-bold text-kyndo-graphite">Painel do Lojista</h1>
 <p className="text-kyndo-slate mt-2 text-sm">Acesse sua conta para gerenciar sua loja</p>
 </div>

 {/* Botão Demo */}
 <button
 onClick={handleDemoLogin}
 className="w-full bg-kyndo-orange hover:bg-kyndo-orange-hover text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
 >
 <Sparkles className="w-5 h-5" /> Entrar como Demo (Ayrton)
 </button>

 <div className="relative">
 <div className="absolute inset-0 flex items-center">
 <div className="w-full border-t border-zinc-200"></div>
 </div>
 <div className="relative flex justify-center text-xs">
 <span className="bg-kyndo-ice px-3 text-kyndo-slate">ou entre com sua conta</span>
 </div>
 </div>

 <form onSubmit={handleLogin} className="space-y-4">
 {error && (
 <div className="bg-kyndo-danger-bg border border-red-200 text-kyndo-danger text-sm px-4 py-3 rounded-xl">
 {error}
 </div>
 )}

 <div>
 <label className="block text-sm font-medium text-kyndo-slate mb-1.5">E-mail</label>
 <input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 required
 className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-kyndo-graphite focus:border-kyndo-orange focus:ring-1 focus:ring-kyndo-orange outline-none transition-colors"
 placeholder="seu@email.com"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-kyndo-slate mb-1.5">Senha</label>
 <input
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 required
 className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-kyndo-graphite focus:border-kyndo-orange focus:ring-1 focus:ring-kyndo-orange outline-none transition-colors"
 placeholder="••••••••"
 />
 </div>

 <button
 type="submit"
 disabled={loading}
 className="w-full bg-kyndo-graphite hover:bg-zinc-800 disabled:bg-zinc-400 text-white font-bold py-3.5 rounded-xl transition-colors"
 >
 {loading ? "Entrando..." : "Entrar"}
 </button>
 </form>

 <div className="text-center space-y-3 pt-2">
 <Link
 href="/admin/register"
 className="block text-sm text-kyndo-orange hover:text-kyndo-orange-hover transition-colors font-medium"
 >
 Não tem conta? → Criar minha loja
 </Link>
 <p className="text-kyndo-slate text-xs">
 <span className="kyndo-wordmark"><span className="text-kyndo-graphite">kyndo</span><span className="dot">.</span></span>
 {" "}ORDER &copy; 2026
 </p>
 </div>
 </div>
 </div>
 )
}