import fs = require('fs');
import path = require('path');
import { LeadDiscoveryClientConfig } from './clientTypes';
import { DiscoveryQuery } from './discoveryQueryTypes';
import { activeAutomationSeedSources, readActiveLeadDiscoveryClients, readSeedSources } from './seedSourceRegistry';
import { SeedSource } from './seedSourceTypes';

interface BuyerIntentTemplate {
  templateId: string;
  clientId: string;
  vertical: string;
  query: string;
  intentType: string;
  priority: number;
  maxLeadAgeDays: number;
  expectedSourceTypes: string[];
  notes: string;
}

interface NegativeTermsConfig {
  negativeTerms: string[];
}

export interface SourceQueryRow {
  id: string;
  clientId: string;
  sourceId: string;
  sourceCategory: string;
  sourceName: string;
  query: string;
  priority: SeedSource['priority'];
  expectedLeadQuality: SeedSource['expectedLeadQuality'];
  queryTemplateId?: string;
  intentType: string;
}

const queryTemplateDir = path.join(process.cwd(), 'data', 'lead-discovery', 'query-templates');
const negativeTermsPath = path.join(queryTemplateDir, 'negative-query-terms.json');
const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'targeted-discovery');
const sourceQueriesMdPath = path.join(outputDir, 'source-queries.md');
const sourceQueriesCsvPath = path.join(outputDir, 'source-queries.csv');
const sourceQueriesJsonPath = path.join(outputDir, 'source-queries.json');

export function buildSourceQueries(now = new Date()): { filesGenerated: string[]; rows: SourceQueryRow[]; discoveryQueries: DiscoveryQuery[] } {
  const generatedAt = now.toISOString();
  const clients = readActiveLeadDiscoveryClients();
  const clientById = new Map(clients.map((client) => [client.clientId, client]));
  const sources = activeAutomationSeedSources(clients, readSeedSources());
  const templates = readBuyerIntentTemplates();
  const negativeTerms = readNegativeTerms();
  const rows = sources.flatMap((source) => {
    const client = clientById.get(source.clientId);
    if (!client) return [];
    return sourceQueriesFor(client, source, templates, negativeTerms);
  });
  const discoveryQueries = rows.map((row, index) => sourceRowToDiscoveryQuery(row, clientById.get(row.clientId)!, index + 1));

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(sourceQueriesMdPath, renderSourceQueries(generatedAt, rows), 'utf8');
  fs.writeFileSync(sourceQueriesCsvPath, renderCsv(rows), 'utf8');
  fs.writeFileSync(sourceQueriesJsonPath, `${JSON.stringify({ generatedAt, totalQueries: discoveryQueries.length, queries: discoveryQueries }, null, 2)}\n`, 'utf8');

  return {
    filesGenerated: [sourceQueriesMdPath, sourceQueriesCsvPath, sourceQueriesJsonPath].map((file) => path.relative(process.cwd(), file)),
    rows,
    discoveryQueries,
  };
}

function sourceQueriesFor(
  client: LeadDiscoveryClientConfig,
  source: SeedSource,
  templates: BuyerIntentTemplate[],
  negativeTerms: string[],
): SourceQueryRow[] {
  const clientTemplates = templates
    .filter((template) => template.clientId === client.clientId)
    .filter((template) => template.vertical === client.vertical)
    .sort((left, right) => left.priority - right.priority || left.templateId.localeCompare(right.templateId))
    .slice(0, source.priority === 'high' ? 2 : 1);
  const fallbackQueries = fallbackIntentQueries(client);
  const queryInputs = clientTemplates.length > 0
    ? clientTemplates.map((template) => ({ query: stripExistingSitePrefix(template.query), templateId: template.templateId, intentType: template.intentType }))
    : fallbackQueries.map((query, index) => ({ query, templateId: undefined, intentType: `source_intent_${index + 1}` }));

  return queryInputs.map((input, index) => {
    const sourceQuery = compact([source.sourceUrlPattern, input.query]).join(' ');
    return {
      id: `${source.sourceId}-source-q-${String(index + 1).padStart(3, '0')}`,
      clientId: client.clientId,
      sourceId: source.sourceId,
      sourceCategory: source.sourceCategory,
      sourceName: source.sourceName,
      query: appendNegativeTerms(sourceQuery, negativeTerms),
      priority: source.priority,
      expectedLeadQuality: source.expectedLeadQuality,
      queryTemplateId: input.templateId,
      intentType: input.intentType,
    };
  });
}

