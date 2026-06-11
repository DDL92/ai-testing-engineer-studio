import { Lead } from '../leads/types';

export type LeadDiscoveryTier = 'A' | 'B' | 'C';

export interface TierCounts {
  A: number;
  B: number;
  C: number;
}

export interface IcpSummary {
  name: string;
  count: number;
}

export interface LeadInventorySummary {
  totalLeads: number;
  tierCounts: TierCounts;
  topIcps: IcpSummary[];
}

export interface LocalContextSource {
  label: string;
  path: string;
  exists: boolean;
  excerpt: string;
}

export interface LeadDiscoveryAutomationInput {
  generatedAt: string;
  leads: Lead[];
  inventory: LeadInventorySummary;
  contextSources: LocalContextSource[];
}

export interface DiscoverySourceGuidance {
  name: string;
  useCase: string;
  safetyNote: string;
}

export interface SearchQueryGroup {
  category: string;
  queries: string[];
}
