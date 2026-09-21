/** Pakistan-friendly WhatsApp helpers (same pattern as Mushk admin). */

export function whatsappDigits(phone?: string | null): string {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('92') && digits.length >= 12) return digits;
  if (digits.startsWith('0') && digits.length >= 11) return `92${digits.slice(1)}`;
  if (digits.length === 10 && digits.startsWith('3')) return `92${digits}`;
  return digits;
}

export function whatsappHref(phone: string, message: string): string {
  if (!phone || !message) return '';
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export function fulfillmentLabel(status?: string) {
  if (!status) return '';
  return STATUS_LABEL[status] || status;
}

type OrderLike = {
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  shippingAddress?: { phone?: string; fullName?: string };
  fulfillmentStatus: string;
  trackingNumber?: string;
  trackingCarrier?: string;
};

export function buildOrderWhatsAppMessage(order: OrderLike): string {
  const name =
    String(order.customerName || order.shippingAddress?.fullName || 'Customer').trim() || 'Customer';
  const orderNo = order.orderNumber || '';
  const status = order.fulfillmentStatus;
  const tracking = String(order.trackingNumber || '').trim();
  const carrier = String(order.trackingCarrier || '').trim();

  const intro = `Dear ${name}, Thanks for ordering from SMART EDGE. Your Order No ${orderNo}`;

  switch (status) {
    case 'confirmed':
      return `${intro} is Confirmed. We will prepare your cover shortly.`;
    case 'processing':
      return `${intro} is being Processed. We will ship it soon.`;
    case 'shipped': {
      let msg = `${intro} is Shipped.`;
      if (tracking) {
        msg += ` Tracking: ${tracking}`;
        if (carrier) msg += ` via ${carrier}`;
        msg += '.';
      }
      msg += ' You can track updates in your SMART EDGE order page.';
      return msg;
    }
    case 'delivered':
      return `${intro} is Delivered. Thank you for shopping with SMART EDGE!`;
    case 'cancelled':
      return `${intro} has been Cancelled. Contact us on WhatsApp if you need help.`;
    default:
      return '';
  }
}

export function orderWhatsAppLink(order: OrderLike): { message: string; href: string; phone: string } {
  const message = buildOrderWhatsAppMessage(order);
  const phone = whatsappDigits(order.customerPhone || order.shippingAddress?.phone);
  const href = message && phone ? whatsappHref(phone, message) : '';
  return { message, href, phone };
}
