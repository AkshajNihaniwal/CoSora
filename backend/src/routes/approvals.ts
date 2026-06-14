import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireAdmin, denyReviewer } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';
import { getPendingApprovals, processApproval, processRejection } from '../services/hitlService';
import { HITLMethod } from '@prisma/client';

const router = Router();
router.use(authenticate);

const approveSchema = z.object({
  stage: z.number().int().min(0).max(9),
  method: z.nativeEnum(HITLMethod),
  password: z.string().optional(),
  biometricToken: z.string().optional(),
  signatureToken: z.string().optional(),
});

const rejectSchema = approveSchema.extend({
  reason: z.string().min(1),
});

router.get('/pending', async (req: Request, res: Response) => {
  const pending = await getPendingApprovals(req.user!.id, req.user!.role);
  res.json(pending);
});

router.post('/:taskId/approve', denyReviewer, requireAdmin, validateBody(approveSchema), async (req: Request, res: Response) => {
  try {
    const approval = await processApproval({
      taskId: req.params.taskId,
      stage: req.body.stage,
      approverId: req.user!.id,
      approverRole: req.user!.role,
      method: req.body.method,
      password: req.body.password,
      biometricToken: req.body.biometricToken,
      signatureToken: req.body.signatureToken,
      ipAddress: req.ip,
      deviceInfo: req.headers['user-agent'],
    });
    res.json(approval);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Approval failed' });
  }
});

router.post('/:taskId/reject', denyReviewer, requireAdmin, validateBody(rejectSchema), async (req: Request, res: Response) => {
  try {
    const approval = await processRejection({
      taskId: req.params.taskId,
      stage: req.body.stage,
      approverId: req.user!.id,
      approverRole: req.user!.role,
      method: req.body.method,
      reason: req.body.reason,
      password: req.body.password,
      ipAddress: req.ip,
      deviceInfo: req.headers['user-agent'],
    });
    res.json(approval);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Rejection failed' });
  }
});

router.get('/:taskId/history', async (req: Request, res: Response) => {
  const history = await prisma.approval.findMany({
    where: { taskId: req.params.taskId },
    include: { approver: { select: { name: true, userId: true, role: true } } },
    orderBy: { createdAt: 'desc' },
  });
  res.json(history);
});

export default router;
