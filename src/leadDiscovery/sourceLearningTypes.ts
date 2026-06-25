export type SourceLearningRecommendation =
  | 'increase'
  | 'keep'
  | 'reduce'
  | 'disable'
  | 'needs_more_data';

export interface SourceLearningRow {
  sourceId: string;
  totalQueries: number;
  totalCandidates: number;
  leadLikeCandidates: number;
  deliveryCandidates: number;
  verificationCandidates: number;
  verifiedLeads: number;
  sourceScore: number;
  recommendation: SourceLearningRecommendation;
}
