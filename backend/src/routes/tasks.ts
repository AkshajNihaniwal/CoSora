import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireAdmin, requireEditorOrAdmin, denyReviewer, canAccessDomain } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';
import { writeAuditLog } from '../services/auditService';
import { checkHitlGate, isHitlStage, triggerHitlGate } from '../services/hitlService';
import { enqueueOrchestrate, enqueueAgentRun } from '../jobs/agentQueue';
import { domainToAgent } from '../agents/orchestrator';
import { getTaskAssistantSession, sendTaskAssistantMessage } from '../services/taskAssistantService';
import { LegalDomain, TaskStatus, UserRole } from '@prisma/client';

const router = Router();
router.use(authenticate);

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  domain: z.nativeEnum(LegalDomain),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL']).optional(),
  assignedToId: z.string().optional(),
  manualEntry: z.boolean().optional(),
  dueAt: z.string().datetime().optional(),
});

router.get('/', async (req: Request, res: Response) => {
  const { stage, status, domain } = req.query;
  const user = req.user!;

  let where: Record<string, unknown> = {};

  if (user.role === UserRole.ADMIN) {
    // see all
  } else if (user.role === UserRole.EDITOR) {
    where = { domain: { in: user.domainScope as LegalDomain[] } };
  } else {
    where = { domain: { in: user.domainScope as LegalDomain[] } };
  }

  if (stage) where.currentStage = parseInt(stage as string, 10);
  if (status) where.status = status;
  if (domain) where.domain = domain;

  const tasks = await prisma.task.findMany({
    where,
    include: {
      assignedTo: { select: { id: true, name: true, userId: true } },
      _count: { select: { documents: true, approvals: true, comments: true } },
    },
    orderBy: [{ priority: 'desc' }, { updatedAt: 'desc' }],
  });

  res.json(tasks);
});

router.post('/', denyReviewer, requireEditorOrAdmin, validateBody(createTaskSchema), async (req: Request, res: Response) => {
  try {
    const task = await prisma.task.create({
      data: {
        title: req.body.title,
        description: req.body.description,
        domain: req.body.domain,
        priority: req.body.priority,
        assignedToId: req.body.assignedToId,
        manualEntry: req.body.manualEntry ?? (req.user!.role !== UserRole.REVIEWER),
        dueAt: req.body.dueAt ? new Date(req.body.dueAt) : undefined,
        status: TaskStatus.PENDING,
        currentStage: 0,
      },
      include: { assignedTo: { select: { id: true, name: true, userId: true } } },
    });

    await writeAuditLog({
      eventType: 'TASK_CREATED',
      taskId: task.id,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      description: `Task created: ${task.title}`,
      metadata: { domain: task.domain },
    });

    const jobId = await enqueueOrchestrate(task.id);
    const agentName = domainToAgent(task.domain);
    const agentJobId = await enqueueAgentRun(task.id, agentName, 2);
    res.status(201).json({ task, orchestratorJobId: jobId, agentJobId });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to create task' });
  }
});

router.get('/:taskId', async (req: Request, res: Response) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.taskId },
    include: {
      assignedTo: { select: { id: true, name: true, userId: true } },
      documents: { orderBy: { version: 'desc' } },
      approvals: { include: { approver: { select: { name: true, userId: true } } } },
      comments: { orderBy: { createdAt: 'desc' } },
      agentLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
      auditLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
    },
  });

  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  if (req.user!.role !== UserRole.ADMIN && !canAccessDomain(req, task.domain)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  res.json(task);
});

router.patch('/:taskId', denyReviewer, requireEditorOrAdmin, async (req: Request, res: Response) => {
  const { title, description, assignedToId, priority, dueAt } = req.body;
  const task = await prisma.task.update({
    where: { id: req.params.taskId },
    data: {
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
      ...(assignedToId !== undefined ? { assignedToId } : {}),
      ...(priority ? { priority } : {}),
      ...(dueAt ? { dueAt: new Date(dueAt) } : {}),
    },
  });
  res.json(task);
});

router.post('/:taskId/advance', denyReviewer, requireEditorOrAdmin, async (req: Request, res: Response) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  const nextStage = task.currentStage + 1;
  if (nextStage > 9) {
    res.status(400).json({ error: 'Already at final stage' });
    return;
  }

  if (isHitlStage(task.currentStage)) {
    const gatePassed = await checkHitlGate(task.id, task.currentStage);
    if (!gatePassed) {
      res.status(403).json({ error: `HITL approval required at L${task.currentStage}` });
      return;
    }
  }

  const updated = await prisma.task.update({
    where: { id: task.id },
    data: {
      currentStage: nextStage,
      status: isHitlStage(nextStage) ? TaskStatus.AWAITING_HITL : TaskStatus.IN_PROGRESS,
    },
  });

  if (isHitlStage(nextStage)) {
    await triggerHitlGate(task.id, nextStage);
  }

  await writeAuditLog({
    eventType: 'TASK_STAGE_ADVANCED',
    taskId: task.id,
    actorId: req.user!.id,
    actorRole: req.user!.role,
    description: `Task advanced to L${nextStage}`,
    metadata: { from: task.currentStage, to: nextStage },
  });

  res.json(updated);
});

