export type SourcePerformanceRecommendation =
  | 'increase'
  | 'keep'
  | 'reduce'
  | 'disable'
  | 'needs_more_data';

export interface SourcePerformanceRow {
  sourceId?: string;
  source: string;
  sourceCategory?: string;
  queryTemplateType?: 'standard' | 'social' | 'source_specific' | 'intent_rewrite' | 'conversation' | 'behavior' | 'dynamic' | 'unknown';
  expectedLeadQuality?: 'high' | 'medium' | 'low';
  query: string;
  clientId: string;
  candidatesGenerated: number;
  enrichedCandidates: number;
  deliveryCandidates: number;
  verificationCandidates: number;
  verifiedLeads: number;
  meetingsBooked: number;
  quotesSent: number;
  won: number;
  lost: number;
  badFit: number;
  noResponse: number;
  performanceScore: number;
  recommendation: SourcePerformanceRecommendation;
}

export interface SourcePerformanceBatch {
  generatedAt: string;
  rows: SourcePerformanceRow[];
  sourceRows: SourcePerformanceRow[];
  queryRows: SourcePerformanceRow[];
  recommendationRows: SourcePerformanceRow[];
  recommendationDeduplicationCount: number;
  filesGenerated: string[];
}
