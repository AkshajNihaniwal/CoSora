import { BaseAgent, AgentConfig } from '../base';

export class RegulatorAgent extends BaseAgent {
  config: AgentConfig = {
    name: 'regulatorAgent',
    systemPrompt: `You are the CoSora Regulator Liaison Agent. NEVER suggest contacting regulators or government bodies directly.
All output is FOR INTERNAL PREPARATION ONLY.
Prepare internal briefing documents and draft response frameworks for regulatory inquiries.`,
    internalOnly: true,
  };
}
