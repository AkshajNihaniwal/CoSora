import prisma from '../lib/prisma';
import { getAIProvider, getProviderLabel } from '../agents/aiProviderImpl';
import { fetchIndianLegalContext, TASK_ASSISTANT_SYSTEM_PROMPT } from './indianLegalContextService';
import { buildTaskAssistantContext } from './taskContextService';
import { ChatMessage } from './documentAnalysisService';

export async function getTaskAssistantHistory(taskId: string, limit = 50) {
  return prisma.taskAssistantMessage.findMany({
    where: { taskId },
    orderBy: { createdAt: 'asc' },
    take: limit,
  });
}

export async function getTaskAssistantSession(taskId: string) {
  const ctx = await buildTaskAssistantContext(taskId);
  const messages = await getTaskAssistantHistory(taskId);
  return {
    task: ctx.task,
    contextBrief: ctx.contextBrief,
    analysisSummary: ctx.analysis,
    documentName: ctx.documentName,
    hasDocumentText: ctx.documentText.length > 0,
    messages,
  };
}

export async function sendTaskAssistantMessage(input: {
  taskId: string;
  userId: string;
  message: string;
  editorInstructions?: string;
}) {
  const ctx = await buildTaskAssistantContext(input.taskId);
  const history = await getTaskAssistantHistory(input.taskId);

  const legalCtx = await fetchIndianLegalContext({
    domain: ctx.task.domain,
    documentText: ctx.documentText,
    instructions: input.message,
  });

  const chatHistory: ChatMessage[] = history.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }));

  const userPrompt = `${legalCtx.promptBlock}

${ctx.promptBlock}

The user is asking for help on THIS SPECIFIC TASK above. Reference the task title, clauses, risk score, and document content in your answer.

USER MESSAGE: ${input.message}
${input.editorInstructions && input.editorInstructions !== input.message ? `\nADDITIONAL EDITOR NOTES: ${input.editorInstructions}` : ''}

Respond in plain text (not JSON). Be specific to this task. Cite Indian statutes where relevant. If suggesting clause edits, show exact wording.`;

  const userRecord = await prisma.taskAssistantMessage.create({
    data: {
      taskId: input.taskId,
      userId: input.userId,
      role: 'user',
      content: input.message,
    },
  });

  chatHistory.push({ role: 'user', content: input.message });

  const provider = getAIProvider();
  const response = await provider.complete({
    systemPrompt: `${TASK_ASSISTANT_SYSTEM_PROMPT}

You MUST use the task context provided in each user message. Never give generic answers — always reference the specific task title, domain, clauses, and document details loaded for this matter.`,
    userPrompt,
    maxTokens: 3000,
    messages: chatHistory.slice(0, -1),
  });

  const reply =
    response.content?.trim() ||
    'I could not generate a response. Please try again or rephrase your question about this task.';

  const assistantMsg = await prisma.taskAssistantMessage.create({
    data: {
      taskId: input.taskId,
      userId: input.userId,
      role: 'assistant',
      content: reply,
      metadata: {
        provider: getProviderLabel(),
        modelVersion: response.modelVersion,
        taskTitle: ctx.task.title,
      },
    },
  });

  const messages = await getTaskAssistantHistory(input.taskId);

  return {
    userMessage: userRecord,
    message: assistantMsg,
    messages,
    provider: getProviderLabel(),
    contextBrief: ctx.contextBrief,
  };
}
