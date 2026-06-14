export type RiskRating = 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

export interface RiskBreakdown {
  overallScore: number;
  legacyScore: number;
  rating: RiskRating;
  dimensions: {
    contractual: number;
    regulatory: number;
    financial: number;
    litigation: number;
    operational: number;
    dataPrivacy: number;
  };
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
  type: string;
  location: string;
  title: string;
  description: string;
  dataSummary: string;
  legalRelevance: string;
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

export interface MissingField {
  field: string;
  label: string;
  reason: string;
  required: boolean;
}

export interface IntakeDraft {
  title: string;
  description: string;
  domain: string;
  priority: string;
  riskScore: number;
  riskScorePrecise: number;
  summary: string;
  analysisSummary?: TaskAnalysisSummary;
  readyToCreate?: boolean;
}

export const RISK_RATING_COLORS: Record<RiskRating, string> = {
  LOW: 'text-cosora-success',
  MODERATE: 'text-cosora-gold',
  ELEVATED: 'text-cosora-orange',
  HIGH: 'text-cosora-orange',
  CRITICAL: 'text-cosora-danger',
};

export const DIMENSION_LABELS: Record<string, string> = {
  contractual: 'Contractual',
  regulatory: 'Regulatory',
  financial: 'Financial',
  litigation: 'Litigation',
  operational: 'Operational',
  dataPrivacy: 'Data Privacy',
};
