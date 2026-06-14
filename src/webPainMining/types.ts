export type PainMiningStatus = 'Manual web research required' | 'Provider configured' | 'Signals available';

export interface PainMiningSource {
  id: string;
  name: string;
  enabled: boolean;
  sourceType: 'public_reviews' | 'public_forum' | 'search_query';
  queryTemplates: string[];
  allowedUse: string;
  disallowedUse: string[];
}

export interface PainMiningState {
  schemaVersion: number;
  lastRunAt: string | null;
  status: PainMiningStatus;
  apiKeyEnv: string | null;
  notes: string[];
  safetyRules: string[];
}

export interface PainSignal {
  id: string;
  company: string;
  companyName: string;
  source: string;
  url: string;
  signal: string;
  category: string;
  sourceUrl: string;
  sourceTitle: string;
  observedText: string;
  cautiousSummary: string;
  confidence: 'low' | 'medium' | 'high';
  date: string;
  discoveredAt: string;
  sourceType: 'manual' | 'provider';
}

export interface PainMiningReport {
  generatedAt: string;
  status: PainMiningStatus;
  queries: string[];
  signals: PainSignal[];
  topSignal: PainSignal | undefined;
  recurringComplaints: string[];
  qaRiskOpportunities: string[];
  recommendedResearchAction: string;
  safetyRules: string[];
}

export interface PainMiningDashboard {
  topPainSignal: string;
}
