import { LeadSourceCategory } from './sourceTypes';
import { LeadVertical } from './types';
import { LeadLikeClassificationResult } from './leadLikeTypes';

export type SearchCandidateRiskLevel = 'low' | 'medium' | 'high';

export interface SearchCandidate {
  id: string;
  clientId: string;
  clientName: string;
  vertical: LeadVertical;
  sourceId?: string;
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
  url: string;
  title: string;
  snippet: string;
  discoveredAt: string;
  riskLevel: SearchCandidateRiskLevel;
  manualReviewRequired: boolean;
  notes: string;
  leadLikeClassification: LeadLikeClassificationResult['leadLikeClassification'];
  leadLikeReasons: string[];
  leadLikeScore: number;
  leadLikeConfidence: number;
  leadLikeSignals: string[];
  behaviorScore?: number;
  behaviorConfidence?: number;
  behaviorReasons?: string[];
  buyerSignals?: string[];
  buyerSignalCount?: number;
  buyerSignalCategories?: string[];
  buyerSignalStrength?: 'weak' | 'medium' | 'strong';
}

export interface SearchSourceResult {
  clientId: string;
  clientName: string;
  query: string;
  queryTemplateId?: string;
  queryTemplateType?: 'standard' | 'social' | 'source_specific' | 'behavior' | 'dynamic';
  sourceId?: string;
  sourceCategory?: LeadSourceCategory;
  sourceQueryPriority?: 'high' | 'medium' | 'low';
  expectedLeadQuality?: 'high' | 'medium' | 'low';
  behaviorCategory?: string;
  behaviorSignals?: string[];
  executedAt: string;
  candidateCount: number;
  error: string | null;
}

export interface SearchCandidateBatch {
  generatedAt: string;
  maxQueriesPerClient: number;
  maxCandidatesPerQuery: number;
  totalClients: number;
  totalQueriesExecuted: number;
  totalCandidates: number;
  candidates: SearchCandidate[];
  sourceResults: SearchSourceResult[];
  safetyRules: string[];
}
