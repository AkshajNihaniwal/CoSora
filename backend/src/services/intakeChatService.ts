import prisma from '../lib/prisma';
import { extractTextFromBuffer } from '../utils/documentExtractor';
import { runIntakeAnalysis, ChatMessage } from './documentAnalysisService';
import { IntakeChatTurnResult } from '../types/legalAnalysis';

const SESSION_TTL_HOURS = 24;

export async function getOrCreateIntakeSession(userId: string, sessionId?: string) {
  if (sessionId) {
    const existing = await prisma.intakeSession.findFirst({
      where: { id: sessionId, userId, status: 'active', expiresAt: { gt: new Date() } },
    });
    if (existing) return existing;
  }

  return prisma.intakeSession.create({
    data: {
      userId,
      messages: [],
      collectedFields: {},
      expiresAt: new Date(Date.now() + SESSION_TTL_HOURS * 60 * 60 * 1000),
    },
  });
}

export async function processIntakeChatTurn(input: {
  userId: string;
  sessionId?: string;
  message: string;
  files?: Express.Multer.File[];
}): Promise<IntakeChatTurnResult> {
  const session = await getOrCreateIntakeSession(input.userId, input.sessionId);
  const messages = (session.messages as unknown as ChatMessage[]) || [];
  const collectedFields = (session.collectedFields as unknown as Record<string, string>) || {};

  messages.push({ role: 'user', content: input.message });

  const extracted = await Promise.all(
    (input.files || []).map((f) => extractTextFromBuffer(f.buffer, f.originalname, f.mimetype))
  );

  const result = await runIntakeAnalysis({
    instructions: input.message,
    documents: extracted,
    conversationHistory: messages,
    collectedFields,
  });

  messages.push({ role: 'assistant', content: result.reply });

  const draft = {
    title: result.title,
    description: result.description,
    domain: result.domain,
    priority: result.priority,
    riskScore: result.riskScore,
    riskScorePrecise: result.riskScorePrecise,
    summary: result.summary,
    analysisSummary: result.analysisSummary,
    readyToCreate: result.readyToCreate,
  };

  await prisma.intakeSession.update({
    where: { id: session.id },
    data: {
      messages: messages as object,
      draft: draft as object,
      status: result.readyToCreate ? 'ready' : 'active',
    },
  });

  return {
    sessionId: session.id,
    reply: result.reply,
    missingFields: result.missingFields,
    draft,
    readyToCreate: result.readyToCreate,
    analysisSummary: result.analysisSummary,
  };
}
