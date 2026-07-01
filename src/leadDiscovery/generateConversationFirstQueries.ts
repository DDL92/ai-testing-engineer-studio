import fs = require('fs');
import path = require('path');
import { LeadDiscoveryClientConfig } from './clientTypes';
import { ConversationPattern } from './conversationPatternTypes';
import { DiscoveryQuery, DiscoveryQueryBatch } from './discoveryQueryTypes';
import { LeadSourceCategory } from './sourceTypes';
import { readActiveLeadDiscoveryClients } from './seedSourceRegistry';

interface ConversationFirstQueryBatch extends DiscoveryQueryBatch {
  patternCount: number;
  priorityMix: Record<string, number>;
  allowedSourceTargets: string[];
  allocationTargets: Record<string, Record<string, number>>;
}

const patternsDir = path.join(process.cwd(), 'data', 'lead-discovery', 'conversation-patterns');
const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'conversation-first');
const jsonPath = path.join(outputDir, 'conversation-first-queries.json');
const markdownPath = path.join(outputDir, 'conversation-first-queries.md');

const allowedSourceTargets = [
  'site:reddit.com',
  'site:facebook.com/groups',
  'site:weddingwire.com/wedding-forums',
  'site:weddingbee.com',
  'site:tripadvisor.com',
];

const globalNegativeTerms = [
  'vendor profile',
  'business listing',
  'directory',
  'best caterers',
  'top caterers',
  'pricing page',
  'company profile',
  'marketplace listing',
  'reviews page',
  'jobs',
  'hiring',
];

const urgencyPhrases: Record<string, string[]> = {
  high: ['urgent', 'last minute', 'this weekend'],
  medium: ['planning', 'recommendations'],
  low: ['advice', 'help deciding'],
};

const allocationTargets: Record<string, Record<string, number>> = {
  flora_and_fauna_foods_001: {
    'conversation-first': 50,
    'source-specific': 25,
    'intent rewrites': 15,
    'behavior/dynamic': 10,
  },
  costa_retreats_001: {
    'conversation-first': 50,
    'Reddit/travel discussions': 25,
    'intent rewrites': 15,
    'tourism/event/public sources': 10,
  },
  lzt_costa_rica_001: {
    'source-specific public notices/construction': 40,
    'conversation/Spanish pain phrases': 30,
    'intent rewrites': 20,
    'enrichment-ready public source monitor': 10,
  },
};

