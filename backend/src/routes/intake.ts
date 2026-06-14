import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { denyReviewer, requireEditorOrAdmin } from '../middleware/rbac';
import { extractTextFromBuffer, ALLOWED_INTAKE_MIMES } from '../utils/documentExtractor';
import { analyzeIntakeDocuments, analysisSummaryToJson } from '../services/documentAnalysisService';
import { processIntakeChatTurn } from '../services/intakeChatService';
import { uploadDocument } from '../services/documentService';
import { writeAuditLog } from '../services/auditService';
import { enqueueOrchestrate, enqueueAgentRun } from '../jobs/agentQueue';
import { domainToAgent } from '../agents/orchestrator';
import { createMemoryUpload, formatUploadError } from '../utils/uploadLimits';
import { config } from '../config';
import prisma from '../lib/prisma';
import { LegalDomain, Priority, TaskStatus } from '@prisma/client';

const upload = createMemoryUpload({
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.split('.').pop()?.toLowerCase();
    const allowedExt = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'md'];
    if (allowedExt.includes(ext || '') || ALLOWED_INTAKE_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.originalname}`));
    }
  },
});

const router = Router();
router.use(authenticate, denyReviewer, requireEditorOrAdmin);

function handleUpload(field: string, max: number) {
  return (req: Request, res: Response, next: (err?: unknown) => void) => {
    upload.array(field, max)(req, res, (err: unknown) => {
      if (err) {
        res.status(400).json({ error: formatUploadError(err) });
        return;
      }
      next();
    });
  };
}

router.get('/limits', (_req: Request, res: Response) => {
  res.json({
    maxFileSizeMb: config.upload.maxFileSizeMb,
    maxFiles: config.upload.maxFilesPerRequest,
  });
});

router.post('/chat', handleUpload('files', config.upload.maxFilesPerRequest), async (req: Request, res: Response) => {
  try {
    const message = (req.body.message as string) || '';
    const sessionId = req.body.sessionId as string | undefined;
    const files = req.files as Express.Multer.File[] | undefined;

    if (!message.trim() && (!files || files.length === 0)) {
      res.status(400).json({ error: 'Message or files required' });
      return;
    }

    const result = await processIntakeChatTurn({
      userId: req.user!.id,
      sessionId,
      message: message.trim() || `Uploaded ${files?.length || 0} document(s) for Indian legal analysis`,
      files,
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Chat failed' });
  }
});

router.post('/analyze', handleUpload('files', config.upload.maxFilesPerRequest), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    const instructions = (req.body.instructions as string) || '';

    if ((!files || files.length === 0) && !instructions.trim()) {
      res.status(400).json({ error: 'Upload at least one document or provide instructions' });
      return;
    }

    const extracted = await Promise.all(
      (files || []).map((f) =>
        extractTextFromBuffer(f.buffer, f.originalname, f.mimetype)
      )
    );

    const analysis = await analyzeIntakeDocuments({
      instructions,
      documents: extracted,
    });

    await writeAuditLog({
      eventType: 'AI_COMPLIANCE_CHECK',
      actorId: req.user!.id,
      actorRole: req.user!.role,
      description: `Document intake analysis: ${files?.length || 0} file(s)`,
      metadata: {
        filenames: files?.map((f) => f.originalname),
        riskScore: analysis.riskScore,
        domain: analysis.domain,
        provider: analysis.provider,
      },
    });

    res.json({
      analysis,
      filesReceived: files?.map((f) => ({
        name: f.originalname,
        size: f.size,
        mimeType: f.mimetype,
      })) || [],
    });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Analysis failed' });
  }
});

router.post('/create', handleUpload('files', config.upload.maxFilesPerRequest), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[] | undefined;
    const {
      title,
      description,
      domain,
      priority,
      riskScore,
      riskScorePrecise,
      instructions,
      summary,
      analysisSummary,
      sessionId,
    } = req.body;

    if (!title || !description || !domain) {
      res.status(400).json({ error: 'title, description, and domain are required' });
      return;
    }

    if (!Object.values(LegalDomain).includes(domain as LegalDomain)) {
      res.status(400).json({ error: 'Invalid legal domain' });
      return;
    }

    const fullDescription = [
      description,
      summary ? `\n\nAI Analysis Summary:\n${summary}` : '',
      instructions ? `\n\nUser Instructions:\n${instructions}` : '',
      files?.length ? `\n\nAttached Documents: ${files.map((f) => f.originalname).join(', ')}` : '',
    ].join('');

    let parsedSummary = analysisSummary;
    if (typeof analysisSummary === 'string') {
      try { parsedSummary = JSON.parse(analysisSummary); } catch { parsedSummary = null; }
    }

    const precise = riskScorePrecise ? parseFloat(String(riskScorePrecise)) : null;
    const legacyRisk = riskScore ? parseInt(String(riskScore), 10) : (precise ? Math.ceil(precise / 20) : 3);

    const task = await prisma.task.create({
      data: {
        title,
        description: fullDescription,
        domain: domain as LegalDomain,
        priority: (priority as Priority) || Priority.NORMAL,
        riskScore: Math.min(5, Math.max(1, legacyRisk)),
        riskScorePrecise: precise,
        analysisSummary: parsedSummary ? analysisSummaryToJson(parsedSummary) : undefined,
        jurisdiction: 'India',
        manualEntry: true,
        status: TaskStatus.IN_PROGRESS,
        currentStage: 1,
      },
      include: { assignedTo: { select: { id: true, name: true, userId: true } } },
    });

    const uploadedDocs = [];
    for (const file of files || []) {
      const doc = await uploadDocument({
        taskId: task.id,
        filename: file.originalname,
        buffer: file.buffer,
        mimeType: file.mimetype,
        uploadedBy: req.user!.userId,
        notes: 'Uploaded during task intake',
      });
      uploadedDocs.push(doc);
    }

    await writeAuditLog({
      eventType: 'TASK_CREATED',
      taskId: task.id,
      actorId: req.user!.id,
      actorRole: req.user!.role,
      description: `Task created with ${uploadedDocs.length} document(s): ${task.title}`,
      metadata: { domain: task.domain, documents: uploadedDocs.map((d) => d.filename) },
    });

    if (uploadedDocs.length > 0) {
      await writeAuditLog({
        eventType: 'DOCUMENT_CREATED',
        taskId: task.id,
        actorId: req.user!.id,
        description: `${uploadedDocs.length} document(s) uploaded at intake`,
        metadata: { documentIds: uploadedDocs.map((d) => d.id) },
      });
    }

    if (sessionId) {
      await prisma.intakeSession.updateMany({
        where: { id: sessionId, userId: req.user!.id },
        data: { status: 'completed', taskId: task.id },
      });
    }

    const orchestratorJobId = await enqueueOrchestrate(task.id);
    const agentName = domainToAgent(task.domain);
    const agentJobId = await enqueueAgentRun(
      task.id,
      agentName,
      2,
      summary || instructions
    );

    res.status(201).json({
      task,
      documents: uploadedDocs,
      orchestratorJobId,
      agentJobId,
    });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : 'Task creation failed' });
  }
});

export default router;
