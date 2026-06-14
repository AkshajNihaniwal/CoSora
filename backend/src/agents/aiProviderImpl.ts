import { AIProvider, AICompletionRequest, AICompletionResponse, ChatMessage } from './aiProvider';
import { legacyScoreFromPrecise } from '../types/legalAnalysis';
import { config } from '../config';

const MOCK_DRAFTS: Record<string, string> = {
  contract: 'MASTER SERVICES AGREEMENT (INDIA)\n\nThis Agreement is entered into between the parties under Indian law, with governing law and jurisdiction in India...',
  compliance: 'COMPLIANCE ASSESSMENT MEMO (INDIA)\n\nPursuant to internal review, the following Indian regulatory requirements apply...',
  litigation: 'INTERNAL LITIGATION BRIEF (INDIA)\n\nFOR INTERNAL USE ONLY — Case summary under Indian procedural law...',
  ip: 'IP ASSIGNMENT AND LICENSING MEMO (INDIA)\n\nRegarding intellectual property rights under Indian IP statutes...',
  employment: 'EMPLOYMENT AGREEMENT REVIEW (INDIA)\n\nAnalysis of employment terms under Indian labour codes and Shops & Establishments Act...',
  governance: 'BOARD RESOLUTION DRAFT (INDIA)\n\nRESOLVED under Companies Act, 2013...',
  ma: 'DUE DILIGENCE CHECKLIST (INDIA)\n\nM&A transaction review covering Indian regulatory approvals (CCI, SEBI, RBI)...',
  privacy: 'DATA PRIVACY IMPACT ASSESSMENT (INDIA)\n\nDPDP Act 2023 compliance review for data processing activities...',
  risk: 'ENTERPRISE RISK REGISTER ENTRY (INDIA)\n\nRisk identification under Indian regulatory framework...',
  regulator: 'REGULATORY RESPONSE PREPARATION (INDIA)\n\nDraft response framework for RBI/SEBI/MCA inquiry...',
  policy: 'CORPORATE POLICY DRAFT (INDIA)\n\nPolicy aligned with Indian corporate governance standards...',
  property: 'COMMERCIAL LEASE REVIEW (INDIA)\n\nAnalysis under Transfer of Property Act and state stamp/registration requirements...',
};

function detectAgentType(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('litigation')) return 'litigation';
  if (p.includes('contract')) return 'contract';
  if (p.includes('compliance')) return 'compliance';
  if (p.includes('ip ') || p.includes('intellectual')) return 'ip';
  if (p.includes('employment')) return 'employment';
  if (p.includes('governance')) return 'governance';
  if (p.includes('merger') || p.includes('acquisition')) return 'ma';
  if (p.includes('privacy') || p.includes('dpdp')) return 'privacy';
  if (p.includes('risk')) return 'risk';
  if (p.includes('regulator')) return 'regulator';
  if (p.includes('policy')) return 'policy';
  if (p.includes('property') || p.includes('lease')) return 'property';
  return 'contract';
}

