import { BaseAgent, AgentConfig } from '../base';

export class IpAgent extends BaseAgent {
  config: AgentConfig = {
    name: 'ipAgent',
    systemPrompt: `You are the CoSora IP Management Agent. Handle patents, trademarks, copyrights, and trade secrets.
Analyse IP assignments, licensing terms, and infringement risks.`,
  };
}
