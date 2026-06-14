import { NormalizedWebLead, RecommendedQualifiedOffer } from '../webLeadQualification/types';

export type LeadRotationReadinessStatus = 'READY' | 'PARTIAL' | 'NOT READY';
export type LeadRotationRecommendation = 'PROMOTE' | 'REVIEW' | 'DEMOTE';

export interface LeadRotationCandidate {
  rank: number;
  companyId: string;
  companyName: string;
  website: string;
  category: string;
  recommendedOffer: RecommendedQualifiedOffer;
  qualificationScore: number;
  qaOpportunityScore: number;
  evidenceStatus: LeadRotationReadinessStatus;
  companyConfidence: number;
  evidenceConfidence: number;
  painConfidence: number;
  falsePositivePenalty: number;
  commercialReadinessScore: number;
  readiness: LeadRotationReadinessStatus;
  recommendation: LeadRotationRecommendation;
  blockers: string[];
  reasons: string[];
  sourceLead: NormalizedWebLead;
}

export interface LeadRotationDecision {
  generatedAt: string;
  topRankedLead: LeadRotationCandidate | null;
  actionableLead: LeadRotationCandidate | null;
  candidates: LeadRotationCandidate[];
  demotedLeads: LeadRotationCandidate[];
  rotationStatus: 'ACTIONABLE_LEAD_FOUND' | 'NO_ACTIONABLE_LEAD';
  evidenceBlockers: string[];
  safetyRules: string[];
}
