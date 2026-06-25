import crypto = require('crypto');
import fs = require('fs');
import net = require('net');
import path = require('path');
import {
  getTavilyRuntimeConfig,
  getTavilyUsage,
  loadLocalEnv,
  tavilySearch,
  type TavilySearchResult,
} from '../integrations/tavily/tavilyClient';
import {
  appendTavilyLedgerEntry,
  evaluateWebsiteTavilyBudget,
  queryHash,
  readTavilyLedger,
  usageDiscrepancyWarnings,
  websiteUsageFromLedger,
} from '../integrations/tavily/tavilyUsage';
import {
  WEBSITE_CATEGORIES,
  type WebsiteCandidateInput,
  type WebsiteCategory,
  type WebsiteSourceReference,
} from './types';

interface TavilyQuery {
  id: string;
  query: string;
  category: WebsiteCategory;
  location: string | null;
  enabled: boolean;
}

interface TavilyDiscoveryConfig {
  enabled: boolean;
  queriesPerRun: number;
  resultsPerQuery: number;
  queries: TavilyQuery[];
}

interface TavilyCacheEntry {
  queryId: string;
  queryHash: string;
  lastRunAt: string;
  resultHostnames: string[];
  requestId?: string;
}

export interface WebsiteTavilyReport {
  tavilyEnabled: boolean;
  tavilyAvailable: boolean;
  usageChecked: boolean;
  accountPlanUsage: number | null;
  accountPlanLimit: number | null;
  accountUsagePercent: number | null;
  sharedThresholdPercent: number;
  websiteCreditsUsedToday: number;
  websiteCreditsUsedThisMonth: number;
  websiteDailyLimit: number;
  websiteMonthlyLimit: number;
  queriesConfigured: number;
  queriesEligible: number;
  eligibleQueryIds: string[];
  cachedQueryIds: string[];
  queriesExecuted: number;
  queriesSkippedCached: number;
  estimatedCredits: number;
  actualCredits: number;
  budgetDecision: string;
  budgetReasons: string[];
  candidatesFromTavily: number;
  candidatesAccepted: number;
  candidatesRejected: number;
  rejectedNonBusiness: number;
  rejectedGenericTitle: number;
  rejectedEditorialOrDirectory: number;
  rejectedLowRelevance: number;
  acceptedHighConfidence: number;
  acceptedForReview: number;
  fixtureLeadsExcludedFromProductionRanking: number;
  resultDiagnostics: Array<{
    title: string;
    hostname: string | null;
    score: number | null;
    outcome: 'accepted_high_confidence' | 'accepted_for_review' | 'rejected';
    reason: string;
  }>;
  fallbackSourcesUsed: string[];
  warnings: string[];
}

export interface WebsiteTavilyDiscoveryResult {
  candidates: WebsiteCandidateInput[];
  report: WebsiteTavilyReport;
}

const CONFIG_PATH = path.join(process.cwd(), 'data', 'website-studio', 'tavily-discovery.json');
const CACHE_PATH = path.join(process.cwd(), 'data', 'website-studio', 'tavily-cache.json');
const CACHE_DAYS = 7;
const BLOCKED_HOST_PATTERNS = [
  'google.', 'bing.', 'yahoo.', 'instagram.com', 'facebook.com', 'linkedin.com',
  'tripadvisor.', 'yelp.', 'booking.com', 'expedia.', 'airbnb.', 'maps.google.',
  'indeed.', 'glassdoor.', 'amazon.', 'ebay.',
  'retreat.guru', 'tripaneer.com', 'preferredhotels.com', 'myboutiquehotel.com',
  'mrandmrssmith.com', 'surfcamp-online.com',
];
const BLOCKED_PATH_PATTERN = /\.(pdf)(?:$|\?)/i;
const EDITORIAL_PATH_PATTERN = /\/(articles?|blog|news|magazine|directory|categories?|tags?|search|listings?|travel-guides?|destinations?)(?:\/|$)/i;
const GENERIC_TITLE_PATTERN = /^(about(?:\s+us)?|home|welcome|guanacaste|costa rica|contact|directory|search results?|hotels?|retreats?|surf camps?)$/i;
const LIST_TITLE_PATTERN = /^(?:[•*\-\s]*\d+\+?\s+)|\b(?:best|top)\b.+\bin\b|\blist of\b|\bguide to\b|\bthings to do\b|\bwhere to stay\b|\b(?:hotels?|retreats?|surf camps?)\s+in\s+(?:guanacaste|costa rica)(?:\s+province)?$/i;
const ENTITY_TYPE_PATTERN = /\b(hotel|camp|retreat|studio|school|resort|villa|gym|clinic|restaurant|agency|company|spa|hostel)\b/i;
const CONFIDENCE_MARKER = '[tavily-confidence:';

