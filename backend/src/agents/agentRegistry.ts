import { BaseAgent } from './base';
import { ContractAgent } from './specialists/contractAgent';
import { ComplianceAgent } from './specialists/complianceAgent';
import { LitigationAgent } from './specialists/litigationAgent';
import { IpAgent } from './specialists/ipAgent';
import { EmploymentAgent } from './specialists/employmentAgent';
import { GovernanceAgent } from './specialists/governanceAgent';
import { MaAgent } from './specialists/maAgent';
import { PrivacyAgent } from './specialists/privacyAgent';
import { RiskAgent } from './specialists/riskAgent';
import { RegulatorAgent } from './specialists/regulatorAgent';
import { PolicyAgent } from './specialists/policyAgent';
import { PropertyAgent } from './specialists/propertyAgent';

const agents: Record<string, BaseAgent> = {
  contractAgent: new ContractAgent(),
  complianceAgent: new ComplianceAgent(),
  litigationAgent: new LitigationAgent(),
  ipAgent: new IpAgent(),
  employmentAgent: new EmploymentAgent(),
  governanceAgent: new GovernanceAgent(),
  maAgent: new MaAgent(),
  privacyAgent: new PrivacyAgent(),
  riskAgent: new RiskAgent(),
  regulatorAgent: new RegulatorAgent(),
  policyAgent: new PolicyAgent(),
  propertyAgent: new PropertyAgent(),
};

export function createAgent(name: string): BaseAgent {
  const agent = agents[name];
  if (!agent) throw new Error(`Unknown agent: ${name}`);
  return agent;
}

export function listAgentNames(): string[] {
  return Object.keys(agents);
}
