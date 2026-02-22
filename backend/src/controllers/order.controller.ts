import { OrderStatus, PaymentMethod, Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';
import { sendOrderConfirmationEmail, sendOrderConfirmationSms } from '../services/notification.service';
import { buildOrderConfirmationEmail } from '../templates/orderConfirmationEmail';

const orderItemSchema = z.object({
  menuItemId: z.number().int().positive(),
  name: z.string().min(1),
  quantity: z.number().int().min(1),
  unitPrice: z.number().positive()
});

const createOrderSchema = z.object({
  customerName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  address: z.string().min(5),
  deliveryDate: z.coerce.date(),
  items: z.array(orderItemSchema).min(1),
  specialInstructions: z.string().max(500).optional(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  paymentReference: z.string().max(120).optional(),
  paymentReceiptUrl: z.string().max(500).optional()
});

const updateOrderSchema = z.object({
  status: z.nativeEnum(OrderStatus)
});

const paymentVerificationSchema = z.object({
  verified: z.boolean(),
  notes: z.string().max(500).optional()
});

export async function createOrder(req: Request, res: Response) {
  let rawItems: unknown = req.body.items;
  if (typeof req.body.items === 'string') {
    try {
      rawItems = JSON.parse(req.body.items);
    } catch {
      return res.status(400).json({ message: 'Items must be valid JSON.' });
    }
  }

  const payload = {
    ...req.body,
    items: rawItems,
    paymentReceiptUrl: req.file ? `/uploads/${req.file.filename}` : req.body.paymentReceiptUrl
  };

  const parse = createOrderSchema.safeParse(payload);
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid payload', errors: parse.error.flatten() });
  }

  const data = parse.data;

  const minAdvanceMs = 24 * 60 * 60 * 1000;
  if (data.deliveryDate.getTime() < Date.now() + minAdvanceMs) {
    return res.status(400).json({ message: 'Delivery slot must be at least 24 hours from now.' });
  }

  if (data.paymentMethod === 'BANK_TRANSFER' && !data.paymentReference) {
    return res.status(400).json({ message: 'Payment reference is required for bank transfer.' });
  }

  const computedItems = data.items.map((item) => ({
    ...item,
    subtotal: Number((item.quantity * item.unitPrice).toFixed(2))
  }));

  const totalAmount = computedItems.reduce((sum, item) => sum + item.subtotal, 0);
  if (totalAmount <= 0) {
    return res.status(400).json({ message: 'Cart total must be greater than 0.' });
  }

  const created = await prisma.order.create({
    data: {
      orderCode: `TMP-${Date.now()}`,
      customerName: data.customerName,
      email: data.email.toLowerCase(),
      phone: data.phone,
      address: data.address,
      deliveryDate: data.deliveryDate,
      items: computedItems,
      specialInstructions: data.specialInstructions,
      totalAmount,
      paymentMethod: data.paymentMethod,
      paymentReference: data.paymentReference,
      paymentReceiptUrl: data.paymentReceiptUrl,
      paymentDetails:
        data.paymentMethod === 'BANK_TRANSFER'
          ? {
              bankName: 'Foodie National Bank',
              accountName: 'Foodie Foods Pvt Ltd',
              accountNumber: '002233445566',
              referenceInstruction: 'Use your Order ID as transfer reference'
            }
          : Prisma.JsonNull,
      status: 'PENDING'
    }
  });

  const orderCode = `FOOD-${new Date().getFullYear()}-${String(created.id).padStart(5, '0')}`;

  const order = await prisma.order.update({
    where: { id: created.id },
    data: { orderCode }
  });

  const email = buildOrderConfirmationEmail({
    orderCode,
    customerName: order.customerName,
    deliveryAddress: order.address,
    deliveryDate: order.deliveryDate,
    paymentMethod: order.paymentMethod,
    totalAmount: order.totalAmount,
    items: computedItems
  });

  await sendOrderConfirmationEmail(order.email, email.subject, email.html, email.text);

  let smsSent = false;
  if (order.phone) {
    await sendOrderConfirmationSms(order.phone, `Foodie order ${orderCode} received. Total £${order.totalAmount.toFixed(2)}.`);
    smsSent = true;
  }

  await prisma.order.update({
    where: { id: order.id },
    data: {
      emailSent: true,
      smsSent
    }
  });

  return res.status(201).json({
    orderId: order.id,
    orderCode,
    status: order.status,
    emailSent: true,
    smsSent,
    totalAmount: order.totalAmount,
    paymentMethod: order.paymentMethod,
    deliveryDate: order.deliveryDate,
    message: 'Your pre-order has been successfully placed.'
  });
}

export async function getOrders(_req: Request, res: Response) {
  const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' } });
  return res.json(orders);
}

export async function updateOrder(req: Request, res: Response) {
  const id = Number(req.params.id);
  const parse = updateOrderSchema.safeParse(req.body);
  if (!id || !parse.success) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status: parse.data.status }
  });

  return res.json(order);
}

export async function getPaymentOptions(_req: Request, res: Response) {
  return res.json({
    methods: [
      { value: 'CASH_ON_DELIVERY', label: 'Cash on Delivery' },
      {
        value: 'BANK_TRANSFER',
        label: 'Bank Transfer',
        bankDetails: {
          bankName: 'Foodie National Bank',
          accountName: 'Foodie Foods Pvt Ltd',
          accountNumber: '002233445566',
          referenceInstruction: 'Use your Order ID as transfer reference'
        }
      }
    ]
  });
}


export async function resendOrderConfirmation(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'Invalid id' });
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  const items = Array.isArray(order.items) ? order.items : [];
  const typedItems = items.filter((item): item is { menuItemId: number; name: string; quantity: number; unitPrice: number; subtotal: number } => {
    return typeof item === 'object' && item !== null;
  });

  const email = buildOrderConfirmationEmail({
    orderCode: order.orderCode,
    customerName: order.customerName,
    deliveryAddress: order.address,
    deliveryDate: order.deliveryDate,
    paymentMethod: order.paymentMethod,
    totalAmount: order.totalAmount,
    items: typedItems
  });

  await sendOrderConfirmationEmail(order.email, email.subject, email.html, email.text);
  await prisma.order.update({ where: { id }, data: { emailSent: true } });

  return res.json({ message: 'Confirmation email sent', orderCode: order.orderCode });
}

export async function verifyBankTransfer(req: Request, res: Response) {
  const id = Number(req.params.id);
  const parse = paymentVerificationSchema.safeParse(req.body);

  if (!id || !parse.success) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return res.status(404).json({ message: 'Order not found' });
  }

  if (order.paymentMethod !== 'BANK_TRANSFER') {
    return res.status(400).json({ message: 'Payment verification is only for bank transfer orders.' });
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status: parse.data.verified ? 'PAID' : order.status,
      paymentDetails: {
        ...(typeof order.paymentDetails === 'object' && order.paymentDetails ? order.paymentDetails : {}),
        verificationPlaceholder: {
          verified: parse.data.verified,
          notes: parse.data.notes || null,
          verifiedAt: new Date().toISOString()
        }
      }
    }
  });

  logger.info('order.bank_transfer.verification_placeholder', {
    orderId: id,
    verified: parse.data.verified
  });

  return res.json(updated);
}
