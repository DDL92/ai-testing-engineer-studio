import fs = require('fs');
import path = require('path');
import { searchLeads } from '../integrations/tavily/searchLeads';
import { getTavilyRuntimeConfig, loadLocalEnv, TavilySearchResult } from '../integrations/tavily/tavilyClient';
import {
  SearchProviderConfig,
  WebDiscoveryDashboard,
  WebDiscoveryState,
  WebLeadCandidate,
  WebLeadDiscoveryReport,
  WebSearchSource,
} from './types';

const dataRoot = path.join(process.cwd(), 'data', 'web-discovery');
const outputRoot = path.join(process.cwd(), 'output', 'web-discovery');
const statePath = path.join(dataRoot, 'web-discovery-state.json');
const sourcesPath = path.join(dataRoot, 'search-sources.json');
const leadsPath = path.join(dataRoot, 'discovered-web-leads.json');

const tavilyLeadQueries = [
  'gym management software',
  'fitness booking software',
  'martial arts software',
  'membership management platform',
  'crossfit software',
  'fitness saas platform',
  'booking software for gyms',
  'fitness scheduling software',
];

const discoveryNiches = [
  'gym management software',
  'fitness studio software',
  'martial arts school software',
  'booking software for gyms',
  'class scheduling SaaS',
  'membership management software',
  'wellness studio software',
  'yoga studio software',
  'CrossFit gym software',
  'personal training studio software',
];

const safetyRules = [
  'Use public web discovery only.',
  'Do not scrape LinkedIn.',
  'Do not scrape behind login.',
  'Do not bypass rate limits.',
  'Do not send outreach, emails, CRM updates, proposals, meetings, invoices, or payments.',
  'Do not invent leads, complaints, quotes, bugs, vulnerabilities, outcomes, or revenue.',
  'Human approval is required before promoting, contacting, auditing, proposing, or sending anything.',
];

export function buildWebLeadDiscoveryReport(): WebLeadDiscoveryReport {
  ensureWebDiscoveryData();

  const generatedAt = new Date().toISOString();
  const state = loadState();
  const provider = providerFromEnv(state.provider);
  const sources = loadSources().filter((source) => source.enabled);
  const queries = buildSearchQueries(sources);
  const leads = loadWebLeads().map((lead) => rankLead(lead)).sort((left, right) => right.score - left.score || left.companyName.localeCompare(right.companyName));
  const topFive = leads.slice(0, 5);
  const topLead = topFive[0];
  const status = leads.length > 0 ? 'Results available' : providerConfigured(provider) ? 'Provider configured' : 'Manual web research required';

  return {
    generatedAt,
    status,
    provider,
    queries,
    manualResearchChecklist: manualResearchChecklist(status),
    leads,
    topFive,
    topLead,
    bestNewQaOpportunity: topLead ? `${topLead.companyName}: ${topLead.recommendedOffer}` : 'No web lead results recorded yet.',
    recommendedResearchAction: topLead
      ? topLead.recommendedAction
      : 'Run the generated public-search queries manually, then paste reviewed candidates into data/web-discovery/discovered-web-leads.json.',
    safetyRules,
  };
}

export async function runTavilyLeadDiscovery(): Promise<WebLeadDiscoveryReport> {
  ensureWebDiscoveryData();
  loadLocalEnv();
  const config = getTavilyRuntimeConfig();

  if (!config.hasApiKey) {
    const report = buildWebLeadDiscoveryReport();
    saveState({
      ...report,
      status: 'Manual web research required',
      recommendedResearchAction: 'No Tavily API key detected. Use generated public-search queries manually.',
    });
    return {
      ...report,
      status: 'Manual web research required',
      recommendedResearchAction: 'No Tavily API key detected. Use generated public-search queries manually.',
    };
  }

  const generatedAt = new Date().toISOString();
  const existing = loadWebLeads().map((lead) => normalizeLead(lead));
  const merged = new Map<string, WebLeadCandidate>();
  for (const lead of existing) merged.set(leadKey(lead), lead);

  let searchesUsed = 0;
  for (const query of tavilyLeadQueries) {
    if (searchesUsed >= config.dailyLimit) break;
    const response = await searchLeads(query, config.maxResults);
    searchesUsed += 1;
    for (const result of response.results) {
      const candidate = resultToLead(result, query, generatedAt);
      const key = leadKey(candidate);
      if (!merged.has(key)) {
        merged.set(key, candidate);
        continue;
      }
      const current = merged.get(key);
      if (current && candidate.confidence > current.confidence) {
        merged.set(key, { ...current, ...candidate, discoveredAt: current.discoveredAt, discoveryDate: current.discoveryDate });
      }
    }
  }

  const ranked = dedupeLeads([...merged.values()].map((lead) => rankLead(lead))).sort((left, right) => right.score - left.score || left.companyName.localeCompare(right.companyName));
  saveWebLeads(ranked);

  const report = buildWebLeadDiscoveryReport();
  return {
    ...report,
    status: ranked.length > 0 ? 'Results available' : 'Provider configured',
    recommendedResearchAction: ranked[0]
      ? ranked[0].recommendedAction
      : 'Tavily returned no usable public lead results. Review search queries and limits.',
  };
}

