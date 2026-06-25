import fs = require('fs');
import path = require('path');
import { LeadDiscoveryClientConfig } from './clientTypes';
import { DiscoveryQuery, DiscoveryQueryBatch } from './discoveryQueryTypes';
import { LeadSourceCategory } from './sourceTypes';
import { readActiveLeadDiscoveryClients } from './seedSourceRegistry';

interface RewriteBatch {
  queries: DiscoveryQuery[];
}

interface ConversationSource {
  sourceName: string;
  sourcePrefix: string;
  sourceCategory: LeadSourceCategory;
}

const rewriteBatchPath = path.join(process.cwd(), 'output', 'lead-discovery', 'query-rewrites', 'rewritten-queries.json');
const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'conversation-queries');
const summaryPath = path.join(outputDir, 'conversation-query-summary.md');
const jsonPath = path.join(outputDir, 'conversation-queries.json');
const csvPath = path.join(outputDir, 'conversation-queries.csv');

const floraConversationSources: ConversationSource[] = [
  { sourceName: 'Reddit public discussions', sourcePrefix: 'site:reddit.com', sourceCategory: 'public_forum' as const },
  { sourceName: 'Facebook public groups', sourcePrefix: 'site:facebook.com/groups', sourceCategory: 'public_social' as const },
  { sourceName: 'What to Expect community', sourcePrefix: 'site:community.whattoexpect.com', sourceCategory: 'public_forum' as const },
  { sourceName: 'WeddingWire forum', sourcePrefix: 'site:forum.weddingwire.com', sourceCategory: 'public_forum' as const },
  { sourceName: 'WeddingBee boards', sourcePrefix: 'site:boards.weddingbee.com', sourceCategory: 'public_forum' as const },
];

const costaConversationSources: ConversationSource[] = [
  { sourceName: 'Reddit public discussions', sourcePrefix: 'site:reddit.com', sourceCategory: 'public_forum' as const },
  { sourceName: 'Tripadvisor public forums', sourcePrefix: 'site:tripadvisor.com', sourceCategory: 'public_review' as const },
];

const lztConversationSources: ConversationSource[] = [
  { sourceName: 'Reddit public discussions', sourcePrefix: 'site:reddit.com', sourceCategory: 'public_forum' as const },
  { sourceName: 'Facebook public groups', sourcePrefix: 'site:facebook.com/groups', sourceCategory: 'public_social' as const },
];

export function generateConversationQueries(now = new Date()): DiscoveryQueryBatch {
  const generatedAt = now.toISOString();
  const clients = readActiveLeadDiscoveryClients();
  const rewriteQueries = readRewriteQueries();
  const queries = clients.flatMap((client) => conversationQueriesForClient(client, rewriteQueries.filter((query) => query.clientId === client.clientId)));
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
      'Conversation query generation is local planning only.',
      'Queries are biased to public indexed conversation pages only.',
      'No login, scraping, browser automation, contact extraction, outreach, email, DM, calls, or forms are performed.',
      'Human review is required before delivery or contact.',
    ],
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(summaryPath, renderSummary(batch), 'utf8');
  fs.writeFileSync(jsonPath, `${JSON.stringify(batch, null, 2)}\n`, 'utf8');
  fs.writeFileSync(csvPath, renderCsv(queries), 'utf8');

  return batch;
}

