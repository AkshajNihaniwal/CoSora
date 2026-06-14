import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireEditorOrAdmin, denyReviewer } from '../middleware/rbac';
import { validateBody } from '../middleware/validate';
import { LegalDomain } from '@prisma/client';

const router = Router();
router.use(authenticate);

const kbSchema = z.object({
  domain: z.nativeEnum(LegalDomain),
  title: z.string().min(1),
  content: z.string().min(1),
  docType: z.string().min(1),
  jurisdiction: z.string().optional(),
  tags: z.array(z.string()).default([]),
  version: z.string().optional(),
});

router.get('/', async (req: Request, res: Response) => {
  const { domain, tags } = req.query;
  const entries = await prisma.knowledgeBase.findMany({
    where: {
      isActive: true,
      ...(domain ? { domain: domain as LegalDomain } : {}),
      ...(tags ? { tags: { hasSome: (tags as string).split(',') } } : {}),
    },
    orderBy: { updatedAt: 'desc' },
  });
  res.json(entries);
});

router.get('/search', async (req: Request, res: Response) => {
  const { query, domain } = req.query;
  const q = (query as string || '').toLowerCase();

  const entries = await prisma.knowledgeBase.findMany({
    where: {
      isActive: true,
      ...(domain ? { domain: domain as LegalDomain } : {}),
      OR: q
        ? [
            { title: { contains: q, mode: 'insensitive' } },
            { content: { contains: q, mode: 'insensitive' } },
            { tags: { has: q } },
          ]
        : undefined,
    },
    take: 20,
  });

  const ranked = entries.map((e, i) => ({
    ...e,
    relevance: 1 - i * 0.05,
  }));

  res.json(ranked);
});

router.post('/', denyReviewer, requireEditorOrAdmin, validateBody(kbSchema), async (req: Request, res: Response) => {
  const entry = await prisma.knowledgeBase.create({ data: req.body });
  res.status(201).json(entry);
});

router.put('/:id', denyReviewer, requireEditorOrAdmin, validateBody(kbSchema.partial()), async (req: Request, res: Response) => {
  const entry = await prisma.knowledgeBase.update({
    where: { id: req.params.id },
    data: req.body,
  });
  res.json(entry);
});

export default router;
