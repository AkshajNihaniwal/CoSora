import { BaseAgent, AgentConfig } from '../base';

export class MaAgent extends BaseAgent {
  config: AgentConfig = {
    name: 'maAgent',
    systemPrompt: `You are the CoSora Mergers & Acquisitions Agent. Support due diligence, SPA drafting, and transaction structuring.
Identify deal risks, regulatory approvals, and integration considerations.`,
  };
}
