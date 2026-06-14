import { config } from '../config';

export interface LegalResearchSnippet {
  title: string;
  snippet: string;
  source: string;
  url?: string;
}

const INDIAN_LAW_BASELINE = [
  'Indian Contract Act, 1872 — offer, acceptance, consideration, breach, indemnity',
  'Companies Act, 2013 — board resolutions, related party transactions, CSR',
  'DPDP Act, 2023 — personal data processing, consent, cross-border transfer',
  'Arbitration and Conciliation Act, 1996 — dispute resolution clauses',
  'Consumer Protection Act, 2019 — unfair contracts, liability',
  'Indian Stamp Act / state stamp laws — enforceability of unstamped instruments',
  'SEBI ICDR Regulations — listed entity disclosures and agreements',
  'RBI Master Directions — lending, FEMA compliance for foreign exchange',
  'Industrial Disputes Act, 1947 & labour codes — employment contracts',
  'Transfer of Property Act, 1882 — lease and property agreements',
  'Information Technology Act, 2000 — electronic records, digital signatures',
];

const INDIAN_TEMPLATE_NOTES: Record<string, string[]> = {
  contract: [
    'Indian MSAs typically include governing law (Indian), jurisdiction (courts/arbitration seat in India), stamp duty, GST, TDS, limitation period, and force majeure aligned with Indian standards.',
    'NDAs in India often reference confidentiality term, return/destruction, permitted disclosures under law, and DPDP obligations for personal data.',
  ],
  employment: [
    'Indian employment agreements reference notice period, non-compete (enforceability limits), POSH compliance, gratuity/bonus applicability, and state-specific shops & establishment rules.',
  ],
  privacy: [
    'DPDP-compliant DPAs include purpose limitation, data principal rights, grievance officer, cross-border transfer safeguards, and breach notification timelines.',
  ],
  property: [
    'Indian commercial leases specify lock-in, escalation, security deposit, registration/stamp duty, maintenance CAM charges, and leave & license vs lease distinction.',
  ],
};

function detectDocCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/employment|employee|labour|labor|offer letter/i.test(lower)) return 'employment';
  if (/dpdp|privacy|data protection|personal data/i.test(lower)) return 'privacy';
  if (/lease|rent|property|leave and license/i.test(lower)) return 'property';
  return 'contract';
}

async function searchBing(query: string): Promise<LegalResearchSnippet[]> {
  const key = process.env.AZURE_BING_SEARCH_KEY;
  const endpoint = process.env.AZURE_BING_SEARCH_ENDPOINT || 'https://api.bing.microsoft.com/v7.0/search';

  if (!key) return [];

  try {
    const url = `${endpoint}?q=${encodeURIComponent(query)}&count=5&mkt=en-IN`;
    const res = await fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': key } });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      webPages?: { value?: Array<{ name: string; snippet: string; url: string }> };
    };

    return (data.webPages?.value || []).map((r) => ({
      title: r.name,
      snippet: r.snippet,
      source: 'Bing Web Search (India)',
      url: r.url,
    }));
  } catch {
    return [];
  }
}

export async function fetchIndianLegalContext(input: {
  domain?: string;
  documentText?: string;
  instructions?: string;
}): Promise<{
  statutes: string[];
  templateNotes: string[];
  researchSnippets: LegalResearchSnippet[];
  webResearchUsed: boolean;
  promptBlock: string;
}> {
  const combined = `${input.instructions || ''}\n${input.documentText || ''}`.slice(0, 4000);
  const category = detectDocCategory(combined);
  const templateNotes = INDIAN_TEMPLATE_NOTES[category] || INDIAN_TEMPLATE_NOTES.contract;

  const queries = [
    `India ${input.domain || 'contract'} law latest amendments 2024 2025`,
    `India ${category} agreement standard clauses legal requirements`,
    'India DPDP Act 2023 compliance legal contracts',
  ];

  let researchSnippets: LegalResearchSnippet[] = [];
  if (config.azure.endpoint && process.env.AZURE_BING_SEARCH_KEY) {
    for (const q of queries.slice(0, 2)) {
      const results = await searchBing(q);
      researchSnippets = [...researchSnippets, ...results];
    }
  }

  const webResearchUsed = researchSnippets.length > 0;

  const researchBlock = researchSnippets.length
    ? researchSnippets.map((r) => `• ${r.title}: ${r.snippet}${r.url ? ` (${r.url})` : ''}`).join('\n')
    : 'Use your knowledge of current Indian statutes, RBI/SEBI circulars, and standard Indian legal templates.';

  const promptBlock = `JURISDICTION: India ONLY. All analysis must reference Indian law, Indian courts, Indian regulatory bodies (RBI, SEBI, MCA, CCI), and Indian contract templates.

BASELINE INDIAN STATUTES:
${INDIAN_LAW_BASELINE.map((s) => `• ${s}`).join('\n')}

INDIAN TEMPLATE STANDARDS (${category}):
${templateNotes.map((n) => `• ${n}`).join('\n')}

LIVE WEB RESEARCH (use to stay current on laws/policies):
${researchBlock}`;

  return {
    statutes: INDIAN_LAW_BASELINE,
    templateNotes,
    researchSnippets,
    webResearchUsed,
    promptBlock,
  };
}

export const INDIAN_INTAKE_SYSTEM_PROMPT = `You are CoSora — India's enterprise legal AI assistant (Cornellia Sorabji lineage), powered by Microsoft Azure AI.

SCOPE: Indian market ONLY. Apply Indian Contract Act 1872, Companies Act 2013, DPDP Act 2023, labour codes, SEBI/RBI regulations, stamp duty, GST, arbitration under A&C Act 1996, and sector-specific Indian law.

BEHAVIOUR:
1. Conduct precise risk assessment on 0-100 scale with dimensional breakdown — NOT a vague 1-5 rating.
2. For contracts: highlight MAIN CLAUSES (parties, consideration, indemnity, limitation of liability, termination, governing law, dispute resolution, confidentiality, IP, payment/GST, force majeure) in summaryPointers and clauseHighlights.
3. If documents contain charts, pie charts, graphs, tables, or diagrams — describe each EXPLICITLY in visualElements with dataSummary and legalRelevance.
4. Compare document structure against standard Indian templates and note deviations in templateNotes.
5. In interactive intake: if critical facts are missing (counterparty name, contract value, governing state, effective date, stamp duty status, data involved, etc.) — list them in missingFields and ask the user conversationally. Do NOT set readyToCreate true until essentials are gathered OR user explicitly says to proceed with assumptions.
6. Use provided web research to reflect current Indian law and policy updates.
7. Output valid JSON only when requested — no markdown fences.`;

export const TASK_ASSISTANT_SYSTEM_PROMPT = `You are CoSora Task Assistant for Indian legal workflows. Help Editors and Admins refine drafts, suggest clause changes per Indian law, answer questions about the task document, and incorporate user instructions into actionable legal edits.

Always cite relevant Indian statutes when recommending changes. Be concise and practical. If suggesting document edits, show the exact clause language to add/change.`;
