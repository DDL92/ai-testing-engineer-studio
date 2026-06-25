import fs = require('fs');
import path = require('path');
import { DiscoveryQuery, DiscoveryQueryBatch, DiscoveryQueryPurpose } from './discoveryQueryTypes';
import { LeadDiscoveryClientConfig } from './clientTypes';
import { LeadKeywordSet } from './sourceTypes';
import { LeadSourceCategory, LeadDiscoveryRiskLevel } from './sourceTypes';
import { LeadVertical } from './types';

interface DiscoveryClientConfig extends LeadDiscoveryClientConfig {
  desiredLeadTier?: string;
  maxLeadAgeDays?: number;
  preferredContactMethods?: string[];
  budgetNotes?: string;
  verifiedInterestDefinition?: string;
  salesResponseSpeed?: string;
  serviceRadius?: string;
  minimumGuestCount?: string;
  monthlyLeadTarget?: string;
  travelerOrigins?: string[];
  minimumBudget?: string;
  minimumTripDuration?: string;
  bookingWindow?: string;
  services?: string[];
}

interface SourceFile {
  vertical: LeadVertical;
  sources: Array<{
    name: string;
    category: LeadSourceCategory;
    requiresLogin: boolean;
    automationRisk: LeadDiscoveryRiskLevel;
    enabled: boolean;
    exampleKeywords: string[];
    notes: string;
  }>;
}

interface DiscoverySource {
  vertical: LeadVertical;
  sourceName: string;
  sourceCategory: LeadSourceCategory;
  riskLevel: LeadDiscoveryRiskLevel;
  requiresLogin: boolean;
  exampleKeywords: string[];
  notes: string;
}

const clientsDir = path.join(process.cwd(), 'data', 'lead-discovery', 'clients');
const sourceDir = path.join(process.cwd(), 'data', 'lead-discovery', 'sources');
const keywordDir = path.join(process.cwd(), 'data', 'lead-discovery', 'keywords');
const queryTemplateDir = path.join(process.cwd(), 'data', 'lead-discovery', 'query-templates');
const socialSourcePath = path.join(process.cwd(), 'data', 'lead-discovery', 'social-sources', 'public-social-sources.json');
const negativeTermsPath = path.join(queryTemplateDir, 'negative-query-terms.json');
const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'discovery-queries');
const summaryPath = path.join(outputDir, 'discovery-query-summary.md');
const jsonPath = path.join(outputDir, 'discovery-queries.json');

const safetyRules = [
  'Planning output only: queries are not executed.',
  'No search, scraping, network requests, paid APIs, outreach, email, DM, calls, or form submissions are performed.',
  'Human review is required before delivery, contact, or any client-facing use.',
  'Do not collect real personal lead data until Daniel explicitly approves the workflow and source.',
];

interface BuyerIntentQueryTemplate {
  templateId: string;
  clientId: string;
  vertical: LeadVertical | string;
  sourceId?: string;
  sourceCategory?: LeadSourceCategory;
  query: string;
  intentType: string;
  priority: number;
  expectedSourceTypes: string[];
  maxLeadAgeDays: number;
  notes: string;
}

interface PublicSocialSource {
  sourceId: string;
  sourceName: string;
  sourceCategory: LeadSourceCategory;
  priority: 'high' | 'medium' | 'low_medium' | 'low';
  enabled: boolean;
  requiresLogin: boolean;
  allowedForAutomation: boolean;
  notes: string;
}

interface NegativeQueryTermsConfig {
  negativeTerms: string[];
}

const blockedFloraQueryFragments = [
  'best caterers',
  'top caterers',
  'caterer profile',
  'catering company',
  'vendor directory',
  'caterers near me',
  'eventective caterers',
  'weddingwire vendors',
  'the knot marketplace',
  'zola vendor pages',
];

export function generateDiscoveryQueries(now = new Date()): DiscoveryQueryBatch {
  const generatedAt = now.toISOString();
  const clients = readClientConfigs()
    .filter((client) => client.status === 'active')
    .sort(compareClientPriority);
  const sourceFiles = readJsonFiles<SourceFile>(sourceDir);
  const keywordSets = readJsonFiles<LeadKeywordSet>(keywordDir);
  const queryTemplates = readBuyerIntentTemplates();
  const socialSources = readPublicSocialSources();
  const negativeQueryTerms = readNegativeQueryTerms();
  const sources = flattenSources(sourceFiles);
  const queries = clients.flatMap((client) => generateClientQueries(client, sources, keywordSets, queryTemplates, socialSources, negativeQueryTerms));

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
    negativeQueryTerms,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(summaryPath, renderSummary(batch), 'utf8');
  for (const client of clients) {
    const clientQueries = queries.filter((query) => query.clientId === client.clientId);
    fs.writeFileSync(path.join(outputDir, `${client.clientId}-queries.md`), renderClientQueries(client, clientQueries, generatedAt), 'utf8');
  }
  fs.writeFileSync(jsonPath, `${JSON.stringify(batch, null, 2)}\n`, 'utf8');

  return batch;
}

