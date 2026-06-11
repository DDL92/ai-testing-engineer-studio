import fs = require('fs');
import path = require('path');
import { approvalQueueDir } from '../config/paths';
import { nextFollowUpDate, parseOutreachChannel } from '../outreach/outreachCadence';
import { applyScoreToLead, opportunityToLead } from '../scoring/scorer';
import { readLeads, readMessageReviewQueue, readOpportunities, readOutreachHistory, writeLeads, writeMessageReviewQueue, writeOpportunities, writeOutreachHistory } from '../storage/jsonStore';
import type { Lead, OutreachRecord } from '../types/lead';
import { stableId } from '../utils/ids';
import { emptySummary, writeMessageReviewQueueMarkdown } from './messageReviewWriter';
import {
  MessageChannel,
  MessageReviewItem,
  MessageReviewQueue,
  MessageReviewStatus,
  ReviewMessageType,
  ReviewableStatus,
  messageChannels,
  reviewMessageTypes,
  reviewableStatuses,
} from './messageReviewTypes';

export function scanMessageQueue(): MessageReviewQueue {
  const existing = normalizeQueue(readMessageReviewQueue<Partial<MessageReviewQueue>>({}));
  const now = new Date().toISOString();
  const bySource = new Map(existing.items.map((item) => [item.sourceFile, item]));
  const markdownDrafts = listApprovalDrafts();

  for (const draft of markdownDrafts) {
    const sourceFile = path.relative(process.cwd(), draft);
    const content = fs.readFileSync(draft, 'utf8');
    const existing = bySource.get(sourceFile);
    if (existing) {
      bySource.set(sourceFile, refreshQueueItemMetadata(existing, content));
      continue;
    }
    const item = buildQueueItem(sourceFile, content, now);
    bySource.set(sourceFile, item);
  }

  const queue = buildQueue(Array.from(bySource.values()), now);
  persistQueue(queue);
  return queue;
}

export function reviewMessage(input: { file?: string; status?: string; note?: string; reviewedBy?: string }): { item: MessageReviewItem; queue: MessageReviewQueue } {
  const status = parseReviewableStatus(input.status);
  const sourceFile = resolveApprovalQueueSource(input.file);
  const queue = ensureQueued(sourceFile);
  const now = new Date().toISOString();
  const items = queue.items.map((item) => item.sourceFile === sourceFile
    ? updateStatus(item, status, input.note ?? '', now, input.reviewedBy ?? 'Daniel', { reviewed: true })
    : item);
  const updatedQueue = buildQueue(items, now);
  persistQueue(updatedQueue);
  return { item: findItem(updatedQueue, sourceFile), queue: updatedQueue };
}

export function markMessageSent(input: { file?: string; channel?: string; note?: string; reviewedBy?: string }): { item: MessageReviewItem; queue: MessageReviewQueue; outreach?: OutreachRecord; nextFollowUpAt?: string } {
  const sourceFile = resolveApprovalQueueSource(input.file);
  const channel = parseChannel(input.channel);
  const queue = ensureQueued(sourceFile);
  const now = new Date().toISOString();
  let outreach: OutreachRecord | undefined;
  let nextFollowUpAt = '';
  const current = findItem(queue, sourceFile);

  if (current.leadId) {
    const tracked = recordManualSent(current.leadId, channel, input.note, now);
    outreach = tracked?.record;
    nextFollowUpAt = tracked?.lead.nextFollowUpAt ?? '';
  }

  const items = queue.items.map((item) => item.sourceFile === sourceFile
    ? updateStatus({ ...item, channel }, 'sent', input.note ?? '', now, input.reviewedBy ?? 'Daniel', { sentAt: now, reviewed: true })
    : item);
  const updatedQueue = buildQueue(items, now);
  persistQueue(updatedQueue);
  return { item: findItem(updatedQueue, sourceFile), queue: updatedQueue, outreach, nextFollowUpAt };
}

