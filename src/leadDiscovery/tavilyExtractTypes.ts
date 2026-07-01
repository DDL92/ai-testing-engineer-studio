import { LeadLikeClassification } from './leadLikeTypes';
import { LeadDiscoveryRiskLevel, LeadSourceCategory } from './sourceTypes';
import { LeadVertical } from './types';

export type TavilyExtractAdapterMode = 'offline_ready';

export type TavilyExtractBlockedReason =
  | 'not_lead_like'
  | 'blocked_source_type'
  | 'missing_buyer_intent_evidence'
  | 'non_public_url'
  | 'login_required'
  | 'contact_extraction_needed'
  | 'low_relevance'
  | 'unsupported_url';

export type TavilyExtractSourceType =
  | LeadSourceCategory
  | 'vendor'
  | 'directory'
  | 'article'
  | 'staffing'
  | 'job_post'
  | 'private_login'
  | 'unknown';

export interface TavilyExtractInputCandidate {
  candidateId: string;
  clientId: string;
  clientName?: string;
  vertical?: LeadVertical;
  sourceUrl: string;
  sourceType: TavilyExtractSourceType;
  title: string;
  snippet: string;
  query?: string;
  leadLikeClassification: LeadLikeClassification;
  buyerSignals?: string[];
  buyerSignalCount?: number;
  buyerSignalStrength?: 'weak' | 'medium' | 'strong';
  riskLevel: LeadDiscoveryRiskLevel;
  requiresLogin?: boolean;
  contactExtractionNeeded?: boolean;
  relevance?: 'relevant' | 'low' | 'directory' | 'vendor' | 'article' | 'staffing' | 'job_post' | 'unknown';
  sampleOnly?: boolean;
}

export interface TavilyExtractQueueCandidate {
  candidateId: string;
  clientId: string;
  sourceUrl: string;
  sourceType: TavilyExtractSourceType;
  reasonForExtraction: string;
  expectedExtractionValue: string;
  riskLevel: LeadDiscoveryRiskLevel;
  allowed: boolean;
  blockedReason: TavilyExtractBlockedReason | null;
  sampleOnly: boolean;
}

export interface TavilyExtractQueueBatch {
  generatedAt: string;
  adapterStatus: TavilyExtractAdapterStatus;
  totalCandidatesReviewed: number;
  queueCount: number;
  allowedCount: number;
  blockedCount: number;
  candidates: TavilyExtractQueueCandidate[];
  safetyRules: string[];
  futureIntegrationPath: string[];
}

export interface TavilyExtractAdapterStatus {
  mode: TavilyExtractAdapterMode;
  liveExtractionEnabled: false;
  providerCallsAllowed: false;
  networkCallsAllowed: false;
  creditsUsed: 0;
  status: string;
}

export interface TavilyExtractSimulationResult {
  generatedAt: string;
  status: 'pass' | 'fail';
  expectedAllowedCount: number;
  expectedBlockedCount: number;
  allowedCount: number;
  blockedCount: number;
  scenarios: TavilyExtractQueueCandidate[];
  safetyRules: string[];
  futureIntegrationPath: string[];
}