function buildIndianIntakeMockJson(prompt: string): Record<string, unknown> {
  const lower = prompt.toLowerCase();
  const isContract = /contract|nda|msa|agreement|vendor/i.test(lower);
  const hasDoc = /FILE:|DOCUMENTS \(|uploaded/i.test(lower);
  const userSaysProceed = /proceed|skip|assume|create task|go ahead|no more info/i.test(lower);

  const missingFields = [];
  if (isContract && !/counterparty|party name|vendor name/i.test(lower)) {
    missingFields.push({
      field: 'counterparty_name',
      label: 'Counterparty legal name',
      reason: 'Required to assess party obligations and indemnity exposure under Indian Contract Act',
      required: true,
    });
  }
  if (isContract && !/value|amount|consideration|inr|₹|crore|lakh/i.test(lower)) {
    missingFields.push({
      field: 'contract_value',
      label: 'Contract value (INR)',
      reason: 'Needed for stamp duty, financial risk, and limitation assessment',
      required: true,
    });
  }
  if (isContract && !/governing|jurisdiction|maharashtra|delhi|bangalore|mumbai/i.test(lower)) {
    missingFields.push({
      field: 'governing_state',
      label: 'Governing law / jurisdiction (Indian state)',
      reason: 'Stamp duty and court jurisdiction vary by Indian state',
      required: false,
    });
  }

  const overallScore = /urgent|critical|indemnity|unlimited liability|crore/i.test(lower) ? 72 : 48;
  const readyToCreate = userSaysProceed || (hasDoc && missingFields.filter((m) => m.required).length === 0);

  return {
    reply: missingFields.length && !userSaysProceed
      ? `I've started an Indian-law review. To complete risk assessment, please share: ${missingFields.map((m) => m.label).join(', ')}. You can also say "proceed with assumptions" to continue.`
      : 'Indian legal analysis complete. Review the risk breakdown, clause highlights, and summary pointers below. Confirm when ready to create the task.',
    title: isContract ? 'Contract Review — Indian Law Assessment' : 'Legal Document Review — India',
    description: 'Comprehensive review of uploaded documents under Indian statutes and standard templates.',
    domain: isContract ? 'CONTRACT_MANAGEMENT' : 'LEGAL_COMPLIANCE',
    priority: overallScore >= 70 ? 'HIGH' : 'NORMAL',
    riskScorePrecise: overallScore,
    riskBreakdown: {
      overallScore,
      rating: overallScore >= 80 ? 'CRITICAL' : overallScore >= 60 ? 'ELEVATED' : overallScore >= 40 ? 'MODERATE' : 'LOW',
      dimensions: {
        contractual: overallScore,
        regulatory: overallScore - 6,
        financial: overallScore - 4,
        litigation: overallScore - 10,
        operational: overallScore - 8,
        dataPrivacy: overallScore - 12,
      },
      rationale: 'Assessment based on Indian Contract Act 1872, stamp duty exposure, and standard Indian commercial template benchmarks.',
      topDrivers: overallScore >= 60
        ? ['Broad indemnity language', 'Stamp duty / registration risk', 'Third-party data processing']
        : ['Standard commercial terms', 'Template deviation review needed'],
    },
    executiveSummary: isContract
      ? 'Preliminary Indian-law review identifies key commercial clauses requiring attention. Main areas: parties & consideration, indemnity, limitation of liability, termination, governing law, and dispute resolution.'
      : 'Document reviewed under Indian regulatory framework with dimensional risk scoring.',
    summaryPointers: isContract
      ? [
          'Parties & recitals — verify correct legal names and capacity under Indian law',
          'Indemnity — check scope, cap, and Carve-outs per Indian Contract Act',
          'Limitation of liability — ensure enforceability; consequential damages exclusion',
          'Termination — notice period, breach triggers, consequences under Indian law',
          'Governing law & dispute resolution — Indian courts or institutional arbitration (A&C Act 1996)',
          'Confidentiality & IP — ownership of work product and DPDP compliance if personal data involved',
          'Payment terms — GST, TDS, and invoicing per Indian tax law',
        ]
      : ['Regulatory compliance review under applicable Indian statutes', 'Template alignment with Indian market standards'],
    clauseHighlights: isContract
      ? [
          { clauseId: 'CL-1', section: 'Indemnity', title: 'Indemnification', summary: 'Review indemnity scope — ensure mutual/indemnity cap aligned with Indian practice.', riskLevel: 'HIGH', indianLawRef: 'Indian Contract Act, 1872 — s.124' },
          { clauseId: 'CL-2', section: 'Dispute Resolution', title: 'Arbitration / Courts', summary: 'Confirm seat in India and institutional rules (e.g., DIAC, MCIA) under A&C Act.', riskLevel: 'MODERATE', indianLawRef: 'Arbitration and Conciliation Act, 1996' },
        ]
      : [],
    visualElements: /chart|graph|sheet|xlsx|excel|pie|bar/i.test(lower)
      ? [{
          type: 'table',
          location: 'Uploaded spreadsheet',
          title: 'Financial / metrics data',
          description: 'Numeric tabular data detected — may represent revenue, liability, or compliance metrics.',
          dataSummary: 'Review embedded tables/charts in source document for material disclosures.',
          legalRelevance: 'Financial charts may affect representation & warranty risk and disclosure obligations under Indian law.',
        }]
      : [],
    indianLawReferences: ['Indian Contract Act, 1872', 'DPDP Act 2023', 'Arbitration and Conciliation Act, 1996'],
    templateNotes: ['Compared against standard Indian commercial contract templates — review governing law and stamp duty clauses.'],
    complianceNotes: ['Verify stamp duty and registration requirements for the relevant Indian state', 'Cross-check DPDP obligations if personal data is processed'],
    riskFlags: overallScore >= 60 ? ['Elevated indemnity exposure', 'Confirm stamp duty compliance'] : ['Routine review recommended'],
    missingFields,
    readyToCreate,
    confidenceScore: 0.79,
  };
}

function buildMessages(request: AICompletionRequest): ChatMessage[] {
  const msgs: ChatMessage[] = [{ role: 'system', content: request.systemPrompt }];
  if (request.messages?.length) {
    for (const m of request.messages) {
      if (m.role !== 'system') msgs.push(m);
    }
  }
  msgs.push({ role: 'user', content: request.userPrompt });
  return msgs;
}

function parseStructuredCompletion(content: string, modelVersion: string, tokenCount: number): AICompletionResponse {
  const parsed = (() => {
    try {
      const m = content.match(/\{[\s\S]*\}/);
      return m ? JSON.parse(m[0]) as Record<string, unknown> : null;
    } catch {
      return null;
    }
  })();

  const overall = Number(
    (parsed?.riskBreakdown as Record<string, unknown>)?.overallScore ??
      parsed?.riskScorePrecise ??
      45
  );

  return {
    content,
    riskScore: legacyScoreFromPrecise(overall),
    ragSources: [
      { title: 'CoSora Legal AI Analysis', docType: 'ai', relevance: 0.95 },
      ...(Array.isArray(parsed?.indianLawReferences)
        ? (parsed.indianLawReferences as string[]).slice(0, 3).map((s) => ({
            title: s,
            docType: 'statute',
            relevance: 0.9,
          }))
        : []),
    ],
    complianceNotes: Array.isArray(parsed?.complianceNotes)
      ? (parsed.complianceNotes as string[])
      : [],
    riskFlags: Array.isArray(parsed?.riskFlags) ? (parsed.riskFlags as string[]) : [],
    recommendedNextStage: 2,
    confidenceScore: Number(parsed?.confidenceScore) || 0.85,
    tokenCount,
    modelVersion,
  };
}

function buildTaskAssistantMockResponse(prompt: string): string {
  const title = prompt.match(/TITLE: (.+)/)?.[1]?.trim() || 'your task';
  const domain = prompt.match(/DOMAIN: (.+)/)?.[1]?.trim() || 'LEGAL';
  const risk = prompt.match(/RISK SCORE: ([\d.]+)/)?.[1] || '—';
  const userMsg =
    prompt.match(/USER MESSAGE: ([\s\S]*?)(?:\nADDITIONAL|$)/)?.[1]?.trim() ||
    prompt.match(/EDITOR INSTRUCTION: ([\s\S]+)/)?.[1]?.trim() ||
    'your question';

  const clauseSection = prompt.includes('CLAUSE HIGHLIGHTS')
    ? prompt.split('CLAUSE HIGHLIGHTS')[1]?.split('RISK FLAGS')[0]?.split('COMPLIANCE')[0]?.trim().slice(0, 800)
    : '';

  const docSnippet = prompt.includes('UPLOADED DOCUMENT')
    ? prompt.split('UPLOADED DOCUMENT')[1]?.split('RECENT AGENT')[0]?.trim().slice(0, 400)
    : '';

  return `I've reviewed **${title}** (${domain.replace(/_/g, ' ')}) with risk score **${risk}/100** under Indian law.

**Your question:** ${userMsg}

**Task-specific guidance:**

${clauseSection ? `Based on the clause highlights loaded for this task:\n${clauseSection.split('\n').slice(0, 5).join('\n')}\n\n` : ''}${docSnippet ? `From the uploaded document context:\n${docSnippet.slice(0, 300)}…\n\n` : ''}**Recommendations (Indian law):**
1. Align indemnity and limitation clauses with Indian Contract Act, 1872 — ensure caps are mutual where appropriate.
2. Confirm governing law is India and dispute resolution specifies Indian courts or institutional arbitration (A&C Act, 1996).
3. Verify stamp duty and registration requirements for the relevant state before execution.
4. If personal data is involved, add DPDP Act 2013/2023 compliant data processing terms.

Tell me which clause you'd like me to rewrite (e.g. indemnity, termination, confidentiality) and I'll provide exact replacement language for this task.`;
}

export class MockAIProvider implements AIProvider {
  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const delay = 600 + Math.random() * 800;
    await new Promise((r) => setTimeout(r, delay));

    const combined = request.systemPrompt + request.userPrompt + (request.messages || []).map((m) => m.content).join('\n');
    const agentType = detectAgentType(combined);
    const wantsJson = request.userPrompt.includes('Respond with JSON') || request.userPrompt.includes('Respond with a JSON');
    const isTaskAssistant =
      request.systemPrompt.includes('CoSora Task Assistant') ||
      request.userPrompt.includes('=== TASK CONTEXT') ||
      request.userPrompt.includes('THIS SPECIFIC TASK');

    if (isTaskAssistant) {
      return {
        content: buildTaskAssistantMockResponse(request.userPrompt),
        riskScore: 3,
        ragSources: [{ title: 'Indian Contract Act, 1872', docType: 'statute', relevance: 0.95 }],
        complianceNotes: ['Task context loaded from CoSora task record'],
        riskFlags: [],
        recommendedNextStage: 3,
        confidenceScore: 0.82,
        tokenCount: 900,
        modelVersion: 'mock-gpt-4o-india-assistant',
      };
    }

    if (wantsJson) {
      const mockJson = buildIndianIntakeMockJson(request.userPrompt + (request.messages || []).map((m) => m.content).join('\n'));
      const overall = Number((mockJson.riskBreakdown as Record<string, unknown>)?.overallScore || 48);
      return {
        content: JSON.stringify(mockJson),
        riskScore: legacyScoreFromPrecise(overall),
        ragSources: [
          { title: 'Indian Contract Act, 1872 — Reference', docType: 'statute', relevance: 0.95 },
          { title: 'DPDP Act 2023 — Compliance Guide', docType: 'regulation', relevance: 0.9 },
        ],
        complianceNotes: ['Mock mode — configure GITHUB_MODELS_TOKEN for live AI'],
        riskFlags: (mockJson.riskFlags as string[]) || [],
        recommendedNextStage: 2,
        confidenceScore: 0.79,
        tokenCount: 1800,
        modelVersion: 'mock-gpt-4o-india',
      };
    }

    const riskScore = Math.floor(Math.random() * 5) + 1;
    return {
      content: MOCK_DRAFTS[agentType] || MOCK_DRAFTS.contract,
      riskScore,
      ragSources: [
        { title: 'Indian Contract Act, 1872', docType: 'statute', relevance: 0.92 },
        { title: 'Internal Indian Precedent Template', docType: 'template', relevance: 0.87 },
      ],
      complianceNotes: ['Review under Indian regulatory framework'],
      riskFlags: riskScore >= 4 ? ['High-value transaction'] : [],
      recommendedNextStage: 3,
      confidenceScore: 0.78,
      tokenCount: 1000,
      modelVersion: 'mock-gpt-4o-india',
    };
  }
}

