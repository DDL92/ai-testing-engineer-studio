import fs = require('fs');
import path = require('path');
import { DiscoveryQuery, DiscoveryQueryBatch } from './discoveryQueryTypes';
import { LeadDiscoveryClientConfig } from './clientTypes';
import { SearchCandidate, SearchCandidateBatch, SearchSourceResult } from './searchCandidateTypes';
import { applyTavilyGuardrails, loadTavilyGuardrails } from './applyTavilyGuardrails';
import { GuardrailBlockedQuery } from './tavilyGuardrailTypes';
import { classifyLeadLikeCandidate } from './classifyLeadLikeCandidate';
import { scoreBehavioralIntent } from './scoreBehavioralIntent';
import { tavilySearch } from '../integrations/tavily/tavilyClient';
import { selectSearchProvider } from './providerRouter';
import { ProviderSelection } from './providerTypes';
import { extractBuyerSignals } from './extractBuyerSignals';
import {
  QueryExecutionDiagnostic,
  ResponseDiagnostic,
  SearchDiagnosticsBatch,
  SearchFailureCategory,
} from './searchDiagnosticsTypes';

interface SearchResultItem {
  url: string;
  title: string;
  snippet: string;
}

interface SearchExecutionResult {
  providerUsed: string;
  providerReason: string;
  fallbackActivated: boolean;
  results: SearchResultItem[];
  responseDiagnostic: ResponseDiagnostic;
}

const maxQueriesPerClient = 25;
const maxCandidatesPerQuery = 10;
const requestTimeoutMs = 10000;

const clientsDir = path.join(process.cwd(), 'data', 'lead-discovery', 'clients');
const queryBatchPath = path.join(process.cwd(), 'output', 'lead-discovery', 'discovery-queries', 'discovery-queries.json');
const sourceQueryBatchPath = path.join(process.cwd(), 'output', 'lead-discovery', 'targeted-discovery', 'source-queries.json');
const rewriteQueryBatchPath = path.join(process.cwd(), 'output', 'lead-discovery', 'query-rewrites', 'rewritten-queries.json');
const conversationQueryBatchPath = path.join(process.cwd(), 'output', 'lead-discovery', 'conversation-queries', 'conversation-queries.json');
const behaviorQueryBatchPath = path.join(process.cwd(), 'output', 'lead-discovery', 'behavior-queries', 'behavior-queries.json');
const dynamicQueryBatchPath = path.join(process.cwd(), 'output', 'lead-discovery', 'dynamic-queries', 'dynamic-queries.json');
const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'search-candidates');
const summaryPath = path.join(outputDir, 'search-summary.md');
const candidatesPath = path.join(outputDir, 'search-candidates.json');
const blockedQueriesMdPath = path.join(outputDir, 'blocked-queries.md');
const blockedQueriesJsonPath = path.join(outputDir, 'blocked-queries.json');
const diagnosticsDir = path.join(process.cwd(), 'output', 'lead-discovery', 'diagnostics');
const diagnosticsJsonPath = path.join(diagnosticsDir, 'search-execution-diagnostics.json');
const searchQualityDir = path.join(process.cwd(), 'output', 'lead-discovery', 'search-quality');
const searchCandidatePreviewPath = path.join(searchQualityDir, 'search-candidate-preview.md');
const sourcePerformancePreviewPath = path.join(searchQualityDir, 'source-performance-preview.md');

const safetyRules = [
  'Safe public search only: public search result pages are queried with strict limits.',
  'No login, browser automation, crawling, form submission, messaging, outreach, or contact extraction is performed.',
  'Only source URL, page title, snippet, query, and source metadata are stored.',
  'Email addresses and phone-like strings are redacted if they appear in search titles or snippets.',
  'Manual review is required before enrichment, delivery, contact, or client-facing use.',
];

