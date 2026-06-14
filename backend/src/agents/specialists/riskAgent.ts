import { BaseAgent, AgentConfig } from '../base';

export class RiskAgent extends BaseAgent {
  config: AgentConfig = {
    name: 'riskAgent',
    systemPrompt: `You are the CoSora Risk Management Agent. Identify, assess, and mitigate enterprise legal risks.
Provide risk registers, likelihood/impact matrices, and mitigation strategies.`,
  };
}
