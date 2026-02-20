import { OrderStatus } from '@prisma/client';
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';

const createOrderSchema = z.object({
  customerName: z.string().min(2),
  phone: z.string().min(7),
  address: z.string().min(5),
  deliveryDate: z.string().datetime(),
  items: z.any()
});

const updateOrderSchema = z.object({
  status: z.nativeEnum(OrderStatus)
});

export async function createOrder(req: Request, res: Response) {
  const parse = createOrderSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  const order = await prisma.order.create({
    data: {
      customerName: parse.data.customerName,
      phone: parse.data.phone,
      address: parse.data.address,
      deliveryDate: new Date(parse.data.deliveryDate),
      items: parse.data.items
    }
  });

  return res.status(201).json(order);
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
