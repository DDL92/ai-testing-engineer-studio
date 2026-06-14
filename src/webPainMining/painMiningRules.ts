import fs = require('fs');
import path = require('path');
import { searchPainPoints } from '../integrations/tavily/searchPainPoints';
import { searchReviews } from '../integrations/tavily/searchReviews';
import { getTavilyRuntimeConfig, loadLocalEnv, TavilySearchResult } from '../integrations/tavily/tavilyClient';
import {
  PainMiningDashboard,
  PainMiningReport,
  PainMiningSource,
  PainMiningState,
  PainSignal,
} from './types';

const dataRoot = path.join(process.cwd(), 'data', 'web-pain-mining');
const outputRoot = path.join(process.cwd(), 'output', 'web-pain-mining');
const statePath = path.join(dataRoot, 'pain-mining-state.json');
const sourcesPath = path.join(dataRoot, 'pain-sources.json');
const signalsPath = path.join(dataRoot, 'pain-signals.json');

const tavilyPainQueries = [
  'site:reddit.com PushPress complaints',
  'site:reddit.com PushPress problems',
  'site:g2.com PushPress reviews problems',
  'site:capterra.com PushPress reviews',
  'site:reddit.com TeamUp issues',
  'site:g2.com TeamUp reviews problems',
  'site:reddit.com Wodify complaints',
  'site:g2.com Wodify reviews problems',
  'site:reddit.com ABC Fitness complaints',
  'site:g2.com ABC Fitness reviews problems',
  'site:capterra.com gym software reviews complaints',
];

