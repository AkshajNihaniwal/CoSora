import { PrismaClient, LegalDomain, TaskStatus, UserRole, Priority, AuditEventType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateHexUserId } from '../utils/hexId';
import { sha256 } from '../utils/hash';
import { seedDocument } from '../services/documentService';
import { getDraftForTask, AGENT_FOR_DOMAIN } from './seedDrafts';

const prisma = new PrismaClient();
const PASSWORD = 'CoSora2024!';

async function createUser(
  name: string,
  role: UserRole,
  domainScope: LegalDomain[],
  createdBy?: string
) {
  let userId = generateHexUserId();
  while (await prisma.user.findUnique({ where: { userId } })) {
    userId = generateHexUserId();
  }

  const password = await bcrypt.hash(PASSWORD, 12);
  const user = await prisma.user.create({
    data: { userId, name, password, role, domainScope, createdBy },
  });
  console.log(`  ${role} ${name}: ${userId}`);
  return user;
}

async function seedAuditEntry(
  eventType: AuditEventType,
  description: string,
  taskId?: string,
  actorId?: string,
  prevHash?: string | null
) {
  const metadata = { seeded: true };
  const content = JSON.stringify({
    eventType,
    description,
    metadata,
    prevHash: prevHash ?? null,
    createdAt: new Date().toISOString(),
  });
  const entryHash = sha256(content);

  return prisma.auditLog.create({
    data: {
      eventType,
      taskId,
      actorId,
      description,
      metadata,
      prevHash: prevHash ?? null,
      entryHash,
    },
  });
}