export async function runSafePublicSearch(now = new Date()): Promise<SearchCandidateBatch> {
  const generatedAt = now.toISOString();
  const clients = readActiveClients().sort(compareClientPriority);
  const queryBatch = readQueryBatch();
  const sourceQueryBatch = readSourceQueryBatch();
  const rewriteQueryBatch = readRewriteQueryBatch();
  const conversationQueryBatch = readConversationQueryBatch();
  const behaviorQueryBatch = readBehaviorQueryBatch();
  const dynamicQueryBatch = readDynamicQueryBatch();
  const guardrails = loadTavilyGuardrails();
  const clientIds = new Set(clients.map((client) => client.clientId));
  const guardrailInput = prioritizeQueries([
    ...sourceQueryBatch.queries,
    ...rewriteQueryBatch.queries,
    ...conversationQueryBatch.queries,
    ...behaviorQueryBatch.queries,
    ...dynamicQueryBatch.queries,
    ...queryBatch.queries,
  ]
    .filter((query) => clientIds.has(query.clientId)));
  const guardrailResult = applyTavilyGuardrails(guardrailInput, guardrails);
  const maxQueriesPerClientForRun = guardrails.limits.maxQueriesPerClient;
  const maxCandidatesPerQueryForRun = guardrails.limits.maxResultsPerQuery;
  const candidates: SearchCandidate[] = [];
  const sourceResults: SearchSourceResult[] = [];
  const diagnostics: QueryExecutionDiagnostic[] = guardrailResult.blockedQueries.map((blocked, index) => blockedQueryDiagnostic(blocked, generatedAt, index + 1));

  for (const client of clients) {
    const queries = guardrailResult.allowedQueries
      .filter((query) => query.clientId === client.clientId)
      .slice(0, maxQueriesPerClientForRun);

    for (const query of queries) {
      const startedAt = new Date();
      try {
        const execution = await executePublicSearch(query.query);
        const completedAt = new Date();
        const limited = execution.results.slice(0, maxCandidatesPerQueryForRun);
        for (const result of limited) {
          candidates.push(toCandidate(query, result, generatedAt, candidates.length + 1));
        }
        const querySucceeded = limited.length > 0;
        const failureReason = querySucceeded ? null : 'provider_empty';
        diagnostics.push(queryDiagnostic({
          query,
          index: diagnostics.length + 1,
          startedAt,
          completedAt,
          providerUsed: execution.providerUsed,
          providerReason: execution.providerReason,
          fallbackActivated: execution.fallbackActivated,
          success: querySucceeded,
          failureReason,
          responseDiagnostic: execution.responseDiagnostic,
        }));
        sourceResults.push({
          clientId: client.clientId,
          clientName: client.clientName,
          query: query.query,
          queryTemplateId: query.queryTemplateId,
          queryTemplateType: query.queryTemplateType,
          sourceId: query.sourceId,
          sourceCategory: query.sourceCategory,
          sourceQueryPriority: query.sourceQueryPriority,
          expectedLeadQuality: query.expectedLeadQuality,
          behaviorCategory: query.behaviorCategory,
          behaviorSignals: query.behaviorSignals,
          rewrittenQueries: query.rewrittenQueries,
          rewriteSource: query.rewriteSource,
          rewriteReason: query.rewriteReason,
          rewritePhrase: query.rewritePhrase,
          conversationSource: query.conversationSource,
          executedAt: generatedAt,
          candidateCount: limited.length,
          error: failureReason ? diagnosticMessage(failureReason, execution.responseDiagnostic) : null,
        });
      } catch (error) {
        const completedAt = new Date();
        const responseDiagnostic = responseDiagnosticFromError(error);
        const failureReason = failureCategoryFromResponse(responseDiagnostic);
        diagnostics.push(queryDiagnostic({
          query,
          index: diagnostics.length + 1,
          startedAt,
          completedAt,
          providerUsed: providerNameFromError(error),
          providerReason: providerReasonFromError(error),
          fallbackActivated: fallbackActivatedFromError(error),
          success: false,
          failureReason,
          responseDiagnostic,
        }));
        sourceResults.push({
          clientId: client.clientId,
          clientName: client.clientName,
          query: query.query,
          queryTemplateId: query.queryTemplateId,
          queryTemplateType: query.queryTemplateType,
          sourceId: query.sourceId,
          sourceCategory: query.sourceCategory,
          sourceQueryPriority: query.sourceQueryPriority,
          expectedLeadQuality: query.expectedLeadQuality,
          behaviorCategory: query.behaviorCategory,
          behaviorSignals: query.behaviorSignals,
          rewrittenQueries: query.rewrittenQueries,
          rewriteSource: query.rewriteSource,
          rewriteReason: query.rewriteReason,
          rewritePhrase: query.rewritePhrase,
          conversationSource: query.conversationSource,
          executedAt: generatedAt,
          candidateCount: 0,
          error: diagnosticMessage(failureReason, responseDiagnostic),
        });
      }
    }
  }

  const batch: SearchCandidateBatch = {
    generatedAt,
    maxQueriesPerClient: maxQueriesPerClientForRun,
    maxCandidatesPerQuery: maxCandidatesPerQueryForRun,
    totalClients: clients.length,
    totalQueriesExecuted: sourceResults.length,
    totalCandidates: candidates.length,
    candidates,
    sourceResults,
    safetyRules,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(diagnosticsDir, { recursive: true });
  fs.writeFileSync(diagnosticsJsonPath, `${JSON.stringify({
    generatedAt,
    diagnostics,
    safetyRules,
  } satisfies SearchDiagnosticsBatch, null, 2)}\n`, 'utf8');
  fs.writeFileSync(summaryPath, renderSummary(batch, clients, guardrailResult.blockedQueries), 'utf8');
  fs.writeFileSync(blockedQueriesMdPath, renderBlockedQueries(guardrailResult.blockedQueries, generatedAt), 'utf8');
  fs.writeFileSync(blockedQueriesJsonPath, `${JSON.stringify({
    generatedAt,
    blockedReasons: guardrailResult.blockedReasons,
    clientDistribution: guardrailResult.clientDistribution,
    blockedQueries: guardrailResult.blockedQueries,
  }, null, 2)}\n`, 'utf8');
  fs.mkdirSync(searchQualityDir, { recursive: true });
  fs.writeFileSync(searchCandidatePreviewPath, renderSearchCandidatePreview(candidates, guardrailResult.blockedQueries, generatedAt), 'utf8');
  fs.writeFileSync(sourcePerformancePreviewPath, renderSourcePerformancePreview(batch, generatedAt), 'utf8');
  for (const client of clients) {
    fs.writeFileSync(
      path.join(outputDir, `${client.clientId}-candidates.md`),
      renderClientCandidates(client, batch, generatedAt),
      'utf8',
    );
  }
  fs.writeFileSync(candidatesPath, `${JSON.stringify(batch, null, 2)}\n`, 'utf8');

  return batch;
}

function readActiveClients(): LeadDiscoveryClientConfig[] {
  if (!fs.existsSync(clientsDir)) return [];
  return fs.readdirSync(clientsDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .filter((fileName) => !fileName.endsWith('.sample.json'))
    .sort()
    .map((fileName) => JSON.parse(fs.readFileSync(path.join(clientsDir, fileName), 'utf8')) as LeadDiscoveryClientConfig)
    .filter((client) => client.status === 'active');
}

function readQueryBatch(): DiscoveryQueryBatch {
  if (!fs.existsSync(queryBatchPath)) {
    throw new Error(`Discovery query batch not found: ${path.relative(process.cwd(), queryBatchPath)}. Run npm run leads:queries first.`);
  }
  return JSON.parse(fs.readFileSync(queryBatchPath, 'utf8')) as DiscoveryQueryBatch;
}

function readSourceQueryBatch(): Pick<DiscoveryQueryBatch, 'queries'> {
  if (!fs.existsSync(sourceQueryBatchPath)) return { queries: [] };
  return JSON.parse(fs.readFileSync(sourceQueryBatchPath, 'utf8')) as Pick<DiscoveryQueryBatch, 'queries'>;
}

function readRewriteQueryBatch(): Pick<DiscoveryQueryBatch, 'queries'> {
  if (!fs.existsSync(rewriteQueryBatchPath)) return { queries: [] };
  return JSON.parse(fs.readFileSync(rewriteQueryBatchPath, 'utf8')) as Pick<DiscoveryQueryBatch, 'queries'>;
}

function readConversationQueryBatch(): Pick<DiscoveryQueryBatch, 'queries'> {
  if (!fs.existsSync(conversationQueryBatchPath)) return { queries: [] };
  return JSON.parse(fs.readFileSync(conversationQueryBatchPath, 'utf8')) as Pick<DiscoveryQueryBatch, 'queries'>;
}

function readBehaviorQueryBatch(): Pick<DiscoveryQueryBatch, 'queries'> {
  if (!fs.existsSync(behaviorQueryBatchPath)) return { queries: [] };
  return JSON.parse(fs.readFileSync(behaviorQueryBatchPath, 'utf8')) as Pick<DiscoveryQueryBatch, 'queries'>;
}

function readDynamicQueryBatch(): Pick<DiscoveryQueryBatch, 'queries'> {
  if (!fs.existsSync(dynamicQueryBatchPath)) return { queries: [] };
  return JSON.parse(fs.readFileSync(dynamicQueryBatchPath, 'utf8')) as Pick<DiscoveryQueryBatch, 'queries'>;
}

async function executePublicSearch(query: string): Promise<SearchExecutionResult> {
  const selection = selectSearchProvider();
  if (selection.providerName === 'tavily') {
    try {
      return await executeTavilySearch(query, selection);
    } catch (error) {
      if (selection.fallbackEnabled && selection.fallbackProvider === 'bing_rss') {
        const fallback = await executeBingRssSearch(query);
        return {
          ...fallback,
          providerReason: `${selection.providerReason} Tavily failed; Bing RSS fallback explicitly activated.`,
          fallbackActivated: true,
        };
      }
      throw withProviderMetadata(error, 'tavily', selection.providerReason, false);
    }
  }
  return executeBingRssSearch(query, selection.providerReason);
}

async function executeTavilySearch(query: string, selection: ProviderSelection): Promise<SearchExecutionResult> {
  try {
    const response = await tavilySearch(query, {
      maxResults: maxCandidatesPerQuery,
      searchDepth: 'basic',
      includeAnswer: false,
      timeoutMs: requestTimeoutMs,
    });
    const results = response.results.map((result) => ({
      url: result.url,
      title: redactContactInfo(result.title),
      snippet: redactContactInfo(result.content),
    }));
    return {
      providerUsed: 'tavily',
      providerReason: selection.providerReason,
      fallbackActivated: false,
      results,
      responseDiagnostic: {
        responseSize: Buffer.byteLength(JSON.stringify(response), 'utf8'),
        resultsReturned: results.length,
        emptyResponse: results.length === 0,
        rateLimited: false,
        timeout: false,
        parserFailure: false,
        providerError: false,
        notes: results.length === 0 ? 'provider returned zero results' : 'provider returned parseable results',
      },
    };
  } catch (error) {
    throw searchProviderError(classifyProviderError(error), error instanceof Error ? error.message : String(error), {
      providerName: 'tavily',
      providerReason: selection.providerReason,
      fallbackActivated: false,
    });
  }
}

async function executeBingRssSearch(query: string, providerReason = 'Bing RSS fallback selected.'): Promise<SearchExecutionResult> {
  const url = `https://www.bing.com/search?format=rss&cc=US&setlang=en-US&q=${encodeURIComponent(query)}`;
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        'user-agent': 'ai-testing-engineer-studio/1.0 safe-public-search',
        accept: 'application/rss+xml, application/xml, text/xml',
      },
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
  } catch (error) {
    throw searchProviderError('network_error', error instanceof Error ? error.message : String(error), {
      providerName: 'bing_rss',
      providerReason,
      fallbackActivated: false,
    });
  }

  const text = await response.text();
  const responseSize = Buffer.byteLength(text, 'utf8');

  if (!response.ok) {
    throw searchProviderError(response.status === 429 ? 'rate_limit' : 'network_error', `Public search failed with HTTP ${response.status}`, {
      statusCode: response.status,
      responseSize,
      rateLimited: response.status === 429,
      providerName: 'bing_rss',
      providerReason,
      fallbackActivated: false,
    });
  }

  let results: SearchResultItem[];
  try {
    results = parseBingRss(text);
  } catch (error) {
    throw searchProviderError('parser_error', error instanceof Error ? error.message : String(error), {
      statusCode: response.status,
      responseSize,
      parserFailure: true,
      providerName: 'bing_rss',
      providerReason,
      fallbackActivated: false,
    });
  }

  return {
    providerUsed: 'bing_rss',
    providerReason,
    fallbackActivated: false,
    results,
    responseDiagnostic: {
      statusCode: response.status,
      responseSize,
      resultsReturned: results.length,
      emptyResponse: results.length === 0,
      rateLimited: response.status === 429,
      timeout: false,
      parserFailure: false,
      providerError: false,
      notes: results.length === 0 ? 'provider returned zero results' : 'provider returned parseable results',
    },
  };
}