router.post('/:taskId/return', denyReviewer, requireEditorOrAdmin, async (req: Request, res: Response) => {
  const { stage, reason } = req.body;
  if (stage === undefined || !reason) {
    res.status(400).json({ error: 'Stage and reason required' });
    return;
  }

  const task = await prisma.task.update({
    where: { id: req.params.taskId },
    data: { currentStage: stage, status: TaskStatus.IN_PROGRESS },
  });

  await writeAuditLog({
    eventType: 'TASK_RETURNED',
    taskId: task.id,
    actorId: req.user!.id,
    actorRole: req.user!.role,
    description: `Task returned to L${stage}: ${reason}`,
    metadata: { stage, reason },
  });

  res.json(task);
});

router.post('/:taskId/escalate', denyReviewer, requireEditorOrAdmin, async (req: Request, res: Response) => {
  const { note } = req.body;
  const task = await prisma.task.update({
    where: { id: req.params.taskId },
    data: { status: TaskStatus.ESCALATED, priority: 'URGENT' },
  });

  await writeAuditLog({
    eventType: 'TASK_ESCALATED',
    taskId: task.id,
    actorId: req.user!.id,
    actorRole: req.user!.role,
    description: `Task escalated to Admin${note ? `: ${note}` : ''}`,
    metadata: { note },
  });

  res.json(task);
});

router.post('/:taskId/comments', denyReviewer, requireEditorOrAdmin, async (req: Request, res: Response) => {
  const { text, clauseRef } = req.body;
  if (!text?.trim()) {
    res.status(400).json({ error: 'Comment text required' });
    return;
  }

  const comment = await prisma.comment.create({
    data: {
      taskId: req.params.taskId,
      authorId: req.user!.userId,
      authorRole: req.user!.role,
      text,
      clauseRef,
    },
  });

  await writeAuditLog({
    eventType: 'COMMENT_ADDED',
    taskId: req.params.taskId,
    actorId: req.user!.id,
    actorRole: req.user!.role,
    description: `Comment added${clauseRef ? ` on ${clauseRef}` : ''}`,
    metadata: { commentId: comment.id },
  });

  res.status(201).json(comment);
});

router.post('/:taskId/override', requireAdmin, async (req: Request, res: Response) => {
  const { currentStage, status, assignedToId, password } = req.body;
  if (!password) {
    res.status(400).json({ error: 'Password confirmation required' });
    return;
  }

  const admin = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!admin) {
    res.status(401).json({ error: 'Admin not found' });
    return;
  }

  const { verifyPassword } = await import('../services/userIdService');
  const valid = await verifyPassword(password, admin.password);
  if (!valid) {
    res.status(403).json({ error: 'Invalid password' });
    return;
  }

  const task = await prisma.task.update({
    where: { id: req.params.taskId },
    data: {
      ...(currentStage !== undefined ? { currentStage } : {}),
      ...(status ? { status } : {}),
      ...(assignedToId !== undefined ? { assignedToId } : {}),
    },
  });

  await writeAuditLog({
    eventType: 'SYSTEM_CONFIG_CHANGED',
    taskId: task.id,
    actorId: req.user!.id,
    actorRole: req.user!.role,
    description: `Admin override applied to task`,
    metadata: { currentStage, status, assignedToId },
  });

  res.json(task);
});

router.get('/:taskId/assistant', denyReviewer, requireEditorOrAdmin, async (req: Request, res: Response) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    if (req.user!.role !== UserRole.ADMIN && !canAccessDomain(req, task.domain)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    const session = await getTaskAssistantSession(req.params.taskId);
    res.json(session);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Failed to load assistant' });
  }
});

router.post('/:taskId/assistant', denyReviewer, requireEditorOrAdmin, async (req: Request, res: Response) => {
  try {
    const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    if (req.user!.role !== UserRole.ADMIN && !canAccessDomain(req, task.domain)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    const { message, editorInstructions } = req.body;
    if (!message?.trim()) {
      res.status(400).json({ error: 'message required' });
      return;
    }
    const result = await sendTaskAssistantMessage({
      taskId: req.params.taskId,
      userId: req.user!.id,
      message: message.trim(),
      editorInstructions,
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Assistant failed' });
  }
});

export default router;