function conversationQueriesForClient(client: LeadDiscoveryClientConfig, rewrites: DiscoveryQuery[]): DiscoveryQuery[] {
  const sources = conversationSourcesForClient(client.clientId);
  const phrases = rewrites.length > 0
    ? rewrites.map((query) => query.rewritePhrase ?? stripSiteAndNegatives(query.baseQuery ?? query.query)).filter(Boolean)
    : fallbackPhrases(client);
  const maxQueries = client.clientId === 'flora_and_fauna_foods_001' ? 22 : 10;
  const rows: DiscoveryQuery[] = [];

  for (const phrase of [...new Set(phrases)]) {
    for (const source of sources) {
      const baseQuery = `${source.sourcePrefix} ${quote(phrase)}`;
      rows.push({
        id: `${client.clientId}-conversation-q-${String(rows.length + 1).padStart(4, '0')}`,
        clientId: client.clientId,
        clientName: client.clientName,
        vertical: client.vertical,
        sourceName: source.sourceName,
        sourceCategory: source.sourceCategory,
        query: baseQuery,
        baseQuery,
        targetLocation: client.targetLocations.find((location) => phrase.toLowerCase().includes(location.toLowerCase())) ?? client.targetLocations[0] ?? 'unknown',
        leadType: 'conversation_intent',
        purpose: 'find_recent_intent',
        recencyDays: client.maxLeadAgeDays ?? 30,
        riskLevel: 'low',
        manualReviewRequired: true,
        notes: `Conversation search mode for public indexed source ${source.sourceName}. No login or scraping.`,
        queryTemplateId: `${client.clientId}-conversation-${String(rows.length + 1).padStart(3, '0')}`,
        queryTemplateType: 'conversation',
        expectedSourceTypes: ['public conversation pages', source.sourceName],
        intentType: 'conversation_intent',
        rewrittenQueries: [baseQuery],
        rewriteSource: 'conversation search mode',
        rewriteReason: 'Bias search toward public conversations where buyers ask for recommendations, help, urgency, or planning advice.',
        rewritePhrase: phrase,
        conversationSource: source.sourceName,
        behaviorCategory: 'conversation_intent',
        behaviorSignals: [phrase, source.sourceName],
      });
      if (rows.length >= maxQueries) return rows;
    }
  }

  return rows;
}

function conversationSourcesForClient(clientId: string): ConversationSource[] {
  if (clientId === 'costa_retreats_001') return costaConversationSources;
  if (clientId === 'lzt_costa_rica_001') return lztConversationSources;
  return floraConversationSources;
}

function fallbackPhrases(client: LeadDiscoveryClientConfig): string[] {
  if (client.clientId === 'costa_retreats_001') {
    return ['planning Costa Rica family trip', 'need itinerary help', 'where should we stay in Tamarindo'];
  }
  if (client.clientId === 'lzt_costa_rica_001') {
    return ['necesito PTAR', 'permiso MINSA aguas residuales', 'el terreno no drena'];
  }
  return ['need catering recommendations', 'my caterer cancelled', 'who knows a caterer'];
}

function readRewriteQueries(): DiscoveryQuery[] {
  if (!fs.existsSync(rewriteBatchPath)) return [];
  return (JSON.parse(fs.readFileSync(rewriteBatchPath, 'utf8')) as RewriteBatch).queries ?? [];
}

function renderSummary(batch: DiscoveryQueryBatch): string {
  return `# Conversation Query Summary

Generated: ${batch.generatedAt}

## Totals

- Conversation queries: ${batch.totalQueries}
- Client distribution: ${inlineDistribution(batch.queries.map((query) => query.clientId))}
- Conversation sources: ${inlineDistribution(batch.queries.map((query) => query.conversationSource ?? query.sourceName))}
- Top rewrite phrases: ${inlineDistribution(batch.queries.map((query) => query.rewritePhrase ?? 'unknown'))}

## Queries

${batch.queries.map((query, index) => `${index + 1}. ${query.clientName}: \`${query.query}\`
   - Conversation source: ${query.conversationSource ?? query.sourceName}
   - Rewrite phrase: ${query.rewritePhrase ?? 'unknown'}`).join('\n') || '- No conversation queries generated.'}

No search, scraping, browser automation, login, contact extraction, outreach, email, DM, calls, or forms were performed.
`;
}

function renderCsv(queries: DiscoveryQuery[]): string {
  const headers = ['client_id', 'query_template_id', 'query', 'conversation_source', 'rewrite_phrase'];
  const rows = queries.map((query) => [
    query.clientId,
    query.queryTemplateId ?? '',
    query.query,
    query.conversationSource ?? query.sourceName,
    query.rewritePhrase ?? '',
  ]);
  return `${headers.map(csvCell).join(',')}\n${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function stripSiteAndNegatives(query: string): string {
  return query.replace(/\bsite:[^\s]+\s*/gi, '').replace(/\s-\S+/g, '').replace(/"/g, '').trim();
}

function quote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
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
    const batch = generateConversationQueries();
    console.log(`Conversation queries generated: ${batch.totalQueries}`);
    console.log(`Conversation path: ${path.relative(process.cwd(), jsonPath)}`);
    console.log(`Summary: ${path.relative(process.cwd(), summaryPath)}`);
    console.log('Planning only. No search, scraping, browser automation, contact extraction, outreach, email, DM, calls, or login was performed.');
  } catch (error) {
    console.error('Conversation Query Generator: FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) main();
