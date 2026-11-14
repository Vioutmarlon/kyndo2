"use client"

import { motion, AnimatePresence, type Variants } from "framer-motion"
import { useEffect, useRef, useState, type ReactNode } from "react"

/* ──────────────────────────────────────────────
   Tokens de motion (Jakub Krehel — production polish)
   ────────────────────────────────────────────── */

const EASING = [0.25, 0.1, 0.25, 1] as const // ease-out suave

const ENTER_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 8, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", duration: 0.45, bounce: 0 },
  },
}

const EXIT_VARIANTS: Variants = {
  exit: {
    opacity: 0,
    y: -12,
    filter: "blur(4px)",
    transition: { duration: 0.25, ease: EASING },
  },
}

const STAGGER_CONTAINER: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
}

/* ──────────────────────────────────────────────
   FadeIn — animação de entrada com stagger opcional
   ────────────────────────────────────────────── */

export function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={ENTER_VARIANTS}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerContainer({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={STAGGER_CONTAINER}
      className={className}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div variants={ENTER_VARIANTS} className={className}>
      {children}
    </motion.div>
  )
}

/* ──────────────────────────────────────────────
   AnimatedPresence — transição entre estados
   ────────────────────────────────────────────── */

export function AnimatedSwitch({
  children,
  mode = "wait",
}: {
  children: ReactNode
  mode?: "wait" | "sync" | "popLayout"
}) {
  return (
    <AnimatePresence mode={mode}>
      {children}
    </AnimatePresence>
  )
}

/* ──────────────────────────────────────────────
   Skeleton — shimmer loading state
   ────────────────────────────────────────────── */

export function Skeleton({
  className = "",
  width,
  height,
  borderRadius = 8,
}: {
  className?: string
  width?: string | number
  height?: string | number
  borderRadius?: number
}) {
  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={{
        width: width ?? "100%",
        height: height ?? 20,
        borderRadius,
        background: "#E5E7EB",
        overflow: "hidden",
        position: "relative",
      }}
      aria-hidden="true"
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
          animation: "shimmer 1.5s infinite",
        }}
      />
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .skeleton-shimmer div {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div
      style={{
        background: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        border: "1px solid #E5E7EB",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Skeleton width={32} height={32} borderRadius={8} />
        <Skeleton width={100} height={14} />
      </div>
      <Skeleton width="60%" height={24} />
      <Skeleton width="40%" height={12} />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "12px 16px",
        background: "#FFFFFF",
        borderRadius: 12,
        border: "1px solid #E5E7EB",
      }}
    >
      <Skeleton width={64} height={64} borderRadius={8} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="40%" height={12} />
      </div>
      <Skeleton width={60} height={14} />
    </div>
  )
}

/* ──────────────────────────────────────────────
   LazyImage — carregamento lazy com fade-in
   ────────────────────────────────────────────── */

export function LazyImage({
  src,
  alt,
  className = "",
  width,
  height,
  fallback,
}: {
  src?: string | null
  alt: string
  className?: string
  width?: number | string
  height?: number | string
  fallback?: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: "200px" }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  if (!src) {
    return (
      <div
        className={className}
        style={{
          width: width ?? "100%",
          height: height ?? "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F6F7F9",
          borderRadius: 8,
          color: "#9CA3AF",
          fontSize: 12,
        }}
      >
        {fallback ?? "Sem imagem"}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        width: width ?? "100%",
        height: height ?? "100%",
        borderRadius: 8,
        overflow: "hidden",
        position: "relative",
        background: "#F6F7F9",
      }}
    >
      {!isLoaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#E5E7EB",
            animation: "shimmer 1.5s infinite",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
              animation: "shimmer 1.5s infinite",
            }}
          />
        </div>
      )}
      {isVisible && (
        <motion.img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isLoaded ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.3, ease: EASING }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      )}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes shimmer { 0%, 100% { transform: none; } }
        }
      `}</style>
    </div>
  )
}

/* ──────────────────────────────────────────────
   InteractiveCard — micro-interações hover/press
   ────────────────────────────────────────────── */

export function InteractiveCard({
  children,
  className = "",
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <motion.div
      whileHover={{
        boxShadow:
          "0px 0px 0px 1px rgba(0,0,0,0.08), 0px 1px 2px -1px rgba(0,0,0,0.08), 0px 4px 8px 0px rgba(0,0,0,0.06)",
      }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.15, ease: EASING }}
      onClick={onClick}
      className={className}
      style={{
        cursor: onClick ? "pointer" : undefined,
      }}
    >
      {children}
    </motion.div>
  )
}

/* ──────────────────────────────────────────────
   ProgressBar — indicador animado de métricas
   ────────────────────────────────────────────── */

export function ProgressBar({
  value,
  max = 100,
  color = "#FF6B35",
  label,
  subLabel,
}: {
  value: number
  max?: number
  color?: string
  label?: string
  subLabel?: string
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {(label || subLabel) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          {label && (
            <span style={{ fontSize: 12, fontWeight: 500, color: "#414650" }}>
              {label}
            </span>
          )}
          {subLabel && (
            <span style={{ fontSize: 11, color: "#6B7280" }}>{subLabel}</span>
          )}
        </div>
      )}
      <div
        style={{
          height: 6,
          borderRadius: 99,
          background: "#E5E7EB",
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            height: "100%",
            borderRadius: 99,
            background: color,
          }}
        />
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────
 MotionDiv / MotionButton — wrappers para evitar
 import direto de motion em arquivos que o
 Turbopack cacheia incorretamente
 ────────────────────────────────────────────── */

export const MotionDiv = motion.div

export function MotionButton({
 children,
 className = "",
 onClick,
 whileHover,
 whileTap,
 transition,
 style,
 disabled,
 type,
}: {
 children: ReactNode
 className?: string
 onClick?: () => void
 whileHover?: Record<string, unknown>
 whileTap?: Record<string, unknown>
 transition?: Record<string, unknown>
 style?: React.CSSProperties
 disabled?: boolean
 type?: "button" | "submit" | "reset"
}) {
 return (
 <motion.button
 whileHover={whileHover}
 whileTap={whileTap}
 transition={transition}
 onClick={onClick}
 disabled={disabled}
 type={type}
 className={className}
 style={style}
 >
 {children}
 </motion.button>
 )
}