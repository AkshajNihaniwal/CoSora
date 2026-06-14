import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getUserNotifications,
  markNotificationRead,
  clearReadNotifications,
} from '../services/notificationService';

const router = Router();
router.use(authenticate);

router.get('/', async (req: Request, res: Response) => {
  const page = parseInt((req.query.page as string) || '1', 10);
  const limit = parseInt((req.query.limit as string) || '20', 10);
  const result = await getUserNotifications(req.user!.id, page, limit);
  res.json(result);
});

router.post('/:id/read', async (req: Request, res: Response) => {
  await markNotificationRead(req.params.id, req.user!.id);
  res.json({ success: true });
});

router.delete('/read-all', async (req: Request, res: Response) => {
  await clearReadNotifications(req.user!.id);
  res.json({ success: true });
});

export default router;