export async function runWebsiteTavilyDiscovery(options: {
  dryRun: boolean;
  refresh?: boolean;
}): Promise<WebsiteTavilyDiscoveryResult> {
  loadLocalEnv();
  const report = createEmptyWebsiteTavilyReport();
  const candidates: WebsiteCandidateInput[] = [];
  let config: TavilyDiscoveryConfig;
  let cache: TavilyCacheEntry[];
  let ledger: ReturnType<typeof readTavilyLedger>;

  try {
    config = loadConfig();
    cache = loadCache();
    ledger = readTavilyLedger();
  } catch (error) {
    report.budgetDecision = 'configuration_invalid';
    report.budgetReasons.push(errorMessage(error));
    report.warnings.push(errorMessage(error));
    return { candidates, report };
  }

  const limits = loadLimits();
  if (!limits.valid) {
    report.budgetDecision = 'configuration_invalid';
    report.budgetReasons.push(...limits.errors);
    report.warnings.push(...limits.errors);
    return { candidates, report };
  }
  report.sharedThresholdPercent = limits.threshold;
  report.websiteDailyLimit = limits.daily;
  report.websiteMonthlyLimit = limits.monthly;
  report.queriesConfigured = config.queries.filter((query) => query.enabled).length;
  report.tavilyEnabled = config.enabled && limits.environmentEnabled;

  const runtime = getTavilyRuntimeConfig();
  report.tavilyAvailable = runtime.hasApiKey;
  const usage = websiteUsageFromLedger(ledger);
  report.websiteCreditsUsedToday = usage.today;
  report.websiteCreditsUsedThisMonth = usage.month;

  const cacheEvaluation = eligibleQueries(config.queries, cache, ledger, options.refresh ?? false);
  report.queriesEligible = cacheEvaluation.eligible.length;
  report.queriesSkippedCached = cacheEvaluation.cached;
  report.eligibleQueryIds = cacheEvaluation.eligible.map((query) => query.id);
  report.cachedQueryIds = cacheEvaluation.cachedIds;

  if (!report.tavilyEnabled) {
    report.budgetDecision = 'disabled';
    report.budgetReasons.push('Website Tavily discovery is disabled by configuration.');
    return { candidates, report };
  }
  if (!runtime.hasApiKey) {
    report.budgetDecision = 'unavailable';
    report.budgetReasons.push('The shared Tavily client has no API key available.');
    return { candidates, report };
  }

  let liveUsage: Awaited<ReturnType<typeof getTavilyUsage>>;
  try {
    liveUsage = await getTavilyUsage();
    report.usageChecked = true;
    report.accountPlanUsage = liveUsage.planUsage;
    report.accountPlanLimit = liveUsage.planLimit;
    report.warnings.push(...usageDiscrepancyWarnings(liveUsage, ledger));
  } catch (error) {
    report.budgetDecision = 'usage_unavailable';
    report.budgetReasons.push('Live Tavily usage could not be retrieved, so no search credits were spent.');
    report.warnings.push(errorMessage(error));
    return { candidates, report };
  }

  const requested = Math.min(config.queriesPerRun, cacheEvaluation.eligible.length, 3);
  const budget = evaluateWebsiteTavilyBudget({
    requestedQueries: requested,
    planUsage: liveUsage.planUsage,
    planLimit: liveUsage.planLimit,
    websiteCreditsUsedToday: usage.today,
    websiteCreditsUsedThisMonth: usage.month,
    websiteDailyLimit: limits.daily,
    websiteMonthlyLimit: limits.monthly,
    sharedThresholdPercent: limits.threshold,
  });
  report.accountUsagePercent = budget.accountUsagePercent;
  report.budgetDecision = budget.decision;
  report.budgetReasons.push(...budget.reasons);
  report.estimatedCredits = budget.allowedQueries;
  if (options.dryRun || budget.allowedQueries === 0) return { candidates, report };

  const selected = cacheEvaluation.eligible.slice(0, budget.allowedQueries);
  const seenHosts = new Set<string>();
  for (const query of selected) {
    try {
      const response = await tavilySearch(query.query, {
        searchDepth: 'basic',
        topic: 'general',
        maxResults: 5,
        includeAnswer: false,
        includeImages: false,
        timeoutMs: 10_000,
      });
      report.queriesExecuted += 1;
      const actualCredits = typeof response.usage?.credits === 'number' ? response.usage.credits : null;
      report.actualCredits += actualCredits ?? 1;
      if (actualCredits === null) report.warnings.push(`Tavily did not return usage.credits for query ${query.id}; estimated 1 credit was recorded.`);

      const acceptedHosts: string[] = [];
      for (const result of response.results.slice(0, 5)) {
        report.candidatesFromTavily += 1;
        const evaluation = evaluateTavilyCandidate(result, query, seenHosts);
        report.resultDiagnostics.push(evaluation.diagnostic);
        if (!evaluation.candidate) {
          report.candidatesRejected += 1;
          incrementRejection(report, evaluation.rejectionCategory);
          continue;
        }
        const candidate = evaluation.candidate;
        seenHosts.add(new URL(candidate.websiteUrl as string).hostname.toLowerCase().replace(/^www\./, ''));
        acceptedHosts.push(new URL(candidate.websiteUrl as string).hostname.toLowerCase().replace(/^www\./, ''));
        candidates.push(candidate);
        report.candidatesAccepted += 1;
        if (evaluation.confidence === 'high') report.acceptedHighConfidence += 1;
        else report.acceptedForReview += 1;
      }

      try {
        appendTavilyLedgerEntry({
          timestamp: new Date().toISOString(),
          project: 'website_studio',
          operation: 'search',
          estimatedCredits: 1,
          actualCredits,
          queryHash: queryHash(query.query),
          resultCount: response.results.length,
          requestId: response.requestId,
        });
        ledger = readTavilyLedger();
      } catch (error) {
        report.warnings.push(`Ledger write failure after Tavily search: ${errorMessage(error)}`);
      }

      cache = upsertCache(cache, {
        queryId: query.id,
        queryHash: queryHash(query.query),
        lastRunAt: new Date().toISOString(),
        resultHostnames: acceptedHosts,
        requestId: response.requestId,
      });
      try {
        writeCache(cache);
      } catch (error) {
        report.warnings.push(`Cache write failure after Tavily search: ${errorMessage(error)}`);
      }
    } catch (error) {
      report.warnings.push(`${query.id}: ${errorMessage(error)}`);
    }
  }
  return { candidates, report };
}

