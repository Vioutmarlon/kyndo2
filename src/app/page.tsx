import Link from "next/link"
import { ArrowRight, Store, Shield, Zap } from "lucide-react"

export default function HomePage() {
 return (
 <div className="min-h-screen font-sans" style={{ background: "var(--kyndo-ice)", color: "var(--kyndo-graphite)" }}>
 {/* Header */}
 <header className="border-b border-zinc-200 bg-white/80 backdrop-blur sticky top-0 z-50">
 <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
 <Link href="/" className="flex items-center gap-1 kyndo-wordmark text-xl">
 <span style={{ color: "var(--kyndo-graphite)" }}>kyndo</span>
 <span className="dot">.</span>
 <span className="font-medium ml-1 tracking-wide text-sm" style={{ color: "var(--kyndo-slate)" }}>ORDER</span>
 </Link>
 <Link
 href="/admin/login"
 className="text-sm font-medium transition-colors hover:opacity-80"
 style={{ color: "var(--kyndo-slate)" }}
 >
 Área do Lojista
 </Link>
 </div>
 </header>

 {/* Hero */}
 <section className="max-w-4xl mx-auto px-4 py-20 text-center">
 <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6" style={{ color: "var(--kyndo-graphite)" }}>
 Seu próprio app de pedidos{" "}
 <span style={{ color: "var(--kyndo-orange)" }}>sem taxa por venda</span>
 </h1>
 <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10" style={{ color: "var(--kyndo-slate)" }}>
 Substitua o iFood pelo seu próprio sistema. Pedidos chegam formatados no WhatsApp,
 sem comissão, sem app pra baixar. A partir de R$47/mês.
 </p>
 <div className="flex flex-col sm:flex-row gap-4 justify-center">
 <Link
 href="/demo"
 className="text-white font-bold px-8 py-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-lg shadow-lg"
 style={{ background: "var(--kyndo-orange)", boxShadow: "0 10px 25px -5px rgba(255,107,53,0.3)" }}
 >
 Ver Demo Ao Vivo <ArrowRight className="w-5 h-5" />
 </Link>
 <Link
 href="/admin/login"
 className="bg-white border border-zinc-200 hover:border-orange-400 font-medium px-8 py-4 rounded-xl transition-colors text-lg"
 style={{ color: "var(--kyndo-graphite)" }}
 >
 Já sou cliente
 </Link>
 </div>
 </section>

 {/* Features */}
 <section className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-6">
 {[
 {
 icon: Store,
 title: "Loja White-Label",
 desc: "Cada cliente tem sua própria loja com logo, cores e domínio personalizado.",
 },
 {
 icon: Shield,
 title: "Dados Isolados",
 desc: "Multi-tenant com RLS no Supabase. Cada lojista só vê seus próprios dados.",
 },
 {
 icon: Zap,
 title: "Pedido no WhatsApp",
 desc: "Sem gateway de pagamento complexo. O pedido chega pronto pro estabelecimento.",
 },
 ].map((feature) => (
 <div
 key={feature.title}
 className="rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow border border-zinc-100"
 style={{ background: "var(--kyndo-white)" }}
 >
 <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: "var(--kyndo-orange-soft)" }}>
 <feature.icon className="w-6 h-6" style={{ color: "var(--kyndo-orange)" }} />
 </div>
 <h3 className="font-bold text-lg mb-2" style={{ color: "var(--kyndo-graphite)" }}>{feature.title}</h3>
 <p className="text-sm leading-relaxed" style={{ color: "var(--kyndo-slate)" }}>{feature.desc}</p>
 </div>
 ))}
 </section>

 {/* Footer */}
 <footer className="border-t border-zinc-200 py-8 text-center text-sm" style={{ color: "var(--kyndo-slate)" }}>
 <p>
 <span className="kyndo-wordmark"><span style={{ color: "var(--kyndo-graphite)" }}>kyndo</span><span className="dot">.</span></span>
 {" "}ORDER &copy; 2026 — Gestão de delivery para restaurantes
 </p>
 </footer>
 </div>
 )
}