export class GitHubModelsAIProvider implements AIProvider {
  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const token = config.githubModels.token;
    const model = config.githubModels.model;

    if (!token) {
      return new MockAIProvider().complete(request);
    }

    const messages = buildMessages(request);

    const response = await fetch(config.githubModels.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': config.githubModels.apiVersion,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: request.maxTokens || 4000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(
        `GitHub Models API error ${response.status}: ${response.statusText}${errBody ? ` — ${errBody.slice(0, 200)}` : ''}`
      );
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage?: { total_tokens: number };
    };

    const content = data.choices[0]?.message?.content || '';
    return parseStructuredCompletion(
      content,
      model,
      data.usage?.total_tokens || 1500
    );
  }
}

export class AzureAIProvider implements AIProvider {
  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const key = process.env.AZURE_OPENAI_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o';

    if (!endpoint || !key) {
      return new MockAIProvider().complete(request);
    }

    const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`;
    const messages = buildMessages(request);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': key,
      },
      body: JSON.stringify({
        messages,
        max_tokens: request.maxTokens || 4000,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      throw new Error(`Azure OpenAI error: ${response.statusText}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
      usage?: { total_tokens: number };
    };

    const content = data.choices[0]?.message?.content || '';
    return parseStructuredCompletion(
      content,
      deployment,
      data.usage?.total_tokens || 1500
    );
  }
}

export function isGitHubModelsConfigured(): boolean {
  return !!config.githubModels.token;
}

export function getAIProvider(): AIProvider {
  if (isGitHubModelsConfigured()) {
    return new GitHubModelsAIProvider();
  }
  if (process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_KEY) {
    return new AzureAIProvider();
  }
  return new MockAIProvider();
}

export function getProviderLabel(): string {
  if (isGitHubModelsConfigured()) {
    const bing = process.env.AZURE_BING_SEARCH_KEY ? ' + Web Research' : '';
    return `Microsoft Azure AI (${config.githubModels.model})${bing} — India`;
  }
  if (process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_KEY) {
    const bing = process.env.AZURE_BING_SEARCH_KEY ? ' + Bing Web Research' : '';
    return `Microsoft Azure OpenAI (${process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o'})${bing} — India`;
  }
  return 'CoSora Mock AI — India (configure GITHUB_MODELS_TOKEN for live AI)';
}

export function isAzureConfigured(): boolean {
  return isGitHubModelsConfigured() ||
    !!(process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_KEY);
}