function generateClientQueries(
  client: DiscoveryClientConfig,
  sources: DiscoverySource[],
  keywordSets: LeadKeywordSet[],
  queryTemplates: BuyerIntentQueryTemplate[],
  socialSources: PublicSocialSource[],
  negativeQueryTerms: string[],
): DiscoveryQuery[] {
  const clientTemplates = queryTemplates
    .filter((template) => template.clientId === client.clientId)
    .filter((template) => template.vertical === client.vertical)
    .filter((template) => !isBlockedFloraTemplate(template))
    .sort((left, right) => compareTemplatePriority(left, right, client.clientId, socialSources));
  if (clientTemplates.length > 0) {
    return clientTemplates.map((template, index) => templateToQuery(template, client, index + 1, socialSources, negativeQueryTerms));
  }

  const verticalSources = sources.filter((source) => source.vertical === client.vertical);
  const keywordSet = keywordSets.find((set) => set.vertical === client.vertical);
  const activeSources = verticalSources.length > 0 ? verticalSources : [fallbackSource(client.vertical)];
  const recencyPhrases = recencyIntentPhrases(client, keywordSet);
  const queries: DiscoveryQuery[] = [];

  for (const leadType of client.preferredLeadTypes) {
    for (const source of activeSources) {
      for (const targetLocation of client.targetLocations) {
        for (const recency of recencyPhrases) {
          for (const sourcePrefix of sourcePrefixesFor(source)) {
            const phrase = chooseIntentPhrase(leadType, source, keywordSet);
            const query = compact([
              sourcePrefix,
              quote(phrase),
              quote(targetLocation),
              quote(leadType),
              quote(recency.phrase),
            ]).join(' ');

            queries.push({
              id: `${client.clientId}-q-${String(queries.length + 1).padStart(4, '0')}`,
              clientId: client.clientId,
              clientName: client.clientName,
              vertical: client.vertical,
              sourceName: source.sourceName,
              sourceCategory: source.sourceCategory,
              query: appendNegativeTerms(query, negativeQueryTerms),
              baseQuery: query,
              negativeQueryTerms,
              targetLocation,
              leadType,
              purpose: recency.purpose,
              recencyDays: client.maxLeadAgeDays ?? recency.days,
              riskLevel: source.riskLevel,
              manualReviewRequired: true,
              notes: [
                `Vertical: ${client.vertical}.`,
                `Lead type: ${leadType}.`,
                `Recency intent: ${recency.phrase}.`,
                source.notes,
              ].join(' '),
            });
          }
        }
      }
    }
  }

  return queries;
}

function templateToQuery(
  template: BuyerIntentQueryTemplate,
  client: DiscoveryClientConfig,
  index: number,
  socialSources: PublicSocialSource[],
  negativeQueryTerms: string[],
): DiscoveryQuery {
  const socialSource = template.sourceId ? socialSources.find((source) => source.sourceId === template.sourceId) : undefined;
  const baseQuery = template.query;
  return {
    id: `${client.clientId}-template-q-${String(index).padStart(4, '0')}`,
    clientId: client.clientId,
    clientName: client.clientName,
    vertical: client.vertical,
    sourceId: template.sourceId,
    sourceName: socialSource?.sourceName ?? template.expectedSourceTypes[0] ?? 'Buyer-intent public source',
    sourceCategory: template.sourceCategory ?? socialSource?.sourceCategory ?? 'public_forum',
    query: appendNegativeTerms(baseQuery, negativeQueryTerms),
    baseQuery,
    negativeQueryTerms,
    targetLocation: targetLocationForTemplate(template.query, client.targetLocations),
    leadType: template.intentType,
    purpose: 'find_recent_intent',
    recencyDays: template.maxLeadAgeDays,
    riskLevel: 'low',
    manualReviewRequired: true,
    notes: [
      template.notes,
      `Template ID: ${template.templateId}.`,
      `Expected source types: ${template.expectedSourceTypes.join(', ')}.`,
      'Buyer-intent template. Human review required before delivery or contact.',
    ].join(' '),
    queryTemplateId: template.templateId,
    queryTemplateType: template.sourceId ? 'social' : 'standard',
    expectedSourceTypes: template.expectedSourceTypes,
    intentType: template.intentType,
  };
}

