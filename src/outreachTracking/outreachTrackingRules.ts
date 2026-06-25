import fs = require('fs');
import path = require('path');
import { loadOutcomes } from '../outcomeTracking/outcomeRules';
import { OutcomeRecord } from '../outcomeTracking/types';
import {
  CompanyOutreachStatus,
  FollowupQueueItem,
  OutreachContext,
  OutreachRecord,
  OutreachSource,
  OutreachStatus,
  OutreachSummary,
} from './types';

const outreachPath = path.join(process.cwd(), 'data', 'outreach', 'outreach.json');
const leadOperatorHistoryPath = path.join(process.cwd(), 'data', 'leads', 'outreach-history.json');
const contactReviewsPath = path.join(process.cwd(), 'data', 'contact-reviews.json');
const contactRotationPath = path.join(process.cwd(), 'data', 'contact-aware-rotation', 'rotation-state.json');
const outputDir = path.join(process.cwd(), 'output', 'outreach-tracking');

export function loadOutreachRecords(): OutreachRecord[] {
  const outcomes = loadOutcomes().filter((record) => record.message_sent);
  const leadOperatorRecords = readJson<LeadOperatorOutreachRecord[]>(leadOperatorHistoryPath, [])
    .filter(isProductionLeadOperatorRecord);
  const legacyRecords = readJson<OutreachRecord[]>(outreachPath, []);

  return mergeOutreachRecords([
    ...outcomes.map(outcomeToOutreachRecord),
    ...leadOperatorRecords.map(leadOperatorToOutreachRecord),
    ...legacyRecords.map((record) => normalizeOutreachRecord(record, 'Legacy Outreach')),
  ]);
}

export function loadOutreachContext(): OutreachContext {
  const contactReviews = readJson<ContactReviewContext[]>(contactReviewsPath, []);
  const rotation = readJson<ContactRotationContext>(contactRotationPath, { evaluatedLeads: [] });
  const preparedButUnsent = contactReviews
    .filter((record) => ['prepared', 'approved'].includes(record.messageStatus))
    .map((record) => `${record.companyName} - ${record.contactName || 'contact not verified'} (${record.messageStatus})`);
  const contactDiscoveryCandidates = [
    ...contactReviews
      .filter((record) => record.contactStatus !== 'approved')
      .map((record) => `${record.companyName} - ${record.contactName || 'contact not verified'} (${record.contactStatus})`),
    ...rotation.evaluatedLeads
      .filter((record) => record.contactStatus !== 'CONTACT_READY')
      .map((record) => `${record.companyName} (${record.contactStatus})`),
  ];

  return {
    preparedButUnsent: unique(preparedButUnsent),
    contactDiscoveryCandidates: unique(contactDiscoveryCandidates),
  };
}

export function buildOutreachSummary(
  records: OutreachRecord[],
  today = currentDate(),
  context: OutreachContext = emptyContext(),
): OutreachSummary {
  const companyStatuses = buildCompanyStatuses(records, today);
  const actualRecords = records.filter(isActualOutreach);

  return {
    totalCompaniesContacted: new Set(actualRecords.map((record) => record.companyId)).size,
    totalContacts: new Set(actualRecords.map(contactIdentity)).size,
    invitationsSent: countStatus(records, 'invitation-sent'),
    messagesSent: records.filter(wasMessageSent).length,
    connected: countStatus(records, 'connected'),
    replied: records.filter(hasReply).length,
    waiting: records.filter((record) => wasMessageSent(record) && !hasReply(record)).length,
    followUpsDue: buildFollowupQueue(records, today).length,
    preparedButUnsent: context.preparedButUnsent.length,
    contactDiscoveryCandidates: context.contactDiscoveryCandidates.length,
    companiesWithBestCoverage: [...companyStatuses].sort((left, right) => right.coverageScore - left.coverageScore || right.contactCount - left.contactCount).slice(0, 3),
    companiesNeedingMoreContacts: [...companyStatuses].sort((left, right) => left.coverageScore - right.coverageScore || left.contactCount - right.contactCount),
  };
}