export function getMessageQueueSummary(): MessageReviewQueue {
  return normalizeQueue(readMessageReviewQueue<Partial<MessageReviewQueue>>({}));
}

export function findMessageQueueItemBySource(sourceFile: string | undefined): MessageReviewItem | undefined {
  if (!sourceFile) return undefined;
  const queue = getMessageQueueSummary();
  return queue.items.find((item) => item.sourceFile === sourceFile || item.sourceFile.endsWith(sourceFile));
}

export function messageQueueRecommendationForDraft(sourceFile: string | undefined, messageType: ReviewMessageType): {
  status?: MessageReviewStatus;
  command: string;
  reason: string;
} | undefined {
  if (!sourceFile) return undefined;
  const item = findMessageQueueItemBySource(sourceFile);
  const fileArg = sourceFile;
  if (!item) {
    return { command: 'npm run message:queue', reason: 'Draft exists but is not in the message review queue yet.' };
  }
  if (item.status === 'pending_review') {
    return { status: item.status, command: `npm run message:review -- --file ${fileArg} --status approved --note "Reviewed"`, reason: 'Draft is waiting for manual review.' };
  }
  if (item.status === 'approved') {
    return { status: item.status, command: `npm run message:sent -- --file ${fileArg} --channel ${item.channel === 'unknown' ? 'linkedin' : item.channel} --note "Sent manually"`, reason: 'Draft is approved but not marked sent.' };
  }
  if (item.status === 'needs_edit') {
    return { status: item.status, command: `npm run message:optimize -- --file ${fileArg} --type ${messageType}`, reason: 'Draft needs edits before approval.' };
  }
  return { status: item.status, command: 'npm run message:queue', reason: `Draft is currently ${item.status}.` };
}

function ensureQueued(sourceFile: string): MessageReviewQueue {
  const queue = scanMessageQueue();
  if (!queue.items.some((item) => item.sourceFile === sourceFile)) {
    const content = fs.readFileSync(path.join(process.cwd(), sourceFile), 'utf8');
    const item = buildQueueItem(sourceFile, content, new Date().toISOString());
    const updated = buildQueue([...queue.items, item], new Date().toISOString());
    persistQueue(updated);
    return updated;
  }
  return queue;
}

function resolveApprovalQueueSource(file: string | undefined): string {
  if (!file) throw new Error('Missing --file. Example: npm run message:review -- --file lead-123-optimized-linkedin_dm.md --status approved');
  const resolved = path.isAbsolute(file)
    ? path.resolve(file)
    : file.includes(path.sep)
      ? path.resolve(process.cwd(), file)
      : path.resolve(approvalQueueDir, file);
  const root = path.resolve(approvalQueueDir);
  if (!resolved.startsWith(`${root}${path.sep}`)) throw new Error(`Draft must be under approval queue: ${file}`);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) throw new Error(`Approval queue draft not found: ${file}`);
  if (path.extname(resolved).toLowerCase() !== '.md') throw new Error('Only Markdown approval queue drafts are supported.');
  return path.relative(process.cwd(), resolved);
}

function listApprovalDrafts(): string[] {
  if (!fs.existsSync(approvalQueueDir)) return [];
  return fs.readdirSync(approvalQueueDir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => path.join(approvalQueueDir, file))
    .filter((file) => fs.statSync(file).isFile())
    .sort();
}

function buildQueueItem(sourceFile: string, content: string, now: string): MessageReviewItem {
  const fileName = path.basename(sourceFile);
  const messageType = inferMessageType(fileName, content);
  return {
    id: stableId(sourceFile),
    leadId: inferLeadId(fileName, content),
    sourceFile,
    fileName,
    messageType,
    channel: inferChannel(fileName, content, messageType),
    status: 'pending_review',
    statusHistory: [{ status: 'pending_review', note: 'Added by message:queue scan.', changedAt: now, changedBy: 'system' }],
    reviewedAt: '',
    reviewedBy: '',
    sentAt: '',
    qualityWarnings: inferQualityWarnings(content),
    note: '',
    createdAt: now,
    updatedAt: now,
  };
}

