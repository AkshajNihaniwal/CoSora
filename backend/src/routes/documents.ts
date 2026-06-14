import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { requireEditorOrAdmin, denyReviewer, canAccessDomain } from '../middleware/rbac';
import { uploadDocument, getDocumentWithIntegrityCheck, listDocumentVersions, getLatestDocumentPreview } from '../services/documentService';
import { createMemoryUpload, formatUploadError } from '../utils/uploadLimits';
import { UserRole } from '@prisma/client';

const upload = createMemoryUpload();
const router = Router();
router.use(authenticate);

router.get('/task/:taskId/preview', async (req: Request, res: Response) => {
  const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  if (req.user!.role !== UserRole.ADMIN && !canAccessDomain(req, task.domain)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  const preview = await getLatestDocumentPreview(req.params.taskId);
  if (!preview) {
    res.json({ document: null, content: null });
    return;
  }

  res.json(preview);
});

router.post('/upload', denyReviewer, requireEditorOrAdmin, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: formatUploadError(err) });
      return;
    }
    next();
  });
}, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'File required' });
      return;
    }

    const taskId = req.body.taskId;
    if (!taskId) {
      res.status(400).json({ error: 'taskId required' });
      return;
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    if (req.user!.role !== UserRole.ADMIN && !canAccessDomain(req, task.domain)) {
      res.status(403).json({ error: 'Access denied' });
      return;
    }

    const doc = await uploadDocument({
      taskId,
      filename: req.file.originalname,
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      uploadedBy: req.user!.userId,
      notes: req.body.notes,
    });

    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Upload failed' });
  }
});

router.get('/:documentId', async (req: Request, res: Response) => {
  const result = await getDocumentWithIntegrityCheck(req.params.documentId);
  if (!result || !result.doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  const task = await prisma.task.findUnique({ where: { id: result.doc.taskId } });
  if (!task) {
    res.status(404).json({ error: 'Task not found' });
    return;
  }

  if (req.user!.role !== UserRole.ADMIN && !canAccessDomain(req, task.domain)) {
    res.status(403).json({ error: 'Access denied' });
    return;
  }

  if (result.integrityError) {
    res.status(409).json({ error: 'Document integrity check failed' });
    return;
  }

  res.setHeader('Content-Type', result.doc.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${result.doc.filename}"`);
  res.send(result.content);
});

router.get('/:documentId/versions', async (req: Request, res: Response) => {
  const versions = await listDocumentVersions(req.params.documentId);
  res.json(versions);
});

router.get('/:documentId/diff/:version', async (req: Request, res: Response) => {
  const doc = await prisma.document.findFirst({
    where: { id: req.params.documentId },
  });
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  const version = parseInt(req.params.version, 10);
  const target = await prisma.document.findFirst({
    where: { taskId: doc.taskId, version },
  });

  if (!target) {
    res.status(404).json({ error: 'Version not found' });
    return;
  }

  res.json({ diff: target.diff, version: target.version });
});

export default router;