const niches = [
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

const categories = [
  'booking',
  'scheduling',
  'payments',
  'checkout',
  'signup',
  'onboarding',
  'mobile app',
  'notifications',
  'integrations',
  'reporting',
  'performance',
  'support',
  'regression',
  'UX friction',
];

const safetyRules = [
  'Use cautious language only.',
  'Do not invent complaints, customer quotes, bugs, vulnerabilities, outages, incidents, lost revenue, churn, or customer sentiment.',
  'Do not scrape LinkedIn, private communities, login-only pages, or pages that disallow automated access.',
  'Do not send outreach, emails, CRM updates, proposals, meetings, invoices, or payments.',
  'Human approval is required before using any pain signal in client-facing material.',
];

export function buildPainMiningReport(): PainMiningReport {
  ensurePainMiningData();

  const generatedAt = new Date().toISOString();
  const state = loadState();
  const queries = buildPainQueries(loadSources().filter((source) => source.enabled));
  const signals = loadSignals().map(normalizeSignal);
  const status = signals.length > 0 ? 'Signals available' : hasApiKey(state) ? 'Provider configured' : 'Manual web research required';
  const recurringComplaints = recurringSignals(signals);
  const qaRiskOpportunities = buildQaRiskOpportunities(signals);
  const topSignal = signals[0];

  return {
    generatedAt,
    status,
    queries,
    signals,
    topSignal,
    recurringComplaints,
    qaRiskOpportunities,
    recommendedResearchAction: topSignal
      ? `Worth reviewing ${topSignal.companyName} for possible ${topSignal.category} QA opportunity.`
      : 'Run the generated pain-search queries manually and record only reviewed public signals in data/web-pain-mining/pain-signals.json.',
    safetyRules,
  };
}

export async function runTavilyPainMining(): Promise<PainMiningReport> {
  ensurePainMiningData();
  loadLocalEnv();
  const config = getTavilyRuntimeConfig();

  if (!config.hasApiKey) {
    const report = buildPainMiningReport();
    saveState({ ...report, status: 'Manual web research required' });
    return {
      ...report,
      status: 'Manual web research required',
      recommendedResearchAction: 'No Tavily API key detected. Use generated pain-search queries manually.',
    };
  }

  const generatedAt = new Date().toISOString();
  const existing = loadSignals().map(normalizeSignal);
  const merged = new Map<string, PainSignal>();
  for (const signal of existing) merged.set(signalKey(signal), signal);

  let searchesUsed = 0;
  for (const query of tavilyPainQueries) {
    if (searchesUsed >= config.dailyLimit) break;
    const response = query.includes('reviews')
      ? await searchReviews(query, config.maxResults)
      : await searchPainPoints(query, config.maxResults);
    searchesUsed += 1;
    for (const result of response.results) {
      const signal = resultToPainSignal(result, query, generatedAt);
      const key = signalKey(signal);
      if (!merged.has(key)) merged.set(key, signal);
    }
  }

  const signals = [...merged.values()].sort((left, right) => confidenceRank(right.confidence) - confidenceRank(left.confidence) || left.companyName.localeCompare(right.companyName));
  fs.writeFileSync(signalsPath, `${JSON.stringify(signals, null, 2)}\n`, 'utf8');

  const report = buildPainMiningReport();
  return {
    ...report,
    status: signals.length > 0 ? 'Signals available' : 'Provider configured',
    recommendedResearchAction: signals[0]
      ? `Worth reviewing ${signals[0].companyName} for possible ${signals[0].category} QA opportunity.`
      : 'Tavily returned no usable public pain signals. Review search queries and limits.',
  };
}

export function writePainQueryOutputs(report: PainMiningReport): string[] {
  saveState(report);
  return writeOutputs([
    { fileName: 'pain-search-queries.md', body: renderPainQueries(report) },
  ]);
}

export function writePainMiningOutputs(report: PainMiningReport): string[] {
  saveState(report);
  return writeOutputs([
    { fileName: 'pain-signals.md', body: renderPainSignals(report) },
  ]);
}

export function writePainSummaryOutputs(report: PainMiningReport): string[] {
  saveState(report);
  return writeOutputs([
    { fileName: 'recurring-complaints.md', body: renderRecurringComplaints(report) },
    { fileName: 'qa-risk-opportunities.md', body: renderQaRiskOpportunities(report) },
    { fileName: 'pain-mining-summary.md', body: renderPainMiningSummary(report) },
  ]);
}

export function buildPainMiningDashboard(): PainMiningDashboard {
  const report = buildPainMiningReport();
  return {
    topPainSignal: report.topSignal
      ? `Potential recurring pain signal: ${report.topSignal.category}`
      : 'No pain signals recorded',
  };
}

export function renderPainQueries(report: PainMiningReport): string {
  return [
    '# Pain Search Queries',
    '',
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    '',
    '## Queries',
    renderList(report.queries.map((query) => `\`${query}\``)),
    '',
    '## Manual Review Rules',
    renderList([
      'Use public pages only.',
      'Summarize cautiously; do not copy customer quotes into reports unless Daniel approves.',
      'Record only reviewed public signals in data/web-pain-mining/pain-signals.json.',
    ]),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderPainSignals(report: PainMiningReport): string {
  return [
    '# Pain Signals',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    report.signals.length > 0 ? renderSignalTable(report.signals) : 'No pain signals recorded yet. Manual web research required.',
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderRecurringComplaints(report: PainMiningReport): string {
  return [
    '# Recurring Complaints',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    report.recurringComplaints.length > 0
      ? renderList(report.recurringComplaints)
      : 'Not enough reviewed public pain signals available.',
    '',
    '## Required Language',
    renderList([
      'Public reviews may indicate...',
      'Potential recurring pain signal...',
      'Worth reviewing...',
      'Possible QA opportunity...',
    ]),
    '',
  ].join('\n');
}

export function renderQaRiskOpportunities(report: PainMiningReport): string {
  return [
    '# QA Risk Opportunities',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    report.qaRiskOpportunities.length > 0
      ? renderList(report.qaRiskOpportunities)
      : 'No QA risk opportunities can be inferred without reviewed public pain signals.',
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderPainMiningSummary(report: PainMiningReport): string {
  return [
    '# Pain Mining Summary',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderList([
      `Status: ${report.status}`,
      `Recorded pain signals: ${report.signals.length}`,
      `Top pain signal: ${report.topSignal ? `${report.topSignal.companyName} - ${report.topSignal.category}` : 'None'}`,
      `Recommended research action: ${report.recommendedResearchAction}`,
    ]),
    '',
    '## Cautious Language Rules',
    renderList([
      'Allowed: Public reviews may indicate...',
      'Allowed: Potential recurring pain signal...',
      'Allowed: Worth reviewing...',
      'Allowed: Possible QA opportunity...',
      'Not allowed: Customers hate...',
      'Not allowed: The product is broken...',
      'Not allowed: They have bugs...',
      'Not allowed: They are losing revenue...',
      'Not allowed: Confirmed vulnerability...',
    ]),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

function ensurePainMiningData(): void {
  fs.mkdirSync(dataRoot, { recursive: true });
  fs.mkdirSync(outputRoot, { recursive: true });
  if (!fs.existsSync(statePath)) fs.writeFileSync(statePath, `${JSON.stringify(defaultState(), null, 2)}\n`, 'utf8');
  if (!fs.existsSync(sourcesPath)) fs.writeFileSync(sourcesPath, `${JSON.stringify(defaultSources(), null, 2)}\n`, 'utf8');
  if (!fs.existsSync(signalsPath)) fs.writeFileSync(signalsPath, `${JSON.stringify([], null, 2)}\n`, 'utf8');
}

function defaultState(): PainMiningState {
  return {
    schemaVersion: 1,
    lastRunAt: null,
    status: 'Manual web research required',
    apiKeyEnv: 'TAVILY_API_KEY',
    notes: [
      'Fallback mode generates public search queries only.',
      'Pain signals must be manually reviewed before use.',
    ],
    safetyRules,
  };
}

function defaultSources(): PainMiningSource[] {
  return categories.map((category) => ({
    id: category.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: category,
    enabled: true,
    sourceType: 'search_query',
    queryTemplates: niches.slice(0, 5).map((niche) => `"${niche}" "${category}" "reviews"`),
    allowedUse: 'Public review/search pages only; manual review required.',
    disallowedUse: ['LinkedIn', 'private groups', 'login-only pages', 'copied customer quotes without approval'],
  }));
}

function loadState(): PainMiningState {
  return readJson<PainMiningState>(statePath, defaultState());
}

function loadSources(): PainMiningSource[] {
  return readJson<PainMiningSource[]>(sourcesPath, defaultSources());
}

function loadSignals(): PainSignal[] {
  return readJson<PainSignal[]>(signalsPath, []);
}

function buildPainQueries(sources: PainMiningSource[]): string[] {
  return sources.flatMap((source) => source.queryTemplates).slice(0, 80);
}

function normalizeSignal(signal: PainSignal): PainSignal {
  const companyName = String(signal.companyName ?? signal.company ?? companyFromQuery(signal.sourceTitle ?? '')).trim() || 'Unknown company';
  const sourceUrl = String(signal.sourceUrl ?? signal.url ?? '').trim();
  const observedText = String(signal.observedText ?? signal.signal ?? '').trim();
  const discoveredAt = String(signal.discoveredAt ?? signal.date ?? new Date().toISOString());
  const category = categories.find((item) => item.toLowerCase() === String(signal.category).toLowerCase()) ?? detectCategory(observedText);
  return {
    ...signal,
    id: String(signal.id ?? slug(`${companyName}-${sourceUrl}-${category}`)),
    company: String(signal.company ?? companyName),
    companyName,
    source: String(signal.source ?? sourceUrl),
    url: String(signal.url ?? sourceUrl),
    signal: String(signal.signal ?? observedText),
    category,
    sourceUrl,
    sourceTitle: String(signal.sourceTitle ?? companyName),
    observedText,
    cautiousSummary: safeSummary(signal.cautiousSummary || observedText, category),
    confidence: signal.confidence ?? 'low',
    date: String(signal.date ?? discoveredAt.slice(0, 10)),
    discoveredAt,
    sourceType: signal.sourceType ?? 'manual',
  };
}

function recurringSignals(signals: PainSignal[]): string[] {
  const counts = new Map<string, number>();
  for (const signal of signals) counts.set(signal.category, (counts.get(signal.category) ?? 0) + 1);
  return [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([category, count]) => `Potential recurring pain signal: ${category} appeared in ${count} reviewed public signal(s).`);
}

function buildQaRiskOpportunities(signals: PainSignal[]): string[] {
  return signals.slice(0, 10).map((signal) => `Possible QA opportunity: ${signal.companyName} may be worth reviewing for ${signal.category} workflow risk.`);
}

function safeSummary(value: string, category: string): string {
  const cleaned = String(value ?? '').replace(/\s+/g, ' ').trim();
  if (!cleaned) return `Potential recurring pain signal around ${category}.`;
  return cleaned.startsWith('Public reviews may indicate') || cleaned.startsWith('Potential recurring pain signal') || cleaned.startsWith('Worth reviewing') || cleaned.startsWith('Possible QA opportunity')
    ? cleaned
    : `Public reviews may indicate ${cleaned}`;
}

function hasApiKey(state: PainMiningState): boolean {
  loadLocalEnv();
  return Boolean(state.apiKeyEnv && process.env[state.apiKeyEnv]);
}

function resultToPainSignal(result: TavilySearchResult, query: string, generatedAt: string): PainSignal {
  const company = companyFromQuery(query);
  const category = detectCategory(`${query} ${result.title} ${result.content}`);
  const signal = result.content || result.title;
  const confidence = confidenceFor(result.score, result.url);
  return normalizeSignal({
    id: slug(`${company}-${category}-${result.url}`),
    company,
    companyName: company,
    source: result.url,
    url: result.url,
    signal,
    category,
    sourceUrl: result.url,
    sourceTitle: result.title,
    observedText: signal,
    cautiousSummary: safeSummary(signal, category),
    confidence,
    date: generatedAt.slice(0, 10),
    discoveredAt: generatedAt,
    sourceType: 'provider',
  });
}

function companyFromQuery(query: string): string {
  const match = query.match(/\b(PushPress|TeamUp|Wodify|ABC Fitness)\b/i);
  if (match) return match[1].replace(/\b\w/g, (char) => char.toUpperCase());
  if (/gym software/i.test(query)) return 'Gym Software Market';
  return 'Unknown company';
}

function detectCategory(text: string): string {
  const normalized = text.toLowerCase();
  return categories.find((category) => normalized.includes(category.toLowerCase()))
    ?? (normalized.includes('book') ? 'booking'
      : normalized.includes('pay') ? 'payments'
        : normalized.includes('mobile') || normalized.includes('app') ? 'mobile app'
          : normalized.includes('support') ? 'support'
            : 'UX friction');
}

function confidenceFor(score: number | undefined, url: string): 'low' | 'medium' | 'high' {
  const normalized = url.toLowerCase();
  if ((score ?? 0) >= 0.75 && (normalized.includes('g2.com') || normalized.includes('capterra.com') || normalized.includes('reddit.com'))) return 'high';
  if ((score ?? 0) >= 0.45) return 'medium';
  return 'low';
}

function confidenceRank(confidence: 'low' | 'medium' | 'high'): number {
  return confidence === 'high' ? 3 : confidence === 'medium' ? 2 : 1;
}

function signalKey(signal: PainSignal): string {
  return `${signal.companyName.toLowerCase()}:${signal.category.toLowerCase()}:${signal.sourceUrl.toLowerCase()}`;
}

function saveState(report: PainMiningReport): void {
  const state = loadState();
  fs.writeFileSync(statePath, `${JSON.stringify({ ...state, lastRunAt: report.generatedAt, status: report.status }, null, 2)}\n`, 'utf8');
}

function writeOutputs(outputs: { fileName: string; body: string }[]): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });
  return outputs.map((output) => {
    const outputPath = path.join(outputRoot, output.fileName);
    fs.writeFileSync(outputPath, output.body, 'utf8');
    return outputPath;
  });
}

function renderSignalTable(signals: PainSignal[]): string {
  return [
    '| Company | Category | Confidence | Cautious Summary | Source |',
    '| --- | --- | --- | --- | --- |',
    ...signals.map((signal) => `| ${escapeTable(signal.companyName)} | ${escapeTable(signal.category)} | ${signal.confidence} | ${escapeTable(signal.cautiousSummary)} | ${escapeTable(signal.sourceUrl)} |`),
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
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 120) || 'pain-signal';
}
