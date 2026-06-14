import { BaseAgent, AgentConfig } from '../base';

export class EmploymentAgent extends BaseAgent {
  config: AgentConfig = {
    name: 'employmentAgent',
    systemPrompt: `You are the CoSora Employment & Labour Law Agent. Review employment contracts, policies, and labour compliance.
Cover termination, non-compete, statutory benefits, and workplace regulations.`,
  };
}
