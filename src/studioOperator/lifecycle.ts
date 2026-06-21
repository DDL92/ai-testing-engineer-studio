import crypto = require('crypto');
import fs = require('fs');
import path = require('path');
import {
  LIFECYCLE_STATUSES,
  type FunnelCounts,
  type LeadType,
  type LifecycleEntry,
  type LifecycleStatus,
  type MetricsEvent,
  type StudioMetrics,
} from './types';

const DATA_DIR = path.join(process.cwd(), 'data', 'studio-operator');
const LIFECYCLE_PATH = path.join(DATA_DIR, 'lifecycle.json');
const METRICS_PATH = path.join(DATA_DIR, 'metrics.json');
const SENSITIVE = new Set<LifecycleStatus>([
  'approved_for_outreach', 'contacted', 'replied', 'call_scheduled',
  'proposal_sent', 'won', 'lost', 'archived',
]);

const transitions: Record<LifecycleStatus, LifecycleStatus[]> = {
  discovered: ['needs_verification', 'archived'],
  needs_verification: ['qualified', 'archived'],
  qualified: ['pack_ready', 'proposal_ready', 'archived'],
  pack_ready: ['approved_for_outreach', 'proposal_ready', 'archived'],
  approved_for_outreach: ['contacted', 'archived'],
  contacted: ['replied', 'archived'],
  replied: ['call_scheduled', 'proposal_ready', 'lost', 'archived'],
  call_scheduled: ['proposal_ready', 'lost', 'archived'],
  proposal_ready: ['proposal_sent', 'archived'],
  proposal_sent: ['won', 'lost', 'archived'],
  won: [],
  lost: [],
  archived: [],
};

export function readLifecycle(): LifecycleEntry[] {
  return readJson<LifecycleEntry[]>(LIFECYCLE_PATH, []);
}

export function readMetrics(): StudioMetrics {
  return readJson<StudioMetrics>(METRICS_PATH, { events: [] });
}

export function validateTransition(
  previous: LifecycleStatus,
  next: LifecycleStatus,
  manual: boolean,
): { allowed: boolean; reason: string } {
  if (previous === next) return { allowed: true, reason: 'Status is already set; no event will be counted.' };
  if (!LIFECYCLE_STATUSES.includes(next)) return { allowed: false, reason: `Unsupported lifecycle status: ${next}` };
  if (SENSITIVE.has(next) && !manual) return { allowed: false, reason: `${next} requires studio:mark.` };
  if (!transitions[previous].includes(next)) return { allowed: false, reason: `Invalid transition: ${previous} → ${next}.` };
  return { allowed: true, reason: 'Transition allowed.' };
}

export function upsertAutomatic(
  entries: LifecycleEntry[],
  input: Omit<LifecycleEntry, 'previousStatus' | 'updatedAt' | 'lastActionAt' | 'approvedByOperator' | 'contactedAt' | 'repliedAt' | 'proposalSentAt' | 'wonAt' | 'lostAt' | 'notes'>,
  now: string,
): LifecycleEntry[] {
  const index = entries.findIndex((entry) => entry.leadId === input.leadId && entry.leadType === input.leadType);
  if (index < 0) {
    const entry: LifecycleEntry = {
      ...input,
      previousStatus: null,
      updatedAt: now,
      lastActionAt: now,
      approvedByOperator: false,
      contactedAt: null,
      repliedAt: null,
      proposalSentAt: null,
      wonAt: null,
      lostAt: null,
      notes: [],
    };
    return [...entries, entry];
  }
  const current = entries[index];
  if (['approved_for_outreach', 'contacted', 'replied', 'call_scheduled', 'proposal_sent', 'won', 'lost', 'archived'].includes(current.status)) {
    return entries;
  }
  const nextStatus = automaticProgress(current.status, input.status);
  const updated: LifecycleEntry = {
    ...current,
    businessName: input.businessName,
    nextAction: input.nextAction,
    sourceRecordPath: input.sourceRecordPath,
    packPath: input.packPath,
    ...(nextStatus !== current.status ? {
      status: nextStatus,
      previousStatus: current.status,
      updatedAt: now,
      lastActionAt: now,
    } : {}),
  };
  const next = [...entries];
  next[index] = updated;
  return next;
}

