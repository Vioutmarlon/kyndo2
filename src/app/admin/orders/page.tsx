"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { formatCurrency } from "@/lib/utils"
import {
  Search, ShoppingCart, Clock, ChefHat, Truck, CheckCircle2,
  XCircle, Phone, User, CreditCard, MapPin, Package, RefreshCw
} from "lucide-react"
import {
  MotionDiv, MotionButton, FadeIn, StaggerContainer, StaggerItem,
  SkeletonRow
} from "@/components/motion"

/* ── Kyndo Order Design Tokens (mesmos do dashboard) ── */
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
  indigo: "#4F46E5",
  indigoBg: "#E0E7FF",
  border: "#E5E7EB",
  shadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
  shadowMd: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05)",
} as const

/* ── Tipos ── */
type OrderStatus = "pending" | "confirmed" | "preparing" | "delivering" | "completed" | "cancelled"

interface OrderItem {
  product_name: string
  quantity: number
  price: number
  observations?: string
}

interface Order {
  id: string
  customer_name: string
  customer_phone: string
  items: OrderItem[]
  total: number
  status: OrderStatus
  payment_method: string
  delivery_type: "delivery" | "pickup"
  delivery_address?: string
  created_at: string
  updated_at: string
}

/* ── Configuração de Status ── */
const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "Pendente", color: "#92400E", bg: C.warningBg, icon: Clock },
  confirmed: { label: "Confirmado", color: "#1E40AF", bg: C.infoBg, icon: CheckCircle2 },
  preparing: { label: "Preparando", color: "#1E40AF", bg: C.infoBg, icon: ChefHat },
  delivering: { label: "Entregando", color: "#3730A3", bg: C.indigoBg, icon: Truck },
  completed: { label: "Concluído", color: "#166534", bg: C.successBg, icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "#991B1B", bg: C.dangerBg, icon: XCircle },
}

const FILTER_TABS: { id: OrderStatus | "all"; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "pending", label: "Pendentes" },
  { id: "preparing", label: "Preparando" },
  { id: "delivering", label: "Entregando" },
  { id: "completed", label: "Concluídos" },
  { id: "cancelled", label: "Cancelados" },
]

/* ── Ações disponíveis por status ── */
function getActions(order: Order): { label: string; nextStatus: OrderStatus; bg: string }[] {
  switch (order.status) {
    case "pending":
      return [
        { label: "Confirmar", nextStatus: "confirmed", bg: C.orange },
        { label: "Cancelar", nextStatus: "cancelled", bg: C.danger },
      ]
    case "confirmed":
      return [
        { label: "Iniciar Preparo", nextStatus: "preparing", bg: C.info },
      ]
    case "preparing":
      if (order.delivery_type === "delivery") {
        return [{ label: "Marcar Pronto", nextStatus: "delivering", bg: C.indigo }]
      }
      return [{ label: "Marcar Pronto", nextStatus: "completed", bg: C.success }]
    case "delivering":
      return [{ label: "Confirmar Entrega", nextStatus: "completed", bg: C.success }]
    default:
      return []
  }
}

/* ── Formatação de método de pagamento ── */
function formatPayment(method: string): string {
  const map: Record<string, string> = {
    pix: "Pix",
    dinheiro: "Dinheiro",
    cartao: "Cartão",
    credito: "Cartão Crédito",
    debito: "Cartão Débito",
  }
  return map[method?.toLowerCase()] || method || "Não informado"
}

/* ════════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
   ════════════════════════════════════════════════════════════ */
