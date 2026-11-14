import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Proteger rotas /admin (exceto /admin/login e /admin/register)
  if (request.nextUrl.pathname.startsWith("/admin") && request.nextUrl.pathname !== "/admin/login" && request.nextUrl.pathname !== "/admin/register") {
    // Verificar modo demo via cookie
    const isDemo = request.cookies.get("deliverysaas_demo_session")?.value === "true"

    if (isDemo) {
      // Modo demo: permitir acesso sem sessão Supabase
      return response
    }

    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }

    // Verificar se o usuário tem um tenant associado
    const { data: tenant } = await supabase
      .from("tenants")
      .select("id")
      .eq("owner_id", session.user.id)
      .single()

    if (!tenant && request.nextUrl.pathname !== "/admin/onboarding") {
      return NextResponse.redirect(new URL("/admin/onboarding", request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}