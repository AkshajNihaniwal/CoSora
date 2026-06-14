import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret-min-32-chars-long',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-min-32-chars',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  azure: {
    endpoint: process.env.AZURE_OPENAI_ENDPOINT || '',
    key: process.env.AZURE_OPENAI_KEY || '',
    deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o',
  },
  githubModels: {
    token: process.env.GITHUB_MODELS_TOKEN || process.env.GITHUB_TOKEN || '',
    model: process.env.GITHUB_MODELS_MODEL || 'openai/gpt-4o',
    endpoint:
      process.env.GITHUB_MODELS_ENDPOINT ||
      'https://models.github.ai/inference/chat/completions',
    apiVersion: process.env.GITHUB_MODELS_API_VERSION || '2022-11-28',
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'cosora@yourdomain.com',
    internalDomain: process.env.INTERNAL_EMAIL_DOMAIN || 'yourdomain.com',
  },
  storage: {
    provider: (process.env.STORAGE_PROVIDER || 'local') as 'local' | 'azure',
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    azureConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
    azureContainer: process.env.AZURE_STORAGE_CONTAINER || 'cosora-documents',
  },
  upload: {
    maxFileSizeMb: parseInt(process.env.MAX_UPLOAD_FILE_SIZE_MB || '500', 10),
    maxFilesPerRequest: parseInt(process.env.MAX_UPLOAD_FILES || '10', 10),
    maxExtractChars: parseInt(process.env.MAX_EXTRACT_CHARS || '150000', 10),
    get maxFileSizeBytes() {
      return this.maxFileSizeMb * 1024 * 1024;
    },
  },
};

export const HITL_STAGES = [3, 6, 7, 8] as const;

export const STAGE_LABELS: Record<number, string> = {
  0: 'L0 Intake',
  1: 'L1 Classification',
  2: 'L2 AI Draft',
  3: 'L3 Editor Review',
  4: 'L4 Compliance Check',
  5: 'L5 Risk Assessment',
  6: 'L6 Admin Approval',
  7: 'L7 Legal Sign-off',
  8: 'L8 Execution',
  9: 'L9 Monitoring',
};

export const SLA_HOURS: Record<number, number> = {
  1: 24,
  2: 24,
  3: 24,
  4: 8,
  5: 4,
};

export function computeSlaDeadline(riskScore: number): Date {
  const hours = SLA_HOURS[riskScore] || 24;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export const AGENT_DOMAIN_MAP: Record<string, string> = {
  CONTRACT_MANAGEMENT: 'contractAgent',
  LEGAL_COMPLIANCE: 'complianceAgent',
  LITIGATION: 'litigationAgent',
  IP_MANAGEMENT: 'ipAgent',
  EMPLOYMENT_LABOUR: 'employmentAgent',
  CORPORATE_GOVERNANCE: 'governanceAgent',
  MERGERS_ACQUISITIONS: 'maAgent',
  DATA_PRIVACY: 'privacyAgent',
  RISK_MANAGEMENT: 'riskAgent',
  REGULATOR_LIAISON: 'regulatorAgent',
  POLICY_DRAFTING: 'policyAgent',
  PROPERTY_LEASING: 'propertyAgent',
};
