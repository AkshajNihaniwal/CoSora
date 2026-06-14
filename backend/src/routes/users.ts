import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';
import { getUserByHexId, deactivateUser } from '../services/userIdService';
import { writeAuditLog } from '../services/auditService';
import { UserRole } from '@prisma/client';

const router = Router();

router.use(authenticate);

router.get('/', requireAdmin, async (req: Request, res: Response) => {
  const { role, active } = req.query;
  const users = await prisma.user.findMany({
    where: {
      ...(role ? { role: role as UserRole } : {}),
      ...(active !== undefined ? { isActive: active === 'true' } : {}),
    },
    select: {
      id: true,
      userId: true,
      name: true,
      role: true,
      domainScope: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(users);
});

router.get('/:userId', requireAdmin, async (req: Request, res: Response) => {
  const user = await getUserByHexId(req.params.userId.toUpperCase());
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(user);
});

router.patch('/:userId', requireAdmin, async (req: Request, res: Response) => {
  const { name, domainScope, isActive } = req.body;
  const user = await prisma.user.update({
    where: { userId: req.params.userId.toUpperCase() },
    data: {
      ...(name ? { name } : {}),
      ...(domainScope ? { domainScope } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    },
    select: { id: true, userId: true, name: true, role: true, domainScope: true, isActive: true },
  });
  res.json(user);
});

router.delete('/:userId', requireAdmin, async (req: Request, res: Response) => {
  await deactivateUser(req.params.userId.toUpperCase(), req.user!.id);
  res.json({ success: true });
});

const roleChangeSchema = z.object({
  subjectUserId: z.string(),
  newRole: z.nativeEnum(UserRole),
  reason: z.string().min(1),
});

router.post('/role-change-request', requireAdmin, validateBody(roleChangeSchema), async (req: Request, res: Response) => {
  const subject = await prisma.user.findUnique({ where: { userId: req.body.subjectUserId } });
  if (!subject) {
    res.status(404).json({ error: 'Subject user not found' });
    return;
  }

  const request = await prisma.roleChangeRequest.create({
    data: {
      subjectUserId: subject.id,
      requestedBy: req.user!.userId,
      oldRole: subject.role,
      newRole: req.body.newRole,
      reason: req.body.reason,
    },
  });

  await writeAuditLog({
    eventType: 'USER_ROLE_CHANGE_REQUESTED',
    actorId: req.user!.id,
    actorRole: req.user!.role,
    description: `Role change requested for ${subject.name}: ${subject.role} → ${req.body.newRole}`,
    metadata: { requestId: request.id },
  });

  res.status(201).json(request);
});

router.get('/role-change-requests/list', requireAdmin, async (_req: Request, res: Response) => {
  const requests = await prisma.roleChangeRequest.findMany({
    include: {
      subjectUser: { select: { userId: true, name: true, role: true } },
      approvals: { include: { adminUser: { select: { userId: true, name: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(requests);
});

router.post('/role-change-requests/:requestId/approve', requireAdmin, async (req: Request, res: Response) => {
  const request = await prisma.roleChangeRequest.findUnique({
    where: { id: req.params.requestId },
    include: { approvals: true, subjectUser: true },
  });

  if (!request || request.status !== 'PENDING_ALL_ADMINS') {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  await prisma.roleChangeApproval.create({
    data: {
      requestId: request.id,
      adminUserId: req.user!.id,
      decision: 'APPROVED',
    },
  });

  const allAdmins = await prisma.user.findMany({
    where: { role: UserRole.ADMIN, isActive: true },
  });

  const updated = await prisma.roleChangeRequest.findUnique({
    where: { id: request.id },
    include: { approvals: true },
  });

  const approvedAdminIds = new Set(updated!.approvals.filter((a) => a.decision === 'APPROVED').map((a) => a.adminUserId));
  const allApproved = allAdmins.every((admin) => approvedAdminIds.has(admin.id));

  if (allApproved) {
    await prisma.user.update({
      where: { id: request.subjectUserId },
      data: { role: request.newRole },
    });
    await prisma.roleChangeRequest.update({
      where: { id: request.id },
      data: { status: 'APPROVED', completedAt: new Date() },
    });
    await writeAuditLog({
      eventType: 'USER_ROLE_CHANGED',
      actorId: req.user!.id,
      description: `Role changed for ${request.subjectUser.name} to ${request.newRole}`,
      metadata: { requestId: request.id },
    });
  }

  res.json({ allApproved, status: allApproved ? 'APPROVED' : 'PENDING_ALL_ADMINS' });
});

router.post('/role-change-requests/:requestId/reject', requireAdmin, async (req: Request, res: Response) => {
  await prisma.roleChangeApproval.create({
    data: {
      requestId: req.params.requestId,
      adminUserId: req.user!.id,
      decision: 'REJECTED',
    },
  });
  await prisma.roleChangeRequest.update({
    where: { id: req.params.requestId },
    data: { status: 'REJECTED', completedAt: new Date() },
  });
  res.json({ status: 'REJECTED' });
});

export default router;