export function buildCompanyStatuses(records: OutreachRecord[], today = currentDate()): CompanyOutreachStatus[] {
  const grouped = new Map<string, OutreachRecord[]>();

  for (const record of records) {
    const existing = grouped.get(record.companyId) ?? [];
    existing.push(record);
    grouped.set(record.companyId, existing);
  }

  return [...grouped.entries()].map(([companyId, companyRecords]) => {
    const contactCount = companyRecords.length;
    const invitationCount = countStatus(companyRecords, 'invitation-sent');
    const messageCount = companyRecords.filter(wasMessageSent).length;
    const connectedCount = countStatus(companyRecords, 'connected');
    const repliedCount = companyRecords.filter(hasReply).length;
    const followUpsDue = buildFollowupQueue(companyRecords, today).length;
    const coverageScore = contactCount + messageCount * 2 + connectedCount * 2 + repliedCount * 3;

    return {
      companyId,
      companyName: companyRecords[0]?.companyName ?? companyId,
      contactCount,
      invitationCount,
      messageCount,
      connectedCount,
      repliedCount,
      followUpsDue,
      coverageScore,
    };
  });
}

export function buildFollowupQueue(records: OutreachRecord[], today = currentDate()): FollowupQueueItem[] {
  return records
    .filter((record) => wasMessageSent(record) && !hasReply(record))
    .filter((record) => Boolean(record.nextFollowUpAt) && compareDate(record.nextFollowUpAt as string, today) <= 0)
    .map((record) => ({
      record,
      daysSinceLastTouch: daysBetween(record.lastTouchAt, today),
      reason: `Manual message was sent on ${record.sentAt}; next follow-up date is ${record.nextFollowUpAt}.`,
      recommendedAction: 'Review context and draft a follow-up only after Daniel explicitly approves. Do not auto-send.',
    }))
    .sort((left, right) => {
      const byDate = compareDate(left.record.nextFollowUpAt ?? '', right.record.nextFollowUpAt ?? '');
      if (byDate !== 0) return byDate;
      return left.record.companyName.localeCompare(right.record.companyName) || left.record.contactName.localeCompare(right.record.contactName);
    });
}

export function buildPlannedFollowUps(
  records: OutreachRecord[],
  today = currentDate(),
  upcomingDays = 10,
): FollowupQueueItem[] {
  const upcomingThrough = addDays(today, upcomingDays);
  return records
    .filter((record) => wasMessageSent(record) && !hasReply(record) && Boolean(record.nextFollowUpAt))
    .filter((record) => compareDate(record.nextFollowUpAt as string, upcomingThrough) <= 0)
    .map((record) => ({
      record,
      daysSinceLastTouch: daysBetween(record.lastTouchAt, today),
      reason: compareDate(record.nextFollowUpAt as string, today) <= 0
        ? `Follow-up was due on ${record.nextFollowUpAt}.`
        : `Follow-up is upcoming on ${record.nextFollowUpAt}.`,
      recommendedAction: 'Review context and decide whether to follow up manually. Do not auto-send.',
    }))
    .sort((left, right) => compareDate(left.record.nextFollowUpAt ?? '', right.record.nextFollowUpAt ?? ''));
}

export function writeOutreachStatusOutputs(
  records: OutreachRecord[],
  today = currentDate(),
  context: OutreachContext = loadOutreachContext(),
): string[] {
  const summary = buildOutreachSummary(records, today, context);
  const companyStatuses = buildCompanyStatuses(records, today);
  const outputs = [
    ['outreach-status.md', renderOutreachStatus(summary, records, context, today)],
    ['company-status.md', renderCompanyStatus(companyStatuses)],
    ['contact-status.md', renderContactStatus(records)],
    ['pipeline-summary.md', renderPipelineSummary(summary, companyStatuses)],
  ] as const;

  fs.mkdirSync(outputDir, { recursive: true });

  return outputs.map(([fileName, content]) => {
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, content, 'utf8');
    return outputPath;
  });
}

export function writeFollowupQueueOutput(records: OutreachRecord[], today = currentDate()): string {
  const queue = buildFollowupQueue(records, today);
  const outputPath = path.join(outputDir, 'followup-queue.md');

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, renderFollowupQueue(queue, today), 'utf8');

  return outputPath;
}