function parseBingRss(xml: string): SearchResultItem[] {
  const items: SearchResultItem[] = [];
  const itemPattern = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemPattern.exec(xml)) !== null && items.length < maxCandidatesPerQuery) {
    const itemXml = match[1];
    const title = firstTagValue(itemXml, 'title');
    const link = firstTagValue(itemXml, 'link');
    const description = firstTagValue(itemXml, 'description');
    const url = normalizeResultUrl(link);
    if (!isPublicHttpUrl(url) || isLoginOrAccountUrl(url)) continue;
    items.push({
      url,
      title: redactContactInfo(stripHtml(title)),
      snippet: redactContactInfo(stripHtml(description)),
    });
  }

  return dedupeByUrl(items).slice(0, maxCandidatesPerQuery);
}

function firstTagValue(xml: string, tagName: string): string {
  const pattern = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`);
  const match = pattern.exec(xml);
  return match ? decodeHtml(match[1]) : '';
}

function normalizeResultUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl, 'https://duckduckgo.com');
    const redirected = parsed.searchParams.get('uddg');
    if (redirected) return decodeURIComponent(redirected);
    return parsed.href;
  } catch {
    return rawUrl;
  }
}

function blockedQueryDiagnostic(blocked: GuardrailBlockedQuery<DiscoveryQuery>, generatedAt: string, index: number): QueryExecutionDiagnostic {
  return {
    diagnosticId: `search-diagnostic-${String(index).padStart(5, '0')}`,
    clientId: blocked.query.clientId ?? 'missing_client_id',
    sourceId: blocked.query.sourceId,
    sourceCategory: blocked.query.sourceCategory,
    query: blocked.query.query,
    queryTemplateId: blocked.query.queryTemplateId,
    providerUsed: 'none',
    startedAt: generatedAt,
    completedAt: generatedAt,
    durationMs: 0,
    success: false,
    failureReason: 'query_blocked',
    blockedByGuardrails: true,
    wasSentToProvider: false,
    response: {
      responseSize: 0,
      resultsReturned: 0,
      emptyResponse: false,
      rateLimited: false,
      timeout: false,
      parserFailure: false,
      providerError: false,
      notes: `query blocked by guardrails: ${blocked.blockedReasons.join(', ')}`,
    },
  };
}

function queryDiagnostic(input: {
  query: DiscoveryQuery;
  index: number;
  startedAt: Date;
  completedAt: Date;
  providerUsed: string;
  providerReason?: string;
  fallbackActivated?: boolean;
  success: boolean;
  failureReason: SearchFailureCategory | null;
  responseDiagnostic: ResponseDiagnostic;
}): QueryExecutionDiagnostic {
  return {
    diagnosticId: `search-diagnostic-${String(input.index).padStart(5, '0')}`,
    clientId: input.query.clientId,
    sourceId: input.query.sourceId,
    sourceCategory: input.query.sourceCategory,
    query: input.query.query,
    queryTemplateId: input.query.queryTemplateId,
    providerUsed: input.providerUsed,
    providerReason: input.providerReason,
    fallbackActivated: input.fallbackActivated ?? false,
    providerDurationMs: Math.max(0, input.completedAt.getTime() - input.startedAt.getTime()),
    providerResultCount: input.responseDiagnostic.resultsReturned,
    providerFailureReason: input.failureReason,
    startedAt: input.startedAt.toISOString(),
    completedAt: input.completedAt.toISOString(),
    durationMs: Math.max(0, input.completedAt.getTime() - input.startedAt.getTime()),
    success: input.success,
    failureReason: input.failureReason,
    blockedByGuardrails: false,
    wasSentToProvider: true,
    response: input.responseDiagnostic,
  };
}

function responseDiagnosticFromError(error: unknown): ResponseDiagnostic {
  if (isSearchProviderError(error)) {
    return {
      statusCode: error.statusCode,
      responseSize: error.responseSize ?? 0,
      resultsReturned: 0,
      emptyResponse: error.category === 'provider_empty',
      rateLimited: error.category === 'rate_limit',
      timeout: error.category === 'timeout',
      parserFailure: error.category === 'parser_error',
      providerError: ['network_error', 'rate_limit', 'unknown'].includes(error.category),
      notes: error.message,
    };
  }
  const message = error instanceof Error ? error.message : String(error);
  const timeout = /abort|timeout|timed out/i.test(message);
  return {
    responseSize: 0,
    resultsReturned: 0,
    emptyResponse: false,
    rateLimited: false,
    timeout,
    parserFailure: false,
    providerError: !timeout,
    notes: message || 'unknown provider failure',
  };
}

function failureCategoryFromResponse(response: ResponseDiagnostic): SearchFailureCategory {
  if (response.rateLimited) return 'rate_limit';
  if (response.timeout) return 'timeout';
  if (response.parserFailure) return 'parser_error';
  if (response.emptyResponse) return 'provider_empty';
  if (response.providerError) return 'network_error';
  return 'unknown';
}

function diagnosticMessage(reason: SearchFailureCategory, response: ResponseDiagnostic): string {
  if (reason === 'provider_empty') return 'provider returned zero results';
  if (reason === 'timeout') return 'network request timed out';
  if (reason === 'rate_limit') return 'provider rate limit observed';
  if (reason === 'network_error') return `network request failed: ${response.notes}`;
  if (reason === 'parser_error') return `response parsing failed: ${response.notes}`;
  return response.notes || 'unknown search failure';
}

function searchProviderError(
  category: SearchFailureCategory,
  message: string,
  metadata: {
    statusCode?: number;
    responseSize?: number;
    rateLimited?: boolean;
    parserFailure?: boolean;
    providerName?: string;
    providerReason?: string;
    fallbackActivated?: boolean;
  } = {},
): Error {
  const error = new Error(message) as Error & {
    category: SearchFailureCategory;
    statusCode?: number;
    responseSize?: number;
    rateLimited?: boolean;
    parserFailure?: boolean;
    providerName?: string;
    providerReason?: string;
    fallbackActivated?: boolean;
  };
  error.category = category;
  error.statusCode = metadata.statusCode;
  error.responseSize = metadata.responseSize;
  error.rateLimited = metadata.rateLimited;
  error.parserFailure = metadata.parserFailure;
  error.providerName = metadata.providerName;
  error.providerReason = metadata.providerReason;
  error.fallbackActivated = metadata.fallbackActivated;
  return error;
}

function isSearchProviderError(error: unknown): error is Error & {
  category: SearchFailureCategory;
  statusCode?: number;
  responseSize?: number;
} {
  return error instanceof Error && 'category' in error;
}

function classifyProviderError(error: unknown): SearchFailureCategory {
  const message = error instanceof Error ? error.message : String(error);
  if (/api key/i.test(message)) return 'unknown';
  if (/429|rate/i.test(message)) return 'rate_limit';
  if (/abort|timeout/i.test(message)) return 'timeout';
  if (/parse|json|shape/i.test(message)) return 'parser_error';
  if (/fetch|network|ENOTFOUND|ECONN/i.test(message)) return 'network_error';
  return 'unknown';
}

function providerNameFromError(error: unknown): string {
  return isProviderMetadataError(error) ? error.providerName ?? 'unknown' : 'unknown';
}

function providerReasonFromError(error: unknown): string | undefined {
  return isProviderMetadataError(error) ? error.providerReason : undefined;
}

function fallbackActivatedFromError(error: unknown): boolean {
  return isProviderMetadataError(error) ? Boolean(error.fallbackActivated) : false;
}

function withProviderMetadata(error: unknown, providerName: string, providerReason: string, fallbackActivated: boolean): Error {
  if (isProviderMetadataError(error)) {
    error.providerName = error.providerName ?? providerName;
    error.providerReason = error.providerReason ?? providerReason;
    error.fallbackActivated = error.fallbackActivated ?? fallbackActivated;
    return error;
  }
  const wrapped = error instanceof Error ? error : new Error(String(error));
  return searchProviderError(classifyProviderError(wrapped), wrapped.message, { providerName, providerReason, fallbackActivated });
}

function isProviderMetadataError(error: unknown): error is Error & {
  providerName?: string;
  providerReason?: string;
  fallbackActivated?: boolean;
} {
  return error instanceof Error;
}

function toCandidate(query: DiscoveryQuery, result: SearchResultItem, discoveredAt: string, index: number): SearchCandidate {
  const leadLike = classifyLeadLikeCandidate({
    sourceUrl: result.url,
    sourceName: query.sourceName,
    sourceCategory: query.sourceCategory,
    title: result.title,
    snippet: result.snippet,
    query: query.query,
  });
  const behavioralIntent = scoreBehavioralIntent({
    clientId: query.clientId,
    title: result.title,
    snippet: result.snippet,
    query: query.query,
    sourceUrl: result.url,
  });
  const buyerSignalExtraction = extractBuyerSignals({
    clientId: query.clientId,
    title: result.title,
    snippet: result.snippet,
    query: query.query,
  });
  return {
    id: `search-candidate-${String(index).padStart(5, '0')}`,
    clientId: query.clientId,
    clientName: query.clientName,
    vertical: query.vertical,
    sourceId: query.sourceId,
    sourceName: query.sourceName,
    sourceCategory: query.sourceCategory,
    query: query.query,
    queryTemplateId: query.queryTemplateId,
    queryTemplateType: query.queryTemplateType,
    expectedSourceTypes: query.expectedSourceTypes,
    sourceQueryPriority: query.sourceQueryPriority,
    expectedLeadQuality: query.expectedLeadQuality,
    behaviorCategory: query.behaviorCategory,
    behaviorSignals: query.behaviorSignals,
    rewrittenQueries: query.rewrittenQueries,
    rewriteSource: query.rewriteSource,
    rewriteReason: query.rewriteReason,
    rewritePhrase: query.rewritePhrase,
    conversationSource: query.conversationSource,
    url: result.url,
    title: result.title,
    snippet: result.snippet,
    discoveredAt,
    riskLevel: query.riskLevel,
    manualReviewRequired: true,
    notes: 'Safe public search candidate only. No contact extraction, crawling, outreach, or enrichment was performed.',
    ...leadLike,
    behaviorScore: behavioralIntent.behaviorScore,
    behaviorConfidence: behavioralIntent.behaviorConfidence,
    behaviorReasons: behavioralIntent.behaviorReasons,
    buyerSignals: buyerSignalExtraction.buyerSignals,
    buyerSignalCount: buyerSignalExtraction.buyerSignalCount,
    buyerSignalCategories: buyerSignalExtraction.buyerSignalCategories,
    buyerSignalStrength: buyerSignalExtraction.buyerSignalStrength,
  };
}

function renderSummary(
  batch: SearchCandidateBatch,
  clients: LeadDiscoveryClientConfig[],
  blockedQueries: Array<GuardrailBlockedQuery<DiscoveryQuery>>,
): string {
  const socialResults = batch.sourceResults.filter((result) => result.queryTemplateType === 'social');
  const rewriteResults = batch.sourceResults.filter((result) => result.queryTemplateType === 'intent_rewrite');
  const conversationResults = batch.sourceResults.filter((result) => result.queryTemplateType === 'conversation');
  const blockedPrivateCount = blockedQueries.filter((blocked) => isPrivateOrDisallowedSource(blocked.query)).length;
  return `# Safe Public Search Summary

Generated: ${batch.generatedAt}

## Client Priority

${clients.map((client, index) => `${index + 1}. ${client.clientName} (${client.clientId}) - ${client.vertical}`).join('\n') || '- No active clients found.'}

## Totals

- Total clients: ${batch.totalClients}
- Queries executed: ${batch.totalQueriesExecuted}
- Search candidates stored: ${batch.totalCandidates}
- Max queries per client: ${batch.maxQueriesPerClient}
- Max candidates per query: ${batch.maxCandidatesPerQuery}
- Queries blocked by guardrails: ${blockedQueries.length}
- Social template queries executed: ${socialResults.length}
- Rewritten queries executed: ${rewriteResults.length}
- Conversation queries executed: ${conversationResults.length}
- Rewrite success rate: ${percentage(rewriteResults.filter((result) => result.candidateCount > 0).length, rewriteResults.length).toFixed(1)}%
- Conversation candidate count: ${conversationResults.reduce((sum, result) => sum + result.candidateCount, 0)}
- Public social source count: ${unique(batch.sourceResults.filter((result) => result.queryTemplateType === 'social' && result.sourceId).map((result) => result.sourceId as string)).length}
- Blocked/private source count: ${blockedPrivateCount}
- Graceful failures: ${batch.sourceResults.filter((result) => result.error).length}
- Estimated budget protection: blocked queries were not sent to Tavily or fallback public search.
- Safety reminder: no login, private scraping, browser automation, contact extraction, DMs, or outreach.

## Output Files

${clients.map((client) => `- output/lead-discovery/search-candidates/${client.clientId}-candidates.md`).join('\n') || '- None.'}
- output/lead-discovery/search-candidates/search-candidates.json
- output/lead-discovery/search-candidates/blocked-queries.md
- output/lead-discovery/search-candidates/blocked-queries.json
- output/lead-discovery/search-quality/search-candidate-preview.md
- output/lead-discovery/search-quality/source-performance-preview.md

## Client Distribution

${renderClientDistribution(batch.sourceResults)}

## Template Query Distribution

${renderTemplateDistribution(batch.sourceResults)}

## Template Type Distribution

${renderTemplateTypeDistribution(batch.sourceResults)}

## Source ID Distribution

${renderSourceIdDistribution(batch.sourceResults)}

## Source Category Distribution

${renderSourceCategoryDistribution(batch.sourceResults)}

## Expected Quality Distribution

${renderExpectedQualityDistribution(batch.sourceResults)}

## Behavior Query Distribution

${renderBehaviorQueryDistribution(batch.sourceResults)}

## Rewrite Phrase Distribution

${renderTopValues(batch.sourceResults.filter((result) => result.queryTemplateType === 'intent_rewrite' || result.queryTemplateType === 'conversation').map((result) => result.rewritePhrase ?? 'unknown'))}

## Conversation Source Distribution

${renderTopValues(batch.sourceResults.filter((result) => result.queryTemplateType === 'conversation').map((result) => result.conversationSource ?? 'unknown'))}

## Top Sources

${renderTopSources(batch.candidates)}

## Source Distribution

${renderSourceDistribution(batch.candidates)}

## Safety Rules

${batch.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function renderClientCandidates(
  client: LeadDiscoveryClientConfig,
  batch: SearchCandidateBatch,
  generatedAt: string,
): string {
  const candidates = batch.candidates.filter((candidate) => candidate.clientId === client.clientId);
  const sourceResults = batch.sourceResults.filter((result) => result.clientId === client.clientId);
  return `# Search Candidates - ${client.clientName}

Generated: ${generatedAt}

## Client Summary

- Client ID: ${client.clientId}
- Client name: ${client.clientName}
- Vertical: ${client.vertical}
- Status: ${client.status}
- Candidate count: ${candidates.length}
- Queries executed: ${sourceResults.length}
- Query limit respected: ${sourceResults.length <= maxQueriesPerClient ? 'yes' : 'no'}
- Candidate per query limit: ${maxCandidatesPerQuery}

## Queries Executed

${sourceResults.map((result, index) => `${index + 1}. \`${result.query}\` - ${result.candidateCount} candidates${result.error ? `; error: ${cell(result.error)}` : ''}`).join('\n') || '- No queries executed.'}

## Top Sources

${renderTopSources(candidates)}

## Top Snippets

${candidates.slice(0, 20).map((candidate, index) => `${index + 1}. [${cell(candidate.title)}](${candidate.url})\n   - ${cell(candidate.snippet)}\n   - Query: \`${candidate.query}\``).join('\n') || '- No candidates stored. Review query limits, network access, and public search availability.'}

## Manual Review Disclaimer

These are search candidates only. They contain public result URLs, titles, snippets, and source metadata. No scraping, crawling, login, contact extraction, email/phone collection, outreach, DMs, calls, or form submissions were performed. Daniel must manually review source context before enrichment, delivery, or any contact.
`;
}

function renderBlockedQueries(blockedQueries: Array<GuardrailBlockedQuery<DiscoveryQuery>>, generatedAt: string): string {
  return `# Blocked Search Queries

Generated: ${generatedAt}

## Summary

- Blocked queries: ${blockedQueries.length}
- Budget protection: blocked queries were not sent to Tavily or fallback public search.
- Manual review required before changing guardrails.

## Blocked Reasons

${renderTopValues(blockedQueries.flatMap((blocked) => blocked.blockedReasons))}

## Queries

${blockedQueries.map((blocked, index) => `${index + 1}. \`${blocked.query.query}\`
   - Client: ${blocked.query.clientName ?? blocked.query.clientId ?? 'missing_client_id'} (${blocked.query.clientId ?? 'missing_client_id'})
   - Vertical: ${blocked.query.vertical}
   - Template: ${blocked.query.queryTemplateId ?? 'none'}
   - Reasons: ${blocked.blockedReasons.join(', ')}`).join('\n') || '- No queries blocked.'}
`;
}

function renderSearchCandidatePreview(
  candidates: SearchCandidate[],
  blockedQueries: Array<GuardrailBlockedQuery<DiscoveryQuery>>,
  generatedAt: string,
): string {
  const leadLike = candidates
    .filter((candidate) => candidate.leadLikeClassification === 'lead_like' || candidate.leadLikeClassification === 'possibly_lead_like')
    .sort((left, right) => right.leadLikeScore - left.leadLikeScore || left.title.localeCompare(right.title));
  const generic = candidates
    .filter((candidate) => !['lead_like', 'possibly_lead_like'].includes(candidate.leadLikeClassification))
    .sort((left, right) => right.leadLikeScore - left.leadLikeScore || left.title.localeCompare(right.title));
  return `# Search Candidate Preview

Generated: ${generatedAt}

## Top Lead-Like Candidates

${leadLike.slice(0, 20).map((candidate, index) => renderCandidatePreviewRow(candidate, index)).join('\n') || '- None.'}

## Top Generic Candidates

${generic.slice(0, 20).map((candidate, index) => renderCandidatePreviewRow(candidate, index)).join('\n') || '- None.'}

## Top Blocked Candidates

${blockedQueries.slice(0, 20).map((blocked, index) => `${index + 1}. \`${blocked.query.query}\`
   - Client: ${blocked.query.clientId ?? 'unknown'}
   - Reasons: ${blocked.blockedReasons.join(', ')}`).join('\n') || '- None.'}

No login, scraping, contact extraction, outreach, DMs, calls, or form submissions were performed.
`;
}

function renderCandidatePreviewRow(candidate: SearchCandidate, index: number): string {
  return `${index + 1}. [${cell(candidate.title)}](${candidate.url})
   - Classification: ${candidate.leadLikeClassification}; score: ${candidate.leadLikeScore}; confidence: ${candidate.leadLikeConfidence}
   - Client: ${candidate.clientId}; source: ${candidate.sourceId ?? candidate.sourceName}; query: \`${candidate.query}\`
   - Signals: ${candidate.leadLikeSignals.join(', ') || 'none'}
   - Reasons: ${candidate.leadLikeReasons.map(cell).join(' ')}`;
}

