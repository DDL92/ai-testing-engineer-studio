import { ApprovedFirstOffer } from '../opportunityEngine/types';

export type LeadActionType = 'REVIEW' | 'WAIT' | 'REFINE' | 'FOLLOW-UP' | 'PREPARE PROPOSAL';

export interface LeadIntelligenceState {
  schemaVersion: number;
  updatedAt: string;
  scoringNotes: string[];
  safetyRules: string[];
}

export interface LeadScoreBreakdown {
  opportunityScore: number;
  evidenceReadiness: number;
  proposalReadiness: number;
  executiveReadiness: number;
  commercialPotential: number;
  auditFit: number;
  starterPackFit: number;
  retainerFit: number;
}

export interface LeadIntelligenceItem {
  companyId: string;
  companyName: string;
  overallScore: number;
  recommendedOffer: ApprovedFirstOffer;
  strongestSignals: string[];
  reason: string;
  fastestRevenuePath: string;
  recommendedActionType: LeadActionType;
  recommendedNextAction: string;
  estimatedManualEffort: string;
  scoreBreakdown: LeadScoreBreakdown;
}

export interface LeadOpportunitySummary {
  strongestCandidate: LeadIntelligenceItem | undefined;
  fastestPathToRevenue: LeadIntelligenceItem | undefined;
  bestQaAuditCandidate: LeadIntelligenceItem | undefined;
  bestStarterPackCandidate: LeadIntelligenceItem | undefined;
  futureRetainerCandidate: LeadIntelligenceItem | undefined;
}

export interface LeadIntelligenceReport {
  generatedAt: string;
  state: LeadIntelligenceState;
  leads: LeadIntelligenceItem[];
  opportunities: LeadOpportunitySummary;
  scoringFormula: string[];
  safetyRules: string[];
}
