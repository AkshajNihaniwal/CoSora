import fs from 'fs/promises';
import prisma from '../lib/prisma';
import { extractTextFromBuffer } from '../utils/documentExtractor';
import { TaskAnalysisSummary } from '../types/legalAnalysis';

export interface TaskAssistantContext {
  task: {
    id: string;
    title: string;
    description: string;
    domain: string;
    status: string;
    currentStage: number;
    riskScore: number;
    riskScorePrecise: number | null;
    priority: string;
    jurisdiction: string;
  };
  documentName: string | null;
  documentText: string;
  analysis: TaskAnalysisSummary | null;
  recentAgentActions: string[];
  recentComments: string[];
  contextBrief: string;
  promptBlock: string;
}

export async function buildTaskAssistantContext(taskId: string): Promise<TaskAssistantContext> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      documents: { where: { isLatest: true }, orderBy: { version: 'desc' }, take: 1 },
      agentLogs: { orderBy: { createdAt: 'desc' }, take: 5 },
      comments: { orderBy: { createdAt: 'desc' }, take: 8 },
    },
  });

  if (!task) throw new Error('Task not found');

  let documentText = '';
  let documentName: string | null = null;

  const latestDoc = task.documents[0];
  if (latestDoc) {
    documentName = latestDoc.filename;
    try {
      const buffer = await fs.readFile(latestDoc.filepath);
      const extracted = await extractTextFromBuffer(buffer, latestDoc.filename, latestDoc.mimeType);
      documentText = extracted.text;
      if (!documentText && extracted.extractionNote) {
        documentText = `[Document: ${latestDoc.filename}] ${extracted.extractionNote}`;
      }
    } catch {
      documentText = `[Document on file: ${latestDoc.filename} — could not read content]`;
    }
  }

  if (!documentText.trim()) {
    documentText = task.description.slice(0, 12000);
  } else {
    documentText = documentText.slice(0, 12000);
  }

  const analysis = task.analysisSummary as TaskAnalysisSummary | null;

  const clauseBlock = analysis?.clauseHighlights?.length
    ? analysis.clauseHighlights
        .map((c) => `• ${c.section} — ${c.title}: ${c.summary}${c.indianLawRef ? ` (${c.indianLawRef})` : ''}`)
        .join('\n')
    : 'No structured clause map stored for this task yet.';

  const summaryBlock = analysis?.summaryPointers?.length
    ? analysis.summaryPointers.join('\n')
    : analysis?.executiveSummary || task.description.slice(0, 500);

  const recentAgentActions = task.agentLogs.map(
    (l) => `L${l.stage} ${l.agentName}: ${l.action}`
  );

  const recentComments = task.comments.map(
    (c) => `${c.authorRole}${c.clauseRef ? ` [${c.clauseRef}]` : ''}: ${c.text.slice(0, 200)}`
  );

  const riskDisplay = task.riskScorePrecise ?? task.riskScore * 20;

  const promptBlock = `=== TASK CONTEXT (always use this) ===
TASK ID: ${task.id}
TITLE: ${task.title}
DOMAIN: ${task.domain}
STATUS: ${task.status} · Stage L${task.currentStage}
PRIORITY: ${task.priority}
JURISDICTION: ${task.jurisdiction}
RISK SCORE: ${riskDisplay}/100 (legacy band L${task.riskScore})

TASK DESCRIPTION:
${task.description.slice(0, 3000)}

AI SUMMARY / KEY POINTS:
${summaryBlock}

CLAUSE HIGHLIGHTS (Indian law):
${clauseBlock}

${analysis?.riskFlags?.length ? `RISK FLAGS:\n${analysis.riskFlags.map((f) => `• ${f}`).join('\n')}` : ''}

${analysis?.complianceNotes?.length ? `COMPLIANCE NOTES:\n${analysis.complianceNotes.map((n) => `• ${n}`).join('\n')}` : ''}

UPLOADED DOCUMENT${documentName ? `: ${documentName}` : ''}:
${documentText || '[No document text available — refer to task description and analysis above]'}

RECENT AGENT ACTIVITY:
${recentAgentActions.length ? recentAgentActions.join('\n') : 'None yet'}

RECENT COMMENTS:
${recentComments.length ? recentComments.join('\n') : 'None'}
=== END TASK CONTEXT ===`;

  const contextBrief = analysis
    ? `I'm ready to help with **${task.title}** (${task.domain.replace(/_/g, ' ')}). Risk: **${riskDisplay}/100**. I have loaded your AI analysis (${analysis.clauseHighlights.length} clause highlights${documentName ? `, document: ${documentName}` : ''}). What would you like to change or clarify under Indian law?`
    : `I'm ready to help with **${task.title}**. I've loaded the task description${documentName ? ` and document (${documentName})` : ''}. Ask me about clauses, risk, or suggested edits under Indian law.`;

  return {
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      domain: task.domain,
      status: task.status,
      currentStage: task.currentStage,
      riskScore: task.riskScore,
      riskScorePrecise: task.riskScorePrecise,
      priority: task.priority,
      jurisdiction: task.jurisdiction,
    },
    documentName,
    documentText,
    analysis,
    recentAgentActions,
    recentComments,
    contextBrief,
    promptBlock,
  };
}
