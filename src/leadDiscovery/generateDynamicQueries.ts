import fs = require('fs');
import path = require('path');
import { LeadDiscoveryClientConfig } from './clientTypes';
import { DiscoveryQuery, DiscoveryQueryBatch } from './discoveryQueryTypes';
import { readIntentPhraseLibrary } from './extractBuyerSignals';
import { readActiveLeadDiscoveryClients } from './seedSourceRegistry';

const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'dynamic-queries');
const summaryPath = path.join(outputDir, 'dynamic-query-summary.md');
const jsonPath = path.join(outputDir, 'dynamic-queries.json');
const csvPath = path.join(outputDir, 'dynamic-queries.csv');

export function generateDynamicQueries(now = new Date()): DiscoveryQueryBatch {
  const generatedAt = now.toISOString();
  const clients = readActiveLeadDiscoveryClients();
  const queries = clients.flatMap((client) => dynamicQueriesForClient(client));
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
      'Dynamic query generation is local planning only.',
      'No search, scraping, browser automation, login, contact extraction, or outreach is performed.',
      'Human review is required before delivery or contact.',
    ],
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(summaryPath, renderSummary(batch), 'utf8');
  fs.writeFileSync(jsonPath, `${JSON.stringify(batch, null, 2)}\n`, 'utf8');
  fs.writeFileSync(csvPath, renderCsv(queries), 'utf8');
  return batch;
}

function dynamicQueriesForClient(client: LeadDiscoveryClientConfig): DiscoveryQuery[] {
  const library = readIntentPhraseLibrary(client.clientId);
  if (!library) return [];
  const locations = client.targetLocations.slice(0, client.clientId === 'flora_and_fauna_foods_001' ? 4 : 2);
  const rows: DiscoveryQuery[] = [];
  const pain = library.pain.slice(0, 6);
  const urgency = library.urgency.slice(0, 4);
  const commercial = library.commercial_value.slice(0, 6);
  const recommendation = library.recommendation.slice(0, 4);
  const max = client.clientId === 'flora_and_fauna_foods_001' ? 24 : 12;

  for (const painPhrase of pain) {
    for (const location of locations) {
      const urgencyPhrase = urgency[rows.length % urgency.length];
      const valuePhrase = commercial[rows.length % commercial.length];
      rows.push(toQuery(client, rows.length + 1, [painPhrase, valuePhrase, urgencyPhrase, location], ['pain', 'commercial_value', 'urgency']));
      if (rows.length >= max) return rows;
    }
  }

  for (const recommendationPhrase of recommendation) {
    for (const location of locations) {
      const valuePhrase = commercial[rows.length % commercial.length];
      rows.push(toQuery(client, rows.length + 1, [recommendationPhrase, valuePhrase, location], ['recommendation', 'commercial_value']));
      if (rows.length >= max) return rows;
    }
  }

  return rows;
}

function toQuery(client: LeadDiscoveryClientConfig, index: number, phrases: string[], categories: string[]): DiscoveryQuery {
  return {
    id: `${client.clientId}-dynamic-q-${String(index).padStart(4, '0')}`,
    clientId: client.clientId,
    clientName: client.clientName,
    vertical: client.vertical,
    sourceName: 'Dynamic buyer signal query',
    sourceCategory: 'public_forum',
    query: phrases.map(quote).join(' '),
    targetLocation: phrases[phrases.length - 1] ?? client.targetLocations[0] ?? 'unknown',
    leadType: categories.join('+'),
    purpose: 'find_recent_intent',
    recencyDays: 30,
    riskLevel: 'low',
    manualReviewRequired: true,
    notes: `Dynamic buyer-signal query from categories: ${categories.join(', ')}. Public indexed search only.`,
    queryTemplateId: `${client.clientId}-dynamic-${String(index).padStart(3, '0')}`,
    queryTemplateType: 'dynamic',
    intentType: categories.join('+'),
    expectedSourceTypes: ['public discussions', 'public recommendation threads', 'public request posts'],
    behaviorCategory: categories.join('+'),
    behaviorSignals: phrases,
  };
}

function renderSummary(batch: DiscoveryQueryBatch): string {
  return `# Dynamic Query Summary

Generated: ${batch.generatedAt}

- Dynamic queries: ${batch.totalQueries}
- Client distribution: ${inlineDistribution(batch.queries.map((query) => query.clientId))}
- Category distribution: ${inlineDistribution(batch.queries.map((query) => query.behaviorCategory ?? 'unknown'))}

## Queries

${batch.queries.map((query, index) => `${index + 1}. ${query.clientId}: \`${query.query}\``).join('\n') || '- No dynamic queries generated.'}
`;
}

function renderCsv(queries: DiscoveryQuery[]): string {
  const headers = ['clientId', 'queryTemplateId', 'query', 'behaviorCategory', 'behaviorSignals'];
  const rows = queries.map((query) => [
    query.clientId,
    query.queryTemplateId ?? '',
    query.query,
    query.behaviorCategory ?? '',
    (query.behaviorSignals ?? []).join('|'),
  ]);
  return `${headers.map(csvCell).join(',')}\n${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function quote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function inlineDistribution(values: string[]): string {
  return Object.entries(values.reduce<Record<string, number>>((counts, value) => {
    counts[value || 'unknown'] = (counts[value || 'unknown'] ?? 0) + 1;
    return counts;
  }, {})).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([value, count]) => `${value}:${count}`)
    .join('; ') || 'none';
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function main(): void {
  try {
    const batch = generateDynamicQueries();
    console.log(`Dynamic queries generated: ${batch.totalQueries}`);
    console.log(`Summary: ${path.relative(process.cwd(), summaryPath)}`);
    console.log('Planning only. No scraping, browser automation, contact extraction, outreach, emails, DMs, calls, or login flows were performed.');
  } catch (error) {
    console.error('Dynamic Query Generator: FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) main();
