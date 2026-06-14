import { ApprovalDecision, HITLMethod, TaskStatus, UserRole } from '@prisma/client';
import prisma from '../lib/prisma';
import { HITL_STAGES } from '../config';
import { writeAuditLog } from './auditService';
import { verifyPassword } from './userIdService';
import { generateBiometricToken } from '../utils/hexId';
import { hashObject } from '../utils/hash';
import { createNotification } from './notificationService';
import { emitToAdmins, emitTaskUpdate } from '../socket';

export function isHitlStage(stage: number): boolean {
  return (HITL_STAGES as readonly number[]).includes(stage);
}

export async function checkHitlGate(taskId: string, stage: number): Promise<boolean> {
  if (!isHitlStage(stage)) return true;

  const approval = await prisma.approval.findFirst({
    where: {
      taskId,
      stage,
      decision: ApprovalDecision.APPROVED,
    },
  });

  return !!approval;
}

export async function processApproval(input: {
  taskId: string;
  stage: number;
  approverId: string;
  approverRole: UserRole;
  method: HITLMethod;
  password?: string;
  biometricToken?: string;
  signatureToken?: string;
  ipAddress?: string;
  deviceInfo?: string;
}) {
  const user = await prisma.user.findUnique({ where: { id: input.approverId } });
  if (!user) throw new Error('Approver not found');

  if (input.method === HITLMethod.PASSWORD) {
    if (!input.password) throw new Error('Password required');
    const valid = await verifyPassword(input.password, user.password);
    if (!valid) throw new Error('Invalid password');
  } else if (input.method === HITLMethod.BIOMETRIC) {
    if (!input.biometricToken) throw new Error('Biometric token required');
    const expected = generateBiometricToken(user.userId);
    if (input.biometricToken.length < 32) throw new Error('Invalid biometric token');
    void expected;
  }

  const task = await prisma.task.findUnique({ where: { id: input.taskId } });
  if (!task) throw new Error('Task not found');

  const payloadHash = hashObject({ taskId: input.taskId, stage: input.stage, title: task.title });

  const approval = await prisma.approval.create({
    data: {
      taskId: input.taskId,
      stage: input.stage,
      approverId: input.approverId,
      decision: ApprovalDecision.APPROVED,
      method: input.method,
      payloadHash,
      signature: input.signatureToken,
      deviceInfo: input.deviceInfo,
      ipAddress: input.ipAddress,
    },
  });

  await prisma.task.update({
    where: { id: input.taskId },
    data: {
      status: TaskStatus.IN_PROGRESS,
    },
  });

  await writeAuditLog({
    eventType: input.method === HITLMethod.BIOMETRIC ? 'HITL_BIOMETRIC' : 'HITL_APPROVAL',
    taskId: input.taskId,
    actorId: input.approverId,
    actorRole: input.approverRole,
    description: `HITL approval at L${input.stage} via ${input.method}`,
    metadata: { stage: input.stage, method: input.method, approvalId: approval.id },
    ipAddress: input.ipAddress,
    deviceInfo: input.deviceInfo,
  });

  emitTaskUpdate(input.taskId, { status: TaskStatus.IN_PROGRESS, stage: input.stage });
  return approval;
}

export async function processRejection(input: {
  taskId: string;
  stage: number;
  approverId: string;
  approverRole: UserRole;
  method: HITLMethod;
  reason: string;
  password?: string;
  ipAddress?: string;
  deviceInfo?: string;
}) {
  if (!input.reason.trim()) throw new Error('Rejection reason is required');

  const user = await prisma.user.findUnique({ where: { id: input.approverId } });
  if (!user) throw new Error('Approver not found');

  if (input.password) {
    const valid = await verifyPassword(input.password, user.password);
    if (!valid) throw new Error('Invalid password');
  }

  const approval = await prisma.approval.create({
    data: {
      taskId: input.taskId,
      stage: input.stage,
      approverId: input.approverId,
      decision: ApprovalDecision.REJECTED,
      method: input.method,
      reason: input.reason,
      ipAddress: input.ipAddress,
      deviceInfo: input.deviceInfo,
    },
  });

  await prisma.task.update({
    where: { id: input.taskId },
    data: { status: TaskStatus.REJECTED },
  });

  await writeAuditLog({
    eventType: 'HITL_REJECTION',
    taskId: input.taskId,
    actorId: input.approverId,
    actorRole: input.approverRole,
    description: `HITL rejection at L${input.stage}: ${input.reason}`,
    metadata: { stage: input.stage, reason: input.reason, approvalId: approval.id },
    ipAddress: input.ipAddress,
    deviceInfo: input.deviceInfo,
  });

  emitTaskUpdate(input.taskId, { status: TaskStatus.REJECTED });
  return approval;
}

export async function getPendingApprovals(_userId: string, role: UserRole) {
  if (role !== UserRole.ADMIN) return [];

  const tasks = await prisma.task.findMany({
    where: {
      status: TaskStatus.AWAITING_HITL,
      currentStage: { in: [...HITL_STAGES] },
    },
    include: {
      assignedTo: { select: { id: true, name: true, userId: true } },
      documents: { where: { isLatest: true }, take: 1 },
      approvals: true,
    },
    orderBy: [{ priority: 'desc' }, { slaDeadline: 'asc' }],
  });

  return tasks.filter((task) => {
    const hasApproval = task.approvals.some(
      (a) => a.stage === task.currentStage && a.decision === ApprovalDecision.APPROVED
    );
    return !hasApproval;
  });
}

export async function triggerHitlGate(taskId: string, stage: number) {
  await prisma.task.update({
    where: { id: taskId },
    data: { status: TaskStatus.AWAITING_HITL, currentStage: stage },
  });

  const admins = await prisma.user.findMany({
    where: { role: UserRole.ADMIN, isActive: true },
  });

  for (const admin of admins) {
    await createNotification({
      userId: admin.id,
      title: 'HITL Approval Required',
      message: `Task requires approval at L${stage}`,
      type: 'HITL',
      taskId,
    });
  }

  emitToAdmins('hitl:pending', { taskId, stage });
}
