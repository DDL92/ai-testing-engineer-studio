import { LeadVertical } from './types';

export type PublicSourceType =
  | 'rss_feed'
  | 'public_event_calendar'
  | 'public_forum'
  | 'public_notice'
  | 'chamber_event_page'
  | 'venue_event_page'
  | 'wedding_forum'
  | 'municipality_page'
  | 'tourism_event_page'
  | 'construction_notice_page'
  | 'real_estate_development_page'
  | 'local_business_directory';

export type PublicSourceRiskLevel = 'low' | 'medium' | 'high';

export type PublicSourceEnrichmentType =
  | 'geo'
  | 'event'
  | 'tourism'
  | 'municipality'
  | 'seasonality'
  | 'venue_proximity'
  | 'project_value'
  | 'weather_context'
  | 'business_profile';

export type EnrichmentReadiness = 'none' | 'partial' | 'ready';

export interface EnrichmentReadinessMetadata {
  readiness: EnrichmentReadiness;
  score: number;
  availableSignals: string[];
  missingSignals: string[];
  futureHooks: PublicSourceEnrichmentType[];
  notes: string;
}

export interface PublicSourceMonitor {
  sourceId: string;
  sourceName: string;
  sourceType: PublicSourceType;
  clientId: string;
  vertical: LeadVertical;
  url: string;
  allowed: boolean;
  requiresLogin: boolean;
  riskLevel: PublicSourceRiskLevel;
  expectedSignals: string[];
  supportedEnrichmentTypes: PublicSourceEnrichmentType[];
  notes: string;
  useCase?: string;
  enrichmentNotes?: string;
  sampleOnly?: boolean;
}

export interface PublicSourceCandidate {
  candidateId: string;
  title: string;
  snippet: string;
  sourceType: PublicSourceType;
  sourceId: string;
  clientId: string;
  vertical: LeadVertical;
  inferredIntent: string;
  expectedValue: number;
  locationHint: string | null;
  eventTypeHint: string | null;
  projectTypeHint: string | null;
  dateHint: string | null;
  enrichmentReadiness: EnrichmentReadinessMetadata;
  supportedEnrichmentTypes: PublicSourceEnrichmentType[];
  sampleOnly: boolean;
}

export interface SourceMonitorHealth {
  status: 'ready' | 'needs_review' | 'blocked';
  enabledSourceCount: number;
  blockedSourceCount: number;
  lowRiskSourceCount: number;
  highRiskSourceCount: number;
  recommendedNextAction: string;
}

export interface SourceMonitorResult {
  generatedAt: string;
  sources: PublicSourceMonitor[];
  health: SourceMonitorHealth;
  summary: {
    totalSources: number;
    allowedSources: number;
    blockedSources: number;
    sourcesByClient: Record<string, number>;
    sourcesByVertical: Record<string, number>;
    riskDistribution: Record<string, number>;
    enrichmentTypeDistribution: Record<string, number>;
  };
  safetyRules: string[];
}
