import fs = require('fs');
import path = require('path');
import { LeadDiscoveryClientConfig } from './clientTypes';
import { DiscoveryQuery, DiscoveryQueryBatch } from './discoveryQueryTypes';
import { readActiveLeadDiscoveryClients } from './seedSourceRegistry';
import { BuyerIntentSignals, readBuyerIntentSignals } from './scoreBehavioralIntent';

const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'behavior-queries');
const summaryPath = path.join(outputDir, 'behavior-query-summary.md');
const jsonPath = path.join(outputDir, 'behavior-queries.json');

const clientOutputNames: Record<string, string> = {
  flora_and_fauna_foods_001: 'flora-behavior-queries.md',
  costa_retreats_001: 'costa-behavior-queries.md',
  lzt_costa_rica_001: 'lzt-behavior-queries.md',
};

const safetyRules = [
  'Behavior query generation is local planning only.',
  'No search, scraping, browser automation, login, contact extraction, outreach, emails, DMs, calls, or form submissions are performed.',
  'Human review is required before delivery or contact.',
];

export function generateBehaviorQueries(now = new Date()): DiscoveryQueryBatch {
  const generatedAt = now.toISOString();
  const clients = readActiveLeadDiscoveryClients();
  const queries = clients.flatMap((client) => behaviorQueriesForClient(client));
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
    safetyRules,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(summaryPath, renderSummary(batch), 'utf8');
  fs.writeFileSync(jsonPath, `${JSON.stringify(batch, null, 2)}\n`, 'utf8');
  for (const clientId of Object.keys(clientOutputNames)) {
    const client = clients.find((item) => item.clientId === clientId);
    const clientQueries = queries.filter((query) => query.clientId === clientId);
    fs.writeFileSync(path.join(outputDir, clientOutputNames[clientId]), renderClientQueries(clientId, client, clientQueries, generatedAt), 'utf8');
  }
  return batch;
}

function behaviorQueriesForClient(client: LeadDiscoveryClientConfig): DiscoveryQuery[] {
  const signals = readBuyerIntentSignals(client.clientId);
  if (!signals) return [];
  const locations = client.targetLocations.slice(0, client.clientId === 'flora_and_fauna_foods_001' ? 4 : 2);
  const eventTypes = eventTypesFor(client);
  const recencyPhrases = recencyPhrasesFor(client.clientId);
  const signalRows = prioritizedSignals(signals, client.clientId);
  const rows: DiscoveryQuery[] = [];

  for (const signal of signalRows) {
    for (const location of locations) {
      const eventType = eventTypes[rows.length % eventTypes.length] ?? '';
      const recency = recencyPhrases[rows.length % recencyPhrases.length] ?? '';
      const query = compact([quote(signal.value), quote(location), eventType ? quote(eventType) : '', recency ? quote(recency) : '']).join(' ');
      rows.push({
        id: `${client.clientId}-behavior-q-${String(rows.length + 1).padStart(4, '0')}`,
        clientId: client.clientId,
        clientName: client.clientName,
        vertical: client.vertical,
        sourceName: 'Behavioral buyer intent query',
        sourceCategory: 'public_forum',
        query,
        targetLocation: location,
        leadType: signal.value,
        purpose: 'find_recent_intent',
        recencyDays: client.clientId === 'costa_retreats_001' ? 45 : 30,
        riskLevel: 'low',
        manualReviewRequired: true,
        notes: `Behavioral query from ${signal.category}. Public indexed search only; human review required.`,
        queryTemplateId: `${client.clientId}-${signal.category}-${String(rows.length + 1).padStart(3, '0')}`,
        queryTemplateType: 'behavior',
        intentType: signal.category,
        expectedSourceTypes: ['public discussions', 'public recommendation threads', 'public request posts'],
        behaviorCategory: signal.category,
        behaviorSignals: [signal.value],
      });
      if (rows.length >= maxQueriesFor(client.clientId)) return rows;
    }
  }

  return rows;
}