function refreshQueueItemMetadata(item: MessageReviewItem, content: string): MessageReviewItem {
  const messageType = inferMessageType(item.fileName, content);
  return {
    ...item,
    leadId: inferLeadId(item.fileName, content),
    messageType,
    channel: inferChannel(item.fileName, content, messageType),
    qualityWarnings: inferQualityWarnings(content),
  };
}

function inferLeadId(fileName: string, content: string): string | undefined {
  return fileName.match(/lead-(.*?)-(?:optimized|audit-based-proposal|followup-due|proposal)/i)?.[1]
    ?? fileName.match(/lead-(.*?)\.md/i)?.[1]
    ?? content.match(/Lead ID:\s*([a-z0-9-]+)/i)?.[1]
    ?? content.match(/leadId["':\s]+([a-z0-9-]+)/i)?.[1];
}

function inferMessageType(fileName: string, content: string): ReviewMessageType {
  const normalized = `${fileName}\n${content}`.toLowerCase();
  if (normalized.includes('linkedin_dm') || normalized.includes('linkedin')) return 'linkedin_dm';
  if (normalized.includes('cold_email') || normalized.includes('subject:')) return 'cold_email';
  if (normalized.includes('instagram_dm') || normalized.includes('instagram')) return 'instagram_dm';
  if (normalized.includes('upwork_proposal') || normalized.includes('upwork')) return 'upwork_proposal';
  if (normalized.includes('follow_up') || normalized.includes('follow-up') || normalized.includes('followup')) return 'follow_up';
  if (normalized.includes('audit_based_proposal') || normalized.includes('audit-based-proposal') || normalized.includes('audit based')) return 'audit_based_proposal';
  if (normalized.includes('objection_response') || normalized.includes('objection')) return 'objection_response';
  if (normalized.includes('closing_message') || normalized.includes('close the loop')) return 'closing_message';
  if (normalized.includes('proposal')) return 'audit_based_proposal';
  return 'unknown';
}

function inferChannel(fileName: string, content: string, messageType: ReviewMessageType): MessageChannel {
  const normalized = `${fileName}\n${content}`.toLowerCase();
  if (messageType === 'linkedin_dm' || normalized.includes('linkedin')) return 'linkedin';
  if (messageType === 'cold_email' || normalized.includes('email')) return 'email';
  if (messageType === 'upwork_proposal' || normalized.includes('upwork')) return 'upwork';
  if (messageType === 'instagram_dm' || normalized.includes('instagram')) return 'instagram';
  return 'unknown';
}

function inferQualityWarnings(content: string): string[] {
  const match = content.match(/### Warnings\s+([\s\S]*?)(?:\n### |\n## |$)/i);
  if (!match) return [];
  return match[1].split('\n')
    .map((line) => line.replace(/^-\s*/, '').trim())
    .filter((line) => line && line.toLowerCase() !== 'none.');
}

function parseReviewableStatus(status: string | undefined): ReviewableStatus {
  if (reviewableStatuses.includes(status as ReviewableStatus)) return status as ReviewableStatus;
  throw new Error(`Unsupported --status. Use one of: ${reviewableStatuses.join(', ')}`);
}

function parseChannel(value: string | undefined): MessageChannel {
  if (messageChannels.includes(value as MessageChannel) && value !== 'unknown') return value as MessageChannel;
  if (!value) return 'linkedin';
  throw new Error(`Unsupported --channel. Use one of: ${messageChannels.filter((channel) => channel !== 'unknown').join(', ')}`);
}

function updateStatus(item: MessageReviewItem, status: MessageReviewStatus, note: string, now: string, changedBy: string, options: { reviewed?: boolean; sentAt?: string }): MessageReviewItem {
  return {
    ...item,
    status,
    reviewedAt: options.reviewed ? now : item.reviewedAt,
    reviewedBy: options.reviewed ? changedBy : item.reviewedBy,
    sentAt: options.sentAt ?? item.sentAt,
    note: note ? [item.note, note].filter(Boolean).join('\n') : item.note,
    statusHistory: [...item.statusHistory, { status, note, changedAt: now, changedBy }],
    updatedAt: now,
  };
}

function buildQueue(items: MessageReviewItem[], generatedAt: string): MessageReviewQueue {
  const summary = emptySummary();
  const sorted = items.sort((a, b) => statusOrder(a.status) - statusOrder(b.status) || b.updatedAt.localeCompare(a.updatedAt) || a.fileName.localeCompare(b.fileName));
  for (const item of sorted) summary[item.status] += 1;
  return { generatedAt, items: sorted, summary };
}

function normalizeQueue(queue: Partial<MessageReviewQueue>): MessageReviewQueue {
  return buildQueue(queue.items ?? [], queue.generatedAt ?? new Date().toISOString());
}

function persistQueue(queue: MessageReviewQueue): void {
  writeMessageReviewQueue(queue);
  writeMessageReviewQueueMarkdown(queue);
}

function findItem(queue: MessageReviewQueue, sourceFile: string): MessageReviewItem {
  const item = queue.items.find((entry) => entry.sourceFile === sourceFile);
  if (!item) throw new Error(`Message queue item not found: ${sourceFile}`);
  return item;
}

function statusOrder(status: MessageReviewStatus): number {
  return { pending_review: 1, approved: 2, needs_edit: 3, rejected: 4, sent: 5, archived: 6 }[status];
}

function recordManualSent(leadId: string, channel: MessageChannel, note: string | undefined, sentAt: string): { lead: Lead; record: OutreachRecord } | undefined {
  if (channel === 'unknown') return undefined;
  const parsedChannel = parseOutreachChannel(channel);
  const leads = mergeLeads(readLeads(), readOpportunities().map(opportunityToLead)).map(applyScoreToLead);
  const lead = leads.find((item) => item.id === leadId);
  if (!lead || ['won', 'lost', 'ignored'].includes(lead.status)) return undefined;
  const nextFollowUpAt = nextFollowUpDate(sentAt);
  const updatedLead: Lead = {
    ...lead,
    status: 'proposal_sent',
    lastContactedAt: sentAt,
    nextFollowUpAt,
    notes: appendHistoryNote(lead.notes, `message-sent:${parsedChannel}`, note, sentAt),
    updatedAt: sentAt,
  };
  const record: OutreachRecord = {
    id: stableId(updatedLead.id, parsedChannel, sentAt),
    leadId: updatedLead.id,
    companyName: updatedLead.companyName,
    channel: parsedChannel,
    messageType: 'proposal',
    sentAt,
    nextFollowUpAt,
    note: note ?? '',
  };
  writeLeads(leads.map((item) => item.id === updatedLead.id ? updatedLead : item));
  writeOpportunities(readOpportunities().map((opportunity) => opportunity.id === updatedLead.id
    ? { ...opportunity, status: 'proposal_sent' as const, notes: appendHistoryNote(opportunity.notes ?? '', `message-sent:${parsedChannel}`, note, sentAt), updatedAt: sentAt }
    : opportunity));
  writeOutreachHistory([...readOutreachHistory(), record]);
  return { lead: updatedLead, record };
}

function appendHistoryNote(existingNotes: string, label: string, note: string | undefined, timestamp: string): string {
  if (!note?.trim()) return existingNotes;
  return [existingNotes.trim(), `[${timestamp}] ${label}: ${note.trim()}`].filter(Boolean).join('\n');
}

function mergeLeads(existing: Lead[], incoming: Lead[]): Lead[] {
  const byId = new Map<string, Lead>();
  for (const lead of existing) byId.set(lead.id, lead);
  for (const lead of incoming) byId.set(lead.id, { ...lead, ...byId.get(lead.id), scoreBreakdown: lead.scoreBreakdown });
  return Array.from(byId.values()).sort((a, b) => b.score - a.score || a.companyName.localeCompare(b.companyName));
}
