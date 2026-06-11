import { Client } from '../clientReports/types';

export type ClientHealth = 'GREEN' | 'YELLOW' | 'RED';

export type RenewalDocumentName =
  | 'renewal-pipeline.md'
  | 'client-health.md'
  | 'renewal-risk-report.md'
  | 'expansion-opportunities.md'
  | 'renewal-actions.md';

export interface RenewalSource {
  label: string;
  path: string;
  exists: boolean;
  content?: string;
}

export interface RenewalClientSources {
  deliveryPlan: RenewalSource;
  evidenceLog: RenewalSource;
  qaChecklist: RenewalSource;
  weeklyDeliverySummary: RenewalSource;
  executiveSummary: RenewalSource;
  weeklyReport: RenewalSource;
  monthlyReport: RenewalSource;
  valueDelivered: RenewalSource;
  renewalSignal: RenewalSource;
  clientUpdateDraft: RenewalSource;
  legacyClientReport: RenewalSource;
}

export interface RenewalClientRecord {
  client: Client;
  sources: RenewalClientSources;
  health: ClientHealth;
  healthScore: number;
  evidenceCount: number;
  completedDeliverables: number;
  reportCount: number;
  nextActionCount: number;
  followUpCount: number;
  renewalRecommendation: string;
  nextAction: string;
  missingEvidence: string[];
  missingReports: string[];
  missingActivity: string[];
  manualReviewReminders: string[];
  expansionOpportunities: string[];
}

export interface RenewalDocument {
  fileName: RenewalDocumentName;
  title: string;
  body: string;
}