function sourceRowToDiscoveryQuery(row: SourceQueryRow, client: LeadDiscoveryClientConfig, index: number): DiscoveryQuery {
  return {
    id: `source-query-${String(index).padStart(5, '0')}`,
    clientId: client.clientId,
    clientName: client.clientName,
    vertical: client.vertical,
    sourceId: row.sourceId,
    sourceName: row.sourceName,
    sourceCategory: sourceCategoryFor(row.sourceCategory),
    query: row.query,
    targetLocation: client.targetLocations[0] ?? 'unknown',
    leadType: row.intentType,
    purpose: 'find_recent_intent',
    recencyDays: 45,
    riskLevel: 'low',
    manualReviewRequired: true,
    notes: [
      `Source-specific targeted query for ${row.sourceId}.`,
      `Seed source category: ${row.sourceCategory}.`,
      `Seed priority: ${row.priority}.`,
      `Expected lead quality: ${row.expectedLeadQuality}.`,
      'Public indexed search only. Human review required before delivery or contact.',
    ].join(' '),
    queryTemplateId: row.queryTemplateId,
    queryTemplateType: 'source_specific',
    intentType: row.intentType,
    expectedSourceTypes: [row.sourceCategory, row.sourceName],
    sourceQueryPriority: row.priority,
    expectedLeadQuality: row.expectedLeadQuality,
  };
}

function fallbackIntentQueries(client: LeadDiscoveryClientConfig): string[] {
  if (client.vertical === 'travel_leads') {
    return ['"planning Costa Rica family trip"', '"Costa Rica group trip"', '"need itinerary" "Costa Rica"', '"where should we stay" "Costa Rica"'];
  }
  return ['"looking for catering"', '"wedding catering recommendations"', '"need catering"', '"corporate event catering"'];
}

function readBuyerIntentTemplates(): BuyerIntentTemplate[] {
  if (!fs.existsSync(queryTemplateDir)) return [];
  return fs.readdirSync(queryTemplateDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .filter((fileName) => fileName !== 'negative-query-terms.json')
    .sort()
    .flatMap((fileName) => {
      const parsed = JSON.parse(fs.readFileSync(path.join(queryTemplateDir, fileName), 'utf8')) as unknown;
      return Array.isArray(parsed) ? parsed as BuyerIntentTemplate[] : [];
    });
}

function readNegativeTerms(): string[] {
  if (!fs.existsSync(negativeTermsPath)) return [];
  const parsed = JSON.parse(fs.readFileSync(negativeTermsPath, 'utf8')) as NegativeTermsConfig;
  return [...new Set(parsed.negativeTerms.map((term) => term.trim().toLowerCase()).filter(Boolean))];
}

function renderSourceQueries(generatedAt: string, rows: SourceQueryRow[]): string {
  return `# Source Queries

Generated: ${generatedAt}

## Summary

- Source-specific queries: ${rows.length}
- Client distribution: ${inlineDistribution(rows.map((row) => row.clientId))}
- Source category distribution: ${inlineDistribution(rows.map((row) => row.sourceCategory))}
- Expected quality distribution: ${inlineDistribution(rows.map((row) => row.expectedLeadQuality))}

## Queries

${rows.map((row, index) => `${index + 1}. ${row.clientId} | ${row.sourceId} | ${row.priority} | ${row.expectedLeadQuality}
   - Query: \`${row.query}\`
   - Source: ${row.sourceName}; category: ${row.sourceCategory}; template: ${row.queryTemplateId ?? 'fallback'}`).join('\n') || '- No source-specific queries generated.'}

No login, scraping, page crawling, contact extraction, outreach, emails, DMs, calls, or form submissions were performed.
`;
}

function renderCsv(rows: SourceQueryRow[]): string {
  const headers: Array<keyof SourceQueryRow> = ['clientId', 'sourceId', 'sourceCategory', 'sourceName', 'query', 'priority', 'expectedLeadQuality', 'queryTemplateId', 'intentType'];
  return `${headers.map(csvCell).join(',')}\n${rows.map((row) => headers.map((header) => csvCell(String(row[header] ?? ''))).join(',')).join('\n')}\n`;
}

function stripExistingSitePrefix(query: string): string {
  return query.replace(/\bsite:[^\s]+\s*/gi, '').trim();
}

function appendNegativeTerms(query: string, negativeTerms: string[]): string {
  const normalizedQuery = query.toLowerCase();
  const termsToAppend = negativeTerms
    .filter((term) => !normalizedQuery.includes(`-${term}`))
    .map((term) => term.includes(' ') ? `-"${term}"` : `-${term}`);
  return compact([query, ...termsToAppend]).join(' ');
}

function sourceCategoryFor(category: string): DiscoveryQuery['sourceCategory'] {
  if (category === 'reddit' || category === 'facebook_public') return 'public_social';
  if (category === 'event_request_board' || category === 'rfp_board') return 'public_event_board';
  return 'public_forum';
}

function inlineDistribution(values: string[]): string {
  return Object.entries(values.reduce<Record<string, number>>((counts, value) => {
    counts[value || 'unknown'] = (counts[value || 'unknown'] ?? 0) + 1;
    return counts;
  }, {}))
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([value, count]) => `${value}:${count}`)
    .join('; ') || 'none';
}

function compact(values: string[]): string[] {
  return values.filter((value) => value.trim().length > 0);
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function main(): void {
  try {
    const result = buildSourceQueries();
    console.log(`Source queries generated: ${result.filesGenerated.join(', ')}`);
    console.log(`Source-specific queries: ${result.rows.length}`);
    console.log('Planning only. No scraping, browser automation, contact extraction, outreach, emails, DMs, calls, or login flows were performed.');
  } catch (error) {
    console.error('Source Query Builder: FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) main();
