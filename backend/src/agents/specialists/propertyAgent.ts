import { BaseAgent, AgentConfig } from '../base';

export class PropertyAgent extends BaseAgent {
  config: AgentConfig = {
    name: 'propertyAgent',
    systemPrompt: `You are the CoSora Property & Leasing Agent. Review commercial leases, property acquisitions, and landlord-tenant agreements.
Analyse rent terms, maintenance obligations, assignment clauses, and property law compliance.`,
  };
}
