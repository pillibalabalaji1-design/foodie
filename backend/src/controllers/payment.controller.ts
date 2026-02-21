import { PaymentMethod } from '@prisma/client';
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { sendOrderConfirmationEmail, sendOrderConfirmationSms } from '../services/notification.service';
import { buildOrderConfirmationEmail } from '../templates/orderConfirmationEmail';

const orderItemSchema = z.object({
  menuItemId: z.number().int().positive(),
  name: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: z.number().positive()
});

const createPaymentSchema = z.object({
  customerName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  address: z.string().min(5),
  deliveryDate: z.string().datetime(),
  specialInstructions: z.string().max(500).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentReference: z.string().max(120).optional(),
  items: z.array(orderItemSchema).min(1)
});

export async function createPayment(req: Request, res: Response) {
  let parsedItems: unknown = req.body.items;
  if (typeof parsedItems === 'string') {
    try {
      parsedItems = JSON.parse(parsedItems);
    } catch {
      return res.status(400).json({ message: 'Invalid items payload.' });
    }
  }

  const payload = {
    ...req.body,
    items: parsedItems,
    paymentReceiptUrl: req.file ? `/uploads/${req.file.filename}` : undefined
  };

  const parse = createPaymentSchema.safeParse(payload);
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid payload', errors: parse.error.flatten() });
  }

  const data = parse.data;
  const computedItems = data.items.map((item) => ({
    ...item,
    subtotal: Number((item.quantity * item.unitPrice).toFixed(2))
  }));

  const totalAmount = computedItems.reduce((sum, item) => sum + item.subtotal, 0);
  if (totalAmount <= 0) {
    return res.status(400).json({ message: 'Cart is empty.' });
  }

  const created = await prisma.order.create({
    data: {
      orderCode: `TMP-${Date.now()}`,
      customerName: data.customerName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      address: data.address,
      deliveryDate: new Date(data.deliveryDate),
      items: computedItems,
      totalAmount,
      paymentMethod: data.paymentMethod,
      paymentReference: data.paymentReference,
      paymentReceiptUrl: payload.paymentReceiptUrl,
      specialInstructions: data.specialInstructions,
      paymentDetails:
        data.paymentMethod === 'BANK_TRANSFER'
          ? {
              bankName: 'Foodie National Bank',
              accountName: 'Foodie Foods Pvt Ltd',
              accountNumber: '002233445566',
              referenceInstruction: 'Use your Order ID as transfer reference'
            }
          : undefined,
      status: 'PENDING'
    }
  });

  const orderCode = `FOOD-${new Date().getFullYear()}-${String(created.id).padStart(5, '0')}`;
  const order = await prisma.order.update({ where: { id: created.id }, data: { orderCode } });

  return res.status(201).json({
    message: 'Pending payment order created.',
    orderId: order.id,
    orderCode,
    status: order.status,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    items: computedItems
  });
}

export async function confirmPayment(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'Invalid order id.' });
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return res.status(404).json({ message: 'Order not found.' });
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const typedItems = items.filter(
    (item): item is { menuItemId: number; name: string; quantity: number; unitPrice: number; subtotal: number } =>
      typeof item === 'object' && item !== null
  );

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: order.paymentMethod === 'BANK_TRANSFER' ? 'PAID' : 'CONFIRMED'
    }
  });

  const email = buildOrderConfirmationEmail({
    orderCode: updated.orderCode,
    customerName: updated.customerName,
    deliveryAddress: updated.address,
    deliveryDate: updated.deliveryDate,
    paymentMethod: updated.paymentMethod,
    totalAmount: updated.totalAmount,
    items: typedItems
  });

  await sendOrderConfirmationEmail(updated.email, email.subject, email.html, email.text);

  let smsSent = false;
  if (updated.phone) {
    await sendOrderConfirmationSms(updated.phone, `Foodie order ${updated.orderCode} confirmed. Total £${updated.totalAmount.toFixed(2)}.`);
    smsSent = true;
  }

  await prisma.order.update({
    where: { id },
    data: {
      emailSent: true,
      smsSent
    }
  });

  return res.json({
    message: 'Order confirmed successfully.',
    orderId: updated.id,
    orderCode: updated.orderCode,
    status: updated.status,
    totalAmount: updated.totalAmount,
    paymentMethod: updated.paymentMethod
  });
}
