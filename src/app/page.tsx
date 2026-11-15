"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"

/* ── Kyndo Order Design Tokens ── */
const T = {
 orange: "#FF6B35",
 graphite: "#191B20",
 slate: "#414650",
 ice: "#F6F7F9",
 white: "#FFFFFF",
 gold: "#FF6B35", // Kyndo orange como accent (substituindo gold do Nexora)
 bg: "#0A0A0A",
 fg: "#FFFFFF",
} as const

/* ── Scroll-Driven Video Sequence Component ── */
function VideoSequence({
 id,
 src,
 isFirst = false,
 overlays,
 onReady,
}: {
 id: string
 src: string
 isFirst?: boolean
 overlays?: { a: number; b: number; num: string; title: string[]; desc: string }[]
 onReady?: () => void
}) {
 const sectionRef = useRef<HTMLDivElement>(null)
 const videoRef = useRef<HTMLVideoElement>(null)
 const progressRef = useRef<HTMLDivElement>(null)
 const hintRef = useRef<HTMLDivElement>(null)
 const loaderRef = useRef<HTMLDivElement>(null)
 const barRef = useRef<HTMLDivElement>(null)
 const pctRef = useRef<HTMLSpanElement>(null)
 const overlayRefs = useRef<(HTMLDivElement | null)[]>([])
 const [ready, setReady] = useState(false)
 const targetRef = useRef(0)
 const currentRef = useRef(0)
 const LERP = 0.22

 useEffect(() => {
 const video = videoRef.current
 const section = sectionRef.current
 if (!video || !section) return

 let cancelled = false

 function fit() {
 // Placeholder — videos will be contained by CSS object-fit
 }

 function showProgress() {
 if (!loaderRef.current || ready || !video.duration) return
 const b = video.buffered
 const p = b.length ? Math.min(100, Math.round((b.end(b.length - 1) / video.duration) * 100)) : 0
 if (barRef.current) barRef.current.style.width = `${p}%`
 if (pctRef.current) pctRef.current.textContent = `${p}%`
 }

 function reveal() {
 if (!overlays?.length) return
 const p = video.duration ? Math.min(Math.max(video.currentTime / video.duration, 0), 1) : 0
 overlays.forEach((ov, i) => {
 const el = overlayRefs.current[i]
 if (!el) return
 const x = Math.min(Math.max((p - ov.a) / (ov.b - ov.a), 0), 1)
 el.style.opacity = String(x * x * (3 - 2 * x))
 })
 }

 video.addEventListener("progress", showProgress)
 video.addEventListener("loadeddata", () => {
 if (cancelled || ready) return
 setReady(true)
 if (loaderRef.current) {
 if (barRef.current) barRef.current.style.width = "100%"
 if (pctRef.current) pctRef.current.textContent = "100%"
 loaderRef.current.classList.add("done")
 }
 fit()
 reveal()
 onReady?.()
 })
 video.addEventListener("seeked", reveal)

 function update() {
 if (!section) return
 const r = section.getBoundingClientRect()
 const max = section.offsetHeight - window.innerHeight
 const f = max > 0 ? Math.min(Math.max(-r.top / max, 0), 1) : 0
 targetRef.current = (video.duration || 0) * f
 if (progressRef.current) progressRef.current.style.transform = `scaleX(${f})`
 if (hintRef.current) hintRef.current.style.opacity = f > 0.02 ? "0" : "1"
 }

 function tick() {
 if (!ready || !video.duration) return
 currentRef.current += (targetRef.current - currentRef.current) * LERP
 if (Math.abs(targetRef.current - currentRef.current) < 0.004) currentRef.current = targetRef.current
 const t = Math.min(Math.max(currentRef.current, 0), video.duration - 0.001)
 if (!video.seeking && Math.abs(video.currentTime - t) > 0.012) video.currentTime = t
 reveal()
 }

 video.src = src
 video.load()

 function onScroll() { update() }
 window.addEventListener("scroll", onScroll, { passive: true })
 window.addEventListener("resize", onScroll)

 let rafId: number
 function loop() {
 tick()
 rafId = requestAnimationFrame(loop)
 }
 rafId = requestAnimationFrame(loop)
 onScroll()

 // iOS/Android unlock
 function unlock() {
 const p = video.play()
 if (p && typeof p.then === "function") p.then(() => video.pause()).catch(() => {})
 window.removeEventListener("touchstart", unlock)
 }
 window.addEventListener("touchstart", unlock, { passive: true, once: true })

 return () => {
 cancelled = true
 cancelAnimationFrame(rafId)
 window.removeEventListener("scroll", onScroll)
 window.removeEventListener("resize", onScroll)
 window.removeEventListener("touchstart", unlock)
 }
 }, [src, ready, overlays, onReady])

 return (
 <div ref={sectionRef} className="seq" id={id}>
 <div className={`stage ${isFirst ? "has-logo" : ""}`}>
 {/* Progress bar */}
 <div ref={progressRef} className="progress" />

 {/* Video */}
 <video
 ref={videoRef}
 muted
 playsInline
 preload="auto"
 disablePictureInPicture
 disableRemotePlayback
 aria-label={`Animação Kyndo Order`}
 />

 {/* Hint */}
 {isFirst && (
 <div ref={hintRef} className="hint">
 Role para baixo<span>↓</span>
 </div>
 )}

 {/* Loader */}
 <div ref={loaderRef} className="loader">
 <div className="bar"><div ref={barRef} /></div>
 <p><span ref={pctRef}>0%</span></p>
 </div>

 {/* Text overlays (seção 2) */}
 {overlays && (
 <div className="tx-layer">
 {overlays.map((ov, i) => (
 <div
 key={i}
 ref={(el) => { overlayRefs.current[i] = el }}
 className="tx"
 data-a={ov.a}
 data-b={ov.b}
 >
 <span className="n">{ov.num}</span>
 <span className="t">{ov.title.map((line, li) => <span key={li}>{line}<br /></span>)}</span>
 <span className="d">{ov.desc}</span>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 )
}

/* ── Main Page ── */
export default function KyndoLandingPage() {
 const [s2Ready, setS2Ready] = useState(false)
 const [s3Ready, setS3Ready] = useState(false)

 // Carregamento em cascata dos vídeos (como no Nexora4)
 useEffect(() => {
 // Os vídeos são carregados sob demanda via onReady callbacks
 }, [])

 return (
 <>
 {/* ═══════ SEÇÃO 1: HERO — Apresentação da Marca ═══════ */}
 <VideoSequence
 id="seq1"
 src="/videos/kyndo-hero.mp4"
 isFirst
 onReady={() => {
 // seq2 carrega quando seq1 estiver pronto
 const v2 = document.querySelector("#seq2 video") as HTMLVideoElement
 if (v2) { v2.src = "/videos/kyndo-features.mp4"; v2.load() }
 }}
 />

 {/* ═══════ SEÇÃO 2: FEATURES — O que o Kyndo faz ═══════ */}
 <VideoSequence
 id="seq2"
 src=""
 overlays={[
 { a: 0.600, b: 0.665, num: "01", title: ["CARDÁPIO", "DIGITAL"], desc: "Crie seu cardápio online em minutos, com fotos, categorias e personalização completa." },
 { a: 0.612, b: 0.677, num: "02", title: ["PEDIDOS VIA", "WHATSAPP"], desc: "Seus clientes fazem pedidos formatados direto no WhatsApp, sem intermediários." },
 { a: 0.624, b: 0.689, num: "03", title: ["KANBAN", "OPERACIONAL"], desc: "Gerencie pedidos em tempo real: pendentes, preparando, entregando e concluídos." },
 { a: 0.636, b: 0.701, num: "04", title: ["RELATÓRIOS", "INTELIGENTES"], desc: "Acompanhe vendas, ticket médio, produtos mais vendidos e desempenho por período." },
 { a: 0.648, b: 0.713, num: "05", title: ["MULTI-TENANT", "SEGURO"], desc: "Cada restaurante tem dados isolados com RLS no Supabase. Segurança enterprise." },
 { a: 0.660, b: 0.725, num: "06", title: ["ZERO", "COMISSÃO"], desc: "Diferente dos marketplaces, você não paga taxa por venda. Seu lucro é 100% seu." },
 ]}
 onReady={() => {
 setS2Ready(true)
 const v3 = document.querySelector("#seq3 video") as HTMLVideoElement
 if (v3) { v3.src = "/videos/kyndo-demo.mp4"; v3.load() }
 }}
 />

 {/* ═══════ SEÇÃO 3: DEMO — Plataforma em Ação ═══════ */}
 <VideoSequence
 id="seq3"
 src=""
 />

 {/* ═══════ SEÇÃO 4: CTA — Acesso Demo ═══════ */}
 <section className="contact" id="contato">
 <div className="contact-copy">
 {/* Logo wordmark provisório */}
 <div className="brand-wordmark">
 <span className="kyndo-text">kyndo</span>
 <span className="dot">.</span>
 <span className="order-text">ORDER</span>
 </div>
 <h2>Sua gestão de delivery <em>sem complicação</em></h2>
 <p className="sub">
 Teste agora o painel completo: cardápio, pedidos, Kanban e relatórios.
 Sem cadastro, sem cartão, sem compromisso.
 </p>
 </div>

 <div className="cta-container">
 <Link href="/demo" className="cta-button">
 <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width="22" height="22">
 <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
 </svg>
 Acessar Demo Gratuita
 </Link>
 <p className="note">
 Abre o painel administrativo com dados demonstrativos. Nada é cobrado.
 </p>

 {/* Features rápidas */}
 <div className="quick-features">
 {[
 { icon: "🍔", text: "Cardápio completo" },
 { icon: "📱", text: "Pedidos WhatsApp" },
 { icon: "📊", text: "Relatórios reais" },
 ].map((f, i) => (
 <div key={i} className="quick-feature">
 <span>{f.icon}</span>
 <span>{f.text}</span>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* ═══════ FOOTER ═══════ */}
 <footer className="site-footer">
 <div className="footer-brand">
 <span className="kyndo-text">kyndo</span>
 <span className="dot">.</span>
 <span className="order-text">ORDER</span>
 </div>
 <p>&copy; 2026 Kyndo Order — Gestão de delivery para restaurantes</p>
 </footer>

 {/* ═══════ STYLES ═══════ */}
 <style jsx global>{`
 /* ── Reset & Base ── */
 :root {
 --gold: ${T.orange};
 --bg: ${T.bg};
 --fg: ${T.fg};
 box-sizing: border-box;
 }
 *, *::before, *::after { box-sizing: inherit; margin: 0; padding: 0; }
 html, body { background: var(--bg); color: var(--fg); font-family: 'Inter', system-ui, -apple-system, sans-serif; overflow-x: hidden; }

 /* ── Scroll-Driven Video Sections ── */
 .seq { position: relative; height: 500vh; }
 .stage { position: sticky; top: 0; width: 100%; height: 100vh; height: 100dvh; overflow: hidden; background: #000; }
 .stage video { width: 100%; height: 100%; object-fit: contain; display: block; background: #000; }
 .stage.has-logo video { height: calc(100% - 14vh); margin-top: 14vh; }

 /* ── Progress Bar ── */
 .progress { position: absolute; left: 0; top: 0; height: 3px; width: 100%; background: var(--gold); transform-origin: 0 50%; transform: scaleX(0); z-index: 3; }

 /* ── Scroll Hint ── */
 .hint { position: absolute; left: 0; right: 0; bottom: calc(env(safe-area-inset-bottom, 0px) + 18px); text-align: center; font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); z-index: 3; transition: opacity 0.4s; pointer-events: none; }
 .hint span { display: block; margin-top: 6px; font-size: 18px; animation: bob 1.4s ease-in-out infinite; }
 @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(6px); } }

 /* ── Loader ── */
 .loader { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; background: #000; z-index: 5; transition: opacity 0.5s; }
 .loader.done { opacity: 0; pointer-events: none; }
 .bar { width: 55%; max-width: 260px; height: 3px; background: #2a2a2a; border-radius: 2px; overflow: hidden; }
 .bar div { height: 100%; width: 0; background: var(--gold); transition: width 0.2s; }
 .loader p { font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; color: #aaa; }

 /* ── Text Overlays (Feature Cards) ── */
 .tx-layer { position: absolute; inset: 0; z-index: 2; pointer-events: none; display: none; }
 .tx { position: absolute; opacity: 0; will-change: opacity; text-shadow: 0 1px 2px rgba(0,0,0,0.6); }
 .tx .n { position: absolute; left: 0; top: 0; font-family: 'Oswald', 'Arial Narrow', Impact, sans-serif; font-weight: 700; font-size: clamp(24px, 3vw, 34px); line-height: 1; color: var(--gold); }
 .tx .t { position: absolute; font-family: 'Oswald', 'Arial Narrow', Impact, sans-serif; font-weight: 700; font-size: clamp(14px, 1.8vw, 19px); line-height: clamp(18px, 2.2vw, 22px); color: #fff; text-transform: uppercase; letter-spacing: 0.01em; white-space: nowrap; }
 .tx .d { position: absolute; font-family: 'Inter', 'Roboto', system-ui, sans-serif; font-weight: 500; font-size: clamp(10px, 1.2vw, 12px); line-height: clamp(13px, 1.5vw, 14.6px); color: #e6e6e6; max-width: 200px; }

 /* Overlay positions (desktop — ajustado para 1280px base) */
 @media (min-width: 900px) {
 .tx-layer { display: block; }
 /* Coluna esquerda */
 .tx:nth-child(1) .n { left: 12%; top: 18%; }
 .tx:nth-child(1) .t { left: 16%; top: 18%; }
 .tx:nth-child(1) .d { left: 12%; top: 24%; }
 .tx:nth-child(2) .n { left: 12%; top: 36%; }
 .tx:nth-child(2) .t { left: 16%; top: 36%; }
 .tx:nth-child(2) .d { left: 12%; top: 42%; }
 .tx:nth-child(3) .n { left: 13%; top: 54%; }
 .tx:nth-child(3) .t { left: 17%; top: 54%; }
 .tx:nth-child(3) .d { left: 13%; top: 60%; }
 /* Coluna direita */
 .tx:nth-child(4) .n { right: 12%; top: 18%; }
 .tx:nth-child(4) .t { right: 8%; top: 18%; }
 .tx:nth-child(4) .d { right: 12%; top: 24%; }
 .tx:nth-child(5) .n { right: 12%; top: 36%; }
 .tx:nth-child(5) .t { right: 8%; top: 36%; }
 .tx:nth-child(5) .d { right: 12%; top: 42%; }
 .tx:nth-child(6) .n { right: 12%; top: 54%; }
 .tx:nth-child(6) .t { right: 8%; top: 54%; }
 .tx:nth-child(6) .d { right: 12%; top: 60%; }
 }

 /* Mobile: overlays empilhados abaixo do vídeo */
 @media (max-width: 899px) {
 .tx-layer { display: flex; flex-direction: column; gap: 16px; padding: 20px; position: relative; background: var(--bg); }
 .tx { position: relative !important; opacity: 1 !important; display: flex; flex-direction: column; gap: 4px; padding: 16px; background: #111; border-radius: 12px; border-left: 3px solid var(--gold); }
 .tx .n, .tx .t, .tx .d { position: relative !important; left: auto !important; top: auto !important; right: auto !important; }
 .tx .n { font-size: 20px; margin-bottom: 4px; }
 .tx .t { font-size: 16px; line-height: 20px; }
 .tx .d { font-size: 12px; line-height: 16px; max-width: 100%; }
 .seq { height: auto !important; }
 .stage { position: relative !important; height: 60vh !important; }
 }

 /* ── CTA Section ── */
 .contact { position: relative; min-height: 100vh; min-height: 100dvh; padding: calc(env(safe-area-inset-top, 0px) + 40px) 22px calc(env(safe-area-inset-bottom, 0px) + 40px); display: flex; flex-direction: column; align-items: center; justify-content: center; background: radial-gradient(120% 60% at 50% 0%, rgba(255,107,53,0.16), transparent 60%), #000; }

 .brand-wordmark { font-family: 'Inter', system-ui, sans-serif; font-size: clamp(28px, 5vw, 42px); font-weight: 800; margin-bottom: 22px; letter-spacing: -0.02em; }
 .brand-wordmark .kyndo-text { color: #fff; }
 .brand-wordmark .dot { color: var(--gold); }
 .brand-wordmark .order-text { font-weight: 500; color: rgba(255,255,255,0.6); font-size: 0.5em; margin-left: 8px; letter-spacing: 0.08em; text-transform: uppercase; }

 .contact h2 { margin: 0 0 8px; text-align: center; font-size: clamp(26px, 8vw, 34px); line-height: 1.08; font-weight: 900; text-transform: uppercase; letter-spacing: -0.01em; }
 .contact h2 em { font-style: normal; color: var(--gold); }
 .contact .sub { margin: 0 0 24px; max-width: 34ch; text-align: center; font-size: 15px; line-height: 1.45; color: #c9c9c9; }

 .cta-container { width: 100%; max-width: 420px; display: flex; flex-direction: column; align-items: center; gap: 16px; }

 .cta-button { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; padding: 17px 18px; border: 0; border-radius: 14px; background: linear-gradient(180deg, #ff8c5a, ${T.orange}); color: #fff; font: inherit; font-size: 16px; font-weight: 900; letter-spacing: 0.02em; text-transform: uppercase; cursor: pointer; text-decoration: none; box-shadow: 0 8px 28px rgba(255,107,53,0.28); transition: transform 0.15s, box-shadow 0.15s; }
 .cta-button:hover { transform: translateY(-2px); box-shadow: 0 12px 36px rgba(255,107,53,0.35); }
 .cta-button:active { transform: translateY(1px); }

 .note { margin: 0; text-align: center; font-size: 12px; color: #8a8a8a; }

 .quick-features { display: flex; gap: 16px; margin-top: 24px; flex-wrap: wrap; justify-content: center; }
 .quick-feature { display: flex; align-items: center; gap: 6px; padding: 8px 14px; background: rgba(255,255,255,0.06); border-radius: 99px; font-size: 13px; color: #ccc; border: 1px solid rgba(255,255,255,0.08); }

 /* Desktop CTA layout */
 @media (min-width: 900px) {
 .contact { flex-direction: row; justify-content: center; align-items: center; gap: clamp(48px, 7vw, 120px); padding: 60px clamp(32px, 6vw, 96px); background: radial-gradient(80% 90% at 20% 20%, rgba(255,107,53,0.16), transparent 60%), #000; }
 .contact-copy { flex: 1 1 0; max-width: 520px; display: flex; flex-direction: column; align-items: flex-start; }
 .contact h2 { text-align: left; font-size: clamp(40px, 4.4vw, 64px); margin-bottom: 18px; }
 .contact .sub { text-align: left; max-width: 44ch; font-size: 18px; margin: 0; }
 .cta-container { flex: 1 1 0; max-width: 480px; padding: 34px; border: 1px solid #3a2a20; border-radius: 22px; background: rgba(255,255,255,0.03); box-shadow: 0 20px 80px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,107,53,0.06); align-items: stretch; }
 .quick-features { justify-content: flex-start; }
 }

 /* ── Footer ── */
 .site-footer { padding: 32px 22px; text-align: center; background: #050505; border-top: 1px solid #1a1a1a; }
 .footer-brand { font-family: 'Inter', system-ui, sans-serif; font-size: 18px; font-weight: 800; margin-bottom: 8px; letter-spacing: -0.02em; }
 .footer-brand .kyndo-text { color: #fff; }
 .footer-brand .dot { color: var(--gold); }
 .footer-brand .order-text { font-weight: 500; color: rgba(255,255,255,0.5); font-size: 0.6em; margin-left: 6px; letter-spacing: 0.08em; text-transform: uppercase; }
 .site-footer p { font-size: 12px; color: #666; }

 /* ── Accessibility ── */
 @media (prefers-reduced-motion: reduce) {
 .hint span { animation: none; }
 .cta-button { transition: none; }
 }
 `}</style>
 </>
 )
}