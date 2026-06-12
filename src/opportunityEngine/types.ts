import { ChannelRecord } from '../channelResearch/types';
import { CompanyContactRecord, ContactRecord } from '../leadResearch/types';
import { Lead } from '../leads/types';
import { PainResearchRecord } from '../painIntelligence/types';
import { SiteIntelligenceRecord } from '../siteIntelligence/types';

export type OpportunityCategory =
  | 'qa-audit'
  | 'playwright-automation'
  | 'regression-reduction'
  | 'release-confidence'
  | 'quality-engineering'
  | 'mobile-quality'
  | 'checkout-quality'
  | 'booking-quality'
  | 'onboarding-quality'
  | 'agency-partner-retainer';

export type ApprovedFirstOffer =
  | 'QA Audit ($199-$500)'
  | 'Playwright Starter Pack ($900-$1500)'
  | 'QA Automation Retainer ($1500-$3000/month)';

export interface OpportunityTarget {
  companyId: string;
  companyName: string;
  status: 'active' | 'paused';
  source: string;
  notes: string;
}

export interface OutreachRecordForOpportunity {
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

export interface IntelligenceAvailability {
  leadResearch: boolean;
  channelResearch: boolean;
  painIntelligence: boolean;
  siteIntelligence: boolean;
}

export interface OpportunityInputBundle {
  target: OpportunityTarget;
  lead?: Lead;
  contacts?: CompanyContactRecord;
  outreach: OutreachRecordForOpportunity[];
  channels: ChannelRecord[];
  pain?: PainResearchRecord;
  site?: SiteIntelligenceRecord;
  availability: IntelligenceAvailability;
}

export interface BestContactDecision {
  name: string;
  role: string;
  status: string;
  reason: string;
  researchRequired: boolean;
}

export interface BestChannelDecision {
  primary: string;
  secondary: string;
  reason: string;
}

export interface AutomationDecision {
  title: string;
  coverage: string[];
  reason: string;
}

export interface AuditDecision {
  angle: string;
  reason: string;
  recommendedScope: string[];
}

export interface OutreachPriority {
  contact: string;
  company: string;
  priority: number;
  reason: string;
  channel: string;
  status: string;
}

export interface AuditPriority {
  company: string;
  auditOpportunity: string;
  confidence: number;
  recommendedScope: string[];
}

export interface OpportunityReport {
  companyId: string;
  companyName: string;
  opportunityCategory: OpportunityCategory;
  confidenceScore: number;
  researchRequired: boolean;
  bestContact: BestContactDecision;
  bestChannel: BestChannelDecision;
  bestAuditAngle: AuditDecision;
  bestAutomationOpportunity: AutomationDecision;
  bestFirstOffer: ApprovedFirstOffer;
  retainerPath: string;
  commercialReason: string;
  recommendedNextAction: string;
  availability: IntelligenceAvailability;
  outreachPriorities: OutreachPriority[];
  auditPriority: AuditPriority;
  safetyNotes: string[];
}

export interface OpportunitySummary {
  generatedAt: string;
  reports: OpportunityReport[];
  commercialPriorities: OpportunityReport[];
  outreachPriorities: OutreachPriority[];
  auditPriorities: AuditPriority[];
}

export type ScoredContact = ContactRecord & {
  mergedStatus: string;
  score: number;
};