export function writeSearchQueryOutputs(report: WebLeadDiscoveryReport): string[] {
  saveState(report);
  return writeOutputs([
    { fileName: 'search-queries.md', body: renderSearchQueries(report) },
  ]);
}

export function writeWebDiscoveryOutputs(report: WebLeadDiscoveryReport): string[] {
  saveState(report);
  saveWebLeads(report.leads);
  return writeOutputs([
    { fileName: 'discovered-web-leads.md', body: renderDiscoveredWebLeads(report) },
    { fileName: 'web-discovery-summary.md', body: renderWebDiscoverySummary(report) },
  ]);
}

export function writeWebLeadRankingOutputs(report: WebLeadDiscoveryReport): string[] {
  saveState(report);
  saveWebLeads(report.leads);
  return writeOutputs([
    { fileName: 'web-lead-ranking.md', body: renderWebLeadRanking(report) },
    { fileName: 'top-5-web-leads.md', body: renderTopFiveWebLeads(report) },
  ]);
}

export function writeWebDiscoverySummaryOutputs(report: WebLeadDiscoveryReport): string[] {
  saveState(report);
  return writeOutputs([
    { fileName: 'web-discovery-summary.md', body: renderWebDiscoverySummary(report) },
  ]);
}

export function buildWebDiscoveryDashboard(): Omit<WebDiscoveryDashboard, 'topPainSignal'> {
  const report = buildWebLeadDiscoveryReport();
  const today = new Date().toISOString().slice(0, 10);
  return {
    newWebLeads: report.leads.length,
    topWebLead: report.topLead?.companyName ?? 'No web leads recorded',
    bestNewQaOpportunity: report.bestNewQaOpportunity,
    recommendedResearchAction: report.recommendedResearchAction,
    newLeadsToday: report.leads.filter((lead) => lead.discoveryDate === today).length,
    topOpportunity: report.topLead ? `${report.topLead.companyName} (${report.topLead.score}/100)` : 'No web opportunity recorded',
    bestNewLead: report.topLead?.companyName ?? 'No web leads recorded',
    leadSource: report.topLead?.sourceUrl ?? 'No source recorded',
    discoveryDate: report.topLead?.discoveryDate ?? 'No discovery date recorded',
  };
}