function compareTemplatePriority(
  left: BuyerIntentQueryTemplate,
  right: BuyerIntentQueryTemplate,
  clientId: string,
  socialSources: PublicSocialSource[],
): number {
  const leftSocialRank = templateSocialRank(left, clientId);
  const rightSocialRank = templateSocialRank(right, clientId);
  if (leftSocialRank !== rightSocialRank) return leftSocialRank - rightSocialRank;
  const leftSourceRank = sourcePriorityRank(left.sourceId, socialSources);
  const rightSourceRank = sourcePriorityRank(right.sourceId, socialSources);
  if (leftSourceRank !== rightSourceRank) return leftSourceRank - rightSourceRank;
  return left.priority - right.priority || left.templateId.localeCompare(right.templateId);
}

function templateSocialRank(template: BuyerIntentQueryTemplate, clientId: string): number {
  if (clientId === 'flora_and_fauna_foods_001' && template.sourceId) return 0;
  return template.sourceId ? 1 : 2;
}

function sourcePriorityRank(sourceId: string | undefined, socialSources: PublicSocialSource[]): number {
  if (!sourceId) return 9;
  const priority = socialSources.find((source) => source.sourceId === sourceId)?.priority;
  if (priority === 'high') return 0;
  if (priority === 'medium') return 1;
  if (priority === 'low_medium') return 2;
  if (priority === 'low') return 3;
  return 4;
}

function targetLocationForTemplate(query: string, targetLocations: string[]): string {
  const normalizedQuery = query.toLowerCase();
  return targetLocations.find((location) => normalizedQuery.includes(location.toLowerCase())) ?? targetLocations[0] ?? 'unknown';
}

function isBlockedFloraTemplate(template: BuyerIntentQueryTemplate): boolean {
  if (template.clientId !== 'flora_and_fauna_foods_001') return false;
  const normalized = template.query.toLowerCase();
  return blockedFloraQueryFragments.some((fragment) => normalized.includes(fragment));
}

function readJsonFiles<T>(directory: string): T[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort()
    .map((fileName) => JSON.parse(fs.readFileSync(path.join(directory, fileName), 'utf8')) as T);
}