export function addFallbackSource(report: WebsiteTavilyReport, sourceId: string): void {
  if (!report.fallbackSourcesUsed.includes(sourceId)) report.fallbackSourcesUsed.push(sourceId);
}

function loadConfig(): TavilyDiscoveryConfig {
  if (!fs.existsSync(CONFIG_PATH)) throw new Error('Missing Website Tavily discovery configuration.');
  const value = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')) as Partial<TavilyDiscoveryConfig>;
  if (typeof value.enabled !== 'boolean') throw new Error('Tavily discovery enabled must be boolean.');
  if (!Number.isInteger(value.queriesPerRun) || (value.queriesPerRun ?? 0) < 1 || (value.queriesPerRun ?? 0) > 3) {
    throw new Error('Tavily queriesPerRun must be between 1 and 3.');
  }
  if (value.resultsPerQuery !== 5) throw new Error('Tavily resultsPerQuery must be exactly 5.');
  if (!Array.isArray(value.queries) || value.queries.length > 10) throw new Error('Tavily queries must contain at most 10 entries.');
  const ids = new Set<string>();
  for (const query of value.queries) {
    if (!query.id || !query.query || typeof query.enabled !== 'boolean') throw new Error('Invalid Tavily query configuration.');
    if (!WEBSITE_CATEGORIES.includes(query.category)) throw new Error(`Unsupported Tavily query category: ${query.category}`);
    if (ids.has(query.id)) throw new Error(`Duplicate Tavily query ID: ${query.id}`);
    ids.add(query.id);
  }
  return value as TavilyDiscoveryConfig;
}

