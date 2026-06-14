import { NormalizedWebLead, RecommendedQualifiedOffer } from '../webLeadQualification/types';
import { LeadRotationCandidate } from '../leadRotation/types';

export interface UnifiedTopLead {
  rank: number;
  companyId: string;
  companyName: string;
  category: string;
  website: string;
  qualificationScore: number;
  qaOpportunityScore: number;
  painSignalRelevance: number;
  offerFitScore: number;
  historicalPerformanceScore: number;
  selectionScore: number;
  recommendedOffer: RecommendedQualifiedOffer;
  executionPriority: string;
  nextRevenueAction: string;
  whySelected: string[];
  sourceLead: NormalizedWebLead;
}

export interface RevenueDecision {
  status: 'GO' | 'REVIEW' | 'WAIT';
  reason: string;
  manualAction: string;
}

export interface RevenueIntelligenceReport {
  generatedAt: string;
  previousTopLead: string;
  topLead: UnifiedTopLead | null;
  actionableLead: LeadRotationCandidate | null;
  decision: RevenueDecision;
  unifiedRecommendation: string;
  executionPriority: string;
  safetyRules: string[];
}

export interface RevenueIntelligenceDashboard {
  revenueIntelligenceStatus: string;
  currentTopLead: string;
  actionableLead: string;
  commercialReadiness: string;
  evidenceBlockers: string;
  rotationStatus: string;
  revenueTarget: string;
  recommendedOffer: string;
  executionPriority: string;
}
