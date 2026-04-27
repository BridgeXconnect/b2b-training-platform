import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('ADMIN'));

const roles = ['SALES', 'COURSE_MANAGER', 'TRAINER', 'STUDENT', 'ADMIN'] as const;

const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(roles),
});

const changeRoleSchema = z.object({
  role: z.enum(roles),
});

const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
};

// POST /api/admin/users — create user with any role
adminRouter.post('/', async (req, res, next) => {
  try {
    const { name, email, password, role } = createUserSchema.parse(req.body);

    const hashed = await bcrypt.hash(password, 12);
    try {
      const user = await prisma.user.create({
        data: { name, email, password: hashed, role },
        select: safeUserSelect,
      });
      res.status(201).json(user);
    } catch (createErr: unknown) {
      const e = createErr as Error & { code?: string };
      if (e.code === 'P2002') return res.status(409).json({ message: 'Email already in use' });
      throw createErr;
    }
  } catch (err) {
    next(err);
  }
});

// PATCH /api/admin/users/:id/role — change role, guard against demoting last admin
adminRouter.patch('/:id/role', async (req, res, next) => {
  try {
    const { role } = changeRoleSchema.parse(req.body);
    const { id } = req.params;

    try {
      const updated = await prisma.$transaction(async (tx) => {
        const target = await tx.user.findUnique({ where: { id }, select: { id: true, role: true } });
        if (!target) throw Object.assign(new Error('User not found'), { statusCode: 404 });

        if (target.role === 'ADMIN' && role !== 'ADMIN') {
          const adminCount = await tx.user.count({ where: { role: 'ADMIN' } });
          if (adminCount <= 1) {
            throw Object.assign(new Error('Cannot demote the last admin'), { statusCode: 409 });
          }
        }
        return tx.user.update({ where: { id }, data: { role }, select: safeUserSelect });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      res.json(updated);
    } catch (txErr: unknown) {
      const e = txErr as Error & { statusCode?: number };
      if (e.statusCode === 404) return res.status(404).json({ message: e.message });
      if (e.statusCode === 409) return res.status(409).json({ message: e.message });
      throw txErr;
    }
  } catch (err) {
    next(err);
  }
});
