import { AuditEventType, Prisma, UserRole } from '@prisma/client';
import prisma from '../lib/prisma';
import { sha256 } from '../utils/hash';

export interface AuditEntryInput {
  eventType: AuditEventType;
  taskId?: string;
  actorId?: string;
  actorRole?: UserRole;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  deviceInfo?: string;
}

export async function writeAuditLog(input: AuditEntryInput) {
  const lastEntry = await prisma.auditLog.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { entryHash: true },
  });

  const prevHash = lastEntry?.entryHash ?? null;
  const metadata = input.metadata ?? {};

  const content = JSON.stringify({
    eventType: input.eventType,
    description: input.description,
    metadata,
    prevHash,
    createdAt: new Date().toISOString(),
  });

  const entryHash = sha256(content);

  return prisma.auditLog.create({
    data: {
      eventType: input.eventType,
      taskId: input.taskId,
      actorId: input.actorId,
      actorRole: input.actorRole,
      description: input.description,
      metadata: metadata as Prisma.InputJsonValue,
      ipAddress: input.ipAddress,
      deviceInfo: input.deviceInfo,
      prevHash,
      entryHash,
    },
  });
}

export async function verifyAuditChain() {
  const entries = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      entryHash: true,
      prevHash: true,
      eventType: true,
      description: true,
      metadata: true,
      createdAt: true,
    },
  });

  if (entries.length === 0) return { valid: true };

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const expectedPrev = i === 0 ? null : entries[i - 1].entryHash;
    if (entry.prevHash !== expectedPrev) {
      return { valid: false, brokenAt: entry.id };
    }

    const content = JSON.stringify({
      eventType: entry.eventType,
      description: entry.description,
      metadata: entry.metadata,
      prevHash: entry.prevHash,
      createdAt: entry.createdAt.toISOString(),
    });

    if (sha256(content) !== entry.entryHash) {
      return { valid: false, brokenAt: entry.id };
    }
  }

  return { valid: true };
}
