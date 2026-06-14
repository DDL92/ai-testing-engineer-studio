export type WebDiscoveryStatus = 'Manual web research required' | 'Provider configured' | 'Results available';

export type SearchProviderName = 'manual' | 'tavily' | 'brave' | 'serpapi' | 'custom';

export interface SearchProviderConfig {
  provider: SearchProviderName;
  apiKeyEnv: string | null;
  endpoint: string | null;
  enabled: boolean;
}

export interface WebDiscoveryState {
  schemaVersion: number;
  lastRunAt: string | null;
  status: WebDiscoveryStatus;
  provider: SearchProviderConfig;
  notes: string[];
  safetyRules: string[];
}

export interface WebSearchSource {
  id: string;
  niche: string;
  enabled: boolean;
  queryTemplates: string[];
  allowedSources: string[];
  disallowedSources: string[];
}

export interface WebLeadCandidate {
  id: string;
  name: string;
  companyName: string;
  website: string;
  source: string;
  sourceUrl: string;
  sourceTitle: string;
  snippet: string;
  niche: string;
  discoveryDate: string;
  query: string;
  confidence: number;
  notes: string;
  discoveredAt: string;
  sourceType: 'manual' | 'provider';
  evidence: string[];
  score: number;
  scoreReasons: string[];
  recommendedOffer: string;
  recommendedAction: string;
  painSignalCount: number;
  status: 'needs-human-review' | 'ranked';
}

export interface WebLeadDiscoveryReport {
  generatedAt: string;
  status: WebDiscoveryStatus;
  provider: SearchProviderConfig;
  queries: string[];
  manualResearchChecklist: string[];
  leads: WebLeadCandidate[];
  topFive: WebLeadCandidate[];
  topLead: WebLeadCandidate | undefined;
  bestNewQaOpportunity: string;
  recommendedResearchAction: string;
  safetyRules: string[];
}

export interface WebDiscoveryDashboard {
  newWebLeads: number;
  topWebLead: string;
  topPainSignal: string;
  bestNewQaOpportunity: string;
  recommendedResearchAction: string;
  newLeadsToday: number;
  topOpportunity: string;
  bestNewLead: string;
  leadSource: string;
  discoveryDate: string;
}