function loadLimits(): {
  valid: boolean;
  errors: string[];
  environmentEnabled: boolean;
  daily: number;
  monthly: number;
  threshold: number;
} {
  const errors: string[] = [];
  const enabledRaw = process.env.WEBSITE_TAVILY_ENABLED ?? 'false';
  if (!/^(true|false)$/i.test(enabledRaw)) errors.push('WEBSITE_TAVILY_ENABLED must be true or false.');
  const configuredDaily = strictInteger(process.env.WEBSITE_TAVILY_DAILY_CREDIT_LIMIT, 3, 1, 5, 'WEBSITE_TAVILY_DAILY_CREDIT_LIMIT', errors);
  const configuredMonthly = strictInteger(process.env.WEBSITE_TAVILY_MONTHLY_CREDIT_LIMIT, 100, 1, 150, 'WEBSITE_TAVILY_MONTHLY_CREDIT_LIMIT', errors);
  const configuredThreshold = strictInteger(process.env.TAVILY_SHARED_USAGE_THRESHOLD_PERCENT, 80, 50, 90, 'TAVILY_SHARED_USAGE_THRESHOLD_PERCENT', errors);
  const daily = Math.min(configuredDaily, 3);
  const monthly = Math.min(configuredMonthly, 100);
  const threshold = Math.min(configuredThreshold, 80);
  return {
    valid: errors.length === 0,
    errors,
    environmentEnabled: enabledRaw.toLowerCase() === 'true',
    daily,
    monthly,
    threshold,
  };
}

function eligibleQueries(
  queries: TavilyQuery[],
  cache: TavilyCacheEntry[],
  ledger: ReturnType<typeof readTavilyLedger>,
  refresh = false,
): {
  eligible: TavilyQuery[];
  cached: number;
  cachedIds: string[];
} {
  const cutoff = Date.now() - CACHE_DAYS * 24 * 60 * 60 * 1000;
  let cached = 0;
  const cachedIds: string[] = [];
  const eligible = queries.filter((query) => query.enabled).filter((query) => {
    if (refresh) return true;
    const currentHash = queryHash(query.query);
    const entry = cache.find((item) => item.queryId === query.id && item.queryHash === currentHash);
    const ledgerFresh = ledger.some((item) => (
      item.project === 'website_studio'
      && item.queryHash === currentHash
      && new Date(item.timestamp).getTime() >= cutoff
    ));
    const fresh = Boolean(entry && new Date(entry.lastRunAt).getTime() >= cutoff) || ledgerFresh;
    if (fresh) {
      cached += 1;
      cachedIds.push(query.id);
    }
    return !fresh;
  });
  eligible.sort((a, b) => {
    const aRun = cache.find((item) => item.queryId === a.id)?.lastRunAt ?? '';
    const bRun = cache.find((item) => item.queryId === b.id)?.lastRunAt ?? '';
    return aRun.localeCompare(bRun) || a.id.localeCompare(b.id);
  });
  return { eligible, cached, cachedIds };
}