function readBuyerIntentTemplates(): BuyerIntentQueryTemplate[] {
  if (!fs.existsSync(queryTemplateDir)) return [];
  return fs.readdirSync(queryTemplateDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .filter((fileName) => fileName !== 'negative-query-terms.json')
    .sort()
    .flatMap((fileName) => {
      const parsed = JSON.parse(fs.readFileSync(path.join(queryTemplateDir, fileName), 'utf8')) as unknown;
      return Array.isArray(parsed) ? parsed as BuyerIntentQueryTemplate[] : [];
    });
}

function readPublicSocialSources(): PublicSocialSource[] {
  if (!fs.existsSync(socialSourcePath)) return [];
  const parsed = JSON.parse(fs.readFileSync(socialSourcePath, 'utf8')) as PublicSocialSource[];
  return parsed.filter((source) => source.enabled && !source.requiresLogin && source.allowedForAutomation);
}

function readNegativeQueryTerms(): string[] {
  if (!fs.existsSync(negativeTermsPath)) return [];
  const parsed = JSON.parse(fs.readFileSync(negativeTermsPath, 'utf8')) as NegativeQueryTermsConfig;
  return unique(parsed.negativeTerms.map((term) => term.trim().toLowerCase()).filter(Boolean));
}

function readClientConfigs(): DiscoveryClientConfig[] {
  if (!fs.existsSync(clientsDir)) return [];
  return fs.readdirSync(clientsDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .filter((fileName) => !fileName.endsWith('.sample.json'))
    .sort()
    .map((fileName) => JSON.parse(fs.readFileSync(path.join(clientsDir, fileName), 'utf8')) as DiscoveryClientConfig);
}

function flattenSources(sourceFiles: SourceFile[]): DiscoverySource[] {
  return sourceFiles.flatMap((file) => file.sources
    .filter((source) => source.enabled)
    .map((source) => ({
      vertical: file.vertical,
      sourceName: source.name,
      sourceCategory: source.category,
      riskLevel: source.automationRisk,
      requiresLogin: source.requiresLogin,
      exampleKeywords: source.exampleKeywords,
      notes: source.notes,
    })));
}

function compareClientPriority(left: DiscoveryClientConfig, right: DiscoveryClientConfig): number {
  const priority = ['flora_and_fauna_foods_001', 'lzt_costa_rica_001', 'costa_retreats_001'];
  const leftRank = priority.indexOf(left.clientId);
  const rightRank = priority.indexOf(right.clientId);
  if (leftRank !== -1 || rightRank !== -1) {
    return (leftRank === -1 ? Number.MAX_SAFE_INTEGER : leftRank)
      - (rightRank === -1 ? Number.MAX_SAFE_INTEGER : rightRank);
  }
  return left.clientName.localeCompare(right.clientName);
}

function recencyIntentPhrases(
  client: DiscoveryClientConfig,
  keywordSet?: LeadKeywordSet,
): Array<{ phrase: string; days: number; purpose: DiscoveryQueryPurpose }> {
  const defaults = client.vertical === 'travel_leads'
    ? ['planning now', 'trip next month', 'booking soon']
    : ['looking for recommendations', 'event next month', 'date confirmed'];
  return unique([...(keywordSet?.urgencyPhrases ?? []), ...defaults])
    .slice(0, 3)
    .map((phrase, index) => ({
      phrase,
      days: client.maxLeadAgeDays ?? 30,
      purpose: (index === 0 ? 'find_recent_intent' : index === 1 ? 'verify_recency' : 'prepare_interest_verification') as DiscoveryQueryPurpose,
    }));
}

function chooseIntentPhrase(leadType: string, source: DiscoverySource, keywordSet?: LeadKeywordSet): string {
  const sourceKeyword = source.exampleKeywords.find((keyword) => containsAny(keyword, leadType.split(/\s+/)));
  const servicePhrase = keywordSet?.servicePhrases.find((phrase) => containsAny(phrase, leadType.split(/\s+/)));
  return sourceKeyword ?? servicePhrase ?? `need ${leadType}`;
}

function sourcePrefixesFor(source: DiscoverySource): string[] {
  const name = source.sourceName.toLowerCase();
  if (name.includes('reddit')) return ['site:reddit.com'];
  if (name.includes('facebook')) return ['site:facebook.com/groups'];
  if (name.includes('trip') || name.includes('destination')) return ['site:tripadvisor.com'];
  if (source.sourceCategory === 'public_event_board') return ['site:eventective.com'];
  if (source.sourceCategory === 'public_forum' && source.vertical === 'travel_leads') return ['site:reddit.com'];
  if (source.sourceCategory === 'public_forum' && source.vertical === 'catering_leads') return ['site:reddit.com', 'site:facebook.com/groups'];
  if (source.sourceCategory === 'public_forum') return ['site:reddit.com'];
  return [''];
}

function fallbackSource(vertical: LeadVertical): DiscoverySource {
  return {
    vertical,
    sourceName: 'Manual public search planning',
    sourceCategory: 'public_forum',
    riskLevel: 'low',
    requiresLogin: false,
    exampleKeywords: [],
    notes: 'Fallback local planning source. Human must verify every result before use.',
  };
}

function renderSummary(batch: DiscoveryQueryBatch): string {
  const socialQueries = batch.queries.filter((query) => query.queryTemplateType === 'social');
  return `# Discovery Query Summary

Generated: ${batch.generatedAt}

## Client Priority

${batch.clients.map((client, index) => `${index + 1}. ${client.clientName} (${client.clientId}) - ${client.vertical}, ${client.totalQueries} queries`).join('\n') || '- No active clients found.'}

## Totals

- Total generated queries: ${batch.totalQueries}
- Social template queries: ${socialQueries.length}
- Source IDs: ${renderTopValues(batch.queries.map((query) => query.sourceId ?? 'no_source_id'))}
- Source categories: ${renderTopValues(batch.queries.map((query) => query.sourceCategory))}
- Negative query terms exposed: ${batch.negativeQueryTerms?.length ?? 0}
- Planning boundary: queries were generated locally and were not executed.
- Manual review required before delivery, contact, or client-facing use.

## Output Files

${batch.clients.map((client) => `- output/lead-discovery/discovery-queries/${client.clientId}-queries.md`).join('\n') || '- None.'}
- output/lead-discovery/discovery-queries/discovery-queries.json

## Safety Rules

${batch.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function renderClientQueries(client: DiscoveryClientConfig, queries: DiscoveryQuery[], generatedAt: string): string {
  const grouped = groupByLeadType(queries);
  return `# Discovery Queries - ${client.clientName}

Generated: ${generatedAt}

## Client Profile Summary

- Client ID: ${client.clientId}
- Client name: ${client.clientName}
- Vertical: ${client.vertical}
- Status: ${client.status}
- Target locations: ${client.targetLocations.join(', ')}
- Preferred lead types: ${client.preferredLeadTypes.join(', ')}
- Minimum score: ${client.minScore}
- Lead goal per day: ${client.leadGoalPerDay}
- Delivery cadence: ${client.deliveryCadence}
- Desired lead tier: ${client.desiredLeadTier ?? 'not specified'}
- Max lead age days: ${client.maxLeadAgeDays ?? 'not specified'}
- Verified interest definition: ${client.verifiedInterestDefinition ?? 'not specified'}
- Notes: ${client.notes}

## Total Generated Queries

${queries.length}

## Top 20 Priority Queries

${queries.slice(0, 20).map((query, index) => `${index + 1}. \`${query.query}\`\n   - Source: ${query.sourceId ?? query.sourceName}; category: ${query.sourceCategory}; template: ${query.queryTemplateType ?? 'standard'}; lead type: ${query.leadType}; location: ${query.targetLocation}; vertical: ${query.vertical}; recency: ${query.recencyDays} days; purpose: ${query.purpose}`).join('\n') || '- No queries generated.'}

## Queries by Lead Type

${Object.entries(grouped).map(([leadType, items]) => renderLeadTypeGroup(leadType, items)).join('\n\n') || '- No grouped queries.'}

## Recency Notes

- Queries include explicit recency intent phrases from the matching keyword config and client max lead age.
- These query strings do not verify freshness by themselves; Daniel must manually confirm post dates and context before any use.

## Safety Notes

${safetyRules.map((rule) => `- ${rule}`).join('\n')}

## Manual Review Disclaimer

These are query plans only. They do not contain real lead records, do not execute searches, and do not authorize delivery or contact. Daniel must review sources, context, consent/interest, fit, recency, and risk before any client-facing action.
`;
}

function renderLeadTypeGroup(leadType: string, queries: DiscoveryQuery[]): string {
  return `### ${leadType}

${queries.map((query) => `- \`${query.query}\` (${query.sourceId ?? query.sourceName}; ${query.sourceCategory}; ${query.targetLocation}; ${query.purpose}; ${query.recencyDays} days)`).join('\n')}`;
}

function groupByLeadType(queries: DiscoveryQuery[]): Record<string, DiscoveryQuery[]> {
  return queries.reduce<Record<string, DiscoveryQuery[]>>((groups, query) => {
    groups[query.leadType] = groups[query.leadType] ?? [];
    groups[query.leadType].push(query);
    return groups;
  }, {});
}

function containsAny(value: string, terms: string[]): boolean {
  const normalized = value.toLowerCase();
  return terms.some((term) => term.length > 2 && normalized.includes(term.toLowerCase()));
}

function quote(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`;
}

function compact(values: string[]): string[] {
  return values.filter((value) => value.trim().length > 0);
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function appendNegativeTerms(query: string, negativeTerms: string[]): string {
  if (negativeTerms.length === 0) return query;
  const normalizedQuery = query.toLowerCase();
  const termsToAppend = negativeTerms
    .filter((term) => !normalizedQuery.includes(`-${term}`))
    .map((term) => term.includes(' ') ? `-"${term}"` : `-${term}`);
  return compact([query, ...termsToAppend]).join(' ');
}

function renderTopValues(values: string[]): string {
  const rows = Object.entries(values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {})).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));

  return rows.map(([value, count]) => `${value}=${count}`).join(', ') || 'none';
}

function main(): void {
  const batch = generateDiscoveryQueries();
  console.log(`Discovery queries generated: ${batch.totalQueries}`);
  console.log(`Summary: ${path.relative(process.cwd(), summaryPath)}`);
  console.log(`JSON: ${path.relative(process.cwd(), jsonPath)}`);
  console.log('Planning only. No search, scraping, network requests, paid APIs, outreach, email, DM, calls, or form submissions were performed.');
}

if (require.main === module) main();
