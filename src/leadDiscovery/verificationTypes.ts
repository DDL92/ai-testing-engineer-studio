import { DeliveryQueue, SourceQuality } from './deliveryLeadTypes';
import { CandidateEvidence } from './evidenceTypes';
import type { ResultRelevanceEvaluation } from './relevanceTypes';
import { LeadVertical } from './types';

export type VerificationStatus =
  | 'pending_daniel_review'
  | 'approved_for_manual_contact'
  | 'rejected';

export type VerificationPromotionStatus =
  | 'pending_review'
  | 'verification_review'
  | 'verification_ready';

export type VerificationConfidence =
  | 'low'
  | 'medium'
  | 'high';

export type VerificationFailureReason =
  | 'not_buyer'
  | 'not_buying_service'
  | 'weak_intent'
  | 'location_mismatch'
  | 'low_score'
  | 'low_source_quality'
  | 'unknown_recency'
  | 'vendor_or_directory'
  | 'missing_event_signal'
  | 'contactability_too_low';

export interface VerificationQueueItem {
  id: string;
  clientId: string;
  clientName: string;
  vertical: LeadVertical;
  url: string;
  title: string;
  snippet: string;
  query?: string;
  queryTemplateId?: string;
  estimatedLeadType: string;
  estimatedLocation: string;
  estimatedRecencyDays: number | null;
  estimatedBudgetSignal: string;
  sourceQuality: SourceQuality;
  overallScore: number;
  deliveryQueue: DeliveryQueue;
  suggestedMessage: string;
  salesContext: string;
  approvalStatus: VerificationStatus;
  manualReviewRequired: boolean;
  notes: string;
}

export interface VerificationFailureItem {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  url: string;
  query: string;
  queryTemplateId?: string;
  overallScore: number;
  buyerType: string;
  buyerRole?: string;
  buyerRoleConfidence?: string;
  buyerRoleReasons?: string[];
  rejectionReason?: string | null;
  intentStrength: string;
  sourceQuality: string;
  failureReasons: VerificationFailureReason[];
  recommendedContactMethod: CandidateEvidence['recommendedContactMethod'];
  buyerEvidenceCount: number;
  recencyEvidenceCount: number;
  verificationReadiness: CandidateEvidence['verificationReadiness'];
  readinessReasons: string[];
  resultRelevance: ResultRelevanceEvaluation['resultRelevance'];
  domainCategory: string;
  domainBlocked: boolean;
  relevanceReasons: string[];
}

export interface VerificationBatch {
  generatedAt: string;
  totalDeliveryCandidates: number;
  totalVerificationCandidates: number;
  queueItems: VerificationQueueItem[];
  failureItems?: VerificationFailureItem[];
  safetyRules: string[];
}

export interface VerificationEvidenceResult {
  verificationEvidence: string[];
  verificationEvidenceCount: number;
  verificationConfidence: VerificationConfidence;
  buyerVerificationEvidence: string[];
  intentVerificationEvidence: string[];
  recencyVerificationEvidence: string[];
  promotionReasons: string[];
  verificationPromotionStatus: VerificationPromotionStatus;
}

export interface VerificationReviewQueueItem {
  id: string;
  candidateId: string;
  clientId: string;
  clientName: string;
  sourceName: string;
  sourceCategory: string;
  url: string;
  title: string;
  snippet: string;
  query: string;
  queryTemplateId?: string;
  queryTemplateType?: string;
  overallScore: number;
  buyerType: string;
  buyerRole?: string;
  buyerRoleConfidence?: string;
  buyerRoleReasons?: string[];
  rejectionReason?: string | null;
  intentStrength: string;
  sourceQuality: string;
  resultRelevance: string;
  deliveryQueue: DeliveryQueue;
  verificationPromotionStatus: VerificationPromotionStatus;
  verificationConfidence: VerificationConfidence;
  verificationEvidence: string[];
  verificationEvidenceCount: number;
  buyerVerificationEvidence: string[];
  intentVerificationEvidence: string[];
  recencyVerificationEvidence: string[];
  recommendedContactMethod: CandidateEvidence['recommendedContactMethod'];
  promotionReasons: string[];
  approvalStatus: 'pending_daniel_review';
  manualReviewRequired: true;
}

export interface VerificationReviewBatch {
  generatedAt: string;
  totalDeliveryCandidates: number;
  totalReviewCandidates: number;
  totalReadyCandidates: number;
  reviewItems: VerificationReviewQueueItem[];
  safetyRules: string[];
}
