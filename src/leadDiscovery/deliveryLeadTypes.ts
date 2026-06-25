import { ContactabilityLevel, LeadTier } from './enrichedLeadTypes';
import { BuyerType, IntentStrength } from './buyerIntentTypes';
import { BuyerRole, BuyerRoleConfidence } from './buyerRoleTypes';
import { LeadSourceCategory } from './sourceTypes';
import { LeadVertical } from './types';
import type { VerificationFailureReason } from './verificationTypes';
import { CandidateEvidence } from './evidenceTypes';
import type { ResultRelevanceEvaluation } from './relevanceTypes';
import type { LeadLikeClassificationResult } from './leadLikeTypes';

export type DeliveryQueue =
  | 'qualified_cold'
  | 'warm_intent'
  | 'interest_verification';

export type SourceQuality =
  | 'high'
  | 'medium'
  | 'low';

export interface DeliveryLeadCandidate {
  id: string;
  clientId: string;
  clientName: string;
  vertical: LeadVertical;
  sourceName: string;
  sourceCategory: LeadSourceCategory;
  query: string;
  queryTemplateId?: string;
  queryTemplateType?: 'standard' | 'social' | 'source_specific' | 'intent_rewrite' | 'conversation' | 'behavior' | 'dynamic';
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
  sourceQuality: SourceQuality;
  buyerType: BuyerType;
  buyerRole: BuyerRole;
  buyerRoleConfidence: BuyerRoleConfidence;
  buyerRoleSignals: string[];
  buyerRoleReasons: string[];
  intentStrength: IntentStrength;
  intentSignals: string[];
  exclusionSignals: string[];
  competitorDetected: boolean;
  leadTier: LeadTier;
  overallScore: number;
  deliveryQueue: DeliveryQueue;
  duplicateGroupId: string;
  duplicateReason: string | null;
  excluded: boolean;
  exclusionReason: string | null;
  verificationFailureReasons?: VerificationFailureReason[];
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
  resultRelevance: ResultRelevanceEvaluation['resultRelevance'];
  relevanceReasons: string[];
  domainBlocked: boolean;
  domainCategory: string;
}
