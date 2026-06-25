import fs = require('fs');
import path = require('path');
import {
  GuardrailQueryInput,
  TavilyBlockedReason,
  TavilyGuardrailResult,
  TavilyGuardrails,
} from './tavilyGuardrailTypes';

const guardrailPath = path.join(process.cwd(), 'data', 'lead-discovery', 'tavily', 'tavily-guardrails.json');

const buyerIntentTerms = [
  'looking for',
  'need ',
  'needs ',
  'necesito',
  'recommendation',
  'recommendations',
  'anyone know',
  'planning',
  'event',
  'wedding',
  'corporate',
  'private dinner',
  'bar service',
  'food service',
  'event rentals',
  'caterer cancelled',
  'food vendor',
  'fundraiser',
  'gala',
  'reception',
  'hosting',
  'organizing',
  'accepting catering quotes',
  'requesting proposals',
  'catering',
  'caterer',
  'family trip',
  'group trip',
  'corporate retreat',
  'luxury villa',
  'villa recommendations',
  'where should we stay',
  'family reunion',
  'need itinerary',
  'planta de tratamiento',
  'ptar',
  'tanque septico',
  'tanque séptico',
  'drenaje',
  'no tengo drenaje',
  'fuera de la red',
  'terreno no drena',
  'construyendo',
  'construyendo hotel',
  'permiso minsa',
  'condominio aguas residuales',
  'aguas residuales',
  'reutilizar agua',
];

export function loadTavilyGuardrails(): TavilyGuardrails {
  if (!fs.existsSync(guardrailPath)) {
    throw new Error(`Tavily guardrails not found: ${path.relative(process.cwd(), guardrailPath)}`);
  }
  return JSON.parse(fs.readFileSync(guardrailPath, 'utf8')) as TavilyGuardrails;
}

export function applyTavilyGuardrails<TQuery extends GuardrailQueryInput>(
  queries: TQuery[],
  guardrails = loadTavilyGuardrails(),
): TavilyGuardrailResult<TQuery> {
  if (!guardrails.enabled) {
    return {
      allowedQueries: queries,
      blockedQueries: [],
      blockedReasons: emptyBlockedReasons(),
      clientDistribution: distributionByClient(queries),
    };
  }

  const blockedQueries: TavilyGuardrailResult<TQuery>['blockedQueries'] = [];
  const allowedQueries: TQuery[] = [];
  const allowedByClient = new Map<string, number>();
  let allowedRunCount = 0;

  for (const query of sortByClientPriority(queries, guardrails)) {
    const reasons: TavilyBlockedReason[] = [];
    const clientId = query.clientId?.trim();

    if (guardrails.limits.requireClientId && !clientId) reasons.push('missing_client_id');
    if (clientId && !guardrails.allowedClientIds.includes(clientId)) reasons.push('client_not_allowed');
    if (guardrails.blockedVerticals.includes(query.vertical)) reasons.push('blocked_vertical');
    if (guardrails.limits.requireBuyerIntent && !hasBuyerIntent(query)) reasons.push('missing_buyer_intent');

    if (reasons.length === 0) {
      const currentClientCount = allowedByClient.get(clientId!) ?? 0;
      if (currentClientCount >= guardrails.limits.maxQueriesPerClient) reasons.push('over_client_limit');
      if (allowedRunCount >= guardrails.limits.maxQueriesPerRun) reasons.push('over_run_limit');
    }

    if (reasons.length > 0) {
      blockedQueries.push({ query, blockedReasons: reasons });
      continue;
    }

    allowedQueries.push(query);
    allowedByClient.set(clientId!, (allowedByClient.get(clientId!) ?? 0) + 1);
    allowedRunCount += 1;
  }

  return {
    allowedQueries,
    blockedQueries,
    blockedReasons: countBlockedReasons(blockedQueries.flatMap((blocked) => blocked.blockedReasons)),
    clientDistribution: distributionByClient(allowedQueries),
  };
}

