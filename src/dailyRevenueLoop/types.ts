import { ClientAuditReport } from '../clientAuditReports/types';
import { OpportunityReport } from '../opportunityEngine/types';
import { ProposalPackage } from '../proposalEngine/types';
import { UnifiedAuditReport } from '../unifiedAuditGenerator/types';

export interface DailyRevenueState {
  version: number;
  mode: 'local-review-only';
  lastGeneratedAt: string | null;
  notes: string[];
}

export interface WeeklyRevenueState {
  version: number;
  mode: 'local-review-only';
  weekStartsOn: string;
  notes: string[];
}

export interface ContactPerson {
  name: string;
  role: string;
  department: string;
  linkedinUrl: string;
  priority: number;
  reason: string;
  status: string;
  source: string;
  notes: string;
}

export interface CompanyContactGroup {
  companyId: string;
  companyName: string;
  contacts: ContactPerson[];
}

export interface OutreachRecord {
  companyId: string;
  companyName: string;
  contactName: string;
  contactRole: string;
  channel: string;
  status: string;
  sentAt: string;
  lastTouchAt: string;
  nextFollowUpAt: string | null;
  messageType: string;
  notes: string;
  humanApproved: boolean;
}

export interface DailyLoopContextSource {
  label: string;
  path: string;
  exists: boolean;
}

export interface CompanyRevenueProfile {
  companyId: string;
  companyName: string;
  contacts: ContactPerson[];
  outreach: OutreachRecord[];
  opportunity?: OpportunityReport;
  unifiedAudit?: UnifiedAuditReport;
  clientAudit?: ClientAuditReport;
  proposal?: ProposalPackage;
  proposalMarkdownExists: boolean;
  proposalPdfExists: boolean;
  unifiedAuditExists: boolean;
  clientAuditMarkdownExists: boolean;
  clientAuditPdfExists: boolean;
  evidenceExists: boolean;
  lighthouseExists: boolean;
  playwrightEvidenceExists: boolean;
  repliesWaiting: number;
  followUpsDue: OutreachRecord[];
  scheduledFollowUps: OutreachRecord[];
  opportunityScore: number;
  evidenceReadiness: number;
  researchNeeded: boolean;
}

export interface DailyRevenueLoopInput {
  generatedAt: string;
  today: string;
  dailyState: DailyRevenueState;
  weeklyState: WeeklyRevenueState;
  contacts: CompanyContactGroup[];
  outreach: OutreachRecord[];
  profiles: CompanyRevenueProfile[];
  contextSources: DailyLoopContextSource[];
}

export type DailyRevenueActionType =
  | 'review-reply'
  | 'review-follow-up'
  | 'review-proposal'
  | 'review-audit'
  | 'collect-evidence'
  | 'research-lead';

export interface DailyRevenueAction {
  priority: number;
  type: DailyRevenueActionType;
  companyId: string;
  companyName: string;
  title: string;
  whyItMatters: string;
  estimatedImpact: string;
  recommendedNextStep: string;
  score: number;
}

export interface DailyRevenueSummaryMetrics {
  leadsResearched: number;
  contactsAdded: number;
  outreachTracked: number;
  auditsGenerated: number;
  proposalsGenerated: number;
  evidenceCollected: number;
}

export interface DailyRevenuePlan {
  generatedAt: string;
  today: string;
  totalActiveLeads: number;
  totalContacts: number;
  repliesWaiting: number;
  followUpsDue: number;
  proposalCandidates: number;
  auditCandidates: number;
  topActions: DailyRevenueAction[];
  profiles: CompanyRevenueProfile[];
}

export interface DailyRevenueSummary {
  generatedAt: string;
  today: string;
  metrics: DailyRevenueSummaryMetrics;
  contextSources: DailyLoopContextSource[];
}

export interface WeeklyRevenueReview {
  generatedAt: string;
  today: string;
  topOpportunities: CompanyRevenueProfile[];
  pipelineHealth: {
    activeLeads: number;
    proposalReady: number;
    auditReady: number;
    researchOnly: number;
    followUpsDue: number;
  };
  researchGaps: string[];
  evidenceGaps: string[];
  nextWeekPriorities: DailyRevenueAction[];
}
