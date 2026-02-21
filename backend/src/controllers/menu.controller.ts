import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';

const menuSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(5),
  price: z.coerce.number().positive()
});

export async function getMenu(_req: Request, res: Response) {
  const items = await prisma.menuItem.findMany({ orderBy: { createdAt: 'desc' } });
  res.set('Cache-Control', 'no-store');
  return res.json(items);
}

export async function createMenuItem(req: Request, res: Response) {
  const parse = menuSchema.safeParse(req.body);
  if (!parse.success || !req.file) {
    return res.status(400).json({ message: 'Invalid payload or image missing' });
  }

  const item = await prisma.menuItem.create({
    data: {
      ...parse.data,
      imageUrl: `/uploads/${req.file.filename}`
    }
  });

  return res.status(201).json(item);
}

export async function updateMenuItem(req: Request, res: Response) {
  const id = Number(req.params.id);
  const parse = menuSchema.safeParse(req.body);
  if (!id || !parse.success) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  const item = await prisma.menuItem.update({
    where: { id },
    data: {
      ...parse.data,
      ...(req.file ? { imageUrl: `/uploads/${req.file.filename}` } : {})
    }
  });

  return res.json(item);
}

export async function deleteMenuItem(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'Invalid id' });
  }

  await prisma.menuItem.delete({ where: { id } });
  return res.status(204).send();
}
