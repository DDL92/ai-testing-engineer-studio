import { LeadVertical } from './types';

export type TavilyBlockedReason =
  | 'client_not_allowed'
  | 'blocked_vertical'
  | 'missing_client_id'
  | 'missing_buyer_intent'
  | 'over_client_limit'
  | 'over_run_limit';

export interface TavilyGuardrails {
  enabled: boolean;
  priority: {
    floraFirst: boolean;
    clientOrder: string[];
  };
  allowedClientIds: string[];
  blockedVerticals: string[];
  limits: {
    maxQueriesPerRun: number;
    maxQueriesPerClient: number;
    maxResultsPerQuery: number;
    requireBuyerIntent: boolean;
    requireClientId: boolean;
    recencyFirst: boolean;
  };
  budgetPhilosophy: string;
  manualReviewRequired: boolean;
  prohibitedActions: string[];
}

export interface GuardrailQueryInput {
  id: string;
  clientId?: string;
  clientName?: string;
  vertical: LeadVertical | string;
  query: string;
  intentType?: string;
  leadType?: string;
  purpose?: string;
  queryTemplateId?: string;
  queryTemplateType?: 'standard' | 'social' | 'source_specific' | 'intent_rewrite' | 'conversation' | 'behavior' | 'dynamic';
  sourceId?: string;
  sourceCategory?: string;
  sourceQueryPriority?: 'high' | 'medium' | 'low';
  expectedLeadQuality?: 'high' | 'medium' | 'low';
  behaviorCategory?: string;
  behaviorSignals?: string[];
  expectedSourceTypes?: string[];
}

export interface GuardrailAllowedQuery<TQuery extends GuardrailQueryInput = GuardrailQueryInput> {
  query: TQuery;
}

export interface GuardrailBlockedQuery<TQuery extends GuardrailQueryInput = GuardrailQueryInput> {
  query: TQuery;
  blockedReasons: TavilyBlockedReason[];
}

export interface TavilyGuardrailResult<TQuery extends GuardrailQueryInput = GuardrailQueryInput> {
  allowedQueries: TQuery[];
  blockedQueries: Array<GuardrailBlockedQuery<TQuery>>;
  blockedReasons: Record<TavilyBlockedReason, number>;
  clientDistribution: Record<string, number>;
}
