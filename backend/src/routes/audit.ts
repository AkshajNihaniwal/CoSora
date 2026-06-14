import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { verifyAuditChain, writeAuditLog } from '../services/auditService';
import { emitAuditLog } from '../socket';
import { AuditEventType } from '@prisma/client';

const router = Router();

router.get('/verify', async (_req: Request, res: Response) => {
  const result = await verifyAuditChain();
  res.json(result);
});

router.use(authenticate);

router.get('/', requireAdmin, async (req: Request, res: Response) => {
  const { taskId, actorId, eventType, dateFrom, dateTo, page = '1', limit = '50' } = req.query;
  const skip = (parseInt(page as string, 10) - 1) * parseInt(limit as string, 10);

  const where: Record<string, unknown> = {};
  if (taskId) where.taskId = taskId;
  if (actorId) where.actorId = actorId;
  if (eventType) where.eventType = eventType as AuditEventType;
  if (dateFrom || dateTo) {
    where.createdAt = {
      ...(dateFrom ? { gte: new Date(dateFrom as string) } : {}),
      ...(dateTo ? { lte: new Date(dateTo as string) } : {}),
    };
  }

  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        actor: { select: { name: true, userId: true, role: true } },
        task: { select: { title: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit as string, 10),
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.json({ entries, total, page: parseInt(page as string, 10), limit: parseInt(limit as string, 10) });
});

router.get('/export', requireAdmin, async (req: Request, res: Response) => {
  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'asc' },
    include: { actor: { select: { userId: true, name: true } } },
  });

  const chain = await verifyAuditChain();
  const exportData = {
    generatedAt: new Date().toISOString(),
    exportedBy: req.user!.userId,
    chainValid: chain.valid,
    entries,
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', 'attachment; filename=cosora-audit-export.json');
  res.json(exportData);
});

router.post('/test-entry', requireAdmin, async (req: Request, res: Response) => {
  const entry = await writeAuditLog({
    eventType: 'SYSTEM_CONFIG_CHANGED',
    actorId: req.user!.id,
    actorRole: req.user!.role,
    description: 'Test audit entry',
    metadata: { test: true },
  });
  emitAuditLog(entry);
  res.json(entry);
});

export default router;
