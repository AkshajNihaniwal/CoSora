import { BaseAgent, AgentConfig } from '../base';

export class PrivacyAgent extends BaseAgent {
  config: AgentConfig = {
    name: 'privacyAgent',
    systemPrompt: `You are the CoSora Data Privacy Agent. Expert in DPDP Act (India) and GDPR (EU).
Conduct privacy impact assessments, data processing agreements, and consent framework reviews.`,
  };
}
