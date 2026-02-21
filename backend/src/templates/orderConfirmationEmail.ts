import { PaymentMethod } from '@prisma/client';

type OrderItem = {
  menuItemId: number;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

type OrderEmailData = {
  orderCode: string;
  customerName: string;
  deliveryAddress: string;
  deliveryDate: Date;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  items: OrderItem[];
};

function formatPaymentMethod(paymentMethod: PaymentMethod) {
  return paymentMethod === 'BANK_TRANSFER' ? 'Bank Transfer' : 'Cash on Delivery';
}

export function buildOrderConfirmationEmail(data: OrderEmailData) {
  const itemRows = data.items
    .map(
      (item) =>
        `<tr><td>${item.name}</td><td>${item.quantity}</td><td>₹${item.unitPrice.toFixed(2)}</td><td>₹${item.subtotal.toFixed(2)}</td></tr>`
    )
    .join('');

  const html = `
    <h2>Thanks for your pre-order, ${data.customerName}!</h2>
    <p>Your order has been received successfully.</p>
    <p><strong>Order ID:</strong> ${data.orderCode}</p>
    <p><strong>Delivery:</strong> ${data.deliveryAddress} on ${data.deliveryDate.toLocaleString()}</p>
    <p><strong>Payment method:</strong> ${formatPaymentMethod(data.paymentMethod)}</p>
    <table border="1" cellpadding="8" cellspacing="0">
      <thead>
        <tr><th>Item</th><th>Qty</th><th>Unit price</th><th>Subtotal</th></tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>
    <p><strong>Total:</strong> ₹${data.totalAmount.toFixed(2)}</p>
  `;

  const textLines = [
    `Thanks for your pre-order, ${data.customerName}!`,
    `Order ID: ${data.orderCode}`,
    `Delivery: ${data.deliveryAddress} on ${data.deliveryDate.toLocaleString()}`,
    `Payment method: ${formatPaymentMethod(data.paymentMethod)}`,
    'Items:'
  ];

  for (const item of data.items) {
    textLines.push(`- ${item.name} x${item.quantity} @ ₹${item.unitPrice.toFixed(2)} = ₹${item.subtotal.toFixed(2)}`);
  }

  textLines.push(`Total: ₹${data.totalAmount.toFixed(2)}`);

  return {
    subject: `Foodie Pre-Order Confirmation (${data.orderCode})`,
    html,
    text: textLines.join('\n')
  };
}