export function evaluateTavilyCandidate(
  result: TavilySearchResult,
  query: Pick<TavilyQuery, 'category' | 'location'>,
  seenHosts: Set<string> = new Set(),
): {
  candidate: WebsiteCandidateInput | null;
  confidence: 'high' | 'low' | null;
  rejectionCategory: 'non_business' | 'generic_title' | 'editorial_or_directory' | 'low_relevance' | null;
  diagnostic: WebsiteTavilyReport['resultDiagnostics'][number];
} {
  const cleanedTitle = cleanTitle(result.title);
  const baseDiagnostic = {
    title: cleanedTitle.slice(0, 120),
    hostname: null as string | null,
    score: typeof result.score === 'number' ? result.score : null,
  };
  if (typeof result.score === 'number' && result.score < 0.5) {
    return rejected(baseDiagnostic, 'low_relevance', `Tavily relevance ${result.score.toFixed(2)} is below 0.50.`);
  }
  if (GENERIC_TITLE_PATTERN.test(cleanedTitle)) {
    return rejected(baseDiagnostic, 'generic_title', 'Generic page title does not identify an individual business.');
  }
  if (LIST_TITLE_PATTERN.test(cleanedTitle)) {
    return rejected(baseDiagnostic, 'non_business', 'List, comparison, or location-category title.');
  }

  let url: URL;
  try {
    url = new URL(result.url);
  } catch {
    return rejected(baseDiagnostic, 'non_business', 'Invalid result URL.');
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  baseDiagnostic.hostname = host;
  if (url.protocol !== 'https:' || unsafeHost(host) || seenHosts.has(host)) {
    return rejected(baseDiagnostic, 'non_business', 'Unsafe, unsupported, or duplicate hostname.');
  }
  if (
    BLOCKED_HOST_PATTERNS.some((blocked) => host.includes(blocked))
    || BLOCKED_PATH_PATTERN.test(url.pathname)
    || EDITORIAL_PATH_PATTERN.test(url.pathname)
  ) {
    return rejected(baseDiagnostic, 'editorial_or_directory', 'Editorial, directory, aggregator, or unsupported result URL.');
  }
  if (/\b(blog|news|article|directory|listing|jobs?|careers?|marketplace|travel guide)\b/i.test(`${url.pathname} ${cleanedTitle}`)) {
    return rejected(baseDiagnostic, 'editorial_or_directory', 'Editorial or directory language in the result.');
  }
  const businessName = conservativeBusinessName(cleanedTitle);
  if (!businessName) return rejected(baseDiagnostic, 'non_business', 'No conservative business identity could be extracted.');

  const signals = businessIdentitySignals(businessName, url, result.content);
  if (signals.length === 0) {
    return rejected(baseDiagnostic, 'non_business', 'No business-identity signals were found.');
  }
  const confidence = signals.length >= 2 ? 'high' : 'low';
  url.hash = '';
  for (const key of [...url.searchParams.keys()]) {
    if (/^(utm_|fbclid|gclid)/i.test(key)) url.searchParams.delete(key);
  }
  const discoveredAt = new Date().toISOString();
  const cleanUrl = url.toString().replace(/\/$/, '');
  const evidenceText = result.content.trim().slice(0, 500) || null;
  const confidenceNote = `${CONFIDENCE_MARKER}${confidence}] [tavily-signals:${signals.length}] [tavily-score:${typeof result.score === 'number' ? result.score.toFixed(3) : 'unknown'}]`;
  const reference: WebsiteSourceReference = {
    source: 'tavily_search',
    sourceUrl: cleanUrl,
    detailUrl: null,
    discoveredAt,
    evidenceText,
  };
  const candidate: WebsiteCandidateInput = {
    id: `tavily_${slug(businessName)}_${crypto.createHash('sha256').update(host).digest('hex').slice(0, 8)}`,
    businessName,
    category: query.category,
    source: 'tavily_search',
    location: query.location,
    websiteUrl: cleanUrl,
    instagramUrl: null,
    facebookUrl: null,
    email: null,
    phone: null,
    notes: `${confidenceNote} ${evidenceText ?? ''}`.trim(),
    detailUrl: null,
    sourceUrl: cleanUrl,
    discoveredAt,
    evidenceText,
    sources: [reference],
  };
  return {
    candidate,
    confidence,
    rejectionCategory: null,
    diagnostic: {
      ...baseDiagnostic,
      outcome: confidence === 'high' ? 'accepted_high_confidence' : 'accepted_for_review',
      reason: `${signals.length} business-identity signal(s): ${signals.join(', ')}.`,
    },
  };
}

function conservativeBusinessName(title: string): string | null {
  const first = cleanTitle(title)
    .split(/\s+[|–—]\s+/)[0]
    .replace(/\b(official site|official website|home)\b/gi, '')
    .trim();
  if (first.length < 2 || first.length > 100 || GENERIC_TITLE_PATTERN.test(first) || LIST_TITLE_PATTERN.test(first)) return null;
  return first;
}

function cleanTitle(title: string): string {
  return title
    .replace(/^[\s•*·▪►▸\-–—]+/, '')
    .replace(/^(?:wellness\s+)?resort\s+in\s+costa\s+rica(?=[A-ZÀ-ÖØ-Þ])/i, '')
    .replace(/\s+[A-Z][A-Z\s!]{10,}$/, '')
    .replace(/\s*([|–—])\s*\1+(?:\s*\1+)*/g, ' $1 ')
    .replace(/\s+/g, ' ')
    .replace(/\s+[|–—]\s+(official site|official website|home|welcome)$/i, '')
    .trim();
}

function businessIdentitySignals(name: string, url: URL, snippet: string): string[] {
  const signals: string[] = [];
  if (specificBusinessName(name)) signals.push('specific business-like name');
  if (hostnameResemblesName(url.hostname, name)) signals.push('hostname resembles name');
  if (ENTITY_TYPE_PATTERN.test(snippet)) signals.push('snippet identifies an entity type');
  if (url.pathname === '/' || url.pathname === '') signals.push('root official-style URL');
  return signals;
}

function specificBusinessName(name: string): boolean {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 10) return false;
  if (LIST_TITLE_PATTERN.test(name) || GENERIC_TITLE_PATTERN.test(name)) return false;
  const genericWords = new Set(['best', 'top', 'luxury', 'independent', 'boutique', 'hotels', 'hotel', 'retreats', 'retreat', 'surf', 'camps', 'camp', 'guanacaste', 'costa', 'rica', 'province']);
  return words.some((word) => !genericWords.has(word.toLowerCase()) && /^[A-ZÀ-ÖØ-Þ]/.test(word));
}

