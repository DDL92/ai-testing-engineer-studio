import { LeadSourceCategory } from './sourceTypes';
import { LeadVertical } from './types';
import { CandidateEvidence } from './evidenceTypes';
import type { ResultRelevanceEvaluation } from './relevanceTypes';
import type { LeadLikeClassificationResult } from './leadLikeTypes';

export type LeadTier =
  | 'qualified_cold'
  | 'warm_intent'
  | 'interest_verification_candidate';

export type ContactabilityLevel =
  | 'high'
  | 'medium'
  | 'low'
  | 'unknown';

export interface EnrichedLeadCandidate {
  id: string;
  clientId: string;
  clientName: string;
  vertical: LeadVertical;
  sourceName: string;
  sourceCategory: LeadSourceCategory;
  query: string;
  queryTemplateId?: string;
  queryTemplateType?: 'standard' | 'social' | 'source_specific' | 'behavior' | 'dynamic';
  expectedSourceTypes?: string[];
  sourceQueryPriority?: 'high' | 'medium' | 'low';
  expectedLeadQuality?: 'high' | 'medium' | 'low';
  behaviorCategory?: string;
  behaviorSignals?: string[];
  behaviorScore?: number;
  behaviorConfidence?: number;
  behaviorReasons?: string[];
  buyerSignals?: string[];
  buyerSignalCount?: number;
  buyerSignalCategories?: string[];
  buyerSignalStrength?: 'weak' | 'medium' | 'strong';
  url: string;
  title: string;
  snippet: string;
  discoveredAt: string;
  estimatedLeadType: string;
  estimatedLocation: string;
  estimatedRecencyDays: number | null;
  estimatedBudgetSignal: string;
  estimatedEventType: string;
  estimatedTripType: string;
  estimatedContactability: ContactabilityLevel;
  intentScore: number;
  recencyScore: number;
  locationFitScore: number;
  budgetScore: number;
  contactabilityScore: number;
  overallScore: number;
  leadTier: LeadTier;
  manualReviewRequired: boolean;
  reasons: string[];
  notes: string;
  leadLikeClassification: LeadLikeClassificationResult['leadLikeClassification'];
  leadLikeReasons: string[];
  leadLikeScore: number;
  leadLikeConfidence: number;
  leadLikeSignals: string[];
  buyerEvidence: CandidateEvidence['buyerEvidence'];
  buyerEvidenceCount: number;
  recencyEvidence: CandidateEvidence['recencyEvidence'];
  recencyEvidenceCount: number;
  contactMethodEvidence: CandidateEvidence['contactMethodEvidence'];
  recommendedContactMethod: CandidateEvidence['recommendedContactMethod'];
  contactMethodReason: string;
  contactActionStatus: CandidateEvidence['contactActionStatus'];
  verificationReadiness: CandidateEvidence['verificationReadiness'];
  readinessReasons: string[];
  resultRelevance?: ResultRelevanceEvaluation['resultRelevance'];
  relevanceReasons?: string[];
  domainBlocked?: boolean;
  domainCategory?: string;
}