function hasBuyerIntent(query: GuardrailQueryInput): boolean {
  if (query.intentType && query.intentType.trim().length > 0) return true;
  const text = `${query.query} ${query.leadType ?? ''} ${query.purpose ?? ''}`.toLowerCase();
  return buyerIntentTerms.some((term) => text.includes(term));
}

function sortByClientPriority<TQuery extends GuardrailQueryInput>(
  queries: TQuery[],
  guardrails: TavilyGuardrails,
): TQuery[] {
  const order = new Map(guardrails.priority.clientOrder.map((clientId, index) => [clientId, index]));
  return [...queries].sort((left, right) => {
    const leftRank = order.get(left.clientId ?? '') ?? Number.MAX_SAFE_INTEGER;
    const rightRank = order.get(right.clientId ?? '') ?? Number.MAX_SAFE_INTEGER;
    if (leftRank !== rightRank) return leftRank - rightRank;
    const leftTemplateRank = templateTypeRank(left);
    const rightTemplateRank = templateTypeRank(right);
    if (leftTemplateRank !== rightTemplateRank) return leftTemplateRank - rightTemplateRank;
    const leftPriorityRank = sourcePriorityRank(left);
    const rightPriorityRank = sourcePriorityRank(right);
    if (leftPriorityRank !== rightPriorityRank) return leftPriorityRank - rightPriorityRank;
    const leftQualityRank = expectedQualityRank(left);
    const rightQualityRank = expectedQualityRank(right);
    if (leftQualityRank !== rightQualityRank) return leftQualityRank - rightQualityRank;
    const leftSourceRank = sourceRank(left);
    const rightSourceRank = sourceRank(right);
    if (leftSourceRank !== rightSourceRank) return leftSourceRank - rightSourceRank;
    return left.query.localeCompare(right.query);
  });
}

function templateTypeRank(query: GuardrailQueryInput): number {
  if (query.queryTemplateType === 'source_specific') return 0;
  if (query.queryTemplateType === 'dynamic') return 1;
  if (query.queryTemplateType === 'behavior') return 2;
  if (query.queryTemplateType === 'social') return 3;
  return 4;
}

function sourceRank(query: GuardrailQueryInput): number {
  const sourceId = query.sourceId ?? '';
  if (sourceId === 'reddit') return 0;
  if (sourceId === 'facebook_public') return 1;
  if (sourceId === 'community_recommendation_threads') return 2;
  if (sourceId === 'event_request_boards' || sourceId === 'rfp_boards') return 3;
  if (sourceId === 'instagram_public') return 4;
  if (sourceId === 'tiktok_public') return 5;
  return 6;
}

function sourcePriorityRank(query: GuardrailQueryInput): number {
  if (query.sourceQueryPriority === 'high') return 0;
  if (query.sourceQueryPriority === 'medium') return 1;
  if (query.sourceQueryPriority === 'low') return 2;
  return 3;
}

function expectedQualityRank(query: GuardrailQueryInput): number {
  if (query.expectedLeadQuality === 'high') return 0;
  if (query.expectedLeadQuality === 'medium') return 1;
  if (query.expectedLeadQuality === 'low') return 2;
  return 3;
}

function distributionByClient(queries: GuardrailQueryInput[]): Record<string, number> {
  return queries.reduce<Record<string, number>>((counts, query) => {
    const key = query.clientId || 'missing_client_id';
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function countBlockedReasons(reasons: TavilyBlockedReason[]): Record<TavilyBlockedReason, number> {
  return reasons.reduce<Record<TavilyBlockedReason, number>>((counts, reason) => {
    counts[reason] += 1;
    return counts;
  }, emptyBlockedReasons());
}

function emptyBlockedReasons(): Record<TavilyBlockedReason, number> {
  return {
    client_not_allowed: 0,
    blocked_vertical: 0,
    missing_client_id: 0,
    missing_buyer_intent: 0,
    over_client_limit: 0,
    over_run_limit: 0,
  };
}
