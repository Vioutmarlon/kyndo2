"use client"

import { useState } from "react"
import { formatCurrency, generateWhatsAppMessage } from "@/lib/utils"
import type { Tenant, Category, Product } from "@/lib/supabase"
import { ShoppingCart, Plus, Minus, X, MessageCircle, CheckCircle2, AlertCircle, ChevronLeft } from "lucide-react"
import { FadeIn, MotionDiv } from "@/components/motion"

interface CartItem extends Product {
  quantity: number
  selectedOption?: string
  selectedExtras: string[]
  observations: string
}

interface OrderConfirmationData {
  id: string
  total: number
  payment_method: string
  delivery_type: "delivery" | "pickup"
}

export function Storefront({
  store,
  categories,
}: {
  store: Tenant
  categories: (Category & { products: Product[] })[]
}) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [address, setAddress] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("pix")
  const [changeFor, setChangeFor] = useState("")
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery")
  const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmationData | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const addToCart = (product: Product, option?: string) => {
    const existing = cart.find((item) => item.id === product.id && item.selectedOption === option)
    if (existing) {
      setCart(cart.map((item) =>
        item.id === product.id && item.selectedOption === option
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1, selectedOption: option, selectedExtras: [], observations: "" }])
    }
  }

  const removeFromCart = (productId: string, option?: string) => {
    setCart(cart.filter((item) => !(item.id === productId && item.selectedOption === option)))
  }

  const updateQuantity = (productId: string, delta: number, option?: string) => {
    setCart(cart.map((item) => {
      if (item.id === productId && item.selectedOption === option) {
        const newQty = Math.max(0, item.quantity + delta)
        return newQty === 0 ? null : { ...item, quantity: newQty }
      }
      return item
    }).filter(Boolean) as CartItem[])
  }

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const deliveryFee = deliveryType === "delivery" ? store.delivery_fee : 0
  const total = subtotal + deliveryFee

  const handleCheckout = async () => {
    if (!customerName || !customerPhone) {
      alert("Preencha seu nome e WhatsApp para continuar.")
      return
    }
    if (deliveryType === "delivery" && !address) {
      alert("Preencha o endereço de entrega.")
      return
    }

    setIsSubmitting(true)
    setCheckoutError(null)

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: store.id,
          customer_name: customerName,
          customer_phone: customerPhone,
          items: cart.map((item) => ({
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            unit_price: item.price,
            selected_option: item.selectedOption || undefined,
            extras: item.selectedExtras || [],
            observations: item.observations || undefined,
          })),
          subtotal,
          discount: 0,
          total,
          address: deliveryType === "delivery" ? address : undefined,
          payment_method: paymentMethod,
          change_for: paymentMethod === "dinheiro" && changeFor ? parseFloat(changeFor) : undefined,
          delivery_type: deliveryType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMessage = typeof errorData?.error === "string"
          ? errorData.error
          : "Não foi possível processar seu pedido. Tente novamente."
        setCheckoutError(errorMessage)
        return
      }

      const order = await response.json()
      setOrderConfirmation({
        id: order.id,
        total: order.total,
        payment_method: order.payment_method,
        delivery_type: order.delivery_type,
      })
    } catch {
      setCheckoutError("Erro de conexão. Verifique sua internet e tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendWhatsApp = () => {
    const message = generateWhatsAppMessage({
      customerName,
      customerPhone,
      items: cart.map((item) => ({
        name: `${item.name}${item.selectedOption ? ` (${item.selectedOption})` : ""}`,
        qty: item.quantity,
        price: item.price * item.quantity,
        obs: item.observations || undefined,
      })),
      subtotal,
      discount: 0,
      total,
      address: deliveryType === "delivery" ? address : "",
      paymentMethod,
      changeFor: paymentMethod === "dinheiro" && changeFor ? parseFloat(changeFor) : undefined,
      deliveryType,
    })

    const phone = store.whatsapp_number.replace(/\D/g, "")
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, "_blank")
  }

  const handleBackToMenu = () => {
    setCart([])
    setOrderConfirmation(null)
    setCustomerName("")
    setCustomerPhone("")
    setAddress("")
    setPaymentMethod("pix")
    setChangeFor("")
    setDeliveryType("delivery")
    setCheckoutError(null)
    setIsCartOpen(false)
  }

  const paymentLabel: Record<string, string> = {
    pix: "Pix",
    dinheiro: "Dinheiro",
    cartao_credito: "Cartão de Crédito",
    cartao_debito: "Cartão de Débito",
  }

  // ── Tela de Confirmação ──────────────────────────────────
  if (orderConfirmation) {
    const orderNumber = `#ORD-${orderConfirmation.id.slice(0, 8).toUpperCase()}`
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex items-center justify-center px-4">
        <FadeIn className="w-full max-w-md">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 text-center space-y-6">
            {/* Ícone de sucesso */}
            <MotionDiv
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="flex justify-center"
            >
              <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-400" />
              </div>
            </MotionDiv>

            {/* Título e número do pedido */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Pedido confirmado!</h2>
              <p className="text-zinc-400 text-sm">Seu pedido foi recebido com sucesso</p>
              <p className="text-orange-400 font-mono font-bold text-lg">{orderNumber}</p>
            </div>

            {/* Resumo do pedido */}
            <div className="bg-zinc-950 rounded-xl p-4 space-y-3 text-left border border-zinc-800">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Total</span>
                <span className="font-bold text-white">{formatCurrency(orderConfirmation.total)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Pagamento</span>
                <span className="text-white">{paymentLabel[orderConfirmation.payment_method] || orderConfirmation.payment_method}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Entrega</span>
                <span className="text-white">{orderConfirmation.delivery_type === "delivery" ? "Delivery" : "Retirada no local"}</span>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="space-y-3 pt-2">
              <button
                onClick={handleSendWhatsApp}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-5 h-5" /> Enviar detalhes no WhatsApp
              </button>
              <button
                onClick={handleBackToMenu}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" /> Voltar ao cardápio
              </button>
            </div>
          </div>
        </FadeIn>
      </div>
    )
  }

  // ── Storefront Principal ─────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-zinc-900/95 backdrop-blur border-b border-zinc-800">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center font-bold text-lg">
                {store.name[0]}
              </div>
            )}
            <div>
              <h1 className="font-bold text-lg leading-tight">{store.name}</h1>
              <span className={`text-xs font-medium ${store.is_open ? "text-green-400" : "text-red-400"}`}>
                {store.is_open ? "🟢 Aberto agora" : "🔴 Fechado"}
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors"
          >
            <ShoppingCart className="w-6 h-6 text-white" />
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {cart.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Banner */}
      {store.banner_url && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <img src={store.banner_url} alt="Promoção" className="w-full h-32 object-cover rounded-xl" />
        </div>
      )}

      {/* Menu */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-8 pb-24">
        {categories.map((category) => (
          <section key={category.id}>
            <h2 className="text-xl font-bold mb-4 text-orange-400">{category.name}</h2>
            <div className="space-y-3">
              {category.products.filter((p) => p.is_available).map((product) => (
                <div key={product.id} className="bg-zinc-900 rounded-xl p-4 flex gap-4 border border-zinc-800">
                  {product.image_url && (
                    <img src={product.image_url} alt={product.name} className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{product.name}</h3>
                    <p className="text-zinc-400 text-sm line-clamp-2 mt-1">{product.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-orange-400 font-bold">{formatCurrency(product.price)}</span>
                      <button
                        onClick={() => addToCart(product)}
                        className="flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" /> Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}>
          <div className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-zinc-900 p-4 border-b border-zinc-800 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold">Seu Pedido</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-1 hover:bg-zinc-800 rounded-lg">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {cart.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">Sua sacola está vazia</p>
              ) : (
                <>
                  {cart.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex items-center gap-3 bg-zinc-950 p-3 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        {item.selectedOption && <p className="text-xs text-zinc-400">{item.selectedOption}</p>}
                        <p className="text-orange-400 text-sm font-bold mt-1">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.id, -1, item.selectedOption)} className="p-1 bg-zinc-800 rounded-lg hover:bg-zinc-700">
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-6 text-center font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1, item.selectedOption)} className="p-1 bg-zinc-800 rounded-lg hover:bg-zinc-700">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="border-t border-zinc-800 pt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-400">Entrega</span>
                      <span>{deliveryFee > 0 ? formatCurrency(deliveryFee) : "Grátis"}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-orange-400">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <input placeholder="Seu nome" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none" />
                    <input placeholder="WhatsApp (com DDD)" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none" />

                    <div className="flex gap-2">
                      <button onClick={() => setDeliveryType("delivery")} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${deliveryType === "delivery" ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>Delivery</button>
                      <button onClick={() => setDeliveryType("pickup")} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${deliveryType === "pickup" ? "bg-orange-500 text-white" : "bg-zinc-800 text-zinc-400"}`}>Retirar</button>
                    </div>

                    {deliveryType === "delivery" && (
                      <input placeholder="Endereço completo" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none" />
                    )}

                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none">
                      <option value="pix">Pix</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="cartao_credito">Cartão de Crédito</option>
                      <option value="cartao_debito">Cartão de Débito</option>
                    </select>

                    {paymentMethod === "dinheiro" && (
                      <input placeholder="Troco para quanto?" value={changeFor} onChange={(e) => setChangeFor(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:border-orange-500 outline-none" />
                    )}

                    {/* Mensagem de erro */}
                    {checkoutError && (
                      <FadeIn className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-300 text-sm">{checkoutError}</p>
                      </FadeIn>
                    )}

                    <button
                      onClick={handleCheckout}
                      disabled={isSubmitting}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-500/50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors text-lg"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>Confirmar Pedido</>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}