async function main() {
  console.log('Seeding CoSora database...\n');

  // Temporarily disable audit immutability triggers for clean re-seed
  await prisma.$executeRawUnsafe('ALTER TABLE "AuditLog" DISABLE TRIGGER audit_log_no_delete');
  await prisma.$executeRawUnsafe('ALTER TABLE "AuditLog" DISABLE TRIGGER audit_log_no_update');

  await prisma.notification.deleteMany();
  await prisma.roleChangeApproval.deleteMany();
  await prisma.roleChangeRequest.deleteMany();
  await prisma.crossDeptApproval.deleteMany();
  await prisma.emailEvent.deleteMany();
  await prisma.agentLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.document.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.task.deleteMany();
  await prisma.knowledgeBase.deleteMany();
  await prisma.systemConfig.deleteMany();
  await prisma.user.deleteMany();

  console.log('Creating users:');
  const gc = await createUser('General Counsel', UserRole.ADMIN, Object.values(LegalDomain));
  await createUser('Head of Legal', UserRole.ADMIN, Object.values(LegalDomain), gc.id);
  await createUser('Managing Partner', UserRole.ADMIN, Object.values(LegalDomain), gc.id);

  await createUser('Contract Editor', UserRole.EDITOR, [LegalDomain.CONTRACT_MANAGEMENT, LegalDomain.LEGAL_COMPLIANCE]);
  await createUser('Employment Editor', UserRole.EDITOR, [LegalDomain.EMPLOYMENT_LABOUR, LegalDomain.CORPORATE_GOVERNANCE]);
  await createUser('IP Editor', UserRole.EDITOR, [LegalDomain.IP_MANAGEMENT, LegalDomain.MERGERS_ACQUISITIONS]);
  await createUser('Privacy Editor', UserRole.EDITOR, [LegalDomain.DATA_PRIVACY, LegalDomain.RISK_MANAGEMENT]);
  await createUser('Regulator Editor', UserRole.EDITOR, [LegalDomain.REGULATOR_LIAISON, LegalDomain.POLICY_DRAFTING]);
  await createUser('Property Editor', UserRole.EDITOR, [LegalDomain.PROPERTY_LEASING, LegalDomain.LITIGATION]);

  await createUser('Finance Head', UserRole.REVIEWER, [LegalDomain.CONTRACT_MANAGEMENT, LegalDomain.MERGERS_ACQUISITIONS]);
  await createUser('HR Head', UserRole.REVIEWER, [LegalDomain.EMPLOYMENT_LABOUR, LegalDomain.POLICY_DRAFTING]);
  await createUser('Compliance Officer', UserRole.REVIEWER, [LegalDomain.LEGAL_COMPLIANCE, LegalDomain.DATA_PRIVACY]);

  const editors = await prisma.user.findMany({ where: { role: UserRole.EDITOR } });

  console.log('\nCreating knowledge base entries...');
  for (const domain of Object.values(LegalDomain)) {
    for (let i = 1; i <= 3; i++) {
      await prisma.knowledgeBase.create({
        data: {
          domain,
          title: `${domain.replace(/_/g, ' ')} Reference ${i}`,
          content: `Sample legal reference content for ${domain}. This document covers key statutes, internal policies, and precedents relevant to ${domain.replace(/_/g, ' ').toLowerCase()} matters.`,
          docType: i === 1 ? 'statute' : i === 2 ? 'template' : 'precedent',
          jurisdiction: 'India',
          tags: [domain.toLowerCase(), 'reference', `v${i}`],
          version: '1.0',
        },
      });
    }
  }

  console.log('\nCreating sample tasks...');
  const taskConfigs = [
    { title: 'Vendor MSA Review', domain: LegalDomain.CONTRACT_MANAGEMENT, stage: 3, status: TaskStatus.AWAITING_HITL, risk: 3, priority: Priority.HIGH },
    { title: 'GDPR Compliance Audit', domain: LegalDomain.DATA_PRIVACY, stage: 2, status: TaskStatus.IN_PROGRESS, risk: 4, priority: Priority.NORMAL },
    { title: 'Employment Termination', domain: LegalDomain.EMPLOYMENT_LABOUR, stage: 6, status: TaskStatus.AWAITING_HITL, risk: 5, priority: Priority.CRITICAL },
    { title: 'Patent Filing Review', domain: LegalDomain.IP_MANAGEMENT, stage: 1, status: TaskStatus.IN_PROGRESS, risk: 2, priority: Priority.NORMAL },
    { title: 'Board Resolution Draft', domain: LegalDomain.CORPORATE_GOVERNANCE, stage: 2, status: TaskStatus.IN_PROGRESS, risk: 3, priority: Priority.NORMAL, manualEntry: true },
    { title: 'Acquisition Due Diligence', domain: LegalDomain.MERGERS_ACQUISITIONS, stage: 4, status: TaskStatus.IN_PROGRESS, risk: 5, priority: Priority.URGENT },
    { title: 'Regulatory Inquiry Response', domain: LegalDomain.REGULATOR_LIAISON, stage: 3, status: TaskStatus.AWAITING_HITL, risk: 5, priority: Priority.CRITICAL },
    { title: 'Office Lease Renewal', domain: LegalDomain.PROPERTY_LEASING, stage: 5, status: TaskStatus.IN_PROGRESS, risk: 2, priority: Priority.LOW },
    { title: 'Litigation Strategy Memo', domain: LegalDomain.LITIGATION, stage: 2, status: TaskStatus.ESCALATED, risk: 4, priority: Priority.URGENT },
    { title: 'Anti-Bribery Policy Update', domain: LegalDomain.POLICY_DRAFTING, stage: 7, status: TaskStatus.AWAITING_HITL, risk: 3, priority: Priority.HIGH },
  ];

  const tasks = [];
  for (let i = 0; i < taskConfigs.length; i++) {
    const cfg = taskConfigs[i];
    const editor = editors[i % editors.length];
    const slaDeadline = new Date(Date.now() + (cfg.risk >= 4 ? 4 : 24) * 60 * 60 * 1000);

    const task = await prisma.task.create({
      data: {
        title: cfg.title,
        description: `Sample task: ${cfg.title}. Requires legal review and approval through the CoSora L0-L9 pipeline.`,
        domain: cfg.domain,
        currentStage: cfg.stage,
        riskScore: cfg.risk,
        status: cfg.status,
        priority: cfg.priority,
        assignedToId: editor.id,
        slaDeadline,
        manualEntry: (cfg as { manualEntry?: boolean }).manualEntry ?? false,
      },
    });
    tasks.push(task);
  }

  console.log('\nCreating AI-generated documents and agent logs...');
  const contractEditor = editors.find((e) => e.name === 'Contract Editor') || editors[0];
  for (const task of tasks) {
    const draft = getDraftForTask(task.title, task.domain);
    const agentName = AGENT_FOR_DOMAIN[task.domain] || 'contractAgent';
    const filename = `${task.title.replace(/\s+/g, '_')}_Draft_v1.txt`;

    await seedDocument({
      taskId: task.id,
      filename,
      content: draft,
      uploadedBy: contractEditor.userId,
      notes: `Auto-generated by ${agentName} at L2`,
    });

    await prisma.agentLog.create({
      data: {
        taskId: task.id,
        agentName,
        stage: Math.max(2, task.currentStage - 1),
        action: `Generated draft document for "${task.title}"`,
        modelVersion: 'mock-gpt-4o',
        confidenceScore: 0.82 + Math.random() * 0.1,
        tokenCount: 1200 + Math.floor(Math.random() * 800),
        durationMs: 900 + Math.floor(Math.random() * 1100),
        ragSources: [
          { title: 'Internal Policy Manual v3.2', docType: 'policy', relevance: 0.91 },
          { title: 'Precedent Template 2024', docType: 'template', relevance: 0.86 },
        ],
      },
    });
  }

  console.log('\nCreating audit log entries...');
  let prevHash: string | null = null;
  for (const task of tasks.slice(0, 5)) {
    const entry = await seedAuditEntry(
      AuditEventType.TASK_CREATED,
      `Task created: ${task.title}`,
      task.id,
      gc.id,
      prevHash
    );
    prevHash = entry.entryHash;
  }

  console.log('\nSeed complete!');
  console.log(`Default password for all users: ${PASSWORD}`);

  await prisma.$executeRawUnsafe('ALTER TABLE "AuditLog" ENABLE TRIGGER audit_log_no_delete');
  await prisma.$executeRawUnsafe('ALTER TABLE "AuditLog" ENABLE TRIGGER audit_log_no_update');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
