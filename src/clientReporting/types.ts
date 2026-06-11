import { Client } from '../clientReports/types';

export type ClientReportingDocumentName =
  | 'executive-summary.md'
  | 'weekly-report.md'
  | 'monthly-report.md'
  | 'value-delivered.md'
  | 'renewal-signal.md'
  | 'client-update-draft.md';

export type RenewalSignal = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ClientReportingSource {
  label: string;
  path: string;
  exists: boolean;
  content?: string;
}

export interface EvidenceSummary {
  auditEvidence: string[];
  screenshots: string[];
  testResults: string[];
  defects: string[];
  risks: string[];
  recommendations: string[];
  followUpItems: string[];
  evidenceCount: number;
}

export interface ClientReportingInput {
  client: Client;
  deliveryPlan: ClientReportingSource;
  evidenceLog: ClientReportingSource;
  qaChecklist: ClientReportingSource;
  weeklyDeliverySummary: ClientReportingSource;
}

export interface ClientReportingDocument {
  fileName: ClientReportingDocumentName;
  title: string;
  body: string;
}

export interface RenewalSignalResult {
  signal: RenewalSignal;
  reasons: string[];
}