export function renderOutreachStatus(
  summary: OutreachSummary,
  records: OutreachRecord[] = [],
  context: OutreachContext = emptyContext(),
  today = currentDate(),
): string {
  return `# Outreach Status

Generated: ${today}

## Summary

${bullets([
    `Total companies contacted: ${summary.totalCompaniesContacted}`,
    `Total contacts: ${summary.totalContacts}`,
    `Invitations sent: ${summary.invitationsSent}`,
    `Messages sent: ${summary.messagesSent}`,
    `Connected: ${summary.connected}`,
    `Replied: ${summary.replied}`,
    `Waiting: ${summary.waiting}`,
    `Follow-ups due: ${summary.followUpsDue}`,
    `Prepared but unsent leads: ${summary.preparedButUnsent}`,
    `Contact-discovery candidates: ${summary.contactDiscoveryCandidates}`,
  ])}

## Actual Outreach Activity

${records.filter(wasMessageSent).length > 0 ? records.filter(wasMessageSent).map(renderActualOutreach).join('\n\n') : '- No actual messages sent are recorded.'}

## Prepared But Unsent Leads

${context.preparedButUnsent.length > 0 ? bullets(context.preparedButUnsent) : '- None.'}

## Contact-Discovery Candidates

${context.contactDiscoveryCandidates.length > 0 ? bullets(context.contactDiscoveryCandidates) : '- None.'}

## Companies With Best Coverage

${summary.companiesWithBestCoverage.length > 0 ? bullets(summary.companiesWithBestCoverage.map(renderCompanyStatusLine)) : '- No company outreach records found.'}

## Companies Needing More Contacts

${summary.companiesNeedingMoreContacts.length > 0 ? bullets(summary.companiesNeedingMoreContacts.map(renderCompanyGapLine)) : '- No company outreach records found.'}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderCompanyStatus(companyStatuses: CompanyOutreachStatus[]): string {
  return `# Company Outreach Status

${companyStatuses.map((company) => `## ${company.companyName}

${bullets([
    `Contacts: ${company.contactCount}`,
    `Invitations sent: ${company.invitationCount}`,
    `Messages sent: ${company.messageCount}`,
    `Connected: ${company.connectedCount}`,
    `Replied: ${company.repliedCount}`,
    `Follow-ups due: ${company.followUpsDue}`,
    `Coverage score: ${company.coverageScore}`,
  ])}`).join('\n\n')}
`;
}

export function renderContactStatus(records: OutreachRecord[]): string {
  const rows = records
    .sort((left, right) => left.companyName.localeCompare(right.companyName) || left.contactName.localeCompare(right.contactName))
    .map((record) => `| ${record.companyName} | ${record.contactName} | ${record.contactRole} | ${record.channel} | ${responseLabel(record)} | ${record.sentAt} | ${record.lastTouchAt} | ${record.nextFollowUpAt ?? 'Not scheduled'} | ${record.source ?? 'Legacy Outreach'} | ${record.humanApproved ? 'yes' : 'no'} |`);

  return `# Contact Outreach Status

| Company | Contact | Role | Channel | Response | Sent At | Last Touch | Next Follow-Up | Source | Human Approved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderPipelineSummary(summary: OutreachSummary, companyStatuses: CompanyOutreachStatus[]): string {
  return `# Outreach Pipeline Summary

## Pipeline Counts

${bullets([
    `Companies contacted: ${summary.totalCompaniesContacted}`,
    `Contacts in local outreach tracker: ${summary.totalContacts}`,
    `Open invitations: ${summary.invitationsSent}`,
    `Manual messages sent: ${summary.messagesSent}`,
    `Connections recorded: ${summary.connected}`,
    `Replies recorded: ${summary.replied}`,
    `Follow-ups due: ${summary.followUpsDue}`,
  ])}

## Company Coverage

${companyStatuses.length > 0 ? bullets(companyStatuses.map(renderCompanyStatusLine)) : '- No company outreach records found.'}

## Recommended Operating Note

- Future \`day:plan\` or Operator OS dashboard work should read these generated files, but Sprint 52 intentionally avoids a dashboard layer.
`;
}

export function renderFollowupQueue(queue: FollowupQueueItem[], today = currentDate()): string {
  const body = queue.length > 0
    ? queue.map((item) => `## ${item.record.companyName} - ${item.record.contactName}

${bullets([
      `Contact: ${item.record.contactName}`,
      `Company: ${item.record.companyName}`,
      `Days since last touch: ${item.daysSinceLastTouch}`,
      `Reason: ${item.reason}`,
      `Recommended action: ${item.recommendedAction}`,
    ])}`).join('\n\n')
    : '- No follow-ups are due. Invitation-sent records are intentionally excluded until connected, and message-sent records are not due until their next follow-up date.';

  return `# Follow-Up Queue

Generated: ${today}

${body}

## Safety Notes

${bullets([
    'Do not follow up on invitation-sent records unless they become connected and a manual message is approved.',
    'Follow up only when status is message-sent and nextFollowUpAt is today or earlier.',
    'This command does not generate an actual follow-up message or send anything.',
    'Daniel approval is required before any follow-up is written or sent.',
  ])}
`;
}

function countStatus(records: OutreachRecord[], status: OutreachStatus): number {
  return records.filter((record) => record.status === status).length;
}

export function outcomeToOutreachRecord(record: OutcomeRecord): OutreachRecord {
  const followUpDate = record.follow_up_date || parseFollowUpDate(record.next_action);
  const replyReceived = record.response_status === 'replied';
  return {
    companyId: slug(record.company),
    companyName: record.company,
    contactName: record.contact,
    contactRole: record.contact_role ?? '',
    channel: normalizeChannel(record.channel),
    status: replyReceived ? 'replied' : 'message-sent',
    sentAt: dateOnly(record.date),
    lastTouchAt: dateOnly(record.date),
    nextFollowUpAt: followUpDate,
    messageType: record.message_type ?? record.action_type,
    notes: record.notes || record.next_action,
    humanApproved: true,
    source: 'Outcome Tracking',
    messageSent: record.message_sent,
    replyReceived,
  };
}

export function mergeOutreachRecords(records: OutreachRecord[]): OutreachRecord[] {
  const deduplicated = new Map<string, OutreachRecord>();
  for (const record of records) {
    const normalized = normalizeOutreachRecord(record, record.source ?? 'Legacy Outreach');
    const key = outreachIdentity(normalized);
    const broadKey = broadOutreachIdentity(normalized);
    const existingBroad = [...deduplicated.entries()].find(([, existing]) =>
      broadOutreachIdentity(existing) === broadKey
      && (isUnknownContact(existing.contactName) || isUnknownContact(normalized.contactName)));
    if (!deduplicated.has(key) && !existingBroad) deduplicated.set(key, normalized);
  }
  return [...deduplicated.values()];
}

export function parseFollowUpDate(nextAction: string): string | null {
  const match = nextAction.match(/\bfollow[\s-]?up(?:\s+\w+){0,3}\s+(\d{4}-\d{2}-\d{2})\b/i);
  return match?.[1] ?? null;
}

function renderCompanyStatusLine(company: CompanyOutreachStatus): string {
  return `${company.companyName}: ${company.contactCount} contacts, ${company.messageCount} messages sent, ${company.connectedCount} connected, ${company.followUpsDue} follow-ups due, coverage score ${company.coverageScore}.`;
}

function renderCompanyGapLine(company: CompanyOutreachStatus): string {
  if (company.contactCount < 3) return `${company.companyName}: needs more manually verified contacts (${company.contactCount} currently recorded).`;
  if (company.messageCount === 0) return `${company.companyName}: has contacts but no manual messages sent yet.`;
  return `${company.companyName}: coverage exists; continue monitoring manually.`;
}

function safetyNotes(): string[] {
  return [
    'Local outreach tracking only. No messages, invitations, emails, or follow-ups are sent.',
    'No LinkedIn scraping, APIs, CRM, credentials, external databases, or automated enrichment are used.',
    'Human approval remains required before any external action.',
  ];
}

function renderActualOutreach(record: OutreachRecord): string {
  return [
    `Company: ${record.companyName}`,
    `Contact: ${record.contactName}`,
    `Channel: ${displayChannel(record.channel)}`,
    `Sent: ${record.sentAt}`,
    `Response: ${responseLabel(record)}`,
    `Follow-up due: ${record.nextFollowUpAt ?? 'Not scheduled'}`,
    `Source: ${record.source ?? 'Legacy Outreach'}`,
  ].join('\n');
}

function responseLabel(record: OutreachRecord): string {
  return hasReply(record) ? 'Replied' : wasMessageSent(record) ? 'Pending' : record.status;
}

function wasMessageSent(record: OutreachRecord): boolean {
  return record.messageSent ?? ['message-sent', 'replied', 'waiting', 'follow-up-due', 'closed-no-response'].includes(record.status);
}

function hasReply(record: OutreachRecord): boolean {
  return record.replyReceived ?? record.status === 'replied';
}

function isActualOutreach(record: OutreachRecord): boolean {
  return wasMessageSent(record) || ['invitation-sent', 'connected', 'replied'].includes(record.status);
}

function normalizeOutreachRecord(record: OutreachRecord, source: OutreachSource): OutreachRecord {
  return {
    ...record,
    companyId: record.companyId || slug(record.companyName),
    sentAt: dateOnly(record.sentAt),
    lastTouchAt: dateOnly(record.lastTouchAt || record.sentAt),
    nextFollowUpAt: record.nextFollowUpAt ? dateOnly(record.nextFollowUpAt) : null,
    source,
    messageSent: record.messageSent ?? ['message-sent', 'replied', 'waiting', 'follow-up-due', 'closed-no-response'].includes(record.status),
    replyReceived: record.replyReceived ?? record.status === 'replied',
  };
}

function leadOperatorToOutreachRecord(record: LeadOperatorOutreachRecord): OutreachRecord {
  return {
    companyId: record.leadId || slug(record.companyName),
    companyName: record.companyName,
    contactName: 'Lead operator contact',
    contactRole: '',
    channel: normalizeChannel(record.channel),
    status: 'message-sent',
    sentAt: dateOnly(record.sentAt),
    lastTouchAt: dateOnly(record.sentAt),
    nextFollowUpAt: record.nextFollowUpAt ? dateOnly(record.nextFollowUpAt) : null,
    messageType: record.messageType,
    notes: record.note,
    humanApproved: true,
    source: 'Lead Operator',
    messageSent: true,
    replyReceived: false,
  };
}

function outreachIdentity(record: OutreachRecord): string {
  return [
    slug(record.companyName),
    slug(record.contactName === 'Lead operator contact' ? '' : record.contactName),
    record.channel,
    record.sentAt,
  ].join('|');
}

function broadOutreachIdentity(record: OutreachRecord): string {
  return [slug(record.companyName), record.channel, record.sentAt].join('|');
}

function isUnknownContact(contactName: string): boolean {
  return !contactName || contactName === 'Lead operator contact';
}

function contactIdentity(record: OutreachRecord): string {
  return `${slug(record.companyName)}|${slug(record.contactName)}|${record.channel}`;
}

function normalizeChannel(value: string): OutreachRecord['channel'] {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'linkedin') return 'linkedin';
  if (normalized === 'email') return 'email';
  if (normalized === 'phone') return 'phone';
  if (normalized === 'referral') return 'referral';
  if (['website-form', 'website_form', 'contact-form'].includes(normalized)) return 'website-form';
  return 'other';
}

