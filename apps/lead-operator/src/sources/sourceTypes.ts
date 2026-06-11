import type { LeadSource } from '../types/lead';

export type SourceCategory =
  | 'public_job_board'
  | 'startup_directory'
  | 'agency_directory'
  | 'github_public_search'
  | 'rss_feed'
  | 'manual_seed'
  | 'upwork_manual'
  | 'linkedin_manual'
  | 'instagram_manual'
  | 'referral'
  | 'other';

export type SourceQualityCategory = 'excellent' | 'good' | 'experimental' | 'low priority';
export type SourceRecommendation = 'keep' | 'improve_keywords' | 'disable' | 'review_manually' | 'add_more_similar_sources';

export interface EnhancedLeadSource extends LeadSource {
  category?: SourceCategory;
  priority?: number;
  maxResults?: number;
  includeKeywords?: string[];
  excludeKeywords?: string[];
  allowedDomains?: string[];
  manualReviewRequired?: boolean;
}

export interface SourceQualityRecord {
  id: string;
  name: string;
  type: LeadSource['type'];
  enabled: boolean;
  url: string;
  category: SourceCategory;
  keywords: string[];
  lastCheckedAt: string;
  totalOpportunitiesFound: number;
  hotLeadsFound: number;
  warmLeadsFound: number;
  lowLeadsFound: number;
  ignoredLeadsFound: number;
  averageLeadScore: number;
  conversionCount: number;
  wonCount: number;
  lostCount: number;
  sourceQualityScore: number;
  sourceQualityCategory: SourceQualityCategory;
  recommendation: SourceRecommendation;
  notes: string;
  warnings: string[];
}

export interface SourceQualityReport {
  generatedAt: string;
  summary: {
    totalSources: number;
    enabledSources: number;
    disabledSources: number;
    excellentSources: number;
    goodSources: number;
    experimentalSources: number;
    lowPrioritySources: number;
    bestSource: string;
    worstSource: string;
  };
  records: SourceQualityRecord[];
  recommendations: string[];
}
