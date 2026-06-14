export type RiskRating = 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

export interface RiskDimensionScores {
  contractual: number;
  regulatory: number;
  financial: number;
  litigation: number;
  operational: number;
  dataPrivacy: number;
}

export interface RiskBreakdown {
  overallScore: number;
  legacyScore: number;
  rating: RiskRating;
  dimensions: RiskDimensionScores;
  rationale: string;
  topDrivers: string[];
}

export interface ClauseHighlight {
  clauseId: string;
  section: string;
  title: string;
  summary: string;
  riskLevel: RiskRating;
  indianLawRef?: string;
  pageOrSheet?: string;
}

export interface VisualElement {
  type: 'chart' | 'pie_chart' | 'bar_graph' | 'line_graph' | 'table' | 'diagram' | 'image' | 'graph';
  location: string;
  title: string;
  description: string;
  dataSummary: string;
  legalRelevance: string;
}

export interface MissingField {
  field: string;
  label: string;
  reason: string;
  required: boolean;
}

export interface TaskAnalysisSummary {
  executiveSummary: string;
  summaryPointers: string[];
  clauseHighlights: ClauseHighlight[];
  visualElements: VisualElement[];
  riskBreakdown: RiskBreakdown;
  indianLawReferences: string[];
  applicableStatutes: string[];
  templateNotes: string[];
  complianceNotes: string[];
  riskFlags: string[];
  jurisdiction: string;
  webResearchUsed: boolean;
  confidenceScore: number;
}

export interface IntakeAnalysisResult {
  title: string;
  description: string;
  domain: string;
  priority: string;
  riskScore: number;
  riskScorePrecise: number;
  summary: string;
  analysisSummary: TaskAnalysisSummary;
  complianceNotes: string[];
  riskFlags: string[];
  documentInsights: Array<{
    filename: string;
    insight: string;
    extractionNote?: string;
  }>;
  missingFields: MissingField[];
  readyToCreate: boolean;
  confidenceScore: number;
  modelVersion: string;
  provider: string;
}

export interface IntakeChatTurnResult {
  sessionId: string;
  reply: string;
  missingFields: MissingField[];
  draft: Partial<IntakeAnalysisResult> | null;
  readyToCreate: boolean;
  analysisSummary?: TaskAnalysisSummary;
}

export function legacyScoreFromPrecise(score: number): number {
  if (score <= 20) return 1;
  if (score <= 40) return 2;
  if (score <= 60) return 3;
  if (score <= 80) return 4;
  return 5;
}

export function ratingFromScore(score: number): RiskRating {
  if (score <= 20) return 'LOW';
  if (score <= 40) return 'MODERATE';
  if (score <= 60) return 'ELEVATED';
  if (score <= 80) return 'HIGH';
  return 'CRITICAL';
}

export function buildDefaultRiskBreakdown(overall = 45): RiskBreakdown {
  return {
    overallScore: overall,
    legacyScore: legacyScoreFromPrecise(overall),
    rating: ratingFromScore(overall),
    dimensions: {
      contractual: overall,
      regulatory: Math.max(10, overall - 8),
      financial: Math.max(10, overall - 5),
      litigation: Math.max(10, overall - 12),
      operational: Math.max(10, overall - 10),
      dataPrivacy: Math.max(10, overall - 15),
    },
    rationale: 'Preliminary assessment pending full document review under Indian law.',
    topDrivers: ['Pending detailed clause analysis'],
  };
}
