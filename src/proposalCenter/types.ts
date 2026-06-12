import { ContactReviewRecord } from '../contactReview/types';
import { Lead, RecommendedOffer } from '../leads/types';

export type ProposalReadinessStatus = 'READY' | 'PARTIAL' | 'NOT READY';
export type ProposalOfferType = 'QA Audit' | 'Playwright Starter Pack' | 'QA Automation Retainer';

export interface ProposalArtifacts {
  researchPack: boolean;
  leadPack: boolean;
  auditPack: boolean;
  outreachPack: boolean;
  contactReview: boolean;
  clientWorkflow: boolean;
  sow: boolean;
}

export interface ProposalContextSource {
  label: string;
  path: string;
  exists: boolean;
  excerpt: string;
}

export interface ProposalOpportunity {
  lead: Lead;
  contactReview?: ContactReviewRecord;
  artifacts: ProposalArtifacts;
  proposalPriorityScore: number;
  readinessStatus: ProposalReadinessStatus;
  offerType: ProposalOfferType;
  scopeClarity: ProposalReadinessStatus;
  auditEvidenceStatus: string;
  contactStatus: string;
  sowReadiness: ProposalReadinessStatus;
  revenuePotential: string;
  retainerFit: ProposalReadinessStatus;
  missingRequirements: string[];
  nextRequiredStep: string;
  suggestedCommand: string;
  scoreReasons: string[];
}

export interface ProposalCenterInput {
  generatedAt: string;
  leads: Lead[];
  contactReviews: ContactReviewRecord[];
  contextSources: ProposalContextSource[];
}

export interface ProposalCenterReport {
  generatedAt: string;
  totalLeads: number;
  commercialLeads: number;
  excludedLeads: number;
  opportunities: ProposalOpportunity[];
  topFive: ProposalOpportunity[];
  proposalReady: ProposalOpportunity[];
  auditOfferCandidates: ProposalOpportunity[];
  starterPackCandidates: ProposalOpportunity[];
  retainerCandidates: ProposalOpportunity[];
  contextSources: ProposalContextSource[];
}

export type OfferPricingRanges = Record<ProposalOfferType, string>;
export type RecommendedOfferMap = Record<RecommendedOffer, ProposalOfferType>;