function prioritizedSignals(signals: BuyerIntentSignals, clientId: string): Array<{ category: string; value: string }> {
  const categories = [
    { category: 'pain', values: signals.painSignals },
    { category: 'purchase', values: signals.purchaseSignals },
    { category: 'urgency', values: signals.urgencySignals },
    { category: 'commercial_value', values: signals.commercialValueSignals },
    { category: 'planning', values: signals.planningSignals },
    { category: 'recommendation', values: signals.recommendationSignals },
  ];
  const rows: Array<{ category: string; value: string }> = [];
  const maxLength = Math.max(...categories.map((item) => item.values.length));
  for (let index = 0; index < maxLength; index += 1) {
    for (const item of categories) {
      const value = item.values[index];
      if (value) rows.push({ category: item.category, value });
    }
  }
  return clientId === 'flora_and_fauna_foods_001' ? rows : rows.slice(0, 12);
}

function eventTypesFor(client: LeadDiscoveryClientConfig): string[] {
  if (client.clientId === 'costa_retreats_001') return ['family trip', 'group trip', 'corporate retreat', 'villa'];
  if (client.clientId === 'lzt_costa_rica_001') return ['aguas residuales', 'PTAR', 'permiso MINSA', 'Guanacaste'];
  return ['wedding', 'corporate event', 'fundraiser', 'private dinner', 'bar service'];
}

function recencyPhrasesFor(clientId: string): string[] {
  if (clientId === 'lzt_costa_rica_001') return ['urgente', 'esta semana', 'Costa Rica'];
  return ['next month', 'next week', 'ASAP', 'recommendations'];
}

function maxQueriesFor(clientId: string): number {
  if (clientId === 'flora_and_fauna_foods_001') return 30;
  if (clientId === 'costa_retreats_001') return 18;
  if (clientId === 'lzt_costa_rica_001') return 18;
  return 10;
}

function renderSummary(batch: DiscoveryQueryBatch): string {
  return `# Behavior Query Summary

Generated: ${batch.generatedAt}

## Totals

- Behavior queries: ${batch.totalQueries}
- Flora queries: ${batch.queries.filter((query) => query.clientId === 'flora_and_fauna_foods_001').length}
- Costa queries: ${batch.queries.filter((query) => query.clientId === 'costa_retreats_001').length}
- LZT queries: ${batch.queries.filter((query) => query.clientId === 'lzt_costa_rica_001').length}
- Behavior categories: ${inlineDistribution(batch.queries.map((query) => query.behaviorCategory ?? 'unknown'))}

## Safety Rules

${batch.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function renderClientQueries(clientId: string, client: LeadDiscoveryClientConfig | undefined, queries: DiscoveryQuery[], generatedAt: string): string {
  if (!client) {
    return `# Behavior Queries - ${clientId}

Generated: ${generatedAt}

- Status: inactive or missing active non-sample client config.
- Queries generated: 0
- Safety: no search, scraping, login, contact extraction, or outreach performed.
`;
  }
  return `# Behavior Queries - ${client.clientName}

Generated: ${generatedAt}

- Client ID: ${client.clientId}
- Vertical: ${client.vertical}
- Queries generated: ${queries.length}
- Categories: ${inlineDistribution(queries.map((query) => query.behaviorCategory ?? 'unknown'))}

## Queries

${queries.map((query, index) => `${index + 1}. \`${query.query}\`
   - Category: ${query.behaviorCategory}; signals: ${(query.behaviorSignals ?? []).join(', ')}`).join('\n') || '- No behavior queries generated.'}
`;
}

function inlineDistribution(values: string[]): string {
  return Object.entries(values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {})).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([value, count]) => `${value}:${count}`)
    .join('; ') || 'none';
}

function quote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function compact(values: string[]): string[] {
  return values.filter((value) => value.trim().length > 0);
}

function main(): void {
  try {
    const batch = generateBehaviorQueries();
    console.log(`Behavior queries generated: ${batch.totalQueries}`);
    console.log(`Summary: ${path.relative(process.cwd(), summaryPath)}`);
    console.log('Planning only. No search, scraping, browser automation, contact extraction, outreach, emails, DMs, calls, or login flows were performed.');
  } catch (error) {
    console.error('Behavior Query Generator: FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) main();
