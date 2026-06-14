import bcrypt from 'bcryptjs';
import { generateHexUserId } from '../utils/hexId';
import prisma from '../lib/prisma';
import { LegalDomain, UserRole } from '@prisma/client';
import { writeAuditLog } from './auditService';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createUser(data: {
  name: string;
  password: string;
  role: UserRole;
  domainScope: LegalDomain[];
  createdBy?: string;
}) {
  let userId = generateHexUserId();
  let exists = await prisma.user.findUnique({ where: { userId } });
  while (exists) {
    userId = generateHexUserId();
    exists = await prisma.user.findUnique({ where: { userId } });
  }

  const hashed = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      userId,
      name: data.name,
      password: hashed,
      role: data.role,
      domainScope: data.domainScope,
      createdBy: data.createdBy,
    },
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

  await writeAuditLog({
    eventType: 'USER_CREATED',
    actorId: data.createdBy,
    description: `User ${user.name} (${user.userId}) created with role ${user.role}`,
    metadata: { userId: user.userId, role: user.role },
  });

  return user;
}

export async function getUserByHexId(hexUserId: string) {
  return prisma.user.findUnique({
    where: { userId: hexUserId },
    select: {
      id: true,
      userId: true,
      name: true,
      role: true,
      domainScope: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      createdBy: true,
    },
  });
}

export async function deactivateUser(hexUserId: string, actorId: string) {
  const user = await prisma.user.update({
    where: { userId: hexUserId },
    data: { isActive: false },
    select: { id: true, userId: true, name: true },
  });

  await writeAuditLog({
    eventType: 'SYSTEM_CONFIG_CHANGED',
    actorId,
    description: `User ${user.name} deactivated`,
    metadata: { userId: user.userId },
  });

  return user;
}
