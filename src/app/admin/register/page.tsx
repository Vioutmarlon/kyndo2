"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { UserPlus } from "lucide-react"

export default function AdminRegisterPage() {
 const [storeName, setStoreName] = useState("")
 const [email, setEmail] = useState("")
 const [password, setPassword] = useState("")
 const [whatsapp, setWhatsapp] = useState("")
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState("")
 const router = useRouter()

 const handleRegister = async (e: React.FormEvent) => {
 e.preventDefault()
 setLoading(true)
 setError("")

 // Modo demo: salva credenciais no localStorage
 if (!storeName || !email || !password) {
 setError("Preencha todos os campos obrigatórios")
 setLoading(false)
 return
 }

 // Simular criação de conta (modo demo)
 const demoAccount = {
 id: `demo-${Date.now()}`,
 storeName,
 email,
 whatsapp,
 createdAt: new Date().toISOString(),
 }

 localStorage.setItem("deliverysaas_demo_account", JSON.stringify(demoAccount))
 localStorage.setItem("deliverysaas_demo_session", "true")

 // Redirecionar para dashboard
 router.push("/admin")
 router.refresh()
 }

 return (
 <div className="min-h-screen bg-zinc-950 flex items-center justify-center px-4">
 <div className="w-full max-w-sm space-y-8">
 <div className="text-center">
 <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
 <UserPlus className="w-8 h-8 text-white" />
 </div>
 <h1 className="text-2xl font-bold text-white">Criar Conta de Lojista</h1>
 <p className="text-zinc-400 mt-2 text-sm">Cadastre sua loja e comece a receber pedidos</p>
 </div>

 <form onSubmit={handleRegister} className="space-y-4">
 {error && (
 <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
 {error}
 </div>
 )}

 <div>
 <label className="block text-sm font-medium text-zinc-400 mb-1.5">Nome da Loja *</label>
 <input
 type="text"
 value={storeName}
 onChange={(e) => setStoreName(e.target.value)}
 required
 className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none transition-colors"
 placeholder="Minha Hamburgueria"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-zinc-400 mb-1.5">E-mail *</label>
 <input
 type="email"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 required
 className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none transition-colors"
 placeholder="seu@email.com"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-zinc-400 mb-1.5">WhatsApp</label>
 <input
 type="tel"
 value={whatsapp}
 onChange={(e) => setWhatsapp(e.target.value)}
 className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none transition-colors"
 placeholder="(11) 99999-9999"
 />
 </div>

 <div>
 <label className="block text-sm font-medium text-zinc-400 mb-1.5">Senha *</label>
 <input
 type="password"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 required
 minLength={6}
 className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-orange-500 outline-none transition-colors"
 placeholder="Mínimo 6 caracteres"
 />
 </div>

 <button
 type="submit"
 disabled={loading}
 className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 text-white font-bold py-3.5 rounded-xl transition-colors"
 >
 {loading ? "Criando conta..." : "Criar Minha Conta"}
 </button>
 </form>

 <div className="text-center space-y-3">
 <Link
 href="/admin/login"
 className="block text-sm text-orange-400 hover:text-orange-300 transition-colors"
 >
 Já tenho conta → Entrar
 </Link>
 <p className="text-zinc-500 text-xs">
 DeliverySaaS &copy; 2026
 </p>
 </div>
 </div>
 </div>
 )
}