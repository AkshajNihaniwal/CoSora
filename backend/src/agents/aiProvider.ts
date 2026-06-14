export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AICompletionRequest {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  messages?: ChatMessage[];
}

export interface AICompletionResponse {
  content: string;
  riskScore: number;
  ragSources: Array<{ title: string; docType: string; relevance: number }>;
  complianceNotes: string[];
  riskFlags: string[];
  recommendedNextStage: number;
  confidenceScore: number;
  tokenCount: number;
  modelVersion: string;
}

export interface AIProvider {
  complete(request: AICompletionRequest): Promise<AICompletionResponse>;
}