export function generateConversationFirstQueries(now = new Date()): ConversationFirstQueryBatch {
  const generatedAt = now.toISOString();
  const clients = readActiveLeadDiscoveryClients();
  const activeClientIds = new Set(clients.map((client) => client.clientId));
  const patterns = readPatterns().filter((pattern) => activeClientIds.has(pattern.clientId));
  const queries = clients.flatMap((client) => buildQueriesForClient(client, patterns.filter((pattern) => pattern.clientId === client.clientId)));
  const batch: ConversationFirstQueryBatch = {
    generatedAt,
    totalQueries: queries.length,
    patternCount: patterns.length,
    priorityMix: priorityMix(patterns),
    allowedSourceTargets,
    allocationTargets,
    clients: clients.map((client) => ({
      clientId: client.clientId,
      clientName: client.clientName,
      vertical: client.vertical,
      totalQueries: queries.filter((query) => query.clientId === client.clientId).length,
    })),
    queries,
    safetyRules: [
      'Conversation-first generation is local query planning only.',
      'No Tavily, provider, network, scraping, browser automation, login, contact extraction, outreach, email, DM, calls, or forms are used.',
      'Queries target public discussion/forum surfaces and require human review before any live run.',
      'Negative filters block vendor/listing/directory/article-like result types without blanket-blocking discussion domains.',
      'Next live run must preserve max 60 credits per scheduled run, max 50 search credits, max 8 extract credits, and 2 buffer credits.',
    ],
    negativeQueryTerms: globalNegativeTerms,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(batch, null, 2)}\n`, 'utf8');
  fs.writeFileSync(markdownPath, renderMarkdown(batch), 'utf8');
  return batch;
}

function buildQueriesForClient(client: LeadDiscoveryClientConfig, patterns: ConversationPattern[]): DiscoveryQuery[] {
  const sortedPatterns = [...patterns].sort((left, right) => right.priorityWeight - left.priorityWeight || left.patternId.localeCompare(right.patternId));
  const maxQueries = client.clientId === 'flora_and_fauna_foods_001' ? 24 : client.clientId === 'costa_retreats_001' ? 18 : 16;
  const rows: DiscoveryQuery[] = [];
  const seen = new Set<string>();

  for (const pattern of sortedPatterns) {
    for (const sourceTarget of allowedSourcesFor(pattern)) {
      const urgency = urgencyPhrases[pattern.urgencyLevel] ?? [];
      const location = locationFor(client, pattern);
      const negativeTerms = unique([...globalNegativeTerms, ...pattern.negativeTerms]);
      const baseQuery = [
        sourceTarget,
        quote(pattern.phrase),
        quote(location),
        urgency[0] ? quote(urgency[0]) : '',
        negativeTerms.map((term) => `-${quote(term)}`).join(' '),
      ].filter(Boolean).join(' ');

      if (seen.has(baseQuery)) continue;
      seen.add(baseQuery);
      rows.push({
        id: `${client.clientId}-conversation-first-${String(rows.length + 1).padStart(4, '0')}`,
        clientId: client.clientId,
        clientName: client.clientName,
        vertical: client.vertical,
        sourceName: sourceNameFor(sourceTarget),
        sourceCategory: sourceCategoryFor(sourceTarget),
        query: baseQuery,
        baseQuery,
        negativeQueryTerms: negativeTerms,
        targetLocation: location,
        leadType: 'conversation_first_buyer_intent',
        purpose: 'find_recent_intent',
        recencyDays: client.maxLeadAgeDays ?? 30,
        riskLevel: 'low',
        manualReviewRequired: true,
        notes: `Conversation-first pattern ${pattern.patternId}: ${pattern.intentCategory}; expected buyer role ${pattern.expectedBuyerRole}.`,
        queryTemplateId: `${pattern.patternId}-${sourceTarget.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}`,
        queryTemplateType: 'conversation',
        expectedSourceTypes: ['public forum discussion', 'public indexed community thread', sourceNameFor(sourceTarget)],
        intentType: pattern.intentCategory,
        sourceQueryPriority: pattern.priorityWeight >= 9 ? 'high' : pattern.priorityWeight >= 8 ? 'medium' : 'low',
        expectedLeadQuality: pattern.priorityWeight >= 9 ? 'high' : 'medium',
        behaviorCategory: 'conversation_first',
        behaviorSignals: [pattern.phrase, pattern.intentCategory, pattern.urgencyLevel],
        rewrittenQueries: [baseQuery],
        rewriteSource: 'conversation pattern library',
        rewriteReason: 'Prioritize real buyer conversations over generic service keywords.',
        rewritePhrase: pattern.phrase,
        conversationSource: sourceNameFor(sourceTarget),
      });
      if (rows.length >= maxQueries) return rows;
    }
  }

  return rows;
}

function readPatterns(): ConversationPattern[] {
  if (!fs.existsSync(patternsDir)) return [];
  return fs.readdirSync(patternsDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort()
    .flatMap((fileName) => JSON.parse(fs.readFileSync(path.join(patternsDir, fileName), 'utf8')) as ConversationPattern[]);
}

function allowedSourcesFor(pattern: ConversationPattern): string[] {
  const preferred = pattern.preferredSources.filter((source) => allowedSourceTargets.includes(source));
  return preferred.length > 0 ? preferred : ['site:reddit.com'];
}

function locationFor(client: LeadDiscoveryClientConfig, pattern: ConversationPattern): string {
  const phrase = pattern.phrase.toLowerCase();
  return client.targetLocations.find((location) => phrase.includes(location.toLowerCase())) ?? client.targetLocations[0] ?? 'public';
}

function sourceNameFor(sourceTarget: string): string {
  if (sourceTarget === 'site:reddit.com') return 'Reddit public discussions';
  if (sourceTarget === 'site:facebook.com/groups') return 'Facebook public groups';
  if (sourceTarget === 'site:weddingwire.com/wedding-forums') return 'WeddingWire forums';
  if (sourceTarget === 'site:weddingbee.com') return 'WeddingBee boards';
  if (sourceTarget === 'site:tripadvisor.com') return 'Tripadvisor public forums';
  return sourceTarget;
}

function sourceCategoryFor(sourceTarget: string): LeadSourceCategory {
  if (sourceTarget === 'site:facebook.com/groups') return 'public_social';
  if (sourceTarget === 'site:tripadvisor.com') return 'public_review';
  return 'public_forum';
}

function priorityMix(patterns: ConversationPattern[]): Record<string, number> {
  return patterns.reduce<Record<string, number>>((counts, pattern) => {
    const key = `${pattern.urgencyLevel}/${pattern.intentCategory}`;
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
}

function renderMarkdown(batch: ConversationFirstQueryBatch): string {
  return `# Conversation-First Queries

Generated: ${batch.generatedAt}

## Summary

- Conversation patterns: ${batch.patternCount}
- Generated conversation-first queries: ${batch.totalQueries}
- Client distribution: ${inlineDistribution(batch.queries.map((query) => query.clientName))}
- Priority mix: ${inlineDistribution(Object.entries(batch.priorityMix).flatMap(([key, count]) => Array(count).fill(key)))}
- Allowed public discussion sources: ${batch.allowedSourceTargets.join(', ')}
- Recommended next live run mode: scheduled conversation-first discovery with unchanged Tavily budget caps.

## Expected Query Allocation

${Object.entries(batch.allocationTargets).map(([clientId, allocation]) => `### ${clientId}
${Object.entries(allocation).map(([bucket, percentage]) => `- ${bucket}: ${percentage}%`).join('\n')}`).join('\n\n')}

## Queries

${batch.queries.map((query, index) => `${index + 1}. ${query.clientName}: \`${query.query}\`
   - Source: ${query.conversationSource}
   - Pattern: ${query.rewritePhrase}
   - Negative filters: ${(query.negativeQueryTerms ?? []).join(', ')}`).join('\n') || '- No queries generated.'}

## Safety

${batch.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
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
    .map(([value, count]) => `${value}:${count}`)
    .join('; ') || 'none';
}

if (require.main === module) {
  try {
    const batch = generateConversationFirstQueries();
    console.log(`Conversation-first queries generated: ${batch.totalQueries}`);
    console.log(`Patterns used: ${batch.patternCount}`);
    console.log(`JSON: ${path.relative(process.cwd(), jsonPath)}`);
    console.log(`Markdown: ${path.relative(process.cwd(), markdownPath)}`);
    console.log('Planning only. No Tavily, provider, network, scraping, browser automation, contact extraction, outreach, or login ran.');
  } catch (error) {
    console.error('Conversation-first query generation failed.');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

