import { Lead, OutreachChannel } from '../leads/types';
import {
  ContactReviewChannel,
  ContactReviewRecord,
  ContactReviewReportInput,
  ContactReviewUpdateInput,
  ContactStatus,
  MessageStatus,
  contactReviewChannelOptions,
  contactStatusOptions,
  messageStatusOptions,
} from './types';

const targetContactRoles = [
  'Head of Engineering',
  'VP Engineering',
  'CTO',
  'QA Manager',
  'Product Manager',
  'Founder',
  'Operations Lead',
];

export function createInitialContactReview(lead: Lead, now = new Date().toISOString()): ContactReviewRecord {
  return {
    leadId: lead.id,
    companyName: lead.companyName,
    website: lead.website,
    contactName: '',
    contactRole: '',
    contactUrl: '',
    channel: toContactReviewChannel(lead.outreachChannel),
    contactStatus: 'not-researched',
    messageStatus: 'not-prepared',
    lastContactedAt: '',
    nextFollowUpDate: '',
    notes: '',
    createdAt: now,
    updatedAt: now,
  };
}

export function applyContactReviewUpdate(
  existing: ContactReviewRecord,
  update: ContactReviewUpdateInput,
  now = new Date().toISOString(),
): ContactReviewRecord {
  return {
    ...existing,
    ...definedOnly(update),
    updatedAt: now,
  };
}

export function renderContactReviewReport(input: ContactReviewReportInput): string {
  const { record, sources } = input;

  return `# Contact Review: ${record.companyName}

## Lead Summary

${bullets([
    `Lead ID: ${record.leadId}`,
    `Company: ${record.companyName}`,
    `Website: ${record.website || 'Not provided'}`,
    `Preferred manual channel: ${record.channel}`,
  ])}

## Contact Research Status

${bullets([
    `Contact status: ${record.contactStatus}`,
    `Message status: ${record.messageStatus}`,
    `Last contacted: ${record.lastContactedAt || 'Not contacted'}`,
    `Next follow-up date: ${record.nextFollowUpDate || 'Not set'}`,
  ])}

## Target Contact Roles

${bullets(targetContactRoles)}

## Current Contact Record

${bullets([
    `Contact name: ${record.contactName || 'Not recorded. Do not invent a name.'}`,
    `Contact role: ${record.contactRole || 'Not recorded. Use only manually verified role data.'}`,
    `Contact URL: ${record.contactUrl || 'Not recorded. Use only manually found public URLs.'}`,
    `Notes: ${record.notes || 'No notes recorded.'}`,
  ])}

## Outreach Assets Available

${bullets([
    `Outreach pack: ${sources.outreachPackExists ? sources.outreachPackPath : `missing at ${sources.outreachPackPath}`}`,
    `Audit pack: ${sources.auditPackExists ? sources.auditPackPath : `missing at ${sources.auditPackPath}`}`,
  ])}

## Manual Approval Checklist

${checklist([
    'Contact found through public manual research',
    'Contact name verified',
    'Role verified',
    'Company verified',
    'Message reviewed',
    'No unsupported claims',
    'No fake metrics',
    'No automated sending',
    'Follow-up date chosen manually',
  ])}

## Follow-Up Plan

${bullets(buildFollowUpPlan(record))}

## Recommended Next Action

${bullets([recommendNextAction(record, sources)])}

## Safety Rules

${bullets([
    'Manual contact research only.',
    'Do not scrape, browse automatically, call APIs, use credentials, enrich private data, or connect a CRM.',
    'Do not send emails, LinkedIn messages, contact-form messages, or follow-ups from this command.',
    'Do not invent contact names, roles, URLs, audit findings, metrics, or personalization.',
    'Daniel must approve the contact, message, channel, and follow-up plan before outreach.',
  ])}
`;
}

export function mapStatusUpdate(status: string): Pick<ContactReviewUpdateInput, 'contactStatus' | 'messageStatus'> {
  if (isContactStatus(status)) return { contactStatus: status };
  if (isMessageStatus(status)) return { messageStatus: status };

  const alias = statusAliases[status];
  if (alias) return alias;

  throw new Error(`Unsupported status: ${status}. Use one of: ${[...contactStatusOptions, ...messageStatusOptions, ...Object.keys(statusAliases)].join(', ')}`);
}

export function parseContactReviewChannel(value: string): ContactReviewChannel {
  if (contactReviewChannelOptions.includes(value as ContactReviewChannel)) {
    return value as ContactReviewChannel;
  }

  throw new Error(`Unsupported channel: ${value}. Use one of: ${contactReviewChannelOptions.join(', ')}`);
}