export function markLifecycle(input: {
  entries: LifecycleEntry[];
  metrics: StudioMetrics;
  leadId: string;
  leadType: LeadType;
  status: LifecycleStatus;
  note?: string;
  now: string;
  source?: string | null;
  category?: string | null;
  offer?: string | null;
  confirmedOffer?: string;
  confirmedOneTimeRevenueUsd?: number;
  confirmedMrrUsd?: number;
}): { entries: LifecycleEntry[]; metrics: StudioMetrics; entry: LifecycleEntry; changed: boolean } {
  const index = input.entries.findIndex((entry) => entry.leadId === input.leadId && entry.leadType === input.leadType);
  if (index < 0) throw new Error('Lifecycle entry does not exist. Run studio:daily before marking this lead.');
  const current = input.entries[index];
  const validation = validateTransition(current.status, input.status, true);
  if (!validation.allowed) throw new Error(validation.reason);
  if (input.note) validateNote(input.note);
  validateRevenueInput(input.status, current, input.confirmedOffer, input.confirmedOneTimeRevenueUsd, input.confirmedMrrUsd);
  if (current.status === input.status) return { entries: input.entries, metrics: input.metrics, entry: current, changed: false };

  const updated: LifecycleEntry = {
    ...current,
    previousStatus: current.status,
    status: input.status,
    updatedAt: input.now,
    lastActionAt: input.now,
    nextAction: nextActionFor(input.status),
    approvedByOperator: input.status === 'approved_for_outreach' ? true : current.approvedByOperator,
    contactedAt: input.status === 'contacted' ? input.now : current.contactedAt,
    repliedAt: input.status === 'replied' ? input.now : current.repliedAt,
    proposalSentAt: input.status === 'proposal_sent' ? input.now : current.proposalSentAt,
    wonAt: input.status === 'won' ? input.now : current.wonAt,
    lostAt: input.status === 'lost' ? input.now : current.lostAt,
    notes: input.note ? [...current.notes, input.note] : current.notes,
    confirmedOffer: input.status === 'won' ? input.confirmedOffer ?? null : current.confirmedOffer ?? null,
    confirmedOneTimeRevenueUsd: input.status === 'won' ? input.confirmedOneTimeRevenueUsd ?? null : current.confirmedOneTimeRevenueUsd ?? null,
    confirmedMrrUsd: input.status === 'won' ? input.confirmedMrrUsd ?? null : current.confirmedMrrUsd ?? null,
    revenueConfirmedAt: input.status === 'won' && (input.confirmedOneTimeRevenueUsd || input.confirmedMrrUsd)
      ? input.now
      : current.revenueConfirmedAt ?? null,
  };
  const entries = [...input.entries];
  entries[index] = updated;
  const event = metricForStatus(input.status);
  const metrics = event
    ? addMetricOnce(input.metrics, {
      id: crypto.createHash('sha256').update(`${input.leadType}|${input.leadId}|${event}`).digest('hex').slice(0, 16),
      leadId: input.leadId,
      leadType: input.leadType,
      event,
      source: input.source ?? null,
      category: input.category ?? null,
      offer: input.offer ?? null,
      recordedAt: input.now,
    })
    : input.metrics;
  return { entries, metrics, entry: updated, changed: true };
}

export function writeLifecycleAndMetrics(entries: LifecycleEntry[], metrics: StudioMetrics): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  writeAtomic(LIFECYCLE_PATH, entries);
  writeAtomic(METRICS_PATH, metrics);
}

export function metricCounts(metrics: StudioMetrics): Record<LeadType, FunnelCounts> {
  const empty = (): FunnelCounts => ({
    leadsDiscovered: 0, leadsVerified: 0, leadsQualified: 0, packsReady: 0,
    outreachApproved: 0, messagesSent: 0, repliesReceived: 0, callsScheduled: 0,
    proposalsReady: 0, proposalsSent: 0, clientsWon: 0, clientsLost: 0,
  });
  const counts = { qa: empty(), website: empty() };
  for (const event of metrics.events) counts[event.leadType][event.event] += 1;
  return counts;
}

