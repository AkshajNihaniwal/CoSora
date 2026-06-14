import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';
import {
  processInboundEmail,
  sendInternalEmail,
  sendCrossDeptTokenEmail,
} from '../services/emailService';
import { generateSecureToken } from '../utils/hexId';
import { writeAuditLog } from '../services/auditService';

const router = Router();

const inboundSchema = z.object({
  senderEmail: z.string().email(),
  subject: z.string().min(1),
  rawHeaders: z.record(z.unknown()).optional(),
  taskId: z.string().uuid().optional(),
});

const sendSchema = z.object({
  toEmail: z.string().email(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

const crossDeptSchema = z.object({
  taskId: z.string().uuid(),
  department: z.string().min(1),
  approverEmail: z.string().email(),
  approverName: z.string().min(1),
});

const respondSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED']),
  notes: z.string().optional(),
});

router.post('/inbound', validateBody(inboundSchema), async (req: Request, res: Response) => {
  const event = await processInboundEmail(req.body);
  res.status(201).json(event);
});

router.use(authenticate);

router.post('/send-internal', requireAdmin, validateBody(sendSchema), async (req: Request, res: Response) => {
  try {
    await sendInternalEmail({ ...req.body, actorId: req.user!.id });
    res.json({ success: true });
  } catch (err) {
    res.status(403).json({ error: err instanceof Error ? err.message : 'Send failed' });
  }
});

router.post('/cross-dept-token', requireAdmin, validateBody(crossDeptSchema), async (req: Request, res: Response) => {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

  const approval = await prisma.crossDeptApproval.create({
    data: {
      taskId: req.body.taskId,
      department: req.body.department,
      approverEmail: req.body.approverEmail,
      approverName: req.body.approverName,
      token,
      tokenExpiresAt: expiresAt,
    },
  });

  await sendCrossDeptTokenEmail({
    taskId: req.body.taskId,
    department: req.body.department,
    approverEmail: req.body.approverEmail,
    approverName: req.body.approverName,
    token,
    expiresAt,
  });

  res.status(201).json({ id: approval.id, expiresAt });
});

router.post('/cross-dept-respond/:token', validateBody(respondSchema), async (req: Request, res: Response) => {
  const approval = await prisma.crossDeptApproval.findUnique({
    where: { token: req.params.token },
  });

  if (!approval || approval.status !== 'PENDING') {
    res.status(404).json({ error: 'Invalid or expired token' });
    return;
  }

  if (new Date() > approval.tokenExpiresAt) {
    await prisma.crossDeptApproval.update({
      where: { id: approval.id },
      data: { status: 'EXPIRED' },
    });
    res.status(410).json({ error: 'Token expired' });
    return;
  }

  const updated = await prisma.crossDeptApproval.update({
    where: { id: approval.id },
    data: {
      status: req.body.decision,
      decision: req.body.decision,
      notes: req.body.notes,
      respondedAt: new Date(),
    },
  });

  await writeAuditLog({
    eventType: req.body.decision === 'APPROVED' ? 'CROSS_DEPT_APPROVED' : 'CROSS_DEPT_REJECTED',
    taskId: approval.taskId,
    description: `Cross-dept ${req.body.decision.toLowerCase()} from ${approval.approverEmail}`,
    metadata: { department: approval.department, notes: req.body.notes },
  });

  res.json(updated);
});

router.get('/', requireAdmin, async (_req: Request, res: Response) => {
  const emails = await prisma.emailEvent.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { task: { select: { id: true, title: true } } },
  });
  res.json(emails);
});

export default router;