function recommendNextAction(record: ContactReviewRecord, sources: ContactReviewSourcesForRecommendation): string {
  if (!record.contactName && !record.contactRole && !record.contactUrl) {
    return 'Research a real public contact manually before preparing outreach. Do not scrape or enrich private data.';
  }

  if (record.contactStatus === 'rejected') {
    return 'Do not contact this record. Find a different manually verified contact or pause the lead.';
  }

  if (record.contactStatus === 'contact-found' || record.contactStatus === 'needs-review') {
    return sources.outreachPackExists
      ? 'Review the outreach pack and approve or reject the contact/message manually.'
      : 'Generate or review an outreach pack before approving a message.';
  }

  if (record.messageStatus === 'approved') {
    return 'Message is approved. Send manually only if Daniel chooses to proceed, then update status to sent-manually.';
  }

  if (record.messageStatus === 'prepared') {
    return 'Review the prepared outreach message and approve only after checking claims, contact, and evidence.';
  }

  if (record.messageStatus === 'sent-manually' && !record.nextFollowUpDate) {
    return 'Set a manual follow-up date before closing today\'s outreach task.';
  }

  if (record.messageStatus === 'sent-manually' && record.nextFollowUpDate) {
    return `Monitor manually for follow-up on ${record.nextFollowUpDate}.`;
  }

  if (record.messageStatus === 'follow-up-needed') {
    return 'Review context and prepare a short follow-up manually. Do not auto-send.';
  }

  if (record.nextFollowUpDate) {
    return `Follow-up date is recorded for ${record.nextFollowUpDate}; confirm the message is approved and sent manually before using it.`;
  }

  return 'Review contact and outreach assets manually before taking any external action.';
}

interface ContactReviewSourcesForRecommendation {
  outreachPackExists: boolean;
}

function buildFollowUpPlan(record: ContactReviewRecord): string[] {
  if (record.messageStatus === 'sent-manually' && record.nextFollowUpDate) {
    return [
      `Message was marked sent manually. Follow up on ${record.nextFollowUpDate} only after Daniel reviews the context.`,
      'Use a short, no-pressure follow-up from the outreach pack if still appropriate.',
    ];
  }

  if (record.messageStatus === 'sent-manually') {
    return [
      'Message was marked sent manually, but no next follow-up date is set.',
      'Choose a follow-up date manually and update the local record.',
    ];
  }

  if (record.nextFollowUpDate) {
    return [
      `Next follow-up date is ${record.nextFollowUpDate}.`,
      'Confirm a message was actually sent manually before following up.',
    ];
  }

  return [
    'No follow-up is scheduled.',
    'Set a follow-up date only after Daniel manually sends an approved message.',
  ];
}

function toContactReviewChannel(channel: OutreachChannel | undefined): ContactReviewChannel {
  if (!channel || channel === 'upwork') return 'linkedin';
  return channel;
}

function isContactStatus(value: string): value is ContactStatus {
  return contactStatusOptions.includes(value as ContactStatus);
}

function isMessageStatus(value: string): value is MessageStatus {
  return messageStatusOptions.includes(value as MessageStatus);
}

const statusAliases: Record<string, Pick<ContactReviewUpdateInput, 'contactStatus' | 'messageStatus'>> = {
  'message-approved': { messageStatus: 'approved' },
  'message-prepared': { messageStatus: 'prepared' },
  'sent': { messageStatus: 'sent-manually' },
  'sent-manually': { messageStatus: 'sent-manually' },
  'follow-up': { messageStatus: 'follow-up-needed' },
  'contact-approved': { contactStatus: 'approved' },
  'contact-found': { contactStatus: 'contact-found' },
  'needs-review': { contactStatus: 'needs-review' },
  'contact-rejected': { contactStatus: 'rejected' },
};

function definedOnly(update: ContactReviewUpdateInput): ContactReviewUpdateInput {
  const next: ContactReviewUpdateInput = {};

  if (update.contactName !== undefined) next.contactName = update.contactName;
  if (update.contactRole !== undefined) next.contactRole = update.contactRole;
  if (update.contactUrl !== undefined) next.contactUrl = update.contactUrl;
  if (update.channel !== undefined) next.channel = update.channel;
  if (update.contactStatus !== undefined) next.contactStatus = update.contactStatus;
  if (update.messageStatus !== undefined) next.messageStatus = update.messageStatus;
  if (update.lastContactedAt !== undefined) next.lastContactedAt = update.lastContactedAt;
  if (update.nextFollowUpDate !== undefined) next.nextFollowUpDate = update.nextFollowUpDate;
  if (update.notes !== undefined) next.notes = update.notes;

  return next;
}

function bullets(lines: string[]): string {
  return lines.map((line) => `- ${line}`).join('\n');
}

function checklist(lines: string[]): string {
  return lines.map((line) => `- [ ] ${line}`).join('\n');
}
