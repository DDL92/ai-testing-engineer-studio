import fs = require('fs');
import path = require('path');
import { getRevenueSourceOfTruth } from '../revenueIntelligence/sourceOfTruth';
import { OutcomeRecord, OutcomeStatus, OutcomeSummary } from './types';

export const allowedOutcomeStatuses: OutcomeStatus[] = [
  'not_sent',
  'sent',
  'replied',
  'no_reply',
  'meeting_booked',
  'proposal_sent',
  'won',
  'lost',
  'paused',
];

const dataPath = path.join(process.cwd(), 'data', 'outcomes', 'outcomes.json');
const outputRoot = path.join(process.cwd(), 'output', 'outcomes');

const safetyRules = [
  'Manual-only outcome tracking.',
  'Human-approved local records only.',
  'Do not send messages, emails, proposals, meeting invites, invoices, payment links, or payments.',
  'Do not invent replies, revenue, client interest, meetings, proposals, wins, or losses.',
];

export function ensureOutcomeStore(): void {
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, '[]\n', 'utf8');
  }
}

export function loadOutcomes(): OutcomeRecord[] {
  ensureOutcomeStore();
  const raw = fs.readFileSync(dataPath, 'utf8').trim();
  if (!raw) return [];
  const parsed = JSON.parse(raw) as OutcomeRecord[];
  return parsed.map(normalizeRecord);
}

export function saveOutcomes(records: OutcomeRecord[]): void {
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  fs.writeFileSync(dataPath, `${JSON.stringify(records.map(normalizeRecord), null, 2)}\n`, 'utf8');
}

export function addOutcomeRecord(record: OutcomeRecord): OutcomeRecord[] {
  const records = loadOutcomes();
  const normalized = normalizeRecord(record);
  records.push(normalized);
  saveOutcomes(records);
  return records;
}

export function buildOutcomeSummary(records = loadOutcomes()): OutcomeSummary {
  const revenueTruth = getRevenueSourceOfTruth();
  const messagesSent = records.filter((record) => record.message_sent || record.response_status !== 'not_sent').length;
  const replies = records.filter((record) => record.response_status === 'replied').length;
  const meetings = records.filter((record) => record.meeting_status === 'meeting_booked').length;
  const proposals = records.filter((record) => record.proposal_status === 'proposal_sent').length;
  const wins = records.filter((record) => record.deal_status === 'won').length;
  const losses = records.filter((record) => record.deal_status === 'lost').length;
  const revenueRecorded = records
    .filter((record) => record.deal_status === 'won' || record.revenue_status === 'won')
    .reduce((total, record) => total + safeAmount(record.amount), 0);

  return {
    generatedAt: new Date().toISOString(),
    totalRecords: records.length,
    messagesSent,
    replies,
    meetings,
    proposals,
    wins,
    losses,
    replyRate: messagesSent > 0 ? `${Math.round((replies / messagesSent) * 100)}%` : 'No outcomes recorded yet.',
    revenueRecorded,
    nextManualMessage: records.length > 0
      ? nextActionFromRecords(records)
      : `No outcomes recorded yet. Review the ${revenueTruth.topLead} message pack before any manual send.`,
    hasOutcomes: records.length > 0,
    safetyRules,
  };
}

export function writeOutcomeDashboardOutputs(summary = buildOutcomeSummary()): string[] {
  return writeOutputs([
    { fileName: 'pipeline-status.md', body: renderPipelineStatus(summary) },
    { fileName: 'response-rates.md', body: renderResponseRates(summary) },
    { fileName: 'revenue-by-source.md', body: renderRevenueBySource(summary) },
  ]);
}

export function writeOutcomeReviewOutputs(summary = buildOutcomeSummary(), records = loadOutcomes()): string[] {
  return writeOutputs([
    { fileName: 'win-loss-analysis.md', body: renderWinLossAnalysis(summary, records) },
    { fileName: 'lessons-learned.md', body: renderLessonsLearned(summary, records) },
  ]);
}

export function renderPipelineStatus(summary: OutcomeSummary): string {
  return [
    '# Pipeline Status',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    summary.hasOutcomes ? renderList([
      `Outcome records: ${summary.totalRecords}`,
      `Messages sent: ${summary.messagesSent}`,
      `Replies: ${summary.replies}`,
      `Meetings: ${summary.meetings}`,
      `Proposals: ${summary.proposals}`,
      `Wins: ${summary.wins}`,
      `Losses: ${summary.losses}`,
      `Next manual message: ${summary.nextManualMessage}`,
    ]) : 'No outcomes recorded yet.',
    '',
    '## Safety Rules',
    renderList(summary.safetyRules),
    '',
  ].join('\n');
}

