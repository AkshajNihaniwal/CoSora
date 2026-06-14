import prisma from '../lib/prisma';
import { LegalDomain, TaskStatus } from '@prisma/client';
import { getAIProvider } from './aiProviderImpl';
import { AGENT_DOMAIN_MAP, computeSlaDeadline } from '../config';
import { writeAuditLog } from '../services/auditService';
import { hashObject } from '../utils/hash';

export async function runOrchestrator(taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) throw new Error('Task not found');

  const start = Date.now();
  const provider = getAIProvider();

  const response = await provider.complete({
    systemPrompt: `You are the CoSora Orchestrator Agent. Classify the legal domain and assess risk for enterprise legal tasks. Available domains: ${Object.keys(AGENT_DOMAIN_MAP).join(', ')}.`,
    userPrompt: `Task: ${task.title}\nDescription: ${task.description}\nCurrent domain hint: ${task.domain}`,
  });

  const slaDeadline = computeSlaDeadline(response.riskScore);
  const agentName = AGENT_DOMAIN_MAP[task.domain] || 'contractAgent';

  await prisma.task.update({
    where: { id: taskId },
    data: {
      riskScore: response.riskScore,
      slaDeadline,
      status: TaskStatus.IN_PROGRESS,
      currentStage: 1,
    },
  });

  const inputHash = hashObject({ title: task.title, description: task.description });
  const outputHash = hashObject(response);

  await prisma.agentLog.create({
    data: {
      taskId,
      agentName: 'orchestrator',
      stage: 0,
      action: `Classified domain ${task.domain}, risk ${response.riskScore}, routed to ${agentName}`,
      inputHash,
      outputHash,
      modelVersion: response.modelVersion,
      ragSources: response.ragSources,
      confidenceScore: response.confidenceScore,
      tokenCount: response.tokenCount,
      durationMs: Date.now() - start,
    },
  });

  await writeAuditLog({
    eventType: 'AI_RISK_SCORED',
    taskId,
    description: `Orchestrator assigned risk score ${response.riskScore}`,
    metadata: { riskScore: response.riskScore, agentName, slaDeadline },
  });

  return { taskId, agentName, riskScore: response.riskScore, slaDeadline };
}

export function domainToAgent(domain: LegalDomain): string {
  return AGENT_DOMAIN_MAP[domain] || 'contractAgent';
}