function renderSourcePerformancePreview(batch: SearchCandidateBatch, generatedAt: string): string {
  return `# Source Performance Preview

Generated: ${generatedAt}

## Source ID Distribution

${renderTopValues(batch.sourceResults.map((result) => result.sourceId ?? 'no_source_id'))}

## Source Category Distribution

${renderTopValues(batch.sourceResults.map((result) => result.sourceCategory ?? 'unknown'))}

## Source Query Distribution

${renderTopValues(batch.sourceResults.map((result) => result.queryTemplateType ?? 'standard'))}

## Expected Quality Distribution

${renderTopValues(batch.sourceResults.map((result) => result.expectedLeadQuality ?? 'unknown'))}

## Source Rows

${sourcePreviewRows(batch).map((row, index) => `${index + 1}. ${row.sourceId}
   - Category: ${row.sourceCategory}; expected quality: ${row.expectedLeadQuality}; query type: ${row.queryTemplateType}
   - Queries: ${row.queries}; candidates: ${row.candidates}; lead-like: ${row.leadLike}; possible: ${row.possibleLeadLike}`).join('\n') || '- No source rows.'}
`;
}

function renderTopSources(candidates: SearchCandidate[]): string {
  const rows = Object.entries(candidates.reduce<Record<string, number>>((counts, candidate) => {
    const host = hostFor(candidate.url);
    counts[host] = (counts[host] ?? 0) + 1;
    return counts;
  }, {}))
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 10);

  return rows.map(([host, count]) => `- ${host}: ${count}`).join('\n') || '- No sources stored.';
}

