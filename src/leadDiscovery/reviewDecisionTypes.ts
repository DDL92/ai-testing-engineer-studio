import type { BuyerRole } from './buyerRoleTypes';
import type { IntentStrength } from './buyerIntentTypes';

export type ReviewDecisionStatus =
  | 'approve'
  | 'reject'
  | 'hold'
  | 'needs_recency_check'
  | 'false_positive';

export type ApprovedReviewReason =
  | 'real buyer'
  | 'high intent'
  | 'good fit'
  | 'recent post'
  | 'high commercial value';

export type RejectedReviewReason =
  | 'directory'
  | 'vendor'
  | 'staffing'
  | 'article'
  | 'stale'
  | 'not buyer'
  | 'duplicate'
  | 'low value';

export type HoldReviewReason =
  | 'needs more evidence'
  | 'unclear intent'
  | 'ambiguous source';

export type ReviewReason =
  | ApprovedReviewReason
  | RejectedReviewReason
  | HoldReviewReason;

export interface ReviewDecisionInput {
  candidateId: string;
  clientId: string;
  decision: ReviewDecisionStatus;
  reviewReason: ReviewReason;
  reviewDate?: string;
  notes?: string;
}

export interface ReviewDecisionRecord {
  candidateId: string;
  clientId: string;
  reviewDate: string;
  decision: ReviewDecisionStatus;
  reviewReason: ReviewReason;
  notes: string;
}

export interface ReviewCandidateContext {
  candidateId: string;
  clientId: string;
  clientName: string;
  source: string;
  sourceCategory: string;
  query: string;
  title: string;
  snippet: string;
  buyerRole: BuyerRole | string;
  buyerSignals: string[];
  intentSignals: string[];
  leadLikeSignals: string[];
  reasons: string[];
  commercialValue: string;
  intentStrength: IntentStrength | string;
}

export interface ReviewHistoryRecord extends ReviewDecisionRecord {
  clientName: string;
  source: string;
  sourceCategory: string;
  query: string;
  title: string;
  snippet: string;
  buyerRole: BuyerRole | string;
  buyerSignals: string[];
  intentSignals: string[];
  leadLikeSignals: string[];
  reasons: string[];
  commercialValue: string;
  intentStrength: IntentStrength | string;
  learningApplied: boolean;
  learningType: 'positive' | 'negative' | 'hold' | 'recency' | 'none';
}

export interface ReviewState {
  generatedAt: string;
  latestDecisions: ReviewHistoryRecord[];
  safetyRules: string[];
}

export interface ReviewHistory {
  generatedAt: string;
  decisions: ReviewHistoryRecord[];
  safetyRules: string[];
}

export interface ReviewMetrics {
  totalDecisions: number;
  approvedCount: number;
  rejectedCount: number;
  holdCount: number;
  needsRecencyCheckCount: number;
  falsePositiveCount: number;
  approvalRate: number;
  rejectionRate: number;
  topApprovalReasons: string;
  topRejectionReasons: string;
  learningCount: number;
  lastReviewDate: string | null;
}

export const approvedReviewReasons: ApprovedReviewReason[] = [
  'real buyer',
  'high intent',
  'good fit',
  'recent post',
  'high commercial value',
];

export const rejectedReviewReasons: RejectedReviewReason[] = [
  'directory',
  'vendor',
  'staffing',
  'article',
  'stale',
  'not buyer',
  'duplicate',
  'low value',
];

export const holdReviewReasons: HoldReviewReason[] = [
  'needs more evidence',
  'unclear intent',
  'ambiguous source',
];

export const reviewSafetyRules = [
  'Human review decisions are local only.',
  'No Tavily, provider calls, network requests, browser automation, login, scraping, contact extraction, outreach, emails, DMs, calls, or forms are used.',
  'Decisions record commercial judgment only and do not send messages or contact anyone.',
  'False-positive and positive learning are deterministic local training artifacts.',
];
