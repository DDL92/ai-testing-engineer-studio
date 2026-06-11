import { Lead, LeadScoreResult } from '../leads/types';

export type AuditPackDocumentName =
  | 'executive-summary.md'
  | 'qa-risk-summary.md'
  | 'playwright-opportunities.md'
  | 'automation-roadmap.md'
  | 'retainer-recommendation.md';

export interface LocalMarkdownSource {
  label: string;
  path: string;
  exists: boolean;
  content?: string;
}

export interface AuditPackInput {
  lead: Lead;
  score: LeadScoreResult;
  researchPack: LocalMarkdownSource;
  auditReport: LocalMarkdownSource;
}

export interface AuditPackDocument {
  fileName: AuditPackDocumentName;
  title: string;
  body: string;
}

export interface AuditPack {
  leadId: string;
  companyName: string;
  generatedAt: string;
  sourceSummary: string[];
  documents: AuditPackDocument[];
}
