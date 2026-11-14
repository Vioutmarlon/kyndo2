import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value)
}

export function generateWhatsAppMessage(order: {
  customerName: string
  customerPhone: string
  items: Array<{ name: string; qty: number; price: number; obs?: string }>
  subtotal: number
  discount: number
  total: number
  address: string
  paymentMethod: string
  changeFor?: number
  deliveryType: "delivery" | "pickup"
}): string {
  const itemsText = order.items
    .map(
      (item) =>
        `• ${item.qty}x ${item.name} - ${formatCurrency(item.price)}${item.obs ? `\n  ↳ Obs: ${item.obs}` : ""}`
    )
    .join("\n")

  const discountLine =
    order.discount > 0
      ? `\n🏷️ *Desconto:* -${formatCurrency(order.discount)}`
      : ""

  const changeLine =
    order.changeFor && order.paymentMethod === "dinheiro"
      ? `\n💵 *Troco para:* ${formatCurrency(order.changeFor)}`
      : ""

  const deliveryLine =
    order.deliveryType === "delivery"
      ? `\n📍 *Entrega:* ${order.address}`
      : "\n📍 *Retirada no local*"

  return `🍔 *NOVO PEDIDO - ${order.customerName}*
📱 WhatsApp: ${order.customerPhone}

*Itens:*
${itemsText}

💰 *Subtotal:* ${formatCurrency(order.subtotal)}${discountLine}
💵 *Total:* ${formatCurrency(order.total)}
${deliveryLine}
💳 *Pagamento:* ${order.paymentMethod}${changeLine}
⏰ *Horário:* Agora`
}