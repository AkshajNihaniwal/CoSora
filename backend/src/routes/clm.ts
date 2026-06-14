import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';
import { syncWithClm, getClmStatus, handleClmWebhook, ClmProvider } from '../services/clmService';

const router = Router();

router.post('/webhook/:provider', async (req: Request, res: Response) => {
  const result = await handleClmWebhook(req.params.provider as ClmProvider, req.body);
  res.json(result);
});

router.use(authenticate);

router.post('/sync/:provider', requireAdmin, async (req: Request, res: Response) => {
  const { taskId } = req.body;
  if (!taskId) {
    res.status(400).json({ error: 'taskId required' });
    return;
  }
  const result = await syncWithClm(req.params.provider as ClmProvider, taskId);
  res.json(result);
});

router.get('/status/:taskId', async (req: Request, res: Response) => {
  const status = await getClmStatus(req.params.taskId);
  res.json(status);
});

export default router;
