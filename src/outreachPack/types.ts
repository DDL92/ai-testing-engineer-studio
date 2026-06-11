import { Lead, LeadScoreResult, OutreachChannel } from '../leads/types';

export type OutreachPackDocumentName =
  | 'contact-strategy.md'
  | 'linkedin-message.md'
  | 'email-draft.md'
  | 'follow-up-1.md'
  | 'follow-up-2.md'
  | 'call-invite.md'
  | 'safety-checklist.md';

export interface LocalSourceStatus {
  label: string;
  path: string;
  exists: boolean;
}

export interface OutreachPackInput {
  lead: Lead;
  score: LeadScoreResult;
  researchPack: LocalSourceStatus;
  auditPack: LocalSourceStatus;
  auditReport: LocalSourceStatus;
}

export interface OutreachAngle {
  summary: string;
  auditPhrase: string;
  painPointText: string;
}

export interface OutreachPackDocument {
  fileName: OutreachPackDocumentName;
  title: string;
  body: string;
}

export interface OutreachPack {
  leadId: string;
  companyName: string;
  generatedAt: string;
  channel: OutreachChannel;
  angle: OutreachAngle;
  documents: OutreachPackDocument[];
}