export function renderResponseRates(summary: OutcomeSummary): string {
  return [
    '# Response Rates',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    summary.hasOutcomes ? renderList([
      `Messages sent: ${summary.messagesSent}`,
      `Replies: ${summary.replies}`,
      `Reply rate: ${summary.replyRate}`,
    ]) : 'No outcomes recorded yet.',
    '',
    '## Notes',
    renderList([
      'Reply rate uses manually recorded outcomes only.',
      'No replies, interest, or meetings are inferred.',
    ]),
    '',
  ].join('\n');
}

export function renderRevenueBySource(summary: OutcomeSummary): string {
  return [
    '# Revenue By Source',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    summary.hasOutcomes ? renderList([
      `Revenue recorded from local won outcomes: $${summary.revenueRecorded.toLocaleString('en-US')}`,
      'Pipeline estimates, offer ranges, and plans are not counted as revenue.',
    ]) : 'No outcomes recorded yet.',
    '',
    '## Safety Rules',
    renderList(summary.safetyRules),
    '',
  ].join('\n');
}

export function renderWinLossAnalysis(summary: OutcomeSummary, records: OutcomeRecord[]): string {
  const won = records.filter((record) => record.deal_status === 'won');
  const lost = records.filter((record) => record.deal_status === 'lost');

  return [
    '# Win-Loss Analysis',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    summary.hasOutcomes ? renderList([
      `Wins: ${summary.wins}`,
      `Losses: ${summary.losses}`,
      `Won companies: ${won.map((record) => record.company).join(', ') || 'None'}`,
      `Lost companies: ${lost.map((record) => record.company).join(', ') || 'None'}`,
    ]) : 'No outcomes recorded yet.',
    '',
    '## Interpretation',
    summary.hasOutcomes
      ? 'Use only Daniel-entered notes to decide what to adjust next.'
      : 'No win-loss pattern exists yet because no manual outcomes have been recorded.',
    '',
    '## Safety Rules',
    renderList(summary.safetyRules),
    '',
  ].join('\n');
}

export function renderLessonsLearned(summary: OutcomeSummary, records: OutcomeRecord[]): string {
  const notes = records.map((record) => record.notes).filter(Boolean);

  return [
    '# Lessons Learned',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    summary.hasOutcomes && notes.length > 0 ? renderList(notes) : 'No outcomes recorded yet.',
    '',
    '## Next Learning Step',
    summary.hasOutcomes
      ? 'Review message, channel, and response status before changing the manual outreach angle.'
      : 'After Daniel manually sends outreach, add the actual outcome with npm run outcome:add.',
    '',
    '## Safety Rules',
    renderList(summary.safetyRules),
    '',
  ].join('\n');
}

function normalizeRecord(record: OutcomeRecord): OutcomeRecord {
  return {
    company: String(record.company ?? '').trim(),
    contact: String(record.contact ?? '').trim(),
    channel: String(record.channel ?? '').trim(),
    date: String(record.date ?? '').trim(),
    action_type: String(record.action_type ?? '').trim(),
    message_sent: Boolean(record.message_sent),
    response_status: normalizeStatus(record.response_status),
    meeting_status: normalizeStatus(record.meeting_status),
    proposal_status: normalizeStatus(record.proposal_status),
    deal_status: normalizeStatus(record.deal_status),
    revenue_status: normalizeStatus(record.revenue_status),
    amount: safeAmount(record.amount),
    notes: String(record.notes ?? '').trim(),
    next_action: String(record.next_action ?? '').trim(),
  };
}

function normalizeStatus(status: OutcomeStatus): OutcomeStatus {
  return allowedOutcomeStatuses.includes(status) ? status : 'not_sent';
}

function safeAmount(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function nextActionFromRecords(records: OutcomeRecord[]): string {
  const latestWithAction = [...records].reverse().find((record) => record.next_action.trim().length > 0);
  return latestWithAction?.next_action ?? 'Review latest manual outcome and choose the next approved action.';
}

function writeOutputs(outputs: { fileName: string; body: string }[]): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });
  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }
  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}
