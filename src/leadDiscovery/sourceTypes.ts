import { LeadVertical } from './types';

export type LeadDiscoveryRiskLevel = 'low' | 'medium' | 'high';

export type LeadSourceCategory =
  | 'public_forum'
  | 'public_social'
  | 'public_directory'
  | 'public_job_board'
  | 'public_review'
  | 'public_event_board'
  | 'public_business_listing';

export interface LeadIntentSignal {
  phrase: string;
  weight: number;
  notes: string;
}

export interface LeadSourceConfig {
  vertical: LeadVertical;
  sourceName: string;
  category: LeadSourceCategory;
  enabled: boolean;
  requiresLogin: boolean;
  automationRisk: LeadDiscoveryRiskLevel;
  keywords: string[];
  notes: string;
}

export interface LeadKeywordSet {
  vertical: LeadVertical;
  searchPhrases: string[];
  servicePhrases: string[];
  urgencyPhrases: string[];
  budgetPhrases: string[];
  locationPhrases: string[];
}
