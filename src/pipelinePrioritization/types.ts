import { Client } from '../clientReports/types';
import { ContactReviewRecord } from '../contactReview/types';
import { Lead, RecommendedOffer } from '../leads/types';

export type PrioritizationTier = 'A' | 'B' | 'C';

export type PrioritizationStage =
  | 'NEW_LEAD'
  | 'RESEARCH_READY'
  | 'LEAD_PACK_READY'
  | 'AUDIT_READY'
  | 'OUTREACH_READY'
  | 'CONTACT_REVIEW'
  | 'FOLLOW_UP'
  | 'SOW_READY'
  | 'CLIENT_READY'
  | 'CLIENT'
  | 'PAUSED'
  | 'LOST';

export interface PrioritizationArtifacts {
  researchPack: boolean;
  leadPack: boolean;
  auditPack: boolean;
  outreachPack: boolean;
  contactReview: boolean;
  sow: boolean;
  clientWorkflow: boolean;
}

export interface LocalContextSource {
  label: string;
  path: string;
  exists: boolean;
  excerpt: string;
}

export interface PipelinePriorityInput {
  generatedAt: string;
  today: string;
  leads: Lead[];
  contactReviews: ContactReviewRecord[];
  clients: Client[];
  contextSources: LocalContextSource[];
}

export interface PrioritizedOpportunity {
  lead: Lead;
  contactReview?: ContactReviewRecord;
  client?: Client;
  artifacts: PrioritizationArtifacts;
  stage: PrioritizationStage;
  tier: PrioritizationTier;
  priorityScore: number;
  revenuePath: string;
  pricingRange: string;
  whyItMatters: string;
  nextAction: string;
  suggestedCommand: string;
  stalledReasons: string[];
  scoreReasons: string[];
}

export interface PriorityAction {
  title: string;
  company: string;
  reason: string;
  command: string;
  expectedOutput: string;
  manualApprovalNote: string;
  priorityScore: number;
}

export interface PipelinePrioritizationReport {
  generatedAt: string;
  totalLeads: number;
  totalPrioritized: number;
  tierA: PrioritizedOpportunity[];
  tierB: PrioritizedOpportunity[];
  tierC: PrioritizedOpportunity[];
  readyNow: PrioritizedOpportunity[];
  needsResearch: PrioritizedOpportunity[];
  needsAuditPack: PrioritizedOpportunity[];
  needsOutreachPack: PrioritizedOpportunity[];
  needsContactReview: PrioritizedOpportunity[];
  needsSow: PrioritizedOpportunity[];
  needsFollowUp: PrioritizedOpportunity[];
  shouldPause: PrioritizedOpportunity[];
  topRevenueOpportunities: PrioritizedOpportunity[];
  topActions: PriorityAction[];
  stalledOpportunities: PrioritizedOpportunity[];
  contextSources: LocalContextSource[];
}

export type OfferPricingRanges = Record<RecommendedOffer, string>;
