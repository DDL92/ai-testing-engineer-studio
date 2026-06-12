import fs = require('fs');
import path = require('path');
import {
  CompanyOutreachStatus,
  FollowupQueueItem,
  OutreachRecord,
  OutreachStatus,
  OutreachSummary,
} from './types';

const outreachPath = path.join(process.cwd(), 'data', 'outreach', 'outreach.json');
const outputDir = path.join(process.cwd(), 'output', 'outreach-tracking');

export function loadOutreachRecords(): OutreachRecord[] {
  const raw = fs.readFileSync(outreachPath, 'utf8').trim();
  if (!raw) return [];
  return JSON.parse(raw) as OutreachRecord[];
}

export function buildOutreachSummary(records: OutreachRecord[], today = currentDate()): OutreachSummary {
  const companyStatuses = buildCompanyStatuses(records, today);

  return {
    totalCompaniesContacted: new Set(records.map((record) => record.companyId)).size,
    totalContacts: records.length,
    invitationsSent: countStatus(records, 'invitation-sent'),
    messagesSent: countStatus(records, 'message-sent'),
    connected: countStatus(records, 'connected'),
    replied: countStatus(records, 'replied'),
    waiting: countStatus(records, 'waiting') + countStatus(records, 'invitation-sent') + countStatus(records, 'message-sent'),
    followUpsDue: buildFollowupQueue(records, today).length,
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
    const messageCount = countStatus(companyRecords, 'message-sent');
    const connectedCount = countStatus(companyRecords, 'connected');
    const repliedCount = countStatus(companyRecords, 'replied');
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
    .filter((record) => record.status === 'message-sent')
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

export function writeOutreachStatusOutputs(records: OutreachRecord[], today = currentDate()): string[] {
  const summary = buildOutreachSummary(records, today);
  const companyStatuses = buildCompanyStatuses(records, today);
  const outputs = [
    ['outreach-status.md', renderOutreachStatus(summary, today)],
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

export function renderOutreachStatus(summary: OutreachSummary, today = currentDate()): string {
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
  ])}

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
    .map((record) => `| ${record.companyName} | ${record.contactName} | ${record.contactRole} | ${record.channel} | ${record.status} | ${record.sentAt} | ${record.lastTouchAt} | ${record.nextFollowUpAt ?? 'Not scheduled'} | ${record.humanApproved ? 'yes' : 'no'} |`);

  return `# Contact Outreach Status

| Company | Contact | Role | Channel | Status | Sent At | Last Touch | Next Follow-Up | Human Approved |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
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
