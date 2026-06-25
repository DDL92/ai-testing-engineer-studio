import fs = require('fs');
import path = require('path');
import { LeadDiscoveryClientConfig } from './clientTypes';
import { DiscoveryQuery, DiscoveryQueryBatch } from './discoveryQueryTypes';
import { readActiveLeadDiscoveryClients } from './seedSourceRegistry';

const rewriteDir = path.join(process.cwd(), 'data', 'lead-discovery', 'query-rewrites');
const negativeTermsPath = path.join(process.cwd(), 'data', 'lead-discovery', 'query-templates', 'negative-query-terms.json');
const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'query-rewrites');
const summaryPath = path.join(outputDir, 'rewrite-query-summary.md');
const jsonPath = path.join(outputDir, 'rewritten-queries.json');
const csvPath = path.join(outputDir, 'rewritten-queries.csv');

interface NegativeTermsConfig {
  negativeTerms: string[];
}

const rewriteFileByClientId: Record<string, string> = {
  flora_and_fauna_foods_001: 'flora-intent-rewrites.json',
  lzt_costa_rica_001: 'lzt-intent-rewrites.json',
  costa_retreats_001: 'costa-intent-rewrites.json',
};

export function rewriteQueries(now = new Date()): DiscoveryQueryBatch {
  const generatedAt = now.toISOString();
  const clients = readActiveLeadDiscoveryClients();
  const negativeQueryTerms = readNegativeTerms();
  const queries = clients.flatMap((client) => rewriteQueriesForClient(client, negativeQueryTerms));
  const batch: DiscoveryQueryBatch = {
    generatedAt,
    totalQueries: queries.length,
    clients: clients.map((client) => ({
      clientId: client.clientId,
      clientName: client.clientName,
      vertical: client.vertical,
      totalQueries: queries.filter((query) => query.clientId === client.clientId).length,
    })),
    queries,
    safetyRules: [
      'Intent rewrite generation is local planning only.',
      'No search, scraping, browser automation, login, contact extraction, outreach, email, DM, calls, or forms are performed.',
      'Rewrites replace generic service-keyword searches with pain, urgency, recommendation, and purchase-intent language.',
      'Human review is required before delivery or contact.',
    ],
    negativeQueryTerms,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(summaryPath, renderSummary(batch), 'utf8');
  fs.writeFileSync(jsonPath, `${JSON.stringify(batch, null, 2)}\n`, 'utf8');
  fs.writeFileSync(csvPath, renderCsv(queries), 'utf8');

  return batch;
}

function rewriteQueriesForClient(client: LeadDiscoveryClientConfig, negativeQueryTerms: string[]): DiscoveryQuery[] {
  const phrases = readRewritePhrases(client.clientId);
  const locations = client.targetLocations.slice(0, client.clientId === 'flora_and_fauna_foods_001' ? 3 : 2);
  const maxQueries = client.clientId === 'flora_and_fauna_foods_001' ? 18 : 10;
  const queries: DiscoveryQuery[] = [];

  for (const phrase of phrases) {
    const shouldAddLocation = !client.targetLocations.some((location) => phrase.toLowerCase().includes(location.toLowerCase()));
    const locationSet = shouldAddLocation ? locations : [''];
    for (const location of locationSet) {
      const baseQuery = compact([quote(phrase), location ? quote(location) : '']).join(' ');
      queries.push(toQuery(client, queries.length + 1, phrase, baseQuery, negativeQueryTerms));
      if (queries.length >= maxQueries) return queries;
    }
  }

  return queries;
}

function toQuery(
  client: LeadDiscoveryClientConfig,
  index: number,
  phrase: string,
  baseQuery: string,
  negativeQueryTerms: string[],
): DiscoveryQuery {
  return {
    id: `${client.clientId}-rewrite-q-${String(index).padStart(4, '0')}`,
    clientId: client.clientId,
    clientName: client.clientName,
    vertical: client.vertical,
    sourceName: 'Intent rewrite query',
    sourceCategory: 'public_forum',
    query: appendNegativeTerms(baseQuery, negativeQueryTerms),
    baseQuery,
    negativeQueryTerms,
    targetLocation: client.targetLocations.find((location) => baseQuery.toLowerCase().includes(location.toLowerCase())) ?? client.targetLocations[0] ?? 'unknown',
    leadType: 'intent_rewrite',
    purpose: 'find_recent_intent',
    recencyDays: client.maxLeadAgeDays ?? 30,
    riskLevel: 'low',
    manualReviewRequired: true,
    notes: `Intent-first rewrite from phrase "${phrase}". Public indexed search only.`,
    queryTemplateId: `${client.clientId}-rewrite-${String(index).padStart(3, '0')}`,
    queryTemplateType: 'intent_rewrite',
    expectedSourceTypes: ['public conversations', 'recommendation threads', 'public request posts'],
    intentType: 'intent_rewrite',
    rewrittenQueries: [baseQuery],
    rewriteSource: rewriteFileByClientId[client.clientId] ?? 'client rewrite library',
    rewriteReason: 'Replace generic service keywords with pain, urgency, recommendation, or purchase-intent language.',
    rewritePhrase: phrase,
    behaviorCategory: 'intent_rewrite',
    behaviorSignals: [phrase],
  };
}

function readRewritePhrases(clientId: string): string[] {
  const fileName = rewriteFileByClientId[clientId];
  if (!fileName) return [];
  const filePath = path.join(rewriteDir, fileName);
  if (!fs.existsSync(filePath)) return [];
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
  return Array.isArray(parsed)
    ? [...new Set(parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim()))]
    : [];
}

