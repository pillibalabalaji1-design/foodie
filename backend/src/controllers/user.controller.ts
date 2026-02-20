import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(Role).optional().default(Role.USER)
});

export async function listUsers(_req: Request, res: Response) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });
  return res.json(users);
}

export async function createUser(req: Request, res: Response) {
  const parse = createUserSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  const email = parse.data.email.toLowerCase().trim();

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return res.status(409).json({ message: 'Email already exists' });
  }

  const hashedPassword = await bcrypt.hash(parse.data.password, 12);
  const user = await prisma.user.create({
    data: {
      name: parse.data.name,
      email,
      password: hashedPassword,
      role: parse.data.role
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true }
  });

  logger.info('admin.user.created', {
    actorId: req.user?.userId,
    createdUserId: user.id,
    createdUserEmail: user.email,
    role: user.role
  });

  return res.status(201).json(user);
}

export async function deleteUser(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'Invalid id' });
  }

  if (req.user?.userId === id) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }

  const user = await prisma.user.delete({
    where: { id },
    select: { id: true, email: true, role: true }
  });

  logger.warn('admin.user.deleted', {
    actorId: req.user?.userId,
    deletedUserId: user.id,
    deletedUserEmail: user.email,
    role: user.role
  });

  return res.status(204).send();
}
