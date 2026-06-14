import { TaskStatus, UserRole, Priority } from '@prisma/client';
import prisma from '../lib/prisma';
import { writeAuditLog } from '../services/auditService';
import { createNotification } from '../services/notificationService';
import { emitToAdmins } from '../socket';
import { getSlaQueue } from './agentQueue';

export function startSlaMonitor() {
  try {
    const slaQueue = getSlaQueue();

    slaQueue.add(
      'monitor',
      {},
      { repeat: { cron: '*/5 * * * *' }, removeOnComplete: true }
    ).catch((err) => {
      console.warn('[slaMonitor] Could not schedule SLA cron (Redis may be unavailable):', err.message);
    });

    slaQueue.process('monitor', async () => {
      const now = new Date();
      const overdueTasks = await prisma.task.findMany({
        where: {
          status: TaskStatus.AWAITING_HITL,
          slaDeadline: { lt: now },
          priority: { not: Priority.CRITICAL },
        },
      });

      for (const task of overdueTasks) {
        await prisma.task.update({
          where: { id: task.id },
          data: { priority: Priority.CRITICAL, status: TaskStatus.ESCALATED },
        });

        await writeAuditLog({
          eventType: 'SLA_ESCALATION',
          taskId: task.id,
          description: `SLA deadline exceeded at L${task.currentStage}`,
          metadata: { slaDeadline: task.slaDeadline, stage: task.currentStage },
        });

        const admins = await prisma.user.findMany({
          where: { role: UserRole.ADMIN, isActive: true },
        });

        for (const admin of admins) {
          await createNotification({
            userId: admin.id,
            title: 'SLA Escalation',
            message: `Task "${task.title}" exceeded SLA at L${task.currentStage}`,
            type: 'SLA_ESCALATION',
            taskId: task.id,
          });
        }

        emitToAdmins('sla:escalation', { taskId: task.id, title: task.title });
      }

      return { processed: overdueTasks.length };
    });
  } catch (err) {
    console.warn('[slaMonitor] Failed to start:', err instanceof Error ? err.message : err);
  }
}
