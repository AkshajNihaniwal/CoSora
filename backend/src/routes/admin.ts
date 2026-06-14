import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { writeAuditLog } from '../services/auditService';
import { HITL_STAGES, STAGE_LABELS } from '../config';
import { TaskStatus, UserRole } from '@prisma/client';

const router = Router();
router.use(authenticate, requireAdmin);

router.get('/dashboard', async (_req: Request, res: Response) => {
  const [
    activeTasks,
    hitlPending,
    overdueSla,
    completedToday,
    recentAudit,
    tasksByDomain,
    tasksByStage,
  ] = await Promise.all([
    prisma.task.count({ where: { status: { notIn: [TaskStatus.COMPLETED, TaskStatus.ARCHIVED] } } }),
    prisma.task.count({ where: { status: TaskStatus.AWAITING_HITL } }),
    prisma.task.count({
      where: {
        slaDeadline: { lt: new Date() },
        status: TaskStatus.AWAITING_HITL,
      },
    }),
    prisma.task.count({
      where: {
        status: TaskStatus.COMPLETED,
        updatedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    }),
    prisma.auditLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { name: true, role: true } }, task: { select: { title: true } } },
    }),
    prisma.task.groupBy({ by: ['domain'], _count: true, where: { status: { not: TaskStatus.ARCHIVED } } }),
    prisma.task.groupBy({ by: ['currentStage'], _count: true, where: { status: { not: TaskStatus.ARCHIVED } } }),
  ]);

  res.json({
    stats: { activeTasks, hitlPending, overdueSla, completedToday },
    recentAudit,
    tasksByDomain,
    tasksByStage,
    hitlStages: HITL_STAGES,
    stageLabels: STAGE_LABELS,
  });
});

router.get('/workflow-overview', async (_req: Request, res: Response) => {
  const tasks = await prisma.task.findMany({
    where: { status: { notIn: [TaskStatus.COMPLETED, TaskStatus.ARCHIVED] } },
    include: { assignedTo: { select: { name: true, userId: true } } },
    orderBy: [{ domain: 'asc' }, { priority: 'desc' }],
  });

  res.json(tasks);
});

router.post('/configure', async (req: Request, res: Response) => {
  const { key, value } = req.body;
  if (!key || value === undefined) {
    res.status(400).json({ error: 'key and value required' });
    return;
  }

  const config = await prisma.systemConfig.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });

  await writeAuditLog({
    eventType: 'SYSTEM_CONFIG_CHANGED',
    actorId: req.user!.id,
    actorRole: req.user!.role,
    description: `System config updated: ${key}`,
    metadata: { key, value },
  });

  res.json(config);
});

router.get('/admins', async (_req: Request, res: Response) => {
  const admins = await prisma.user.findMany({
    where: { role: UserRole.ADMIN, isActive: true },
    select: { id: true, userId: true, name: true },
  });
  res.json(admins);
});

export default router;