function readNegativeTerms(): string[] {
  if (!fs.existsSync(negativeTermsPath)) return [];
  const parsed = JSON.parse(fs.readFileSync(negativeTermsPath, 'utf8')) as NegativeTermsConfig;
  return [...new Set(parsed.negativeTerms.map((term) => term.trim().toLowerCase()).filter(Boolean))];
}

function renderSummary(batch: DiscoveryQueryBatch): string {
  return `# Intent Rewrite Query Summary

Generated: ${batch.generatedAt}

## Totals

- Rewritten queries: ${batch.totalQueries}
- Client distribution: ${inlineDistribution(batch.queries.map((query) => query.clientId))}
- Rewrite source distribution: ${inlineDistribution(batch.queries.map((query) => query.rewriteSource ?? 'unknown'))}
- Top rewrite phrases: ${inlineDistribution(batch.queries.map((query) => query.rewritePhrase ?? 'unknown'))}

## Queries

${batch.queries.map((query, index) => `${index + 1}. ${query.clientName}: \`${query.query}\`
   - Rewrite phrase: ${query.rewritePhrase ?? 'unknown'}
   - Rewrite reason: ${query.rewriteReason ?? 'unknown'}`).join('\n') || '- No rewrite queries generated.'}

No search, scraping, browser automation, login, contact extraction, outreach, email, DM, calls, or forms were performed.
`;
}

function renderCsv(queries: DiscoveryQuery[]): string {
  const headers = ['client_id', 'query_template_id', 'query', 'rewrite_phrase', 'rewrite_source', 'rewrite_reason'];
  const rows = queries.map((query) => [
    query.clientId,
    query.queryTemplateId ?? '',
    query.query,
    query.rewritePhrase ?? '',
    query.rewriteSource ?? '',
    query.rewriteReason ?? '',
  ]);
  return `${headers.map(csvCell).join(',')}\n${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function appendNegativeTerms(query: string, negativeTerms: string[]): string {
  const normalizedQuery = query.toLowerCase();
  const termsToAppend = negativeTerms
    .filter((term) => !normalizedQuery.includes(`-${term}`))
    .map((term) => term.includes(' ') ? `-"${term}"` : `-${term}`);
  return compact([query, ...termsToAppend]).join(' ');
}

function quote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function compact(values: string[]): string[] {
  return values.filter((value) => value.trim().length > 0);
}

function inlineDistribution(values: string[]): string {
  return Object.entries(values.reduce<Record<string, number>>((counts, value) => {
    counts[value || 'unknown'] = (counts[value || 'unknown'] ?? 0) + 1;
    return counts;
  }, {}))
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 10)
    .map(([value, count]) => `${value}:${count}`)
    .join('; ') || 'none';
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function main(): void {
  try {
    const batch = rewriteQueries();
    console.log(`Intent rewrite queries generated: ${batch.totalQueries}`);
    console.log(`Rewrite path: ${path.relative(process.cwd(), jsonPath)}`);
    console.log(`Summary: ${path.relative(process.cwd(), summaryPath)}`);
    console.log('Planning only. No search, scraping, browser automation, contact extraction, outreach, email, DM, calls, or login was performed.');
  } catch (error) {
    console.error('Intent Rewrite Engine: FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) main();
