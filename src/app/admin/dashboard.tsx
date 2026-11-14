"use client"

import { useState, useEffect } from "react"
import { formatCurrency } from "@/lib/utils"
import type { Tenant, Product } from "@/lib/supabase"
import {
 Plus, Package, Settings, LogOut, Sparkles,
 LayoutDashboard, MessageSquare, ShoppingCart, ChefHat, Clock,
 TrendingUp, CheckCircle2, UtensilsCrossed, Truck, CircleAlert, Edit, Trash2
} from "lucide-react"
import { useRouter } from "next/navigation"

/* ── Kyndo Order colour tokens (inline to avoid Tailwind purge) ── */
const C = {
 orange: "#FF6B35",
 orangeHover: "#E85A25",
 orangeSoft: "#FFF0E9",
 graphite: "#191B20",
 slate: "#414650",
 ice: "#F6F7F9",
 white: "#FFFFFF",
 success: "#16A34A",
 info: "#2563EB",
 warning: "#F59E0B",
 danger: "#DC3545",
 successBg: "#DCFCE7",
 infoBg: "#DBEAFE",
 warningBg: "#FEF3C7",
 dangerBg: "#FEE2E2",
} as const

/* ── Demo data ─────────────────────────────────────────────── */
const DEMO_PRODUCTS: (Product & { categories?: { name: string } })[] = [
 { id: "prod-001", tenant_id: "demo", category_id: "cat-001", name: "X-Bacon Artesanal", description: "Hambúrguer 180g, bacon crocante, cheddar", price: 32.9, image_url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=100&h=100&fit=crop", is_available: true, has_options: true, options: [], extras: [], categories: { name: "🍔 Hambúrgueres" } },
 { id: "prod-002", tenant_id: "demo", category_id: "cat-001", name: "Double Smash Burger", description: "Dois smash burgers 90g, queijo americano", price: 38.9, image_url: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=100&h=100&fit=crop", is_available: true, has_options: true, options: [], extras: [], categories: { name: "🍔 Hambúrgueres" } },
 { id: "prod-003", tenant_id: "demo", category_id: "cat-001", name: "Veggie Burger", description: "Grão-de-bico, rúcula, tomate seco", price: 29.9, image_url: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=100&h=100&fit=crop", is_available: true, has_options: false, options: [], extras: [], categories: { name: "🍔 Hambúrgueres" } },
 { id: "prod-004", tenant_id: "demo", category_id: "cat-002", name: "Coca-Cola Lata", description: "350ml gelada", price: 6.0, image_url: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=100&h=100&fit=crop", is_available: true, has_options: false, options: [], extras: [], categories: { name: "🥤 Bebidas" } },
 { id: "prod-005", tenant_id: "demo", category_id: "cat-002", name: "Suco Natural", description: "Laranja ou Limão - 400ml", price: 10.0, is_available: true, has_options: true, options: [], extras: [], categories: { name: "🥤 Bebidas" } },
 { id: "prod-006", tenant_id: "demo", category_id: "cat-003", name: "Batata Frita", description: "Porção generosa com sal e orégano", price: 18.0, image_url: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=100&h=100&fit=crop", is_available: true, has_options: false, options: [], extras: [], categories: { name: "🍟 Acompanhamentos" } },
 { id: "prod-007", tenant_id: "demo", category_id: "cat-003", name: "Onion Rings", description: "Anéis de cebola empanados e fritos", price: 22.0, image_url: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=100&h=100&fit=crop", is_available: true, has_options: false, options: [], extras: [], categories: { name: "🍟 Acompanhamentos" } },
 { id: "prod-008", tenant_id: "demo", category_id: "cat-004", name: "Brownie com Sorvete", description: "Chocolate quente com sorvete de creme", price: 24.0, image_url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=100&h=100&fit=crop", is_available: true, has_options: false, options: [], extras: [], categories: { name: "🍰 Sobremesas" } },
 { id: "prod-009", tenant_id: "demo", category_id: "cat-004", name: "Milkshake", description: "Chocolate, Morango ou Baunilha - 500ml", price: 22.0, image_url: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=100&h=100&fit=crop", is_available: true, has_options: true, options: [], extras: [], categories: { name: "🍰 Sobremesas" } },
]

interface DemoOrder {
 id: string; customerName: string; items: string; total: number
 status: "pending" | "preparing" | "delivering" | "completed"
 time: string; paymentMethod: string; deliveryType: "delivery" | "pickup"
}

const DEMO_ORDERS: DemoOrder[] = [
 { id: "ord-001", customerName: "Maria Silva", items: "1x X-Bacon, 1x Coca-Cola", total: 38.90, status: "preparing", time: "12:34", paymentMethod: "Pix", deliveryType: "delivery" },
 { id: "ord-002", customerName: "João Santos", items: "2x Double Smash, 1x Batata", total: 95.80, status: "pending", time: "12:41", paymentMethod: "Dinheiro", deliveryType: "delivery" },
 { id: "ord-003", customerName: "Ana Oliveira", items: "1x Veggie Burger, 1x Suco", total: 39.90, status: "delivering", time: "12:15", paymentMethod: "Cartão", deliveryType: "delivery" },
 { id: "ord-004", customerName: "Carlos Lima", items: "1x X-Bacon, 1x Onion Rings, 1x Milkshake", total: 76.90, status: "completed", time: "11:58", paymentMethod: "Pix", deliveryType: "pickup" },
 { id: "ord-005", customerName: "Fernanda Costa", items: "1x Double Smash, 1x Brownie", total: 62.90, status: "preparing", time: "12:45", paymentMethod: "Pix", deliveryType: "delivery" },
 { id: "ord-006", customerName: "Pedro Almeida", items: "2x X-Bacon, 2x Coca, 1x Batata", total: 95.80, status: "pending", time: "12:48", paymentMethod: "Dinheiro", deliveryType: "delivery" },
 { id: "ord-007", customerName: "Lucia Ferreira", items: "1x Veggie, 1x Suco", total: 39.90, status: "completed", time: "11:30", paymentMethod: "Pix", deliveryType: "pickup" },
 { id: "ord-008", customerName: "Roberto Mendes", items: "1x Double Smash, 1x Onion Rings", total: 60.90, status: "delivering", time: "12:20", paymentMethod: "Cartão", deliveryType: "delivery" },
]

/* ── Component ─────────────────────────────────────────────── */
export function AdminDashboard({ tenant, products }: { tenant: Tenant; products: (Product & { categories?: { name: string } })[] }) {
 const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "settings">("dashboard")
 const [isDemo, setIsDemo] = useState(false)
 const [displayProducts, setDisplayProducts] = useState(products)
 const router = useRouter()

 useEffect(() => {
 if (localStorage.getItem("deliverysaas_demo_session") === "true") {
 setIsDemo(true)
 setDisplayProducts(DEMO_PRODUCTS)
 }
 }, [])

 const handleLogout = () => {
 localStorage.removeItem("deliverysaas_demo_session")
 localStorage.removeItem("deliverysaas_demo_account")
 document.cookie = "deliverysaas_demo_session=; path=/; max-age=0"
 router.push("/admin/login")
 router.refresh()
 }

 const orders = isDemo ? DEMO_ORDERS : []
 const pending = orders.filter(o => o.status === "pending")
 const preparing = orders.filter(o => o.status === "preparing")
 const delivering = orders.filter(o => o.status === "delivering")
 const completed = orders.filter(o => o.status === "completed")
 const todaySales = orders.reduce((s, o) => s + o.total, 0)

 /* ── Sub-components ── */
 const OrderCard = ({ order, actionLabel, actionBg }: { order: DemoOrder; actionLabel: string; actionBg: string }) => (
 <div style={{ background: C.white, borderRadius: 8, padding: 12, border: "1px solid #E5E7EB" }}>
 <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
 <span style={{ fontSize: 12, fontWeight: 600, color: C.graphite }}>{order.customerName}</span>
 <span style={{ fontSize: 10, color: C.slate }}>{order.time}</span>
 </div>
 <p style={{ fontSize: 11, color: C.slate, lineHeight: 1.4, marginBottom: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.items}</p>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
 <span style={{ fontSize: 12, fontWeight: 700, color: C.orange }}>{formatCurrency(order.total)}</span>
 <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: C.ice, color: C.slate }}>{order.paymentMethod}</span>
 </div>
 <button style={{ width: "100%", background: actionBg, color: C.white, fontSize: 11, fontWeight: 700, padding: "6px 0", borderRadius: 8, border: "none", cursor: "pointer" }}>
 {actionLabel}
 </button>
 </div>
 )

 const StatusColumn = ({ title, icon: Icon, headerBg, headerColor, badgeBg, badgeColor, list, actionLabel, actionBg, emptyMsg }: {
 title: string; icon: any; headerBg: string; headerColor: string; badgeBg: string; badgeColor: string
 list: DemoOrder[]; actionLabel: string; actionBg: string; emptyMsg: string
 }) => (
 <div style={{ background: C.white, borderRadius: 12, border: "1px solid #E5E7EB", overflow: "hidden", display: "flex", flexDirection: "column" }}>
 <div style={{ background: headerBg, padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${headerBg}` }}>
 <span style={{ fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, color: headerColor }}><Icon size={14} /> {title}</span>
 <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 99, background: badgeBg, color: badgeColor }}>{list.length}</span>
 </div>
 <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8, flex: 1, minHeight: 120 }}>
 {list.length === 0 && <p style={{ fontSize: 12, color: C.slate, textAlign: "center", padding: "16px 0" }}>{emptyMsg}</p>}
 {list.map(o => <OrderCard key={o.id} order={o} actionLabel={actionLabel} actionBg={actionBg} />)}
 </div>
 </div>
 )

 /* ── Tab button helper ── */
 const TabBtn = ({ tab, icon: Icon, label }: { tab: typeof activeTab; icon: any; label: string }) => (
 <button
 onClick={() => setActiveTab(tab)}
 style={{
 flex: 1, minWidth: 100, padding: "12px 12px", fontSize: 14, fontWeight: 500,
 display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
 whiteSpace: "nowrap", border: "none", cursor: "pointer", background: "transparent",
 color: activeTab === tab ? C.orange : C.slate,
 borderBottom: activeTab === tab ? `2px solid ${C.orange}` : "2px solid transparent",
 transition: "color 0.15s, border-color 0.15s",
 }}
 >
 <Icon size={16} /> {label}
 </button>
 )

 return (
 <div style={{ minHeight: "100vh", background: C.ice, color: C.graphite }}>
 {/* ── Header (graphite) ── */}
 <header style={{ background: C.graphite, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 30, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.3)" }}>
 <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
 <div style={{ width: 32, height: 32, borderRadius: 8, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, color: C.white }}>{tenant.name[0]}</div>
 <div style={{ display: "flex", flexDirection: "column" }}>
 <span style={{ fontWeight: 700, color: C.white, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2 }}>{tenant.name}</span>
 {isDemo && <span style={{ fontSize: 10, color: C.orange, display: "flex", alignItems: "center", gap: 4 }}><Sparkles size={12} /> Modo Demo</span>}
 </div>
 </div>
 <button onClick={handleLogout} style={{ padding: 8, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }} title="Sair"><LogOut size={20} color="#9CA3AF" /></button>
 </header>

 {/* ── Tabs ── */}
 <nav style={{ display: "flex", borderBottom: "1px solid #E5E7EB", background: C.white, overflowX: "auto", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
 <TabBtn tab="dashboard" icon={LayoutDashboard} label="Dashboard" />
 <TabBtn tab="products" icon={Package} label="Produtos" />
 <TabBtn tab="settings" icon={Settings} label="Configurações" />
 </nav>

 {/* ── Demo banner ── */}
 {isDemo && <div style={{ background: C.orangeSoft, borderBottom: "1px solid #FED7AA", padding: "8px 16px", textAlign: "center" }}><p style={{ fontSize: 12, color: C.orange }}>⚡ Modo demonstração — dados fictícios, nada será salvo.</p></div>}

 <main style={{ maxWidth: 1024, margin: "0 auto", padding: 16, paddingBottom: 96 }}>

 {/* ═══════ DASHBOARD ═══════ */}
 {activeTab === "dashboard" && (
 <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
 {/* KPI Cards */}
 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
 {[
 { icon: TrendingUp, iconBg: "#DCFCE7", iconColor: C.success, label: "Vendas Hoje", value: formatCurrency(todaySales), sub: `${orders.length} pedidos`, subColor: C.success },
 { icon: MessageSquare, iconBg: "#DBEAFE", iconColor: C.info, label: "Mensagens", value: "89", sub: "via WhatsApp hoje", subColor: C.info },
 { icon: ShoppingCart, iconBg: "#EDE9FE", iconColor: "#7C3AED", label: "Ticket Médio", value: formatCurrency(orders.length ? todaySales / orders.length : 0), sub: "por pedido", subColor: "#7C3AED" },
 { icon: UtensilsCrossed, iconBg: C.orangeSoft, iconColor: C.orange, label: "Mais Vendido", value: "X-Bacon", sub: "47 vendas/semana", subColor: C.orange, small: true },
 ].map((kpi, i) => (
 <div key={i} style={{ background: C.white, borderRadius: 12, padding: 16, border: "1px solid #E5E7EB", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
 <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
 <div style={{ width: 32, height: 32, borderRadius: 8, background: kpi.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}><kpi.icon size={16} color={kpi.iconColor} /></div>
 <span style={{ fontSize: 12, color: C.slate }}>{kpi.label}</span>
 </div>
 <p style={{ fontSize: kpi.small ? 14 : 24, fontWeight: 700, color: C.graphite, margin: 0 }}>{kpi.value}</p>
 <p style={{ fontSize: 12, color: kpi.subColor, marginTop: 4 }}>{kpi.sub}</p>
 </div>
 ))}
 </div>

 {/* Order Queue */}
 <h2 style={{ fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, color: C.graphite, margin: 0 }}><ChefHat size={20} color={C.orange} /> Fila de Pedidos</h2>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
 <StatusColumn title="Pendentes" icon={Clock} headerBg={C.warningBg} headerColor="#92400E" badgeBg={C.warning} badgeColor={C.white} list={pending} actionLabel="Iniciar Preparo" actionBg={C.orange} emptyMsg="Nenhum pedido pendente" />
 <StatusColumn title="Preparando" icon={UtensilsCrossed} headerBg={C.infoBg} headerColor="#1E40AF" badgeBg={C.info} badgeColor={C.white} list={preparing} actionLabel="Marcar Pronto" actionBg={C.success} emptyMsg="Nada em preparo" />
 <StatusColumn title="Entregando" icon={Truck} headerBg="#E0E7FF" headerColor="#3730A3" badgeBg="#4F46E5" badgeColor={C.white} list={delivering} actionLabel="Confirmar Entrega" actionBg="#4F46E5" emptyMsg="Nenhuma entrega" />
 <StatusColumn title="Concluídos" icon={CheckCircle2} headerBg={C.successBg} headerColor="#166534" badgeBg={C.success} badgeColor={C.white} list={completed} actionLabel="Arquivar" actionBg="#9CA3AF" emptyMsg="Nenhum concluído" />
 </div>

 {/* Daily Summary */}
 <div style={{ background: C.white, borderRadius: 12, padding: 16, border: "1px solid #E5E7EB", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
 <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8, color: C.graphite, margin: "0 0 12px" }}><CircleAlert size={16} color={C.warning} /> Resumo do Dia</h3>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 16, textAlign: "center" }}>
 <div><p style={{ fontSize: 24, fontWeight: 700, color: C.graphite, margin: 0 }}>{orders.length}</p><p style={{ fontSize: 12, color: C.slate, margin: 0 }}>Total Pedidos</p></div>
 <div><p style={{ fontSize: 24, fontWeight: 700, color: C.success, margin: 0 }}>{completed.length}</p><p style={{ fontSize: 12, color: C.slate, margin: 0 }}>Concluídos</p></div>
 <div><p style={{ fontSize: 24, fontWeight: 700, color: C.warning, margin: 0 }}>{pending.length + preparing.length}</p><p style={{ fontSize: 12, color: C.slate, margin: 0 }}>Em Andamento</p></div>
 <div><p style={{ fontSize: 24, fontWeight: 700, color: "#4F46E5", margin: 0 }}>{delivering.length}</p><p style={{ fontSize: 12, color: C.slate, margin: 0 }}>Em Entrega</p></div>
 </div>
 </div>
 </div>
 )}

 {/* ═══════ PRODUCTS ═══════ */}
 {activeTab === "products" && (
 <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
 <h2 style={{ fontSize: 18, fontWeight: 700, color: C.graphite, margin: 0 }}>Cardápio ({displayProducts.length})</h2>
 <button style={{ background: C.orange, color: C.white, padding: "8px 16px", borderRadius: 12, fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, border: "none", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}><Plus size={16} /> Novo Produto</button>
 </div>
 {displayProducts.length === 0 ? (
 <div style={{ textAlign: "center", padding: "48px 0", background: C.white, borderRadius: 12, border: "1px dashed #E5E7EB" }}><Package size={48} color="#D1D5DB" /><p style={{ color: C.slate, marginTop: 12 }}>Nenhum produto cadastrado</p></div>
 ) : (
 <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
 {displayProducts.map(product => (
 <div key={product.id} style={{ background: C.white, borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 16, border: "1px solid #E5E7EB", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
 <div style={{ width: 64, height: 64, borderRadius: 8, background: C.ice, flexShrink: 0, overflow: "hidden" }}>
 {product.image_url ? <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#9CA3AF", fontSize: 12 }}>Sem foto</div>}
 </div>
 <div style={{ flex: 1, minWidth: 0 }}>
 <h3 style={{ fontWeight: 600, color: C.graphite, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.name}</h3>
 <p style={{ color: C.slate, fontSize: 14, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{product.categories?.name || "Sem categoria"}</p>
 <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
 <span style={{ color: C.orange, fontWeight: 700, fontSize: 14 }}>{formatCurrency(product.price)}</span>
 <span style={{ fontSize: 12, padding: "2px 8px", borderRadius: 99, background: product.is_available ? C.successBg : C.dangerBg, color: product.is_available ? C.success : C.danger }}>{product.is_available ? "Disponível" : "Indisponível"}</span>
 </div>
 </div>
 <div style={{ display: "flex", gap: 4 }}>
 <button style={{ padding: 8, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}><Edit size={16} color={C.slate} /></button>
 <button style={{ padding: 8, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}><Trash2 size={16} color={C.danger} /></button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* ═══════ SETTINGS ═══════ */}
 {activeTab === "settings" && (
 <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
 <h2 style={{ fontSize: 18, fontWeight: 700, color: C.graphite, margin: 0 }}>Configurações da Loja</h2>
 <div style={{ background: C.white, borderRadius: 12, padding: 16, border: "1px solid #E5E7EB", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", gap: 16 }}>
 {[
 { label: "Nome da Loja", defaultValue: tenant.name, type: "text" },
 { label: "WhatsApp (pedidos)", defaultValue: tenant.whatsapp_number, type: "tel" },
 { label: "Taxa de Entrega", defaultValue: String(tenant.delivery_fee), type: "number" },
 ].map(field => (
 <div key={field.label}>
 <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: C.slate, marginBottom: 4 }}>{field.label}</label>
 <input defaultValue={field.defaultValue} type={field.type} step={field.type === "number" ? "0.50" : undefined} style={{ width: "100%", background: C.ice, border: "1px solid #E5E7EB", borderRadius: 12, padding: "12px 16px", fontSize: 14, color: C.graphite, outline: "none", boxSizing: "border-box" }} />
 </div>
 ))}
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8 }}>
 <span style={{ fontSize: 14, fontWeight: 500, color: C.graphite }}>Loja Aberta</span>
 <button style={{ width: 48, height: 28, borderRadius: 99, border: "none", cursor: "pointer", position: "relative", background: tenant.is_open ? C.success : "#D1D5DB", transition: "background 0.2s" }}>
 <span style={{ position: "absolute", top: 4, left: tenant.is_open ? 24 : 4, width: 20, height: 20, borderRadius: "50%", background: C.white, boxShadow: "0 1px 2px rgba(0,0,0,0.1)", transition: "left 0.2s" }} />
 </button>
 </div>
 </div>
 <button style={{ width: "100%", background: C.orange, color: C.white, fontWeight: 700, padding: "12px 0", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>Salvar Alterações</button>
 </div>
 )}
 </main>
 </div>
 )
}