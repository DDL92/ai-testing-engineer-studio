import { LeadSourceCategory } from './sourceTypes';

export type ProviderHealthStatus =
  | 'healthy'
  | 'degraded'
  | 'rate_limited'
  | 'empty_responses'
  | 'timeouts'
  | 'query_blocked'
  | 'provider_failure'
  | 'unknown';

export type SearchFailureCategory =
  | 'query_blocked'
  | 'provider_empty'
  | 'timeout'
  | 'rate_limit'
  | 'network_error'
  | 'parser_error'
  | 'unknown';

export interface ResponseDiagnostic {
  statusCode?: number;
  responseSize: number;
  resultsReturned: number;
  emptyResponse: boolean;
  rateLimited: boolean;
  timeout: boolean;
  parserFailure: boolean;
  providerError: boolean;
  notes: string;
}

export interface QueryExecutionDiagnostic {
  diagnosticId: string;
  clientId: string;
  sourceId?: string;
  sourceCategory?: LeadSourceCategory;
  query: string;
  queryTemplateId?: string;
  providerUsed: string;
  providerReason?: string;
  fallbackActivated?: boolean;
  providerDurationMs?: number;
  providerResultCount?: number;
  providerFailureReason?: string | null;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  success: boolean;
  failureReason: SearchFailureCategory | null;
  blockedByGuardrails: boolean;
  wasSentToProvider: boolean;
  response: ResponseDiagnostic;
}

export interface SearchDiagnosticsBatch {
  generatedAt: string;
  diagnostics: QueryExecutionDiagnostic[];
  safetyRules: string[];
}
