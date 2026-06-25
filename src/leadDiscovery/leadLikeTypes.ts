export type LeadLikeClassification =
  | 'lead_like'
  | 'possibly_lead_like'
  | 'generic_content'
  | 'directory'
  | 'article'
  | 'definition'
  | 'landing_page'
  | 'unknown';

export interface LeadLikeClassificationResult {
  leadLikeClassification: LeadLikeClassification;
  leadLikeReasons: string[];
  leadLikeScore: number;
  leadLikeConfidence: number;
  leadLikeSignals: string[];
}

export interface LeadLikeCandidateInput {
  sourceUrl: string;
  sourceName: string;
  sourceCategory: string;
  title: string;
  snippet: string;
  query: string;
}
