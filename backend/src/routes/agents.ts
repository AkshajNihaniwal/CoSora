import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { denyReviewer, requireEditorOrAdmin } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';
import { enqueueOrchestrate, enqueueAgentRun, getJobStatus } from '../jobs/agentQueue';
import { createAgent } from '../agents/agentRegistry';

const router = Router();
router.use(authenticate);

const orchestrateSchema = z.object({ taskId: z.string().uuid() });
const runSchema = z.object({
  taskId: z.string().uuid(),
  stage: z.number().int().min(0).max(9).default(2),
  editorInstructions: z.string().optional(),
});

router.post('/orchestrate', denyReviewer, requireEditorOrAdmin, validateBody(orchestrateSchema), async (req: Request, res: Response) => {
  const jobId = await enqueueOrchestrate(req.body.taskId);
  res.json({ jobId, status: 'queued' });
});

router.post('/run/:agentName', denyReviewer, requireEditorOrAdmin, validateBody(runSchema), async (req: Request, res: Response) => {
  const { agentName } = req.params;
  const constrainedAgents = ['litigationAgent', 'regulatorAgent', 'governanceAgent'];

  if (constrainedAgents.includes(agentName)) {
    const task = await prisma.task.findUnique({ where: { id: req.body.taskId } });
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (agentName === 'governanceAgent' && !task.manualEntry) {
      res.status(403).json({ error: 'Governance agent requires manual Editor/Admin entry' });
      return;
    }
  }

  try {
    createAgent(agentName);
  } catch {
    res.status(404).json({ error: `Unknown agent: ${agentName}` });
    return;
  }

  const jobId = await enqueueAgentRun(
    req.body.taskId,
    agentName,
    req.body.stage,
    req.body.editorInstructions
  );

  res.json({ jobId, status: 'queued' });
});

router.get('/status/:jobId', async (req: Request, res: Response) => {
  res.json(getJobStatus(req.params.jobId));
});

router.get('/logs/:taskId', async (req: Request, res: Response) => {
  const logs = await prisma.agentLog.findMany({
    where: { taskId: req.params.taskId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(logs);
});

export default router;