function renderClientDistribution(sourceResults: SearchSourceResult[]): string {
  return renderTopValues(sourceResults.map((result) => result.clientId));
}

function renderTemplateDistribution(sourceResults: SearchSourceResult[]): string {
  return renderTopValues(sourceResults.map((result) => result.queryTemplateId ?? 'no_template'));
}

function renderTemplateTypeDistribution(sourceResults: SearchSourceResult[]): string {
  return renderTopValues(sourceResults.map((result) => result.queryTemplateType ?? 'standard'));
}

function renderSourceIdDistribution(sourceResults: SearchSourceResult[]): string {
  return renderTopValues(sourceResults.map((result) => result.sourceId ?? 'no_source_id'));
}

function renderSourceCategoryDistribution(sourceResults: SearchSourceResult[]): string {
  return renderTopValues(sourceResults.map((result) => result.sourceCategory ?? 'unknown'));
}

function renderExpectedQualityDistribution(sourceResults: SearchSourceResult[]): string {
  return renderTopValues(sourceResults.map((result) => result.expectedLeadQuality ?? 'unknown'));
}

function renderBehaviorQueryDistribution(sourceResults: SearchSourceResult[]): string {
  return renderTopValues(sourceResults.map((result) => result.behaviorCategory ?? 'not_behavior'));
}

