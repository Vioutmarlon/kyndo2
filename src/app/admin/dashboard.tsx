"use client"

import { useState, useEffect } from "react"
import { formatCurrency } from "@/lib/utils"
import type { Tenant, Product } from "@/lib/supabase"
import {
 Plus, Package, Settings, LogOut, Sparkles, Menu, X,
 LayoutDashboard, MessageSquare, ShoppingCart, ChefHat, Clock,
 TrendingUp, CheckCircle2, UtensilsCrossed, Truck, CircleAlert, Edit, Trash2,
 Users, BarChart3, DollarSign, ScanLine, Megaphone, Link2, ChevronRight
} from "lucide-react"
import { useRouter } from "next/navigation"
import {
 MotionDiv, MotionButton, FadeIn, StaggerContainer, StaggerItem,
 LazyImage, InteractiveCard, AnimatedSwitch
} from "@/components/motion"
import {
 AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
 ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts"

/* ── Kyndo Order Design Tokens ── */
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
 border: "#E5E7EB",
 shadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
 shadowMd: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
} as const

/* ── Demo Data ── */
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

const SALES_CHART_DATA = [
 { hora: "10h", vendas: 120 }, { hora: "11h", vendas: 280 },
 { hora: "12h", vendas: 450 }, { hora: "13h", vendas: 380 },
 { hora: "14h", vendas: 220 }, { hora: "15h", vendas: 180 },
 { hora: "16h", vendas: 90 }, { hora: "17h", vendas: 150 },
 { hora: "18h", vendas: 340 }, { hora: "19h", vendas: 520 },
 { hora: "20h", vendas: 480 }, { hora: "21h", vendas: 310 },
]

const PIE_COLORS = [C.warning, C.info, "#6366F1", C.success]

/* ── Sidebar Navigation Config ── */
type NavSection = { title: string; items: { id: string; label: string; icon: any; active?: boolean; comingSoon?: boolean }[] }

const NAV_SECTIONS: NavSection[] = [
 { title: "Principal", items: [
 { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, active: true },
 { id: "orders", label: "Pedidos", icon: ShoppingCart, comingSoon: true },
 { id: "products", label: "Produtos", icon: Package },
 { id: "menu", label: "Cardápio Digital", icon: ChefHat, comingSoon: true },
 ]},
 { title: "Gestão", items: [
 { id: "clients", label: "Clientes", icon: Users, comingSoon: true },
 { id: "reports", label: "Relatórios", icon: BarChart3, comingSoon: true },
 { id: "finance", label: "Financeiro", icon: DollarSign, comingSoon: true },
 ]},
 { title: "Ferramentas", items: [
 { id: "scan3d", label: "Kyndo 3D Scan", icon: ScanLine, comingSoon: true },
 { id: "marketing", label: "Marketing", icon: Megaphone, comingSoon: true },
 { id: "integrations", label: "Integrações", icon: Link2, comingSoon: true },
 ]},
 { title: "Sistema", items: [
 { id: "settings", label: "Configurações", icon: Settings },
 ]},
]

/* ════════════════════════════════════════════════════════════
 MAIN COMPONENT
 ════════════════════════════════════════════════════════════ */
