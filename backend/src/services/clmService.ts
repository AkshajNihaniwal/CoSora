import prisma from '../lib/prisma';

export type ClmProvider = 'ironclad' | 'docusign-clm' | 'icertis' | 'ariba';

export async function syncWithClm(provider: ClmProvider, taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error('Task not found');

  return {
    provider,
    taskId,
    status: 'synced',
    syncedAt: new Date().toISOString(),
    externalId: `${provider}-${taskId.slice(0, 8)}`,
    message: `Stub sync completed with ${provider}`,
  };
}

export async function getClmStatus(taskId: string) {
  return {
    taskId,
    providers: ['ironclad', 'docusign-clm', 'icertis', 'ariba'],
    lastSync: null,
    status: 'not_configured',
  };
}

export async function handleClmWebhook(provider: ClmProvider, payload: Record<string, unknown>) {
  return {
    provider,
    received: true,
    payload,
    processedAt: new Date().toISOString(),
  };
}