function renderSourceDistribution(candidates: SearchCandidate[]): string {
  return renderTopValues(candidates.map((candidate) => candidate.sourceName));
}

function renderTopValues(values: string[]): string {
  const rows = Object.entries(values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {})).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));

  return rows.map(([value, count]) => `- ${value}: ${count}`).join('\n') || '- None.';
}

function percentage(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 1000) / 10;
}

function sourcePreviewRows(batch: SearchCandidateBatch): Array<{
  sourceId: string;
  sourceCategory: string;
  expectedLeadQuality: string;
  queryTemplateType: string;
  queries: number;
  candidates: number;
  leadLike: number;
  possibleLeadLike: number;
}> {
  const rows = new Map<string, {
    sourceId: string;
    sourceCategory: string;
    expectedLeadQuality: string;
    queryTemplateType: string;
    queries: number;
    candidates: number;
    leadLike: number;
    possibleLeadLike: number;
  }>();
  for (const result of batch.sourceResults) {
    const sourceId = result.sourceId ?? 'no_source_id';
    const key = `${sourceId}|${result.sourceCategory ?? 'unknown'}|${result.expectedLeadQuality ?? 'unknown'}|${result.queryTemplateType ?? 'standard'}`;
    const row = rows.get(key) ?? {
      sourceId,
      sourceCategory: result.sourceCategory ?? 'unknown',
      expectedLeadQuality: result.expectedLeadQuality ?? 'unknown',
      queryTemplateType: result.queryTemplateType ?? 'standard',
      queries: 0,
      candidates: 0,
      leadLike: 0,
      possibleLeadLike: 0,
    };
    const candidatesForResult = batch.candidates.filter((candidate) => candidate.clientId === result.clientId && candidate.query === result.query);
    row.queries += 1;
    row.candidates += result.candidateCount;
    row.leadLike += candidatesForResult.filter((candidate) => candidate.leadLikeClassification === 'lead_like').length;
    row.possibleLeadLike += candidatesForResult.filter((candidate) => candidate.leadLikeClassification === 'possibly_lead_like').length;
    rows.set(key, row);
  }
  return [...rows.values()].sort((left, right) => right.leadLike - left.leadLike || right.candidates - left.candidates || left.sourceId.localeCompare(right.sourceId));
}

