import { Prisma } from '@prisma/client';
import { getAIProvider, getProviderLabel } from '../agents/aiProviderImpl';
import { fetchIndianLegalContext, INDIAN_INTAKE_SYSTEM_PROMPT } from './indianLegalContextService';
import { ExtractedDocument } from '../utils/documentExtractor';
import {
  IntakeAnalysisResult,
  TaskAnalysisSummary,
  MissingField,
  RiskBreakdown,
  ClauseHighlight,
  VisualElement,
  legacyScoreFromPrecise,
  ratingFromScore,
} from '../types/legalAnalysis';
import { LegalDomain, Priority } from '@prisma/client';

const VALID_DOMAINS = Object.values(LegalDomain);

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function parseJsonFromContent(raw: string): Record<string, unknown> | null {
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function asStringArray(val: unknown): string[] {
  return Array.isArray(val) ? val.map(String) : [];
}

function parseRiskBreakdown(parsed: Record<string, unknown>): RiskBreakdown {
  const rb = (parsed.riskBreakdown || parsed.riskAssessment) as Record<string, unknown> | undefined;
  const overall = Number(rb?.overallScore ?? parsed.riskScorePrecise ?? parsed.overallRiskScore ?? 45);
  const clamped = Math.min(100, Math.max(0, overall));
  const dims = (rb?.dimensions || {}) as Record<string, number>;

  return {
    overallScore: clamped,
    legacyScore: Number(rb?.legacyScore) || legacyScoreFromPrecise(clamped),
    rating: (rb?.rating as RiskBreakdown['rating']) || ratingFromScore(clamped),
    dimensions: {
      contractual: Number(dims.contractual ?? clamped),
      regulatory: Number(dims.regulatory ?? clamped - 5),
      financial: Number(dims.financial ?? clamped - 3),
      litigation: Number(dims.litigation ?? clamped - 8),
      operational: Number(dims.operational ?? clamped - 6),
      dataPrivacy: Number(dims.dataPrivacy ?? clamped - 10),
    },
    rationale: String(rb?.rationale || parsed.riskRationale || 'Risk assessed under Indian legal framework.'),
    topDrivers: asStringArray(rb?.topDrivers || parsed.riskFlags).slice(0, 5),
  };
}

function parseClauseHighlights(parsed: Record<string, unknown>): ClauseHighlight[] {
  const raw = parsed.clauseHighlights || parsed.mainClauses || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((c, i) => {
    const item = c as Record<string, unknown>;
    return {
      clauseId: String(item.clauseId || `CL-${i + 1}`),
      section: String(item.section || item.clauseSection || 'General'),
      title: String(item.title || item.clauseTitle || 'Clause'),
      summary: String(item.summary || item.description || ''),
      riskLevel: (item.riskLevel as ClauseHighlight['riskLevel']) || 'MODERATE',
      indianLawRef: item.indianLawRef ? String(item.indianLawRef) : undefined,
      pageOrSheet: item.pageOrSheet ? String(item.pageOrSheet) : undefined,
    };
  });
}

function parseVisualElements(parsed: Record<string, unknown>, docs: ExtractedDocument[]): VisualElement[] {
  const fromAi = parsed.visualElements || parsed.chartsAndGraphs || [];
  const elements: VisualElement[] = [];

  if (Array.isArray(fromAi)) {
    for (const v of fromAi) {
      const item = v as Record<string, unknown>;
      elements.push({
        type: (item.type as VisualElement['type']) || 'chart',
        location: String(item.location || 'Document'),
        title: String(item.title || 'Visual element'),
        description: String(item.description || ''),
        dataSummary: String(item.dataSummary || item.data || ''),
        legalRelevance: String(item.legalRelevance || item.significance || ''),
      });
    }
  }

  for (const d of docs) {
    for (const hint of d.visualHints || []) {
      elements.push({
        type: hint.type as VisualElement['type'],
        location: `${d.filename} — ${hint.location}`,
        title: hint.title,
        description: hint.description,
        dataSummary: hint.dataSummary || 'See source document for numeric detail.',
        legalRelevance: hint.legalRelevance || 'Review embedded visual for financial/regulatory implications under Indian law.',
      });
    }
  }

  return elements;
}

function parseMissingFields(parsed: Record<string, unknown>): MissingField[] {
  const raw = parsed.missingFields || [];
  if (!Array.isArray(raw)) return [];
  return raw.map((m) => {
    const item = m as Record<string, unknown>;
    return {
      field: String(item.field || 'unknown'),
      label: String(item.label || item.field || 'Additional information'),
      reason: String(item.reason || 'Required for accurate Indian legal analysis'),
      required: item.required !== false,
    };
  });
}

function buildAnalysisSummary(parsed: Record<string, unknown>, docs: ExtractedDocument[], ctx: { webResearchUsed: boolean }): TaskAnalysisSummary {
  const riskBreakdown = parseRiskBreakdown(parsed);
  return {
    executiveSummary: String(parsed.executiveSummary || parsed.summary || ''),
    summaryPointers: asStringArray(parsed.summaryPointers || parsed.keyPoints || parsed.highlights),
    clauseHighlights: parseClauseHighlights(parsed),
    visualElements: parseVisualElements(parsed, docs),
    riskBreakdown,
    indianLawReferences: asStringArray(parsed.indianLawReferences || parsed.applicableStatutes),
    applicableStatutes: asStringArray(parsed.applicableStatutes || parsed.indianLawReferences),
    templateNotes: asStringArray(parsed.templateNotes || parsed.indianTemplateNotes),
    complianceNotes: asStringArray(parsed.complianceNotes),
    riskFlags: asStringArray(parsed.riskFlags),
    jurisdiction: 'India',
    webResearchUsed: ctx.webResearchUsed,
    confidenceScore: Number(parsed.confidenceScore) || 0.82,
  };
}

function inferDomain(text: string): LegalDomain {
  const lower = text.toLowerCase();
  if (/nda|vendor|msa|agreement|contract/i.test(lower)) return LegalDomain.CONTRACT_MANAGEMENT;
  if (/employment|termination|labour|labor|employee/i.test(lower)) return LegalDomain.EMPLOYMENT_LABOUR;
  if (/dpdp|privacy|data protection/i.test(lower)) return LegalDomain.DATA_PRIVACY;
  if (/lease|property|rent/i.test(lower)) return LegalDomain.PROPERTY_LEASING;
  if (/patent|trademark|ip /i.test(lower)) return LegalDomain.IP_MANAGEMENT;
  if (/litigation|court|dispute/i.test(lower)) return LegalDomain.LITIGATION;
  return LegalDomain.CONTRACT_MANAGEMENT;
}

const ANALYSIS_JSON_SCHEMA = `{
  "reply": "conversational message to user — ask for missing info if needed",
  "title": "task title when ready",
  "description": "task description",
  "domain": "one of: ${VALID_DOMAINS.join(', ')}",
  "priority": "LOW|NORMAL|HIGH|URGENT|CRITICAL",
  "riskScorePrecise": 0-100,
  "riskBreakdown": {
    "overallScore": 0-100,
    "rating": "LOW|MODERATE|ELEVATED|HIGH|CRITICAL",
    "dimensions": { "contractual": 0-100, "regulatory": 0-100, "financial": 0-100, "litigation": 0-100, "operational": 0-100, "dataPrivacy": 0-100 },
    "rationale": "why this score",
    "topDrivers": ["driver1", "driver2"]
  },
  "executiveSummary": "2-3 sentence overview",
  "summaryPointers": ["• Main clause/point 1", "• Main clause/point 2"],
  "clauseHighlights": [{ "clauseId": "CL-1", "section": "Indemnity", "title": "...", "summary": "...", "riskLevel": "HIGH", "indianLawRef": "Indian Contract Act s.124", "pageOrSheet": "p.4" }],
  "visualElements": [{ "type": "pie_chart|bar_graph|line_graph|table|chart|diagram", "location": "Sheet2 / Page 3", "title": "...", "description": "...", "dataSummary": "...", "legalRelevance": "..." }],
  "indianLawReferences": ["DPDP Act 2023 s.6", "..."],
  "templateNotes": ["Deviation from standard Indian NDA template: ..."],
  "complianceNotes": ["..."],
  "riskFlags": ["..."],
  "missingFields": [{ "field": "counterparty_name", "label": "Counterparty legal name", "reason": "...", "required": true }],
  "readyToCreate": false,
  "confidenceScore": 0.0-1.0
}`;

export async function runIntakeAnalysis(input: {
  instructions?: string;
  documents: ExtractedDocument[];
  conversationHistory?: ChatMessage[];
  collectedFields?: Record<string, string>;
}): Promise<IntakeAnalysisResult & { reply: string }> {
  const provider = getAIProvider();
  const providerLabel = getProviderLabel();
  const docText = input.documents.map((d) => d.text).join('\n');
  const ctx = await fetchIndianLegalContext({
    domain: inferDomain(`${input.instructions} ${docText}`),
    documentText: docText,
    instructions: input.instructions,
  });

  const docBlocks = input.documents.map((d) => {
    const meta = [
      d.pageCount ? `${d.pageCount} pages` : null,
      d.sheetCount ? `${d.sheetCount} sheets` : null,
      d.extractionNote,
      d.visualHints?.length ? `${d.visualHints.length} chart/graph element(s) detected` : null,
    ].filter(Boolean).join(' · ');
    return `FILE: ${d.filename}${meta ? ` (${meta})` : ''}\nCONTENT:\n${d.text || '[No extractable text — check scans/images]'}`;
  }).join('\n\n---\n\n');

  const historyBlock = (input.conversationHistory || [])
    .filter((m) => m.role !== 'system')
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n');

  const fieldsBlock = input.collectedFields
    ? Object.entries(input.collectedFields).map(([k, v]) => `${k}: ${v}`).join('\n')
    : '';

  const userPrompt = `${ctx.promptBlock}

USER INSTRUCTIONS: ${input.instructions?.trim() || 'Analyze for Indian legal risk and help create a task.'}

COLLECTED FACTS:
${fieldsBlock || 'None yet'}

CONVERSATION:
${historyBlock || 'New session'}

DOCUMENTS (${input.documents.length}):
${docBlocks || 'No documents uploaded yet'}

Respond with JSON only:
${ANALYSIS_JSON_SCHEMA}`;

  const response = await provider.complete({
    systemPrompt: INDIAN_INTAKE_SYSTEM_PROMPT,
    userPrompt,
    maxTokens: 4000,
    messages: input.conversationHistory,
  });

  const parsed = parseJsonFromContent(response.content) || {};
  const analysisSummary = buildAnalysisSummary(parsed, input.documents, { webResearchUsed: ctx.webResearchUsed });
  const missingFields = parseMissingFields(parsed);
  const readyToCreate = Boolean(parsed.readyToCreate) && missingFields.filter((m) => m.required).length === 0;

  const domain = VALID_DOMAINS.includes(parsed.domain as LegalDomain)
    ? (parsed.domain as LegalDomain)
    : inferDomain(`${input.instructions} ${docText}`);

  const priority = ['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'].includes(String(parsed.priority))
    ? (parsed.priority as Priority)
    : Priority.NORMAL;

  const riskScorePrecise = analysisSummary.riskBreakdown.overallScore;

  return {
    reply: String(parsed.reply || parsed.executiveSummary || 'Analysis complete. Please review the assessment below.'),
    title: String(parsed.title || 'Indian Legal Review Task').slice(0, 120),
    description: String(parsed.description || parsed.executiveSummary || input.instructions || 'Legal document review under Indian law'),
    domain,
    priority,
    riskScore: analysisSummary.riskBreakdown.legacyScore,
    riskScorePrecise,
    summary: analysisSummary.executiveSummary,
    analysisSummary,
    complianceNotes: analysisSummary.complianceNotes,
    riskFlags: analysisSummary.riskFlags,
    missingFields,
    readyToCreate,
    documentInsights: input.documents.map((d) => ({
      filename: d.filename,
      insight: d.text
        ? `Extracted ${d.text.length} chars${d.visualHints?.length ? `; ${d.visualHints.length} chart/graph(s) flagged` : ''}`
        : d.extractionNote || 'No text extracted',
      extractionNote: d.extractionNote,
    })),
    confidenceScore: analysisSummary.confidenceScore,
    modelVersion: response.modelVersion,
    provider: providerLabel,
  };
}

export async function analyzeIntakeDocuments(input: {
  instructions?: string;
  documents: ExtractedDocument[];
}): Promise<IntakeAnalysisResult> {
  const result = await runIntakeAnalysis({ ...input, conversationHistory: [] });
  const { reply: _reply, ...analysis } = result;
  return analysis;
}

export function analysisSummaryToJson(summary: TaskAnalysisSummary): Prisma.InputJsonValue {
  return summary as unknown as Prisma.InputJsonValue;
}
