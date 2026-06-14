import { NormalizedWebLead, RecommendedQualifiedOffer } from '../webLeadQualification/types';

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
  decision: RevenueDecision;
  unifiedRecommendation: string;
  executionPriority: string;
  safetyRules: string[];
}

export interface RevenueIntelligenceDashboard {
  revenueIntelligenceStatus: string;
  currentTopLead: string;
  revenueTarget: string;
  recommendedOffer: string;
  executionPriority: string;
}
