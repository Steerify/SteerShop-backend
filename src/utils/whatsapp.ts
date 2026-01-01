interface WhatsAppMessageParams {
  phone: string;
  message: string;
}

export const generateWhatsAppLink = ({ phone, message }: WhatsAppMessageParams): string => {
  // Remove any non-numeric characters from phone
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Ensure phone starts with country code (234 for Nigeria)
  const formattedPhone = cleanPhone.startsWith('234') 
    ? cleanPhone 
    : cleanPhone.startsWith('0')
    ? `234${cleanPhone.slice(1)}`
    : `234${cleanPhone}`;

  // Encode the message for URL
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};

interface OrderDetails {
  orderNumber: string;
  customerName: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  deliveryAddress: string;
}

export const formatOrderForWhatsApp = (order: OrderDetails): string => {
  const itemsList = order.items
    .map((item) => `- ${item.name} (x${item.quantity}) - ₦${(item.price / 100).toLocaleString()}`)
    .join('\n');

  return `
🛍️ *New Order: ${order.orderNumber}*

👤 Customer: ${order.customerName}

📦 Items:
${itemsList}

💰 Total: ₦${(order.total / 100).toLocaleString()}

📍 Delivery Address:
${order.deliveryAddress}

Please confirm this order.
  `.trim();
};