function hostFor(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

function dedupeByUrl(items: SearchResultItem[]): SearchResultItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });
}

function isPublicHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function isLoginOrAccountUrl(url: string): boolean {
  return /\/(login|signin|sign-in|account|accounts|auth|oauth|session|register|signup|sign-up)(\/|$|\?)/i.test(url);
}

function isPrivateOrDisallowedSource(query: DiscoveryQuery): boolean {
  return /\b(private group|login|signin|sign-in|profile harvesting|auto-dm|dm|contact extraction)\b/i.test(`${query.query} ${query.notes}`);
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function compareClientPriority(left: LeadDiscoveryClientConfig, right: LeadDiscoveryClientConfig): number {
  const priority = ['flora_and_fauna_foods_001', 'lzt_costa_rica_001', 'costa_retreats_001'];
  const leftRank = priority.indexOf(left.clientId);
  const rightRank = priority.indexOf(right.clientId);
  if (leftRank !== -1 || rightRank !== -1) {
    return (leftRank === -1 ? Number.MAX_SAFE_INTEGER : leftRank)
      - (rightRank === -1 ? Number.MAX_SAFE_INTEGER : rightRank);
  }
  return left.clientName.localeCompare(right.clientName);
}

function prioritizeQueries(queries: DiscoveryQuery[]): DiscoveryQuery[] {
  return [...queries].sort((left, right) => {
    const clientCompare = compareQueryClientPriority(left.clientId, right.clientId);
    if (clientCompare !== 0) return clientCompare;
    const typeCompare = queryTypeRank(left.queryTemplateType) - queryTypeRank(right.queryTemplateType);
    if (typeCompare !== 0) return typeCompare;
    const sourcePriorityCompare = sourcePriorityRank(left.sourceQueryPriority) - sourcePriorityRank(right.sourceQueryPriority);
    if (sourcePriorityCompare !== 0) return sourcePriorityCompare;
    const qualityCompare = expectedQualityRank(left.expectedLeadQuality) - expectedQualityRank(right.expectedLeadQuality);
    if (qualityCompare !== 0) return qualityCompare;
    return left.query.localeCompare(right.query);
  });
}

function compareQueryClientPriority(leftClientId: string, rightClientId: string): number {
  const priority = ['flora_and_fauna_foods_001', 'lzt_costa_rica_001', 'costa_retreats_001'];
  const leftRank = priority.indexOf(leftClientId);
  const rightRank = priority.indexOf(rightClientId);
  return (leftRank === -1 ? Number.MAX_SAFE_INTEGER : leftRank)
    - (rightRank === -1 ? Number.MAX_SAFE_INTEGER : rightRank);
}

function queryTypeRank(type: DiscoveryQuery['queryTemplateType']): number {
  if (type === 'source_specific') return 0;
  if (type === 'intent_rewrite') return 1;
  if (type === 'conversation') return 2;
  if (type === 'behavior') return 3;
  if (type === 'dynamic') return 4;
  if (type === 'social') return 5;
  return 6;
}

function sourcePriorityRank(priority: DiscoveryQuery['sourceQueryPriority']): number {
  if (priority === 'high') return 0;
  if (priority === 'medium') return 1;
  if (priority === 'low') return 2;
  return 3;
}

function expectedQualityRank(quality: DiscoveryQuery['expectedLeadQuality']): number {
  if (quality === 'high') return 0;
  if (quality === 'medium') return 1;
  if (quality === 'low') return 2;
  return 3;
}

function stripHtml(value: string): string {
  return decodeHtml(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function redactContactInfo(value: string): string {
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]')
    .replace(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/g, '[redacted-phone]');
}

function cell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

async function main(): Promise<void> {
  try {
    const batch = await runSafePublicSearch();
    const files = [
      path.relative(process.cwd(), summaryPath),
      path.relative(process.cwd(), candidatesPath),
      path.relative(process.cwd(), blockedQueriesMdPath),
      path.relative(process.cwd(), blockedQueriesJsonPath),
      ...batch.sourceResults
        .map((result) => result.clientId)
        .filter((clientId, index, ids) => ids.indexOf(clientId) === index)
        .map((clientId) => path.relative(process.cwd(), path.join(outputDir, `${clientId}-candidates.md`))),
    ];
    console.log(`Search candidates generated: ${files.join(', ')}`);
    console.log(`Queries executed: ${batch.totalQueriesExecuted}`);
    console.log(`Candidates stored: ${batch.totalCandidates}`);
    console.log(`Graceful failures: ${batch.sourceResults.filter((result) => result.error).length}`);
    console.log('Safe public search only. No scraping, browser automation, contact extraction, outreach, email, DM, calls, or forms were performed.');
  } catch (error) {
    console.error('Safe Public Search Runner: FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) {
  void main();
}
