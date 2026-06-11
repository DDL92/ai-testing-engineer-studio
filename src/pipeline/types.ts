import { Lead, RecommendedOffer } from '../leads/types';
import { ContactReviewRecord } from '../contactReview/types';

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
  | 'LOST';

export type OpportunityTier = 'A' | 'B' | 'C';

export interface LocalArtifactStatus {
  researchPack: boolean;
  auditPack: boolean;
  outreachPack: boolean;
  contactReview: boolean;
  clientPrep: boolean;
  clientOnboarding: boolean;
  sow: boolean;
}

export interface OpportunityItem {
  lead: Lead;
  contactReview?: ContactReviewRecord;
  artifacts: LocalArtifactStatus;
  pipelineStage: PipelineStage;
  opportunityScore: number;
  tier: OpportunityTier;
  reason: string;
  nextAction: string;
}

export interface PipelineBreakdown {
  NEW_LEAD: number;
  RESEARCH_READY: number;
  AUDIT_READY: number;
  OUTREACH_READY: number;
  CONTACT_REVIEW: number;
  FOLLOW_UP: number;
  DISCOVERY_CALL: number;
  SOW_READY: number;
  CLIENT_READY: number;
  CLIENT: number;
  PAUSED: number;
  LOST: number;
}

export interface TierSummary {
  A: number;
  B: number;
  C: number;
}

export interface OpportunityTracker {
  generatedAt: string;
  totalLeads: number;
  totalOpportunities: number;
  tierSummary: TierSummary;
  pipelineBreakdown: PipelineBreakdown;
  opportunities: OpportunityItem[];
  topOpportunities: OpportunityItem[];
  followUpsNeeded: OpportunityItem[];
  immediateActions: string[];
}

export type OfferTierWeight = Record<RecommendedOffer, number>;