function displayChannel(channel: OutreachRecord['channel']): string {
  if (channel === 'linkedin') return 'LinkedIn';
  if (channel === 'website-form') return 'Website form';
  return channel.charAt(0).toUpperCase() + channel.slice(1);
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function dateOnly(value: string): string {
  return value.slice(0, 10);
}

function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function unique(items: string[]): string[] {
  return [...new Set(items)];
}

function emptyContext(): OutreachContext {
  return { preparedButUnsent: [], contactDiscoveryCandidates: [] };
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  return raw ? JSON.parse(raw) as T : fallback;
}

interface LeadOperatorOutreachRecord {
  leadId: string;
  companyName: string;
  channel: string;
  messageType: string;
  sentAt: string;
  nextFollowUpAt: string;
  note: string;
}

function isProductionLeadOperatorRecord(record: LeadOperatorOutreachRecord): boolean {
  const text = `${record.leadId} ${record.companyName} ${record.note}`.toLowerCase();
  return !/\b(sample|demo|fixture|test|validation)\b/.test(text);
}

interface ContactReviewContext {
  companyName: string;
  contactName: string;
  contactStatus: string;
  messageStatus: string;
}

interface ContactRotationContext {
  evaluatedLeads: Array<{
    companyName: string;
    contactStatus: string;
  }>;
}

function compareDate(left: string, right: string): number {
  return left.localeCompare(right);
}

function daysBetween(start: string, end: string): number {
  const startDate = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  return Math.floor((endDate.getTime() - startDate.getTime()) / 86_400_000);
}

function currentDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function bullets(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}
