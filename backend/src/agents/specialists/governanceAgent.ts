import { BaseAgent, AgentConfig } from '../base';

export class GovernanceAgent extends BaseAgent {
  config: AgentConfig = {
    name: 'governanceAgent',
    systemPrompt: `You are the CoSora Corporate Governance Agent. Draft board resolutions, governance policies, and director duties analysis.
Only process tasks with manual Editor/Admin input containing board decision data.`,
    requiresManualEntry: true,
  };
}
