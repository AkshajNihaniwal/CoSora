import Queue from 'bull';
import { config } from '../config';
import { runOrchestrator } from '../agents/orchestrator';
import { createAgent } from '../agents/agentRegistry';

let agentQueue: Queue.Queue | null = null;
let slaQueue: Queue.Queue | null = null;
let queuesInitialized = false;

const jobResults = new Map<string, { status: string; result?: unknown; error?: string }>();

function initQueues() {
  if (queuesInitialized) return { agentQueue: agentQueue!, slaQueue: slaQueue! };

  agentQueue = new Queue('agent-jobs', config.redis.url, {
    redis: { maxRetriesPerRequest: null, enableReadyCheck: false },
  });
  slaQueue = new Queue('sla-jobs', config.redis.url, {
    redis: { maxRetriesPerRequest: null, enableReadyCheck: false },
  });

  agentQueue.on('error', (err) => {
    console.warn('[agentQueue] Redis connection issue:', err.message);
  });
  slaQueue.on('error', (err) => {
    console.warn('[slaQueue] Redis connection issue:', err.message);
  });

  agentQueue.process(async (job) => {
    const { type, taskId, agentName, stage, editorInstructions } = job.data as {
      type: 'orchestrate' | 'run';
      taskId: string;
      agentName?: string;
      stage?: number;
      editorInstructions?: string;
    };

    jobResults.set(String(job.id), { status: 'processing' });

    try {
      if (type === 'orchestrate') {
        const result = await runOrchestrator(taskId);
        jobResults.set(String(job.id), { status: 'completed', result });
        return result;
      }

      if (type === 'run' && agentName) {
        const agent = createAgent(agentName);
        const result = await agent.run(taskId, stage ?? 2, editorInstructions);
        jobResults.set(String(job.id), { status: 'completed', result });
        return result;
      }

      throw new Error('Invalid job type');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      jobResults.set(String(job.id), { status: 'failed', error: message });
      throw err;
    }
  });

  queuesInitialized = true;
  return { agentQueue, slaQueue };
}

export function getAgentQueue(): Queue.Queue {
  return initQueues().agentQueue;
}

export function getSlaQueue(): Queue.Queue {
  return initQueues().slaQueue;
}

export function getJobStatus(jobId: string) {
  return jobResults.get(jobId) || { status: 'unknown' };
}

export async function enqueueOrchestrate(taskId: string) {
  try {
    const job = await getAgentQueue().add({ type: 'orchestrate', taskId });
    return job.id?.toString();
  } catch (err) {
    console.warn('[agentQueue] Falling back to inline orchestration:', err);
    await runOrchestrator(taskId);
    const id = `inline-${Date.now()}`;
    jobResults.set(id, { status: 'completed', result: { taskId } });
    return id;
  }
}

export async function enqueueAgentRun(
  taskId: string,
  agentName: string,
  stage: number,
  editorInstructions?: string
) {
  try {
    const job = await getAgentQueue().add({ type: 'run', taskId, agentName, stage, editorInstructions });
    return job.id?.toString();
  } catch (err) {
    console.warn('[agentQueue] Falling back to inline agent run:', err);
    const agent = createAgent(agentName);
    const result = await agent.run(taskId, stage, editorInstructions);
    const id = `inline-${Date.now()}`;
    jobResults.set(id, { status: 'completed', result });
    return id;
  }
}
