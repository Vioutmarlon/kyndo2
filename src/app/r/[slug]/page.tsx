import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { formatCurrency } from "@/lib/utils"
import { LazyImage } from "@/components/motion"
import type { Tenant, Category, Product } from "@/lib/supabase"

export const instant = false

// Tokens Kyndo Order
const T = {
  orange: "#FF6B35",
  graphite: "#191B20",
  slate: "#414650",
  ice: "#F6F7F9",
  white: "#FFFFFF",
} as const

interface PageProps {
  params: Promise<{ slug: string }>
}

async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  )
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await getSupabase()

  const { data: tenant } = await supabase
    .from("tenants")
    .select("name, address")
    .eq("slug", slug)
    .single()

  if (!tenant) {
    return { title: "Restaurante não encontrado" }
  }

  return {
    title: tenant.name,
    description: `Cardápio digital de ${tenant.name}. Faça seu pedido!`,
  }
}

export default async function PublicMenuPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await getSupabase()

  // Buscar tenant pelo slug
  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .single()

  if (tenantError || !tenant) {
    notFound()
  }

  // Buscar categorias ativas ordenadas
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("tenant_id", tenant.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  // Buscar produtos disponíveis de todas as categorias
  const categoryIds = (categories ?? []).map((c: Category) => c.id)

  let products: Product[] = []
  if (categoryIds.length > 0) {
    const { data: productsData } = await supabase
      .from("products")
      .select("*")
      .in("category_id", categoryIds)
      .eq("is_available", true)
      .order("sort_order", { ascending: true })

    products = productsData ?? []
  }

  // Agrupar produtos por categoria
  const productsByCategory = new Map<string, Product[]>()
  for (const product of products) {
    const list = productsByCategory.get(product.category_id) ?? []
    list.push(product)
    productsByCategory.set(product.category_id, list)
  }

  const activeCategories = (categories ?? []).filter(
    (cat: Category) => (productsByCategory.get(cat.id)?.length ?? 0) > 0
  )

  const initial = tenant.name.charAt(0).toUpperCase()

  return (
    <div style={{ minHeight: "100vh", background: T.ice, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      {/* Header */}
      <header
        style={{
          background: T.white,
          borderBottom: `1px solid #E5E7EB`,
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Logo ou inicial */}
          {tenant.logo_url ? (
            <img
              src={tenant.logo_url}
              alt={tenant.name}
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: T.orange,
                color: T.white,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {initial}
            </div>
          )}

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: T.graphite,
                margin: 0,
                lineHeight: 1.3,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {tenant.name}
            </h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                fontWeight: 500,
                color: tenant.is_open ? "#16A34A" : "#DC2626",
                marginTop: 2,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: tenant.is_open ? "#16A34A" : "#DC2626",
                  display: "inline-block",
                }}
              />
              {tenant.is_open ? "Aberto agora" : "Fechado"}
            </span>
          </div>
        </div>
      </header>

      {/* Banner */}
      {tenant.banner_url && (
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "16px 16px 0",
          }}
        >
          <img
            src={tenant.banner_url}
            alt={`Banner ${tenant.name}`}
            style={{
              width: "100%",
              height: 160,
              objectFit: "cover",
              borderRadius: 12,
              display: "block",
            }}
          />
        </div>
      )}

      {/* Navegação por categorias */}
      {activeCategories.length > 1 && (
        <nav
          style={{
            maxWidth: 720,
            margin: "0 auto",
            padding: "16px 16px 0",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <div style={{ display: "flex", gap: 8, paddingBottom: 4 }}>
            {activeCategories.map((cat: Category) => (
              <a
                key={cat.id}
                href={`#cat-${cat.id}`}
                style={{
                  flexShrink: 0,
                  padding: "6px 14px",
                  borderRadius: 99,
                  background: T.white,
                  border: "1px solid #E5E7EB",
                  color: T.slate,
                  fontSize: 13,
                  fontWeight: 500,
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  transition: "background 0.15s, color 0.15s",
                }}
              >
                {cat.name}
              </a>
            ))}
          </div>
        </nav>
      )}

      {/* Menu */}
      <main
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "16px 16px 32px",
        }}
      >
        {activeCategories.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "48px 16px",
              color: T.slate,
            }}
          >
            <p style={{ fontSize: 15, margin: 0 }}>
              Nenhum produto disponível no momento.
            </p>
          </div>
        ) : (
          activeCategories.map((cat: Category) => {
            const catProducts = productsByCategory.get(cat.id) ?? []
            return (
              <section
                key={cat.id}
                id={`cat-${cat.id}`}
                style={{ marginBottom: 32, scrollMarginTop: 80 }}
              >
                <h2
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: T.graphite,
                    margin: "0 0 12px",
                    paddingBottom: 8,
                    borderBottom: `2px solid ${T.orange}`,
                    display: "inline-block",
                  }}
                >
                  {cat.name}
                </h2>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {catProducts.map((product: Product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </section>
            )
          })
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          background: T.graphite,
          padding: "24px 16px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.6)",
            margin: 0,
          }}
        >
          {tenant.name} &middot; Cardápio Digital
        </p>
      </footer>
    </div>
  )
}

/* ──────────────────────────────────────────────
   ProductCard — card individual de produto
   ────────────────────────────────────────────── */

function ProductCard({ product }: { product: Product }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        background: T.white,
        borderRadius: 12,
        padding: 12,
        border: "1px solid #E5E7EB",
      }}
    >
      {/* Imagem */}
      <LazyImage
        src={product.image_url}
        alt={product.name}
        width={88}
        height={88}
        fallback={
          <span style={{ fontSize: 11, color: "#9CA3AF" }}>Sem foto</span>
        }
      />

      {/* Conteúdo */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: T.graphite,
              margin: "0 0 4px",
              lineHeight: 1.3,
            }}
          >
            {product.name}
          </h3>
          {product.description && (
            <p
              style={{
                fontSize: 12,
                color: T.slate,
                margin: 0,
                lineHeight: 1.4,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {product.description}
            </p>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 8,
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: T.graphite,
            }}
          >
            {formatCurrency(product.price)}
          </span>

          <button
            type="button"
            style={{
              padding: "6px 14px",
              borderRadius: 8,
              border: "none",
              background: T.orange,
              color: T.white,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  )
}