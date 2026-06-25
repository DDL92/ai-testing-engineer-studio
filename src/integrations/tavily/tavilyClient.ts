import fs = require('fs');
import path = require('path');

export interface TavilySearchOptions {
  maxResults?: number;
  searchDepth?: 'basic' | 'advanced';
  includeAnswer?: boolean;
  topic?: 'general';
  includeImages?: boolean;
  timeoutMs?: number;
  retainLinkedInSearchSnippets?: boolean;
}

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score?: number;
}

export interface TavilySearchResponse {
  query: string;
  answer?: string;
  results: TavilySearchResult[];
  requestId?: string;
  usage?: {
    credits?: number;
  };
}

export interface TavilyUsageResponse {
  planUsage: number | null;
  planLimit: number | null;
  paygoUsage: number | null;
  paygoLimit: number | null;
  accountSearchUsage: number | null;
  keyUsage: number | null;
  keyLimit: number | null;
  keySearchUsage: number | null;
  available: boolean;
  errorCode: string | null;
  errorMessage: string | null;
  httpStatus: number;
}

export interface TavilyRuntimeConfig {
  hasApiKey: boolean;
  maxResults: number;
  dailyLimit: number;
  searchDepth: 'basic' | 'advanced';
}

const tavilyEndpoint = 'https://api.tavily.com/search';
const tavilyUsageEndpoint = 'https://api.tavily.com/usage';

export function getTavilyRuntimeConfig(): TavilyRuntimeConfig {
  loadLocalEnv();
  const maxResults = boundedNumber(process.env.WEB_SEARCH_MAX_RESULTS, 10, 1, 20);
  const dailyLimit = boundedNumber(process.env.WEB_SEARCH_DAILY_LIMIT, 25, 1, 100);
  const searchDepth = process.env.WEB_SEARCH_DEPTH === 'basic' ? 'basic' : 'advanced';

  return {
    hasApiKey: Boolean(process.env.TAVILY_API_KEY),
    maxResults,
    dailyLimit,
    searchDepth,
  };
}

export async function tavilySearch(query: string, options: TavilySearchOptions = {}): Promise<TavilySearchResponse> {
  loadLocalEnv();
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error('No Tavily API key detected');
  }

  const config = getTavilyRuntimeConfig();
  const controller = options.timeoutMs ? new AbortController() : null;
  const timeout = controller ? setTimeout(() => controller.abort(), options.timeoutMs) : null;
  let response: Response;
  try {
    response = await fetch(tavilyEndpoint, {
      method: 'POST',
      signal: controller?.signal,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: options.searchDepth ?? config.searchDepth,
        max_results: options.maxResults ?? config.maxResults,
        include_answer: options.includeAnswer ?? false,
        include_raw_content: false,
        ...(options.topic ? { topic: options.topic } : {}),
        ...(options.includeImages !== undefined ? { include_images: options.includeImages } : {}),
      }),
    });
  } finally {
    if (timeout) clearTimeout(timeout);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Tavily search failed: ${response.status} ${body.slice(0, 200)}`);
  }

  const data = await response.json() as {
    query?: string;
    answer?: string;
    results?: Array<{ title?: string; url?: string; content?: string; score?: number }>;
    request_id?: string;
    usage?: { credits?: number };
  };

  return {
    query: data.query ?? query,
    answer: data.answer,
    requestId: typeof data.request_id === 'string' ? data.request_id : undefined,
    usage: data.usage,
    results: (data.results ?? [])
      .map((result) => ({
        title: String(result.title ?? '').trim(),
        url: String(result.url ?? '').trim(),
        content: String(result.content ?? '').trim(),
        score: typeof result.score === 'number' ? result.score : undefined,
      }))
      .filter((result) => result.title && result.url && (
        allowedPublicUrl(result.url)
        || (options.retainLinkedInSearchSnippets && allowedLinkedInSnippetUrl(result.url))
      )),
  };
}

export async function getTavilyUsage(): Promise<TavilyUsageResponse> {
  loadLocalEnv();
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error('No Tavily API key detected');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  let response: Response;
  try {
    response = await fetch(tavilyUsageEndpoint, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${apiKey}`,
        accept: 'application/json',
      },
    });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    throw new Error(
      `Tavily usage unavailable: attempted=true; httpStatus=${response.status}; `
      + `category=${usageErrorCategory(response.status)}; parseSuccess=false.`,
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error(
      `Tavily usage unavailable: attempted=true; httpStatus=${response.status}; `
      + 'category=invalid_json; parseSuccess=false.',
    );
  }

  if (!isRecord(data)) {
    throw new Error(
      `Tavily usage unavailable: attempted=true; httpStatus=${response.status}; `
      + 'category=invalid_shape; parseSuccess=false; missingFields=account,key.',
    );
  }
  const account = isRecord(data.account) ? data.account : null;
  const key = isRecord(data.key) ? data.key : null;
  const missingFields = [
    ...missingNumericFields(account, 'account', ['plan_usage', 'plan_limit']),
    ...(key ? [] : ['key']),
  ];
  if (missingFields.length > 0) {
    throw new Error(
      `Tavily usage unavailable: attempted=true; httpStatus=${response.status}; `
      + `category=missing_fields; parseSuccess=true; missingFields=${missingFields.join(',')}.`,
    );
  }

  return {
    planUsage: numberOrNull(account?.plan_usage),
    planLimit: numberOrNull(account?.plan_limit),
    paygoUsage: numberOrNull(account?.paygo_usage),
    paygoLimit: numberOrNull(account?.paygo_limit),
    accountSearchUsage: numberOrNull(account?.search_usage),
    keyUsage: numberOrNull(key?.usage),
    keyLimit: numberOrNull(key?.limit),
    keySearchUsage: numberOrNull(key?.search_usage),
    available: true,
    errorCode: null,
    errorMessage: null,
    httpStatus: response.status,
  };
}

export function allowedPublicUrl(url: string): boolean {
  const normalized = url.toLowerCase();
  return ![
    'linkedin.com',
    '/login',
    '/signin',
    '/sign-in',
    'accounts.google.com',
    'facebook.com/login',
  ].some((blocked) => normalized.includes(blocked));
}

export function allowedLinkedInSnippetUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return /(^|\.)linkedin\.com$/i.test(parsed.hostname)
      && /^\/in\/[^/]+\/?$/i.test(parsed.pathname)
      && !parsed.searchParams.has('sessionRedirect');
  } catch {
    return false;
  }
}

export function loadLocalEnv(): void {
  for (const fileName of ['.env.local', '.env']) {
    const envPath = path.join(process.cwd(), fileName);
    if (!fs.existsSync(envPath)) continue;
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const normalized = trimmed.startsWith('export ') ? trimmed.slice(7).trim() : trimmed;
      const index = normalized.indexOf('=');
      if (index <= 0) continue;
      const key = normalized.slice(0, index).trim();
      if (Object.prototype.hasOwnProperty.call(process.env, key)) continue;
      const value = normalized.slice(index + 1).trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  }
}

function boundedNumber(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}

function numberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function missingNumericFields(
  value: Record<string, unknown> | null,
  prefix: string,
  fields: string[],
): string[] {
  if (!value) return fields.map((field) => `${prefix}.${field}`);
  return fields
    .filter((field) => numberOrNull(value[field]) === null)
    .map((field) => `${prefix}.${field}`);
}

function usageErrorCategory(status: number): string {
  if (status === 401 || status === 403) return 'authentication';
  if (status === 429) return 'rate_limit';
  if (status >= 500) return 'server_error';
  return 'http_error';
}
