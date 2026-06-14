import nodemailer from 'nodemailer';
import prisma from '../lib/prisma';
import { config } from '../config';
import { EmailClassification, EmailDirection, Prisma, UserRole } from '@prisma/client';
import { writeAuditLog } from './auditService';
import { createNotification } from './notificationService';
import { emitToAdmins } from '../socket';

let transporter: nodemailer.Transporter | null = null;

async function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: false,
    auth: config.email.user
      ? { user: config.email.user, pass: config.email.pass }
      : undefined,
  });

  return transporter;
}

export function classifyEmail(subject: string, senderDomain: string): EmailClassification {
  const sub = subject.toLowerCase();
  const domain = senderDomain.toLowerCase();

  if (sub.includes('court') || sub.includes('litigation') || sub.includes('subpoena')) {
    return EmailClassification.COURT_LITIGATION;
  }
  if (sub.includes('regulatory') || sub.includes('government') || sub.includes('sec ') || domain.includes('gov')) {
    return EmailClassification.REGULATORY_GOVERNMENT;
  }
  if (sub.includes('contract') || sub.includes('agreement') || sub.includes('nda')) {
    return EmailClassification.COUNTERPARTY_CONTRACT;
  }
  if (domain.includes(config.email.internalDomain)) {
    if (sub.includes('finance') || sub.includes('hr') || sub.includes('it')) {
      return EmailClassification.CROSS_DEPT_INTERNAL;
    }
    return EmailClassification.INTERNAL_LEGAL_REQUEST;
  }
  if (sub.includes('spam') || sub.includes('unsubscribe')) {
    return EmailClassification.SPAM_IRRELEVANT;
  }
  return EmailClassification.INTERNAL_LEGAL_REQUEST;
}

export async function processInboundEmail(input: {
  senderEmail: string;
  subject: string;
  rawHeaders?: Record<string, unknown>;
  taskId?: string;
}) {
  const senderDomain = input.senderEmail.split('@')[1] || 'unknown';
  const classification = classifyEmail(input.subject, senderDomain);
  const urgency =
    classification === EmailClassification.REGULATORY_GOVERNMENT ||
    classification === EmailClassification.COURT_LITIGATION
      ? 5
      : 3;

  const event = await prisma.emailEvent.create({
    data: {
      taskId: input.taskId,
      direction: EmailDirection.INBOUND,
      senderEmail: input.senderEmail,
      senderDomain,
      subject: input.subject,
      classification,
      urgency,
      adminNotified: false,
      autoReplied: false,
      rawHeaders: (input.rawHeaders ?? {}) as Prisma.InputJsonValue,
    },
  });

  await writeAuditLog({
    eventType: 'EMAIL_RECEIVED',
    taskId: input.taskId,
    description: `Inbound email from ${input.senderEmail}: ${input.subject}`,
    metadata: { emailEventId: event.id, classification },
  });

  await writeAuditLog({
    eventType: 'EMAIL_CLASSIFIED',
    taskId: input.taskId,
    description: `Email classified as ${classification}`,
    metadata: { emailEventId: event.id, classification, urgency },
  });

  if (
    classification === EmailClassification.REGULATORY_GOVERNMENT ||
    classification === EmailClassification.COURT_LITIGATION
  ) {
    await prisma.emailEvent.update({
      where: { id: event.id },
      data: { adminNotified: true },
    });

    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN, isActive: true },
    });

    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        title: 'Urgent: Regulatory/Court Email',
        message: `${input.senderEmail} — ${input.subject}`,
        type: 'URGENT_EMAIL',
        taskId: input.taskId,
      });
    }

    await writeAuditLog({
      eventType: 'EMAIL_ADMIN_NOTIFIED',
      description: `Admin notified for ${classification} email`,
      metadata: { emailEventId: event.id },
    });

    emitToAdmins('email:urgent', {
      sender: input.senderEmail,
      subject: input.subject,
      classification,
    });
  }

  return event;
}

export async function sendInternalEmail(input: {
  toEmail: string;
  subject: string;
  body: string;
  actorId?: string;
}) {
  const recipientExists = await prisma.user.findFirst({
    where: { isActive: true },
  });

  const domain = input.toEmail.split('@')[1]?.toLowerCase();
  if (domain !== config.email.internalDomain.toLowerCase()) {
    throw new Error('Outbound email restricted to internal domain addresses only');
  }

  if (!recipientExists) {
    throw new Error('No internal users found');
  }

  const transport = await getTransporter();
  await transport.sendMail({
    from: config.email.from,
    to: input.toEmail,
    subject: input.subject,
    text: input.body,
  });

  await prisma.emailEvent.create({
    data: {
      direction: EmailDirection.OUTBOUND_INTERNAL,
      senderEmail: config.email.from,
      senderDomain: config.email.internalDomain,
      subject: input.subject,
      classification: EmailClassification.INTERNAL_LEGAL_REQUEST,
      autoReplied: false,
    },
  });

  await writeAuditLog({
    eventType: 'EMAIL_RECEIVED',
    actorId: input.actorId,
    description: `Internal email sent to ${input.toEmail}`,
    metadata: { subject: input.subject, direction: 'OUTBOUND_INTERNAL' },
  });
}

export async function sendCrossDeptTokenEmail(input: {
  taskId: string;
  department: string;
  approverEmail: string;
  approverName: string;
  token: string;
  expiresAt: Date;
}) {
  const link = `${config.frontendUrl}/cross-dept/${input.token}`;
  const transport = await getTransporter();

  await transport.sendMail({
    from: config.email.from,
    to: input.approverEmail,
    subject: `[CoSora] Cross-department approval required — ${input.department}`,
    text: `Dear ${input.approverName},\n\nA cross-department approval is required.\n\nUse this secure link (expires ${input.expiresAt.toISOString()}):\n${link}\n\nCoSora Legal Platform`,
  });

  await writeAuditLog({
    eventType: 'CROSS_DEPT_REQUESTED',
    taskId: input.taskId,
    description: `Cross-dept token sent to ${input.approverEmail}`,
    metadata: { department: input.department, approverEmail: input.approverEmail },
  });
}
