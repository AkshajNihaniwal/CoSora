import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { config } from '../config';
import {
  authenticate,
  setAuthCookies,
  clearAuthCookies,
  signAccessToken,
  signRefreshToken,
} from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';
import { createUser, verifyPassword } from '../services/userIdService';
import { writeAuditLog } from '../services/auditService';
import { LegalDomain, UserRole } from '@prisma/client';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole),
  domainScope: z.array(z.nativeEnum(LegalDomain)).default([]),
});

const loginSchema = z.object({
  userId: z.string().min(1),
  password: z.string().min(1),
});

router.post('/register', authenticate, requireAdmin, validateBody(registerSchema), async (req: Request, res: Response) => {
  try {
    const user = await createUser({
      ...req.body,
      createdBy: req.user!.id,
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Registration failed' });
  }
});

router.post('/login', validateBody(loginSchema), async (req: Request, res: Response) => {
  try {
    const { userId, password } = req.body;
    const user = await prisma.user.findUnique({ where: { userId: userId.toUpperCase() } });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    setAuthCookies(res, accessToken, refreshToken);

    await writeAuditLog({
      eventType: 'USER_LOGIN',
      actorId: user.id,
      actorRole: user.role,
      description: `User ${user.name} logged in`,
      ipAddress: req.ip,
    });

    res.json({
      user: {
        id: user.id,
        userId: user.userId,
        name: user.name,
        role: user.role,
        domainScope: user.domainScope,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Login failed' });
  }
});

router.post('/logout', authenticate, async (req: Request, res: Response) => {
  await writeAuditLog({
    eventType: 'USER_LOGOUT',
    actorId: req.user!.id,
    actorRole: req.user!.role,
    description: `User logged out`,
  });
  clearAuthCookies(res);
  res.json({ success: true });
});

router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({ error: 'No refresh token' });
      return;
    }

    const payload = jwt.verify(token, config.jwt.refreshSecret) as { sub: string };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    setAuthCookies(res, accessToken, refreshToken);
    res.json({ success: true });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

router.get('/me', authenticate, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      userId: true,
      name: true,
      role: true,
      domainScope: true,
      isActive: true,
      createdAt: true,
    },
  });
  res.json(user);
});

export default router;