export function renderSearchQueries(report: WebLeadDiscoveryReport): string {
  return [
    '# Web Lead Search Queries',
    '',
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    `Provider: ${report.provider.provider}`,
    '',
    '## Queries',
    renderList(report.queries.map((query) => `\`${query}\``)),
    '',
    '## Manual Research Checklist',
    renderList(report.manualResearchChecklist),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderDiscoveredWebLeads(report: WebLeadDiscoveryReport): string {
  return [
    '# Discovered Web Leads',
    '',
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    '',
    report.leads.length > 0 ? renderLeadTable(report.leads) : 'No web leads recorded yet. Manual web research required.',
    '',
    '## Fallback Mode',
    report.status === 'Manual web research required'
      ? 'No search API key was detected, so Studio generated public-search tasks instead of inventing web results.'
      : 'Provider configuration detected or local web lead results are available.',
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderWebLeadRanking(report: WebLeadDiscoveryReport): string {
  return [
    '# Web Lead Ranking',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    report.leads.length > 0 ? renderLeadTable(report.leads) : 'No web leads available to rank.',
    '',
    '## Scoring',
    renderList([
      'Score considers SaaS fit, booking/payment/member workflow complexity, public website availability, QA audit fit, Playwright automation fit, retainer fit, and available review/pain signals.',
      'Scores use only local recorded web lead evidence; no web results are invented.',
    ]),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderTopFiveWebLeads(report: WebLeadDiscoveryReport): string {
  return [
    '# Top 5 Web Leads',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    report.topFive.length > 0 ? renderLeadTable(report.topFive) : 'No top web leads because no reviewed web results are recorded yet.',
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderWebDiscoverySummary(report: WebLeadDiscoveryReport): string {
  return [
    '# Web Discovery Summary',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderList([
      `Status: ${report.status}`,
      `Search provider: ${report.provider.provider}`,
      `API key env: ${report.provider.apiKeyEnv ?? 'none'}`,
      `Recorded web leads: ${report.leads.length}`,
      `Top web lead: ${report.topLead?.companyName ?? 'None'}`,
      `Best new QA opportunity: ${report.bestNewQaOpportunity}`,
      `Recommended research action: ${report.recommendedResearchAction}`,
    ]),
    '',
    '## Manual Research Checklist',
    renderList(report.manualResearchChecklist),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

function ensureWebDiscoveryData(): void {
  fs.mkdirSync(dataRoot, { recursive: true });
  fs.mkdirSync(outputRoot, { recursive: true });
  if (!fs.existsSync(statePath)) {
    fs.writeFileSync(statePath, `${JSON.stringify(defaultState(), null, 2)}\n`, 'utf8');
  }
  if (!fs.existsSync(sourcesPath)) {
    fs.writeFileSync(sourcesPath, `${JSON.stringify(defaultSources(), null, 2)}\n`, 'utf8');
  }
  if (!fs.existsSync(leadsPath)) {
    fs.writeFileSync(leadsPath, `${JSON.stringify([], null, 2)}\n`, 'utf8');
  }
}

function defaultState(): WebDiscoveryState {
  return {
    schemaVersion: 1,
    lastRunAt: null,
    status: 'Manual web research required',
    provider: {
      provider: 'tavily',
      apiKeyEnv: 'TAVILY_API_KEY',
      endpoint: null,
      enabled: false,
    },
    notes: [
      'Fallback mode generates search queries and manual research tasks.',
      'Future provider adapters can write reviewed public results into discovered-web-leads.json.',
    ],
    safetyRules,
  };
}

function defaultSources(): WebSearchSource[] {
  return discoveryNiches.map((niche) => ({
    id: slug(niche),
    niche,
    enabled: true,
    queryTemplates: [
      `"${niche}" "demo" "pricing"`,
      `"${niche}" "customer reviews"`,
      `"${niche}" "alternatives" "features"`,
      `"${niche}" "booking" "payments"`,
      `"${niche}" "mobile app" "reviews"`,
    ],
    allowedSources: ['public websites', 'public review pages', 'public directories', 'public comparison pages'],
    disallowedSources: ['LinkedIn', 'login-only pages', 'private communities', 'paid databases'],
  }));
}

function loadState(): WebDiscoveryState {
  return readJson<WebDiscoveryState>(statePath, defaultState());
}

function loadSources(): WebSearchSource[] {
  return readJson<WebSearchSource[]>(sourcesPath, defaultSources());
}

function loadWebLeads(): WebLeadCandidate[] {
  return dedupeLeads(readJson<WebLeadCandidate[]>(leadsPath, []).map((lead) => normalizeLead(lead)));
}

function providerFromEnv(provider: SearchProviderConfig): SearchProviderConfig {
  loadLocalEnv();
  const providerName = (process.env.WEB_SEARCH_PROVIDER as SearchProviderConfig['provider'] | undefined) ?? provider.provider ?? 'tavily';
  const apiKeyEnv = process.env.WEB_SEARCH_API_KEY_ENV ?? provider.apiKeyEnv ?? 'TAVILY_API_KEY';
  const hasKey = Boolean(apiKeyEnv && process.env[apiKeyEnv]);
  return {
    provider: providerName,
    apiKeyEnv,
    endpoint: process.env.WEB_SEARCH_ENDPOINT ?? provider.endpoint,
    enabled: hasKey,
  };
}

function providerConfigured(provider: SearchProviderConfig): boolean {
  return provider.enabled && provider.provider !== 'manual';
}

function buildSearchQueries(sources: WebSearchSource[]): string[] {
  return sources.flatMap((source) => source.queryTemplates).slice(0, 60);
}

function manualResearchChecklist(status: string): string[] {
  return [
    status === 'Manual web research required'
      ? 'No search API key detected. Use these queries manually in a public search engine.'
      : 'Review provider results manually before saving candidates.',
    'Open only public pages. Do not log in or bypass access controls.',
    'Record only company name, public website, source URL, source title, and cautious evidence.',
    'Save reviewed candidates to data/web-discovery/discovered-web-leads.json.',
    'Do not contact anyone from this workflow.',
  ];
}

function rankLead(lead: WebLeadCandidate): WebLeadCandidate {
  const normalizedLead = normalizeLead(lead);
  const haystack = [
    normalizedLead.companyName,
    normalizedLead.website,
    normalizedLead.sourceTitle,
    normalizedLead.snippet,
    normalizedLead.niche,
    normalizedLead.evidence.join(' '),
  ].join(' ').toLowerCase();
  const scoreReasons: string[] = [];
  let score = 0;

  score += addIf(haystack, ['saas', 'software', 'platform'], 15, 'SaaS/software fit', scoreReasons);
  score += addIf(haystack, ['booking', 'scheduling', 'class', 'membership', 'member'], 20, 'Booking/member workflow complexity', scoreReasons);
  score += addIf(haystack, ['payment', 'checkout', 'billing', 'subscription'], 15, 'Payment or checkout workflow', scoreReasons);
  score += normalizedLead.website ? 10 : 0;
  if (normalizedLead.website) scoreReasons.push('+10 Public website available');
  score += Math.round((normalizedLead.confidence || 0) * 10);
  if (normalizedLead.confidence) scoreReasons.push(`+${Math.round(normalizedLead.confidence * 10)} Tavily result confidence`);
  score += addIf(haystack, ['review', 'complaint', 'support', 'mobile', 'integration', 'reporting'], 15, 'Review or pain-signal context', scoreReasons);
  score += addIf(haystack, ['mobile', 'app', 'integration', 'regression', 'release'], 15, 'Playwright automation fit', scoreReasons);
  score += addIf(haystack, ['enterprise', 'multi-location', 'franchise', 'retention', 'operations'], 10, 'Potential retainer fit', scoreReasons);

  const normalizedScore = Math.max(0, Math.min(100, score));
  return {
    ...normalizedLead,
    score: normalizedScore,
    scoreReasons: normalizedLead.scoreReasons?.length ? normalizedLead.scoreReasons : scoreReasons,
    recommendedOffer: normalizedLead.recommendedOffer || offerForScore(normalizedScore),
    recommendedAction: normalizedLead.recommendedAction || `Human review ${normalizedLead.companyName}; confirm public evidence before adding to active lead workflow.`,
    status: 'ranked',
  };
}

function resultToLead(result: TavilySearchResult, query: string, generatedAt: string): WebLeadCandidate {
  const url = safeUrl(result.url);
  const companyName = companyNameFromResult(result);
  const confidence = typeof result.score === 'number' ? Math.max(0, Math.min(1, result.score)) : 0.5;
  return normalizeLead({
    id: slug(`${companyName}-${url.hostname}`),
    name: companyName,
    companyName,
    website: url.origin,
    source: result.url,
    sourceUrl: result.url,
    sourceTitle: result.title,
    snippet: result.content,
    niche: query,
    discoveryDate: generatedAt.slice(0, 10),
    query,
    confidence,
    notes: result.content,
    discoveredAt: generatedAt,
    sourceType: 'provider',
    evidence: [result.title, result.content].filter(Boolean),
    score: 0,
    scoreReasons: [],
    recommendedOffer: '',
    recommendedAction: '',
    painSignalCount: 0,
    status: 'needs-human-review',
  });
}

function dedupeLeads(leads: WebLeadCandidate[]): WebLeadCandidate[] {
  const merged = new Map<string, WebLeadCandidate>();
  for (const lead of leads.filter((item) => isLeadCandidateUrl(item.website || item.sourceUrl))) {
    const key = originFor(lead.website || lead.sourceUrl) || lead.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const current = merged.get(key);
    if (!current || lead.score > current.score || lead.confidence > current.confidence) {
      merged.set(key, lead);
    }
  }
  return [...merged.values()];
}

function normalizeLead(raw: Partial<WebLeadCandidate>): WebLeadCandidate {
  const companyName = String(raw.companyName ?? raw.name ?? raw.sourceTitle ?? 'Unknown web lead').trim();
  const sourceUrl = String(raw.sourceUrl ?? raw.source ?? raw.website ?? '').trim();
  const website = String(raw.website ?? originFor(sourceUrl)).trim();
  const discoveredAt = String(raw.discoveredAt ?? raw.discoveryDate ?? new Date().toISOString());
  return {
    id: String(raw.id ?? slug(`${companyName}-${website || sourceUrl}`)),
    name: String(raw.name ?? companyName),
    companyName,
    website,
    source: String(raw.source ?? sourceUrl),
    sourceUrl,
    sourceTitle: String(raw.sourceTitle ?? companyName),
    snippet: String(raw.snippet ?? raw.notes ?? ''),
    niche: String(raw.niche ?? raw.query ?? 'web discovery'),
    discoveryDate: String(raw.discoveryDate ?? discoveredAt.slice(0, 10)),
    query: String(raw.query ?? raw.niche ?? 'web discovery'),
    confidence: typeof raw.confidence === 'number' ? raw.confidence : 0.5,
    notes: String(raw.notes ?? raw.snippet ?? ''),
    discoveredAt,
    sourceType: raw.sourceType ?? 'provider',
    evidence: Array.isArray(raw.evidence) ? raw.evidence : [String(raw.snippet ?? raw.notes ?? '')].filter(Boolean),
    score: typeof raw.score === 'number' ? raw.score : 0,
    scoreReasons: Array.isArray(raw.scoreReasons) ? raw.scoreReasons : [],
    recommendedOffer: String(raw.recommendedOffer ?? ''),
    recommendedAction: String(raw.recommendedAction ?? ''),
    painSignalCount: typeof raw.painSignalCount === 'number' ? raw.painSignalCount : 0,
    status: raw.status ?? 'needs-human-review',
  };
}

function companyNameFromResult(result: TavilySearchResult): string {
  const title = result.title
    .replace(/\s*[-|:]\s*(Official Site|Pricing|Reviews|Software|G2|Capterra).*$/i, '')
    .replace(/\b(Best|Top)\s+\d*\s*/i, '')
    .trim();
  if (title && title.length <= 80) return title;
  return hostName(result.url);
}

function leadKey(lead: WebLeadCandidate): string {
  return originFor(lead.website || lead.sourceUrl) || `${lead.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '')}:${lead.sourceUrl}`;
}

function isLeadCandidateUrl(value: string): boolean {
  const normalized = value.toLowerCase();
  return ![
    'youtube.com',
    'youtu.be',
    'reddit.com',
    'g2.com',
    'capterra.com',
    'softwareadvice.com',
    'getapp.com',
    'trustradius.com',
  ].some((blocked) => normalized.includes(blocked));
}

function saveWebLeads(leads: WebLeadCandidate[]): void {
  fs.writeFileSync(leadsPath, `${JSON.stringify(dedupeLeads(leads), null, 2)}\n`, 'utf8');
}

function safeUrl(value: string): URL {
  try {
    return new URL(value);
  } catch {
    return new URL('https://example.invalid');
  }
}

function originFor(value: string): string {
  if (!value) return '';
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
}

function hostName(value: string): string {
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch {
    return 'Unknown web lead';
  }
}

function addIf(text: string, terms: string[], points: number, reason: string, reasons: string[]): number {
  if (!terms.some((term) => text.includes(term))) return 0;
  reasons.push(`+${points} ${reason}`);
  return points;
}

function offerForScore(score: number): string {
  if (score >= 80) return 'QA Automation Retainer candidate';
  if (score >= 65) return 'Playwright Starter Pack candidate';
  if (score >= 45) return 'QA Audit candidate';
  return 'Manual review only';
}

function saveState(report: WebLeadDiscoveryReport): void {
  const state = loadState();
  fs.writeFileSync(statePath, `${JSON.stringify({ ...state, lastRunAt: report.generatedAt, status: report.status, provider: report.provider }, null, 2)}\n`, 'utf8');
}

function writeOutputs(outputs: { fileName: string; body: string }[]): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });
  return outputs.map((output) => {
    const outputPath = path.join(outputRoot, output.fileName);
    fs.writeFileSync(outputPath, output.body, 'utf8');
    return outputPath;
  });
}

function renderLeadTable(leads: WebLeadCandidate[]): string {
  return [
    '| Lead | Score | Niche | Offer | Source | Recommended Action |',
    '| --- | ---: | --- | --- | --- | --- |',
    ...leads.map((lead) => `| ${escapeTable(lead.companyName)} | ${lead.score}/100 | ${escapeTable(lead.niche)} | ${escapeTable(lead.recommendedOffer)} | ${escapeTable(lead.sourceUrl || lead.sourceTitle || 'Local record')} | ${escapeTable(lead.recommendedAction)} |`),
  ].join('\n');
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function renderList(items: string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : '- None';
}

function escapeTable(value: string): string {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