export function AdminDashboard({ tenant, products }: { tenant: Tenant; products: (Product & { categories?: { name: string } })[] }) {
 const [activeTab, setActiveTab] = useState("dashboard")
 const [isDemo, setIsDemo] = useState(false)
 const [displayProducts, setDisplayProducts] = useState(products)
 const [sidebarOpen, setSidebarOpen] = useState(false)
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
 const inProgress = pending.length + preparing.length

 const pieData = [
 { name: "Pendentes", value: pending.length },
 { name: "Preparando", value: preparing.length },
 { name: "Entregando", value: delivering.length },
 { name: "Concluídos", value: completed.length },
 ].filter(d => d.value > 0)

 /* ── Kanban Sub-components ── */
 const OrderCard = ({ order, actionLabel, actionBg }: { order: DemoOrder; actionLabel: string; actionBg: string }) => (
 <MotionDiv whileHover={{ y: -2, boxShadow: C.shadowMd }} transition={{ duration: 0.15 }}
 style={{ background: C.white, borderRadius: 10, padding: 14, border: `1px solid ${C.border}`, cursor: "default" }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
 <span style={{ fontSize: 13, fontWeight: 600, color: C.graphite }}>{order.customerName}</span>
 <span style={{ fontSize: 11, color: C.slate, background: C.ice, padding: "2px 6px", borderRadius: 4 }}>{order.time}</span>
 </div>
 <p style={{ fontSize: 12, color: C.slate, lineHeight: 1.5, marginBottom: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{order.items}</p>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
 <span style={{ fontSize: 14, fontWeight: 700, color: C.orange }}>{formatCurrency(order.total)}</span>
 <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 99, background: C.ice, color: C.slate, fontWeight: 500 }}>{order.paymentMethod}</span>
 </div>
 <MotionButton whileTap={{ scale: 0.97 }} transition={{ duration: 0.1 }}
 style={{ width: "100%", background: actionBg, color: C.white, fontSize: 12, fontWeight: 600, padding: "8px 0", borderRadius: 8, border: "none", cursor: "pointer" }}>
 {actionLabel}
 </MotionButton>
 </MotionDiv>
 )

 const StatusColumn = ({ title, icon: Icon, headerColor, badgeBg, list, actionLabel, actionBg, emptyMsg }: {
 title: string; icon: any; headerColor: string; badgeBg: string
 list: DemoOrder[]; actionLabel: string; actionBg: string; emptyMsg: string
 }) => (
 <div style={{ background: C.white, borderRadius: 12, border: `1px solid ${C.border}`, overflow: "hidden", display: "flex", flexDirection: "column", minWidth: 240 }}>
 <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: `1px solid ${C.border}` }}>
 <span style={{ fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, color: headerColor }}><Icon size={15} /> {title}</span>
 <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99, background: badgeBg, color: C.white }}>{list.length}</span>
 </div>
 <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, flex: 1, minHeight: 140 }}>
 {list.length === 0 && <p style={{ fontSize: 12, color: "#9CA3AF", textAlign: "center", padding: "24px 0" }}>{emptyMsg}</p>}
 {list.map(o => <OrderCard key={o.id} order={o} actionLabel={actionLabel} actionBg={actionBg} />)}
 </div>
 </div>
 )

 /* ── Page Content per Tab ── */
 const renderDashboard = () => (
 <MotionDiv key="dashboard" initial={{ opacity: 0, y: 8, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -12, filter: "blur(4px)" }} transition={{ type: "spring", duration: 0.45, bounce: 0 }} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
 {/* KPI Cards */}
 <StaggerContainer style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
 {[
 { icon: TrendingUp, iconBg: C.successBg, iconColor: C.success, label: "Vendas Hoje", value: formatCurrency(todaySales), sub: `${orders.length} pedidos` },
 { icon: ShoppingCart, iconBg: C.infoBg, iconColor: C.info, label: "Pedidos", value: String(orders.length), sub: `${inProgress} em andamento` },
 { icon: DollarSign, iconBg: "#EDE9FE", iconColor: "#7C3AED", label: "Ticket Médio", value: formatCurrency(orders.length ? todaySales / orders.length : 0), sub: "por pedido" },
 { icon: UtensilsCrossed, iconBg: C.orangeSoft, iconColor: C.orange, label: "Mais Vendido", value: "X-Bacon", sub: "47 vendas esta semana" },
 ].map((kpi, i) => (
 <StaggerItem key={i}>
 <InteractiveCard style={{ background: C.white, borderRadius: 14, padding: 20, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
 <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
 <div style={{ width: 40, height: 40, borderRadius: 10, background: kpi.iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}><kpi.icon size={20} color={kpi.iconColor} /></div>
 <span style={{ fontSize: 13, fontWeight: 500, color: C.slate }}>{kpi.label}</span>
 </div>
 <p style={{ fontSize: 28, fontWeight: 800, color: C.graphite, margin: 0, letterSpacing: "-0.02em" }}>{kpi.value}</p>
 <p style={{ fontSize: 12, color: C.slate, marginTop: 4 }}>{kpi.sub}</p>
 </InteractiveCard>
 </StaggerItem>
 ))}
 </StaggerContainer>

 {/* Charts Row */}
 <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
 {/* Sales Chart */}
 <FadeIn delay={0.1}>
 <div style={{ background: C.white, borderRadius: 14, padding: 20, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
 <h3 style={{ fontSize: 15, fontWeight: 700, color: C.graphite, margin: "0 0 16px" }}>Desempenho de Vendas</h3>
 <div style={{ height: 220 }}>
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={SALES_CHART_DATA}>
 <defs><linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={C.orange} stopOpacity={0.15}/><stop offset="95%" stopColor={C.orange} stopOpacity={0}/></linearGradient></defs>
 <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
 <XAxis dataKey="hora" tick={{ fontSize: 11, fill: C.slate }} axisLine={false} tickLine={false} />
 <YAxis tick={{ fontSize: 11, fill: C.slate }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
 <RechartsTooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.border}`, boxShadow: C.shadowMd, fontSize: 12 }} formatter={(v: number) => [formatCurrency(v), "Vendas"]} />
 <Area type="monotone" dataKey="vendas" stroke={C.orange} strokeWidth={2.5} fill="url(#colorVendas)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>
 </FadeIn>

 {/* Pie Chart */}
 <FadeIn delay={0.2}>
 <div style={{ background: C.white, borderRadius: 14, padding: 20, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
 <h3 style={{ fontSize: 15, fontWeight: 700, color: C.graphite, margin: "0 0 16px" }}>Distribuição de Pedidos</h3>
 <div style={{ height: 220 }}>
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie data={pieData} cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
 {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
 </Pie>
 <RechartsTooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12 }} />
 <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: C.slate }} />
 </PieChart>
 </ResponsiveContainer>
 </div>
 </div>
 </FadeIn>
 </div>

 {/* Kanban */}
 <div>
 <h2 style={{ fontSize: 17, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, color: C.graphite, margin: "0 0 12px" }}><ChefHat size={20} color={C.orange} /> Fila de Pedidos</h2>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
 <StatusColumn title="Pendentes" icon={Clock} headerColor="#92400E" badgeBg={C.warning} list={pending} actionLabel="Iniciar Preparo" actionBg={C.orange} emptyMsg="Nenhum pedido pendente" />
 <StatusColumn title="Preparando" icon={UtensilsCrossed} headerColor="#1E40AF" badgeBg={C.info} list={preparing} actionLabel="Marcar Pronto" actionBg={C.success} emptyMsg="Nada em preparo" />
 <StatusColumn title="Entregando" icon={Truck} headerColor="#3730A3" badgeBg="#4F46E5" list={delivering} actionLabel="Confirmar Entrega" actionBg="#4F46E5" emptyMsg="Nenhuma entrega" />
 <StatusColumn title="Concluídos" icon={CheckCircle2} headerColor="#166534" badgeBg={C.success} list={completed} actionLabel="Arquivar" actionBg="#9CA3AF" emptyMsg="Nenhum concluído" />
 </div>
 </div>

 {/* Operational Summary */}
 <FadeIn delay={0.3}>
 <div style={{ background: C.white, borderRadius: 14, padding: 20, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
 <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, color: C.graphite, margin: "0 0 16px" }}><CircleAlert size={16} color={C.warning} /> Resumo Operacional</h3>
 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 20, textAlign: "center" }}>
 <div><p style={{ fontSize: 28, fontWeight: 800, color: C.graphite, margin: 0 }}>{orders.length}</p><p style={{ fontSize: 12, color: C.slate, margin: "4px 0 0" }}>Total Pedidos</p></div>
 <div><p style={{ fontSize: 28, fontWeight: 800, color: C.success, margin: 0 }}>{completed.length}</p><p style={{ fontSize: 12, color: C.slate, margin: "4px 0 0" }}>Concluídos</p></div>
 <div><p style={{ fontSize: 28, fontWeight: 800, color: C.warning, margin: 0 }}>{inProgress}</p><p style={{ fontSize: 12, color: C.slate, margin: "4px 0 0" }}>Em Andamento</p></div>
 <div><p style={{ fontSize: 28, fontWeight: 800, color: "#4F46E5", margin: 0 }}>{delivering.length}</p><p style={{ fontSize: 12, color: C.slate, margin: "4px 0 0" }}>Em Entrega</p></div>
 </div>
 </div>
 </FadeIn>
 </MotionDiv>
 )

 const renderProducts = () => (
 <MotionDiv key="products" initial={{ opacity: 0, y: 8, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -12, filter: "blur(4px)" }} transition={{ type: "spring", duration: 0.45, bounce: 0 }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
 <div>
 <h2 style={{ fontSize: 20, fontWeight: 700, color: C.graphite, margin: 0 }}>Produtos</h2>
 <p style={{ fontSize: 13, color: C.slate, margin: "4px 0 0" }}>Gerencie seu cardápio e categorias</p>
 </div>
 <MotionButton whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.15 }} style={{ background: C.orange, color: C.white, padding: "10px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, border: "none", cursor: "pointer", boxShadow: "0 2px 8px rgba(255,107,53,0.25)" }}><Plus size={16} /> Novo Produto</MotionButton>
 </div>
 {displayProducts.length === 0 ? (
 <FadeIn><div style={{ textAlign: "center", padding: "64px 0", background: C.white, borderRadius: 14, border: `1px dashed ${C.border}` }}><Package size={48} color="#D1D5DB" /><p style={{ color: C.slate, marginTop: 12 }}>Nenhum produto cadastrado</p></div></FadeIn>
 ) : (
 <StaggerContainer style={{ display: "flex", flexDirection: "column", gap: 8 }}>
 {displayProducts.map(product => (
 <StaggerItem key={product.id}>
 <InteractiveCard style={{ background: C.white, borderRadius: 12, padding: 16, display: "flex", alignItems: "center", gap: 16, border: `1px solid ${C.border}`, boxShadow: C.shadow }}>
 <LazyImage src={product.image_url} alt={product.name} width={56} height={56} />
 <div style={{ flex: 1, minWidth: 0 }}>
 <h3 style={{ fontWeight: 600, color: C.graphite, margin: 0, fontSize: 14 }}>{product.name}</h3>
 <p style={{ color: C.slate, fontSize: 12, margin: "2px 0 0" }}>{product.categories?.name || "Sem categoria"}</p>
 <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
 <span style={{ color: C.orange, fontWeight: 700, fontSize: 14 }}>{formatCurrency(product.price)}</span>
 <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: product.is_available ? C.successBg : C.dangerBg, color: product.is_available ? C.success : C.danger, fontWeight: 500 }}>{product.is_available ? "Disponível" : "Indisponível"}</span>
 </div>
 </div>
 <div style={{ display: "flex", gap: 4 }}>
 <MotionButton whileHover={{ scale: 1.1, background: C.ice }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.15 }} style={{ padding: 8, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}><Edit size={16} color={C.slate} /></MotionButton>
 <MotionButton whileHover={{ scale: 1.1, background: C.dangerBg }} whileTap={{ scale: 0.9 }} transition={{ duration: 0.15 }} style={{ padding: 8, borderRadius: 8, border: "none", background: "transparent", cursor: "pointer" }}><Trash2 size={16} color={C.danger} /></MotionButton>
 </div>
 </InteractiveCard>
 </StaggerItem>
 ))}
 </StaggerContainer>
 )}
 </MotionDiv>
 )

 const renderSettings = () => (
 <MotionDiv key="settings" initial={{ opacity: 0, y: 8, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -12, filter: "blur(4px)" }} transition={{ type: "spring", duration: 0.45, bounce: 0 }} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
 <div><h2 style={{ fontSize: 20, fontWeight: 700, color: C.graphite, margin: 0 }}>Configurações</h2><p style={{ fontSize: 13, color: C.slate, margin: "4px 0 0" }}>Dados da loja e preferências</p></div>
 <div style={{ background: C.white, borderRadius: 14, padding: 24, border: `1px solid ${C.border}`, boxShadow: C.shadow, display: "flex", flexDirection: "column", gap: 20 }}>
 {[{ label: "Nome da Loja", defaultValue: tenant.name, type: "text" }, { label: "WhatsApp (pedidos)", defaultValue: tenant.whatsapp_number, type: "tel" }, { label: "Taxa de Entrega", defaultValue: String(tenant.delivery_fee), type: "number" }].map(field => (
 <div key={field.label}><label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.slate, marginBottom: 6 }}>{field.label}</label><input defaultValue={field.defaultValue} type={field.type} step={field.type === "number" ? "0.50" : undefined} style={{ width: "100%", background: C.ice, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 16px", fontSize: 14, color: C.graphite, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }} /></div>
 ))}
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8 }}><span style={{ fontSize: 14, fontWeight: 600, color: C.graphite }}>Loja Aberta</span><button style={{ width: 48, height: 28, borderRadius: 99, border: "none", cursor: "pointer", position: "relative", background: tenant.is_open ? C.success : "#D1D5DB", transition: "background 0.2s" }}><span style={{ position: "absolute", top: 4, left: tenant.is_open ? 24 : 4, width: 20, height: 20, borderRadius: "50%", background: C.white, boxShadow: "0 1px 2px rgba(0,0,0,0.1)", transition: "left 0.2s" }} /></button></div>
 </div>
 <MotionButton whileTap={{ scale: 0.98 }} transition={{ duration: 0.1 }} style={{ width: "100%", background: C.orange, color: C.white, fontWeight: 700, padding: "14px 0", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 15, boxShadow: "0 2px 8px rgba(255,107,53,0.25)" }}>Salvar Alterações</MotionButton>
 </MotionDiv>
 )

 const TAB_CONTENT: Record<string, () => JSX.Element> = { dashboard: renderDashboard, products: renderProducts, settings: renderSettings }

 return (
 <div style={{ display: "flex", minHeight: "100vh", background: C.ice, color: C.graphite }}>
 {/* ── Mobile Overlay ── */}
 {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 40, backdropFilter: "blur(2px)" }} />}

 {/* ── Sidebar ── */}
 <aside style={{
 width: 260, background: C.graphite, display: "flex", flexDirection: "column", position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50,
 transform: sidebarOpen ? "translateX(0)" : undefined,
 transition: "transform 0.25s ease",
 ...(typeof window !== "undefined" && window.innerWidth < 768 && !sidebarOpen ? { transform: "translateX(-100%)" } : {}),
 }}>
 {/* Logo */}
 <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <div style={{ width: 32, height: 32, borderRadius: 8, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: C.white }}>K</div>
 <div><span style={{ fontWeight: 700, color: C.white, fontSize: 16 }}>kyndo</span><span style={{ color: C.orange, fontWeight: 700, fontSize: 16 }}>.</span><span style={{ fontWeight: 500, color: "rgba(255,255,255,0.6)", fontSize: 11, marginLeft: 4, letterSpacing: "0.05em" }}>ORDER</span></div>
 </div>
 <div style={{ marginTop: 12, padding: "8px 10px", background: "rgba(255,255,255,0.06)", borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
 <div style={{ width: 24, height: 24, borderRadius: 6, background: C.orange, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 11, color: C.white, flexShrink: 0 }}>{tenant.name[0]}</div>
 <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tenant.name}</span>
 </div>
 {isDemo && <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}><Sparkles size={10} color={C.orange} /><span style={{ fontSize: 10, color: C.orange }}>Modo Demo</span></div>}
 </div>

 {/* Nav Sections */}
 <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
 {NAV_SECTIONS.map(section => (
 <div key={section.title} style={{ marginBottom: 16 }}>
 <p style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 10px", marginBottom: 6 }}>{section.title}</p>
 {section.items.map(item => {
 const isActive = activeTab === item.id
 return (
 <button key={item.id} onClick={() => !item.comingSoon && setActiveTab(item.id)}
 style={{
 width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, border: "none", cursor: item.comingSoon ? "default" : "pointer",
 background: isActive ? "rgba(255,107,53,0.15)" : "transparent",
 color: isActive ? C.orange : "rgba(255,255,255,0.6)",
 fontSize: 13, fontWeight: isActive ? 600 : 400, transition: "all 0.15s",
 opacity: item.comingSoon ? 0.4 : 1,
 }}>
 <item.icon size={16} />
 <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
 {item.comingSoon && <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.3)" }}>Em breve</span>}
 {isActive && <ChevronRight size={14} />}
 </button>
 )
 })}
 </div>
 ))}
 </nav>

 {/* Footer */}
 <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
 <button onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, border: "none", cursor: "pointer", background: "transparent", color: "rgba(255,255,255,0.5)", fontSize: 13, transition: "color 0.15s" }}>
 <LogOut size={16} /> Sair
 </button>
 </div>
 </aside>

 {/* ── Main Content ── */}
 <div style={{ flex: 1, marginLeft: 260, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
 {/* Top Bar */}
 <header style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 20 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
 <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ display: "none", padding: 6, borderRadius: 6, border: "none", background: "transparent", cursor: "pointer" }} className="mobile-menu-btn"><Menu size={20} color={C.slate} /></button>
 <div>
 <h1 style={{ fontSize: 18, fontWeight: 700, color: C.graphite, margin: 0 }}>
 {activeTab === "dashboard" ? "Visão Geral" : activeTab === "products" ? "Produtos" : "Configurações"}
 </h1>
 <p style={{ fontSize: 12, color: C.slate, margin: "2px 0 0" }}>Acompanhe o desempenho do seu restaurante em tempo real.</p>
 </div>
 </div>
 {isDemo && <div style={{ background: C.orangeSoft, padding: "4px 12px", borderRadius: 99, display: "flex", alignItems: "center", gap: 4 }}><Sparkles size={12} color={C.orange} /><span style={{ fontSize: 11, color: C.orange, fontWeight: 600 }}>Demo</span></div>}
 </header>

 {/* Page Content */}
 <main style={{ flex: 1, padding: 24, maxWidth: 1200, width: "100%", margin: "0 auto", boxSizing: "border-box" }}>
 <AnimatedSwitch mode="wait">{TAB_CONTENT[activeTab]?.()}</AnimatedSwitch>
 </main>
 </div>

 {/* Mobile responsive styles */}
 <style>{`
 @media (max-width: 768px) {
 aside { transform: translateX(-100%) !important; }
 div[style*="marginLeft: 260"] { margin-left: 0 !important; }
 .mobile-menu-btn { display: flex !important; }
 }
 @media (prefers-reduced-motion: reduce) {
 *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
 }
 `}</style>
 </div>
 )
}