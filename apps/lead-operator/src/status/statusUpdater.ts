import { Lead, LeadStatus } from '../types/lead';

export const supportedLeadStatuses: LeadStatus[] = [
  'new',
  'scored',
  'approved',
  'contacted',
  'replied',
  'audit_offered',
  'audit_completed',
  'proposal_sent',
  'won',
  'lost',
  'ignored',
];

export function parseLeadStatus(status: string | undefined): LeadStatus {
  if (!status || !supportedLeadStatuses.includes(status as LeadStatus)) {
    throw new Error(`Invalid status. Supported statuses: ${supportedLeadStatuses.join(', ')}`);
  }

  return status as LeadStatus;
}

export function updateLeadStatus(lead: Lead, status: LeadStatus, note?: string): Lead {
  const now = new Date().toISOString();
  return {
    ...lead,
    status,
    notes: appendNote(lead.notes, status, note, now),
    updatedAt: now,
    lastContactedAt: status === 'contacted' ? now : lead.lastContactedAt,
    nextFollowUpAt: nextFollowUpAt(status, now, lead.nextFollowUpAt),
  };
}

function appendNote(existingNotes: string, status: LeadStatus, note: string | undefined, timestamp: string): string {
  if (!note?.trim()) return existingNotes;
  const entry = `[${timestamp}] status=${status}: ${note.trim()}`;
  return [existingNotes.trim(), entry].filter(Boolean).join('\n');
}

function nextFollowUpAt(status: LeadStatus, timestamp: string, existing: string): string {
  if (status === 'contacted') return addDays(timestamp, 2);
  if (status === 'audit_offered') return addDays(timestamp, 5);
  if (status === 'proposal_sent') return addDays(timestamp, 3);
  return existing;
}

function addDays(timestamp: string, days: number): string {
  const date = new Date(timestamp);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}
