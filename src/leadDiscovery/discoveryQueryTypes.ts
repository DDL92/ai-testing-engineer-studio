import { LeadSourceCategory } from './sourceTypes';
import { LeadVertical } from './types';

export type DiscoveryQueryPurpose =
  | 'find_recent_intent'
  | 'find_contact_context'
  | 'find_source_candidates'
  | 'verify_recency'
  | 'prepare_interest_verification';

export type DiscoveryQueryRiskLevel = 'low' | 'medium' | 'high';

export interface DiscoveryQuery {
  id: string;
  clientId: string;
  clientName: string;
  vertical: LeadVertical;
  sourceId?: string;
  sourceName: string;
  sourceCategory: LeadSourceCategory;
  query: string;
  baseQuery?: string;
  negativeQueryTerms?: string[];
  targetLocation: string;
  leadType: string;
  purpose: DiscoveryQueryPurpose;
  recencyDays: number;
  riskLevel: DiscoveryQueryRiskLevel;
  manualReviewRequired: boolean;
  notes: string;
  queryTemplateId?: string;
  queryTemplateType?: 'standard' | 'social' | 'source_specific' | 'intent_rewrite' | 'conversation' | 'behavior' | 'dynamic';
  expectedSourceTypes?: string[];
  intentType?: string;
  sourceQueryPriority?: 'high' | 'medium' | 'low';
  expectedLeadQuality?: 'high' | 'medium' | 'low';
  behaviorCategory?: string;
  behaviorSignals?: string[];
  rewrittenQueries?: string[];
  rewriteSource?: string;
  rewriteReason?: string;
  rewritePhrase?: string;
  conversationSource?: string;
}

export interface DiscoveryQueryBatch {
  generatedAt: string;
  totalQueries: number;
  clients: Array<{
    clientId: string;
    clientName: string;
    vertical: LeadVertical;
    totalQueries: number;
  }>;
  queries: DiscoveryQuery[];
  safetyRules: string[];
  negativeQueryTerms?: string[];
}
