import fs from 'fs/promises';
import path from 'path';
import prisma from '../lib/prisma';
import { config } from '../config';
import { sha256 } from '../utils/hash';
import { computeTextDiff } from '../utils/diff';
import { writeAuditLog } from './auditService';

async function ensureUploadDir() {
  await fs.mkdir(config.storage.uploadDir, { recursive: true });
}

export async function uploadDocument(input: {
  taskId: string;
  filename: string;
  buffer: Buffer;
  mimeType: string;
  uploadedBy: string;
  notes?: string;
}) {
  await ensureUploadDir();

  const fileHash = sha256(input.buffer);
  const latest = await prisma.document.findFirst({
    where: { taskId: input.taskId, isLatest: true },
    orderBy: { version: 'desc' },
  });

  const version = latest ? latest.version + 1 : 1;
  const ext = path.extname(input.filename);
  const storedName = `${input.taskId}-v${version}${ext}`;
  const filepath = path.join(config.storage.uploadDir, storedName);

  await fs.writeFile(filepath, input.buffer);

  let diff: string | undefined;
  if (latest) {
    try {
      const prevContent = await fs.readFile(latest.filepath, 'utf-8');
      const newContent = input.buffer.toString('utf-8');
      diff = computeTextDiff(prevContent, newContent);
    } catch {
      diff = undefined;
    }
    await prisma.document.updateMany({
      where: { taskId: input.taskId, isLatest: true },
      data: { isLatest: false },
    });
  }

  const doc = await prisma.document.create({
    data: {
      taskId: input.taskId,
      version,
      filename: input.filename,
      filepath,
      mimeType: input.mimeType,
      sizeBytes: input.buffer.length,
      sha256Hash: fileHash,
      isLatest: true,
      uploadedBy: input.uploadedBy,
      diff,
      notes: input.notes,
    },
  });

  await writeAuditLog({
    eventType: version === 1 ? 'DOCUMENT_CREATED' : 'DOCUMENT_EDITED',
    taskId: input.taskId,
    description: `Document ${input.filename} v${version} uploaded`,
    metadata: { documentId: doc.id, version, sha256Hash: fileHash },
  });

  return doc;
}

export async function getDocumentWithIntegrityCheck(documentId: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return null;

  try {
    const content = await fs.readFile(doc.filepath);
    const computed = sha256(content);
    if (computed !== doc.sha256Hash) {
      await writeAuditLog({
        eventType: 'DOCUMENT_EDITED',
        taskId: doc.taskId,
        description: `Document integrity check failed for ${doc.filename}`,
        metadata: { documentId: doc.id, expected: doc.sha256Hash, computed },
      });
      return { doc, integrityError: true };
    }
    return { doc, content, integrityError: false };
  } catch {
    return { doc, integrityError: true };
  }
}

export async function listDocumentVersions(documentId: string) {
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return [];

  return prisma.document.findMany({
    where: { taskId: doc.taskId },
    orderBy: { version: 'desc' },
  });
}

export async function getLatestDocumentPreview(taskId: string) {
  const doc = await prisma.document.findFirst({
    where: { taskId, isLatest: true },
    orderBy: { version: 'desc' },
  });

  if (!doc) return null;

  try {
    const raw = await fs.readFile(doc.filepath, 'utf-8');
    const agentLog = await prisma.agentLog.findFirst({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      document: doc,
      content: raw,
      generatedBy: agentLog?.agentName ?? 'system',
    };
  } catch {
    return { document: doc, content: null, generatedBy: null };
  }
}

export async function seedDocument(input: {
  taskId: string;
  filename: string;
  content: string;
  uploadedBy: string;
  notes?: string;
}) {
  await ensureUploadDir();
  const buffer = Buffer.from(input.content, 'utf-8');
  const fileHash = sha256(buffer);
  const storedName = `${input.taskId}-v1.txt`;
  const filepath = path.join(config.storage.uploadDir, storedName);
  await fs.writeFile(filepath, buffer);

  return prisma.document.create({
    data: {
      taskId: input.taskId,
      version: 1,
      filename: input.filename,
      filepath,
      mimeType: 'text/plain',
      sizeBytes: buffer.length,
      sha256Hash: fileHash,
      isLatest: true,
      uploadedBy: input.uploadedBy,
      notes: input.notes ?? 'AI-generated draft',
    },
  });
}
