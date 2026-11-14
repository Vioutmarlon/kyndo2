import { NextResponse, type NextRequest } from "next/server"

// Rate limiting simples em memória (para produção, use Redis ou Upstash)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minuto
const RATE_LIMIT_MAX_REQUESTS = 30 // 30 requests por minuto por IP

export function applySecurityHeaders(response: NextResponse): NextResponse {
 // Content Security Policy
 response.headers.set(
 "Content-Security-Policy",
 [
 "default-src 'self'",
 "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js precisa de inline scripts
 "style-src 'self' 'unsafe-inline'", // Tailwind CSS usa inline styles
 "img-src 'self' data: https:",
 "font-src 'self'",
 "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
 "frame-ancestors 'none'",
 "base-uri 'self'",
 "form-action 'self' https://wa.me",
 ].join("; ")
 )

 // Prevenir clickjacking
 response.headers.set("X-Frame-Options", "DENY")

 // Prevenir MIME-type sniffing
 response.headers.set("X-Content-Type-Options", "nosniff")

 // Referrer Policy
 response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

 // Permissions Policy
 response.headers.set(
 "Permissions-Policy",
 "camera=(), microphone=(), geolocation=(self), payment=()"
 )

 // HSTS (apenas em produção com HTTPS)
 if (process.env.NODE_ENV === "production") {
 response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
 }

 return response
}

export function checkRateLimit(request: NextRequest): NextResponse | null {
 const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
 const now = Date.now()

 const entry = rateLimitMap.get(ip)

 if (!entry || now > entry.resetAt) {
 rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
 return null
 }

 if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
 return new NextResponse(
 JSON.stringify({ error: "Muitas requisições. Tente novamente em 1 minuto." }),
 {
 status: 429,
 headers: {
 "Content-Type": "application/json",
 "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)),
 },
 }
 )
 }

 entry.count++
 return null
}