function hostnameResemblesName(hostname: string, name: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, '').split('.')[0].replace(/[^a-z0-9]/g, '');
  const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (host.length < 4 || normalizedName.length < 4) return false;
  return host.includes(normalizedName) || normalizedName.includes(host);
}

function rejected(
  diagnostic: Pick<WebsiteTavilyReport['resultDiagnostics'][number], 'title' | 'hostname' | 'score'>,
  category: 'non_business' | 'generic_title' | 'editorial_or_directory' | 'low_relevance',
  reason: string,
): ReturnType<typeof evaluateTavilyCandidate> {
  return {
    candidate: null,
    confidence: null,
    rejectionCategory: category,
    diagnostic: { ...diagnostic, outcome: 'rejected', reason },
  };
}

function incrementRejection(
  report: WebsiteTavilyReport,
  category: ReturnType<typeof evaluateTavilyCandidate>['rejectionCategory'],
): void {
  if (category === 'generic_title') report.rejectedGenericTitle += 1;
  else if (category === 'editorial_or_directory') report.rejectedEditorialOrDirectory += 1;
  else if (category === 'low_relevance') report.rejectedLowRelevance += 1;
  else report.rejectedNonBusiness += 1;
}

function loadCache(): TavilyCacheEntry[] {
  if (!fs.existsSync(CACHE_PATH)) return [];
  const parsed = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')) as unknown;
  if (!Array.isArray(parsed)) throw new Error('Website Tavily cache must be a JSON array.');
  return parsed as TavilyCacheEntry[];
}

function writeCache(cache: TavilyCacheEntry[]): void {
  const temporary = `${CACHE_PATH}.tmp-${process.pid}`;
  fs.writeFileSync(temporary, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
  fs.renameSync(temporary, CACHE_PATH);
}

function upsertCache(cache: TavilyCacheEntry[], entry: TavilyCacheEntry): TavilyCacheEntry[] {
  const next = cache.filter((item) => item.queryId !== entry.queryId);
  next.push(entry);
  return next;
}

export function createEmptyWebsiteTavilyReport(): WebsiteTavilyReport {
  return {
    tavilyEnabled: false,
    tavilyAvailable: false,
    usageChecked: false,
    accountPlanUsage: null,
    accountPlanLimit: null,
    accountUsagePercent: null,
    sharedThresholdPercent: 80,
    websiteCreditsUsedToday: 0,
    websiteCreditsUsedThisMonth: 0,
    websiteDailyLimit: 3,
    websiteMonthlyLimit: 100,
    queriesConfigured: 0,
    queriesEligible: 0,
    eligibleQueryIds: [],
    cachedQueryIds: [],
    queriesExecuted: 0,
    queriesSkippedCached: 0,
    estimatedCredits: 0,
    actualCredits: 0,
    budgetDecision: 'not_evaluated',
    budgetReasons: [],
    candidatesFromTavily: 0,
    candidatesAccepted: 0,
    candidatesRejected: 0,
    rejectedNonBusiness: 0,
    rejectedGenericTitle: 0,
    rejectedEditorialOrDirectory: 0,
    rejectedLowRelevance: 0,
    acceptedHighConfidence: 0,
    acceptedForReview: 0,
    fixtureLeadsExcludedFromProductionRanking: 0,
    resultDiagnostics: [],
    fallbackSourcesUsed: [],
    warnings: [],
  };
}

function strictInteger(
  raw: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
  name: string,
  errors: string[],
): number {
  if (raw === undefined) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < minimum || parsed > maximum) {
    errors.push(`${name} must be an integer between ${minimum} and ${maximum}.`);
    return fallback;
  }
  return parsed;
}

function unsafeHost(host: string): boolean {
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  const version = net.isIP(host);
  if (!version) return false;
  if (version === 6) return host === '::1' || /^(fc|fd|fe80)/i.test(host);
  const parts = host.split('.').map(Number);
  return parts[0] === 10 || parts[0] === 127 || (parts[0] === 169 && parts[1] === 254)
    || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
    || (parts[0] === 192 && parts[1] === 168);
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 48) || 'business';
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