function automaticProgress(current: LifecycleStatus, suggested: LifecycleStatus): LifecycleStatus {
  const order: LifecycleStatus[] = ['discovered', 'needs_verification', 'qualified', 'pack_ready', 'proposal_ready'];
  if (!order.includes(current) || !order.includes(suggested)) return current;
  return order[Math.max(order.indexOf(current), order.indexOf(suggested))];
}

function metricForStatus(status: LifecycleStatus): keyof FunnelCounts | null {
  return ({
    discovered: 'leadsDiscovered',
    needs_verification: 'leadsVerified',
    qualified: 'leadsQualified',
    pack_ready: 'packsReady',
    approved_for_outreach: 'outreachApproved',
    contacted: 'messagesSent',
    replied: 'repliesReceived',
    call_scheduled: 'callsScheduled',
    proposal_ready: 'proposalsReady',
    proposal_sent: 'proposalsSent',
    won: 'clientsWon',
    lost: 'clientsLost',
  } as Partial<Record<LifecycleStatus, keyof FunnelCounts>>)[status] ?? null;
}

function addMetricOnce(metrics: StudioMetrics, event: MetricsEvent): StudioMetrics {
  return metrics.events.some((existing) => existing.id === event.id)
    ? metrics
    : { events: [...metrics.events, event] };
}

function nextActionFor(status: LifecycleStatus): string {
  return ({
    discovered: 'Verify the lead.',
    needs_verification: 'Confirm business fit and evidence.',
    qualified: 'Generate or review the lead pack.',
    pack_ready: 'Review evidence before outreach approval.',
    approved_for_outreach: 'Send approved outreach manually.',
    contacted: 'Monitor for reply and follow up manually when due.',
    replied: 'Review the reply and prepare the next response.',
    call_scheduled: 'Prepare for the call.',
    proposal_ready: 'Review the proposal.',
    proposal_sent: 'Follow up manually when appropriate.',
    won: 'Proceed only through the approved client workflow.',
    lost: 'No active action.',
    archived: 'No active action.',
  })[status];
}

function validateNote(note: string): void {
  if (note.length > 500) throw new Error('Note must be 500 characters or fewer.');
  if (/(password|token|api[-_ ]?key|secret|private[-_ ]?key|credit[-_ ]?card|bank[-_ ]?account)\s*[:=]/i.test(note)) {
    throw new Error('Notes must not contain credentials or financial secrets.');
  }
}

function validateRevenueInput(
  status: LifecycleStatus,
  current: LifecycleEntry,
  offer?: string,
  oneTime?: number,
  mrr?: number,
): void {
  const supplied = offer !== undefined || oneTime !== undefined || mrr !== undefined;
  if (supplied && status !== 'won') throw new Error('Revenue fields are allowed only with --status won.');
  if (!supplied) return;
  if (!offer || !configuredOffers().includes(offer)) throw new Error('Confirmed offer must match an existing configured offer.');
  if (oneTime !== undefined && (!Number.isFinite(oneTime) || oneTime <= 0)) throw new Error('One-time revenue must be a positive number.');
  if (mrr !== undefined && (!Number.isFinite(mrr) || mrr <= 0)) throw new Error('MRR must be a positive number.');
  if (oneTime === undefined && mrr === undefined) throw new Error('Provide --one-time-revenue or --mrr with the confirmed offer.');
  if (current.revenueConfirmedAt || current.confirmedOneTimeRevenueUsd || current.confirmedMrrUsd) {
    throw new Error('Confirmed revenue is already recorded for this lead.');
  }
}

function configuredOffers(): string[] {
  return [
    'QA Audit',
    'Playwright Starter Pack',
    'QA Automation Retainer',
    'Website QA & Performance Audit',
    'Website Presence Starter',
    'Website Recovery / Redesign Pack',
    'Conversion Landing Page',
    'Monthly Website Care',
  ];
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function writeAtomic(filePath: string, value: unknown): void {
  const temporary = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  fs.renameSync(temporary, filePath);
}
