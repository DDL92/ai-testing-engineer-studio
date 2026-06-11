import { Client } from '../clientReports/types';

export type PipelineStage =
  | 'NEW_LEAD'
  | 'RESEARCH_READY'
  | 'AUDIT_READY'
  | 'OUTREACH_READY'
  | 'CONTACT_REVIEW'
  | 'FOLLOW_UP'
  | 'DISCOVERY_CALL'
  | 'SOW_READY'
  | 'CLIENT_READY'
  | 'CLIENT'
  | 'PAUSED'
  | 'LOST'
  | 'UNKNOWN';

export type ClientHealth = 'GREEN' | 'YELLOW' | 'RED' | 'UNKNOWN';

export interface Lead {
  id: string;
  companyName: string;
  website: string;
  industry: string;
  source: string;
  status: string;
  fitNotes: string;
  painPoints: string[];
  recommendedOffer: string;
  nextAction: string;
  score: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContactReview {
  leadId: string;
  companyName: string;
  contactStatus: string;
  messageStatus: string;
  nextFollowUpDate: string;
  updatedAt: string;
}

export interface OperatorSource {
  label: string;
  path: string;
  exists: boolean;
  content: string;
}

export interface OperatorInput {
  generatedAt: string;
  today: string;
  leads: Lead[];
  clients: Client[];
  contactReviews: ContactReview[];
  commercialMode?: {
    enabled: boolean;
    totalLeads: number;
    commercialLeads: number;
    excludedDemoLeads: number;
    topCommercialCompanies: string[];
  };
  opportunityTracker: OperatorSource;
  topOpportunities: OperatorSource;
  followUpNeeded: OperatorSource;
  dashboard: OperatorSource;
  clientOps: OperatorSource;
  nextActions: OperatorSource;
  renewalPipeline: OperatorSource;
  clientHealth: OperatorSource;
  renewalRiskReport: OperatorSource;
  expansionOpportunities: OperatorSource;
  renewalActions: OperatorSource;
}

export interface OperatorOpportunity {
  company: string;
  leadId: string;
  opportunityScore: number;
  stage: PipelineStage;
  offer: string;
  nextAction: string;
  dailyPriorityScore: number;
}

export interface FollowUpSummary {
  due: ContactReview[];
  overdue: ContactReview[];
  future: ContactReview[];
}

export interface RenewalClient {
  client: string;
  clientId: string;
  status: string;
  monthlyValue: string;
  health: ClientHealth;
  renewalRecommendation: string;
  nextAction: string;
}

export interface OperatorAction {
  label: string;
  command: string;
  score: number;
  reason: string;
}

export interface OperatorDocument {
  fileName: 'daily-command-center.md' | 'weekly-success-review.md' | 'monthly-success-review.md';
  title: string;
  body: string;
}
