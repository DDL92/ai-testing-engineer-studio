import fs = require('fs');
import path = require('path');

export interface TavilySearchOptions {
  maxResults?: number;
  searchDepth?: 'basic' | 'advanced';
  includeAnswer?: boolean;
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
}

export interface TavilyRuntimeConfig {
  hasApiKey: boolean;
  maxResults: number;
  dailyLimit: number;
  searchDepth: 'basic' | 'advanced';
}

const tavilyEndpoint = 'https://api.tavily.com/search';

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
  const response = await fetch(tavilyEndpoint, {
    method: 'POST',
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
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Tavily search failed: ${response.status} ${body.slice(0, 200)}`);
  }

  const data = await response.json() as {
    query?: string;
    answer?: string;
    results?: Array<{ title?: string; url?: string; content?: string; score?: number }>;
  };

  return {
    query: data.query ?? query,
    answer: data.answer,
    results: (data.results ?? [])
      .map((result) => ({
        title: String(result.title ?? '').trim(),
        url: String(result.url ?? '').trim(),
        content: String(result.content ?? '').trim(),
        score: typeof result.score === 'number' ? result.score : undefined,
      }))
      .filter((result) => result.title && result.url && allowedPublicUrl(result.url)),
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

export function loadLocalEnv(): void {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return;
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const index = trimmed.indexOf('=');
    if (index <= 0) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

function boundedNumber(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(parsed)));
}
