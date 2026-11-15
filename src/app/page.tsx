"use client"

import { useEffect, useRef, useCallback } from "react"
import Link from "next/link"
import "./landing.css"

/* ── Kyndo Order Design Tokens ── */
const T = {
  orange: "#FF6B35",
  bg: "#000000",
  fg: "#FFFFFF",
} as const

/* ═══════════════════════════════════════════════════════════
   VideoSequence — Scroll-driven video player
   Faithful port of Nexora4's Sequence class
   ═══════════════════════════════════════════════════════════ */
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
  const logoRef = useRef<HTMLImageElement>(null)
  const txLayerRef = useRef<HTMLDivElement>(null)
  const overlayRefs = useRef<(HTMLDivElement | null)[]>([])

  // Mutable state (no React state to avoid re-renders during animation loop)
  const state = useRef({
    target: 0,
    current: 0,
    ready: false,
    LERP: 0.22,
  })

  const handleReady = useCallback(() => {
    onReady?.()
  }, [onReady])

  useEffect(() => {
    const video = videoRef.current
    const section = sectionRef.current
    const txLayer = txLayerRef.current
    if (!video || !section) return

    let cancelled = false
    let rafId = 0
    const st = state.current

    /* ── fit: calculate video render area and set --u for overlays ── */
    function fit() {
      if (!txLayer || !video.videoWidth) return
      const Wd = video.clientWidth
      const Hd = video.clientHeight
      const ar = video.videoWidth / video.videoHeight
      let w: number, hh: number
      if (Wd / Hd > ar) {
        hh = Hd
        w = hh * ar
      } else {
        w = Wd
        hh = w / ar
      }
      txLayer.style.width = w + "px"
      txLayer.style.height = hh + "px"
      txLayer.style.left = (video.offsetLeft + (Wd - w) / 2) + "px"
      txLayer.style.top = (video.offsetTop + (Hd - hh) / 2) + "px"
      txLayer.style.setProperty("--u", String(w / 1280))
      txLayer.style.display = "block"
    }

    /* ── showProgress: update loader bar during buffering ── */
    function showProgress() {
      if (!loaderRef.current || st.ready || !video.duration) return
      const b = video.buffered
      const p = b.length ? Math.min(100, Math.round((b.end(b.length - 1) / video.duration) * 100)) : 0
      if (barRef.current) barRef.current.style.width = p + "%"
      if (pctRef.current) pctRef.current.textContent = p + "%"
    }

    /* ── reveal: show/hide text overlays based on video progress ── */
    function reveal() {
      if (!overlays?.length) return
      const p = video.duration ? Math.min(Math.max(video.currentTime / video.duration, 0), 1) : 0
      for (let k = 0; k < overlays.length; k++) {
        const el = overlayRefs.current[k]
        if (!el) continue
        const a = overlays[k].a
        const b = overlays[k].b
        const x = Math.min(Math.max((p - a) / (b - a), 0), 1)
        // Smoothstep interpolation (same as Nexora4)
        el.style.opacity = String(x * x * (3 - 2 * x))
      }
    }

    /* ── updateLogo: fade-in logo during first 15% of video ── */
    function updateLogo() {
      if (!isFirst || !logoRef.current || !video.duration) return
      const p = Math.min(Math.max(video.currentTime / video.duration, 0), 1)
      const logoOpacity = Math.min(p / 0.15, 1)
      const logoY = -10 + 10 * logoOpacity
      logoRef.current.style.opacity = String(logoOpacity)
      logoRef.current.style.transform = `translate(-50%, ${logoY}px)`
    }

    /* ── Event listeners ── */
    video.addEventListener("progress", showProgress)
    video.addEventListener("loadedmetadata", fit)
    window.addEventListener("resize", fit)
    video.addEventListener("seeked", reveal)

    video.addEventListener("loadeddata", () => {
      if (cancelled || st.ready) return
      st.ready = true
      if (loaderRef.current) {
        if (barRef.current) barRef.current.style.width = "100%"
        if (pctRef.current) pctRef.current.textContent = "100%"
        loaderRef.current.classList.add("done")
      }
      fit()
      update()
      reveal()
      updateLogo()
      handleReady()
    })

    /* ── update: map scroll position to video time ── */
    function update() {
      if (!section) return
      const r = section.getBoundingClientRect()
      const max = section.offsetHeight - window.innerHeight
      const f = max > 0 ? Math.min(Math.max(-r.top / max, 0), 1) : 0
      st.target = (video.duration || 0) * f
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${f})`
      if (hintRef.current) hintRef.current.style.opacity = f > 0.02 ? "0" : "1"
    }

    /* ── tick: smooth LERP interpolation for video seeking ── */
    function tick() {
      if (!st.ready || !video.duration) return
      st.current += (st.target - st.current) * st.LERP
      if (Math.abs(st.target - st.current) < 0.004) st.current = st.target
      const t = Math.min(Math.max(st.current, 0), video.duration - 0.001)
      if (!video.seeking && Math.abs(video.currentTime - t) > 0.012) {
        video.currentTime = t
      }
      reveal()
      updateLogo()
    }

    /* ── Load video ── */
    video.src = src
    video.load()

    /* ── Scroll & resize handlers ── */
    function onScroll() { update() }
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll)

    /* ── Animation loop ── */
    function loop() {
      tick()
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    onScroll()

    /* ── iOS/Android video unlock ── */
    function unlock() {
      const p = video.play()
      if (p && typeof p.then === "function") {
        p.then(() => video.pause()).catch(() => {})
      }
      window.removeEventListener("touchstart", unlock)
    }
    window.addEventListener("touchstart", unlock, { passive: true, once: true })

    /* ── Cleanup ── */
    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      window.removeEventListener("resize", fit)
      window.removeEventListener("touchstart", unlock)
      video.removeEventListener("progress", showProgress)
      video.removeEventListener("loadedmetadata", fit)
      video.removeEventListener("seeked", reveal)
    }
  }, [src, isFirst, overlays, handleReady])

  return (
    <div ref={sectionRef} className="seq" id={id}>
      <div className={`stage ${isFirst ? "has-logo" : ""}`}>
        {/* Progress bar */}
        <div ref={progressRef} className="progress" />

        {/* Logo (first section only) */}
        {isFirst && (
          <img
            ref={logoRef}
            src="/images/kyndo-logo-banner.png"
            alt="Kyndo Order"
            className="logo"
          />
        )}

        {/* Video */}
        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          aria-label="Animação Kyndo Order"
        />

        {/* Scroll hint */}
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

        {/* Text overlays layer (sized by JS fit()) */}
        {overlays && (
          <div ref={txLayerRef} className="tx-layer">
            {overlays.map((ov, i) => (
              <div
                key={i}
                ref={(el) => { overlayRefs.current[i] = el }}
                className="tx"
              >
                <span className="n">{ov.num}</span>
                <span className="t">
                  {ov.title.map((line, li) => <span key={li}>{line}<br /></span>)}
                </span>
                <span className="d">{ov.desc}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Main Landing Page
   ═══════════════════════════════════════════════════════════ */
export default function KyndoLandingPage() {
  return (
    <div className="landing-page">
      {/* ═══ SEÇÃO 1: HERO ═══ */}
      <VideoSequence
        id="seq1"
        src="/videos/kyndo-hero.mp4"
        isFirst
        onReady={() => {
          const v2 = document.querySelector("#seq2 video") as HTMLVideoElement
          if (v2) { v2.src = "/videos/kyndo-features.mp4"; v2.load() }
        }}
      />

      {/* ═══ SEÇÃO 2: FEATURES ═══ */}
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
          const v3 = document.querySelector("#seq3 video") as HTMLVideoElement
          if (v3) { v3.src = "/videos/kyndo-demo.mp4"; v3.load() }
        }}
      />

      {/* ═══ SEÇÃO 3: DEMO ═══ */}
      <VideoSequence
        id="seq3"
        src=""
      />

      {/* ═══ SEÇÃO 4: CTA ═══ */}
      <section className="contact" id="contato">
        <div className="contact-copy">
          <img className="brand" src="/images/kyndo-logo-banner.png" alt="Kyndo Order" />
          <h2>Sua gestão de delivery <em>sem complicação</em></h2>
          <p className="sub">Teste agora o painel completo: cardápio, pedidos, Kanban e relatórios. Sem cadastro, sem cartão, sem compromisso.</p>
        </div>

        <div className="cta-container">
          <Link href="/demo" className="cta">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
            Acessar Demo Gratuita
          </Link>
          <p className="note">Ao clicar, o painel abre com dados demonstrativos. Nada é armazenado nesta página.</p>
        </div>
      </section>

      </div>
  )
}