export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<OrderStatus | "all">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [transitioningIds, setTransitioningIds] = useState<Set<string>>(new Set())

  /* ── Buscar pedidos ── */
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/orders?limit=200")
      if (!res.ok) throw new Error("Falha ao carregar")
      const data = await res.json()
      setOrders(data)
    } catch {
      // Silent fail — lista vazia como fallback
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
    // Polling a cada 15s para atualizações em tempo real
    const interval = setInterval(fetchOrders, 15000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  /* ── Atualizar status (otimista) ── */
  async function handleStatusChange(orderId: string, nextStatus: OrderStatus) {
    if (transitioningIds.has(orderId)) return

    // Update otimista
    setTransitioningIds(prev => new Set(prev).add(orderId))
    const previousOrders = [...orders]
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: nextStatus } : o))

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) {
        // Reverter em caso de erro
        setOrders(previousOrders)
        const err = await res.json().catch(() => ({ error: "Erro ao atualizar" }))
        alert(err.error || "Falha na atualização")
      }
    } catch {
      setOrders(previousOrders)
      alert("Erro de conexão. Tente novamente.")
    } finally {
      setTransitioningIds(prev => {
        const s = new Set(prev)
        s.delete(orderId)
        return s
      })
    }
  }

  /* ── Filtragem client-side ── */
  const filteredOrders = useMemo(() => {
    let result = orders

    // Filtro por status
    if (activeFilter !== "all") {
      result = result.filter(o => o.status === activeFilter)
    }

    // Busca por nome ou telefone
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      result = result.filter(o =>
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_phone?.includes(q)
      )
    }

    return result
  }, [orders, activeFilter, searchQuery])

  /* ── Contadores por status ── */
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length }
    for (const o of orders) {
      c[o.status] = (c[o.status] || 0) + 1
    }
    return c
  }, [orders])

  /* ── Render ── */
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 1200, margin: "0 auto", width: "100%" }}>
      {/* Header */}
      <FadeIn>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: C.graphite, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <ShoppingCart size={24} color={C.orange} />
              Pedidos
            </h1>
            <p style={{ fontSize: 13, color: C.slate, margin: "4px 0 0" }}>
              Gerencie todos os pedidos do seu restaurante
            </p>
          </div>
          <MotionButton
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.15 }}
            onClick={() => { setLoading(true); fetchOrders() }}
            style={{
              background: C.white,
              color: C.slate,
              padding: "10px 16px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: `1px solid ${C.border}`,
              cursor: "pointer",
            }}
          >
            <RefreshCw size={14} className={loading ? "spin-animation" : ""} />
            Atualizar
          </MotionButton>
        </div>
      </FadeIn>

      {/* Search + Filters */}
      <FadeIn delay={0.05}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Search Bar */}
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: C.slate }} />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                background: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: "12px 16px 12px 40px",
                fontSize: 14,
                color: C.graphite,
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
              }}
            />
          </div>

          {/* Filter Tabs */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
            {FILTER_TABS.map(tab => {
              const isActive = activeFilter === tab.id
              const count = counts[tab.id] || 0
              return (
                <MotionButton
                  key={tab.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.1 }}
                  onClick={() => setActiveFilter(tab.id)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 99,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    background: isActive ? C.orange : C.white,
                    color: isActive ? C.white : C.slate,
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: isActive ? "0 2px 8px rgba(255,107,53,0.25)" : C.shadow,
                  }}
                >
                  {tab.label}
                  {count > 0 && (
                    <span style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "1px 6px",
                      borderRadius: 99,
                      background: isActive ? "rgba(255,255,255,0.25)" : C.ice,
                      color: isActive ? C.white : C.slate,
                    }}>
                      {count}
                    </span>
                  )}
                </MotionButton>
              )
            })}
          </div>
        </div>
      </FadeIn>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : filteredOrders.length === 0 ? (
        /* Empty State */
        <FadeIn>
          <div style={{
            textAlign: "center",
            padding: "64px 24px",
            background: C.white,
            borderRadius: 14,
            border: `1px dashed ${C.border}`,
          }}>
            <Package size={48} color="#D1D5DB" style={{ marginBottom: 12 }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: C.graphite, margin: "0 0 4px" }}>
              {searchQuery ? "Nenhum pedido encontrado" : "Nenhum pedido"}
            </p>
            <p style={{ fontSize: 13, color: C.slate, margin: 0 }}>
              {searchQuery
                ? `Não há resultados para "${searchQuery}"`
                : activeFilter === "all"
                  ? "Os pedidos aparecerão aqui quando chegarem"
                  : `Nenhum pedido com status "${STATUS_CONFIG[activeFilter as OrderStatus]?.label}"`}
            </p>
          </div>
        </FadeIn>
      ) : (
        /* Orders List */
        <StaggerContainer>
          <div className="orders-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 12 }}>
            {filteredOrders.map(order => {
              const statusCfg = STATUS_CONFIG[order.status]
              const StatusIcon = statusCfg.icon
              const actions = getActions(order)
              const isTransitioning = transitioningIds.has(order.id)
              const timeStr = new Date(order.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
              const itemsSummary = Array.isArray(order.items)
                ? order.items.map(i => `${i.quantity}x ${i.product_name}`).join(", ")
                : ""

              return (
                <StaggerItem key={order.id}>
                  <MotionDiv
                    whileHover={{ boxShadow: C.shadowMd }}
                    transition={{ duration: 0.15 }}
                    style={{
                      background: C.white,
                      borderRadius: 12,
                      padding: 16,
                      border: `1px solid ${C.border}`,
                      boxShadow: C.shadow,
                      opacity: isTransitioning ? 0.7 : 1,
                      transition: "opacity 0.2s",
                    }}
                  >
                    {/* Header: Cliente + Horário */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8,
                          background: C.orangeSoft, display: "flex",
                          alignItems: "center", justifyContent: "center",
                        }}>
                          <User size={16} color={C.orange} />
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: C.graphite, margin: 0 }}>
                            {order.customer_name || "Cliente"}
                          </p>
                          <p style={{ fontSize: 11, color: C.slate, margin: "2px 0 0", display: "flex", alignItems: "center", gap: 4 }}>
                            <Phone size={10} />
                            {order.customer_phone || "Sem telefone"}
                          </p>
                        </div>
                      </div>
                      <span style={{
                        fontSize: 11, color: C.slate, background: C.ice,
                        padding: "3px 8px", borderRadius: 6, fontWeight: 500,
                      }}>
                        {timeStr}
                      </span>
                    </div>

                    {/* Items Summary */}
                    <p style={{
                      fontSize: 12, color: C.slate, lineHeight: 1.5,
                      margin: "0 0 10px", overflow: "hidden",
                      textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {itemsSummary || "Sem itens"}
                    </p>

                    {/* Total + Status Badge */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: C.orange, letterSpacing: "-0.01em" }}>
                        {formatCurrency(Number(order.total))}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: "3px 10px",
                        borderRadius: 99, background: statusCfg.bg, color: statusCfg.color,
                        display: "flex", alignItems: "center", gap: 4,
                      }}>
                        <StatusIcon size={12} />
                        {statusCfg.label}
                      </span>
                    </div>

                    {/* Info Row: Payment + Delivery Type */}
                    <div style={{
                      display: "flex", gap: 8, marginBottom: 12,
                      fontSize: 11, color: C.slate,
                    }}>
                      <span style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "3px 8px", borderRadius: 6, background: C.ice,
                      }}>
                        <CreditCard size={11} />
                        {formatPayment(order.payment_method)}
                      </span>
                      <span style={{
                        display: "flex", alignItems: "center", gap: 4,
                        padding: "3px 8px", borderRadius: 6, background: C.ice,
                      }}>
                        <MapPin size={11} />
                        {order.delivery_type === "delivery" ? "Entrega" : "Retirada"}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    {actions.length > 0 && (
                      <div style={{ display: "flex", gap: 6 }}>
                        {actions.map(action => (
                          <MotionButton
                            key={action.nextStatus}
                            whileTap={{ scale: 0.97 }}
                            transition={{ duration: 0.1 }}
                            onClick={() => handleStatusChange(order.id, action.nextStatus)}
                            disabled={isTransitioning}
                            style={{
                              flex: 1,
                              background: action.bg,
                              color: C.white,
                              fontSize: 12,
                              fontWeight: 600,
                              padding: "9px 0",
                              borderRadius: 8,
                              border: "none",
                              cursor: isTransitioning ? "default" : "pointer",
                              opacity: isTransitioning ? 0.6 : 1,
                            }}
                          >
                            {isTransitioning ? "Atualizando..." : action.label}
                          </MotionButton>
                        ))}
                      </div>
                    )}
                  </MotionDiv>
                </StaggerItem>
              )
            })}
          </div>
        </StaggerContainer>
      )}

      {/* Responsive + Reduced Motion Styles */}
      <style>{`
        @media (max-width: 768px) {
          .orders-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            transition-duration: 0.01ms !important;
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-animation {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  )
}