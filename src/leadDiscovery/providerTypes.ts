export type ProviderName = 'tavily' | 'bing_rss';

export type ProviderStatus =
  | 'healthy'
  | 'degraded'
  | 'disabled'
  | 'missing_api_key'
  | 'network_error';

export interface ProviderConfig {
  providerName: ProviderName;
  enabled: boolean;
  priority: number;
  requiresApiKey: boolean;
  status: ProviderStatus;
  notes: string;
}

export interface ProviderRegistry {
  providers: ProviderConfig[];
}

export interface TavilyProviderGuardrails {
  enabled: boolean;
  maxDailyQueries: number;
  maxQueriesPerClient: number;
  maxTestQueries: number;
  prioritizeFlora: boolean;
  prioritizePayingClientsOnly: boolean;
  fallbackEnabled: boolean;
}

export interface ProviderSelection {
  providerName: ProviderName;
  providerReason: string;
  fallbackEnabled: boolean;
  tavilyConfigured: boolean;
  fallbackProvider?: ProviderName;
}
