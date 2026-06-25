import fs = require('fs');
import path = require('path');
import { DeliveryLeadCandidate } from './deliveryLeadTypes';
import { EnrichedLeadCandidate } from './enrichedLeadTypes';
import { LeadOutcomeRecord } from './outcomeTypes';
import { SearchCandidate, SearchCandidateBatch } from './searchCandidateTypes';
import { SourcePerformanceBatch, SourcePerformanceRecommendation, SourcePerformanceRow } from './sourcePerformanceTypes';
import { VerificationBatch, VerificationQueueItem } from './verificationTypes';

interface EnrichedLeadBatch {
  enrichedCandidates: EnrichedLeadCandidate[];
}

interface DeliveryBatch {
  deliveryCandidates: DeliveryLeadCandidate[];
}

const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'source-performance');
const sourceSummaryPath = path.join(outputDir, 'source-performance-summary.md');
const sourceCsvPath = path.join(outputDir, 'source-performance.csv');
const querySummaryPath = path.join(outputDir, 'query-performance.md');
const queryCsvPath = path.join(outputDir, 'query-performance.csv');
const recommendationsPath = path.join(outputDir, 'recommendations.md');

const searchPath = path.join(process.cwd(), 'output', 'lead-discovery', 'search-candidates', 'search-candidates.json');
const enrichedPath = path.join(process.cwd(), 'output', 'lead-discovery', 'enriched-leads', 'enriched-leads.json');
const deliveryPath = path.join(process.cwd(), 'output', 'lead-discovery', 'delivery-candidates', 'delivery-candidates.json');
const verificationPath = path.join(process.cwd(), 'output', 'lead-discovery', 'verification', 'verification-summary.md');
const outcomesPath = path.join(process.cwd(), 'data', 'lead-discovery', 'outcomes', 'sample-outcomes.json');
const generatedOutcomesPath = path.join(process.cwd(), 'output', 'lead-discovery', 'outcomes', 'outcome-summary.csv');

export function generateSourcePerformance(now = new Date()): SourcePerformanceBatch {
  const generatedAt = now.toISOString();
  const searchBatch = readJsonOrNull<SearchCandidateBatch>(searchPath);
  const enrichedBatch = readJsonOrNull<EnrichedLeadBatch>(enrichedPath);
  const deliveryBatch = readJsonOrNull<DeliveryBatch>(deliveryPath);
  const verificationBatch = readVerificationSummary();
  const outcomes = readOutcomes();

  const searchCandidates = searchBatch?.candidates ?? [];
  const enrichedCandidates = enrichedBatch?.enrichedCandidates ?? [];
  const deliveryCandidates = deliveryBatch?.deliveryCandidates ?? [];
  const sourceRows = buildRows('source', searchCandidates, enrichedCandidates, deliveryCandidates, verificationBatch, outcomes);
  const queryRows = buildRows('query', searchCandidates, enrichedCandidates, deliveryCandidates, verificationBatch, outcomes);
  const rawRecommendationRows = buildRows('group', searchCandidates, enrichedCandidates, deliveryCandidates, verificationBatch, outcomes);
  const recommendationRows = dedupeRecommendationRows(rawRecommendationRows);
  const batch: SourcePerformanceBatch = {
    generatedAt,
    rows: recommendationRows,
    sourceRows,
    queryRows,
    recommendationRows,
    recommendationDeduplicationCount: Math.max(0, rawRecommendationRows.length - recommendationRows.length),
    filesGenerated: [
      path.relative(process.cwd(), sourceSummaryPath),
      path.relative(process.cwd(), sourceCsvPath),
      path.relative(process.cwd(), querySummaryPath),
      path.relative(process.cwd(), queryCsvPath),
      path.relative(process.cwd(), recommendationsPath),
    ],
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(sourceSummaryPath, renderSummary('Source Performance Summary', sourceRows, generatedAt), 'utf8');
  fs.writeFileSync(sourceCsvPath, renderCsv(sourceRows), 'utf8');
  fs.writeFileSync(querySummaryPath, renderSummary('Query Performance Summary', queryRows, generatedAt), 'utf8');
  fs.writeFileSync(queryCsvPath, renderCsv(queryRows), 'utf8');
  fs.writeFileSync(recommendationsPath, renderRecommendations(batch), 'utf8');

  return batch;
}

function buildRows(
  mode: 'source' | 'query' | 'group',
  searchCandidates: SearchCandidate[],
  enrichedCandidates: EnrichedLeadCandidate[],
  deliveryCandidates: DeliveryLeadCandidate[],
  verificationBatch: VerificationBatch | null,
  outcomes: LeadOutcomeRecord[],
): SourcePerformanceRow[] {
  const groups = new Map<string, SourcePerformanceRow>();
  const queryByCandidate = new Map(searchCandidates.map((candidate) => [candidateKey(candidate.clientId, candidate.url), candidate.query]));
  const sourceByCandidate = new Map(searchCandidates.map((candidate) => [candidateKey(candidate.clientId, candidate.url), candidate.sourceName]));
  const metadataByCandidate = new Map(searchCandidates.map((candidate) => [candidateKey(candidate.clientId, candidate.url), sourceMetadata(candidate)]));
  const metadataBySourceQuery = new Map(searchCandidates.map((candidate) => [sourceQueryKey(candidate.clientId, candidate.sourceName, candidate.query), sourceMetadata(candidate)]));

  for (const candidate of searchCandidates) {
    const metadata = sourceMetadata(candidate);
    const row = ensureRow(groups, keyFor(mode, candidate.sourceName, candidate.query, candidate.clientId, metadata), candidate.sourceName, candidate.query, candidate.clientId, metadata);
    row.candidatesGenerated += 1;
  }

  for (const candidate of enrichedCandidates) {
    const source = candidate.sourceName;
    const query = candidate.query;
    const metadata = metadataBySourceQuery.get(sourceQueryKey(candidate.clientId, source, query));
    const row = ensureRow(groups, keyFor(mode, source, query, candidate.clientId, metadata), source, query, candidate.clientId, metadata);
    row.enrichedCandidates += 1;
  }

  for (const candidate of deliveryCandidates) {
    const source = candidate.sourceName;
    const query = candidate.query || 'unknown';
    const metadata = metadataBySourceQuery.get(sourceQueryKey(candidate.clientId, source, query));
    const row = ensureRow(groups, keyFor(mode, source, query, candidate.clientId, metadata), source, query, candidate.clientId, metadata);
    if (!candidate.excluded) row.deliveryCandidates += 1;
  }

  for (const item of verificationBatch?.queueItems ?? []) {
    const source = sourceByCandidate.get(candidateKey(item.clientId, item.url)) ?? hostFor(item.url);
    const query = item.query || (queryByCandidate.get(candidateKey(item.clientId, item.url)) ?? 'unknown');
    const metadata = metadataByCandidate.get(candidateKey(item.clientId, item.url));
    const row = ensureRow(groups, keyFor(mode, source, query, item.clientId, metadata), source, query, item.clientId, metadata);
    row.verificationCandidates += 1;
  }

  for (const outcome of outcomes) {
    const source = outcome.sourceName || 'unknown';
    const query = 'unknown';
    const row = ensureRow(groups, keyFor(mode, source, query, outcome.clientId), source, query, outcome.clientId);
    if (outcome.outcomeStatus === 'interest_verified') row.verifiedLeads += 1;
    if (outcome.outcomeStatus === 'meeting_booked') row.meetingsBooked += 1;
    if (outcome.outcomeStatus === 'quote_sent') row.quotesSent += 1;
    if (outcome.outcomeStatus === 'won') row.won += 1;
    if (outcome.outcomeStatus === 'lost') row.lost += 1;
    if (outcome.outcomeStatus === 'bad_fit') row.badFit += 1;
    if (outcome.outcomeStatus === 'no_response') row.noResponse += 1;
  }

  return [...groups.values()]
    .map(finalizeRow)
    .sort((left, right) => right.performanceScore - left.performanceScore || right.deliveryCandidates - left.deliveryCandidates || left.source.localeCompare(right.source));
}

function ensureRow(
  rows: Map<string, SourcePerformanceRow>,
  key: string,
  source: string,
  query: string,
  clientId: string,
  metadata?: SourcePerformanceMetadata,
): SourcePerformanceRow {
  const existing = rows.get(key);
  if (existing) return existing;
  const row: SourcePerformanceRow = {
    sourceId: metadata?.sourceId,
    source,
    sourceCategory: metadata?.sourceCategory,
    queryTemplateType: metadata?.queryTemplateType ?? 'unknown',
    expectedLeadQuality: metadata?.expectedLeadQuality,
    query,
    clientId,
    candidatesGenerated: 0,
    enrichedCandidates: 0,
    deliveryCandidates: 0,
    verificationCandidates: 0,
    verifiedLeads: 0,
    meetingsBooked: 0,
    quotesSent: 0,
    won: 0,
    lost: 0,
    badFit: 0,
    noResponse: 0,
    performanceScore: 0,
    recommendation: 'needs_more_data',
  };
  rows.set(key, row);
  return row;
}

function finalizeRow(row: SourcePerformanceRow): SourcePerformanceRow {
  const performanceScore = Math.max(0, Math.round((
    row.deliveryCandidates * 4
    + row.verificationCandidates * 6
    + row.verifiedLeads * 10
    + row.meetingsBooked * 14
    + row.quotesSent * 16
    + row.won * 25
    - row.lost * 5
    - row.badFit * 4
    - row.noResponse * 2
  ) * 10) / 10);
  return {
    ...row,
    performanceScore,
    recommendation: recommendationFor(row, performanceScore),
  };
}

function recommendationFor(row: SourcePerformanceRow, performanceScore: number): SourcePerformanceRecommendation {
  const vendorHeavy = /\b(vendor|directory|marketplace|eventective|weddingwire|the knot|zola|caterers near me)\b/i.test(`${row.source} ${row.query}`);
  if (vendorHeavy) return row.deliveryCandidates > 0 ? 'reduce' : 'disable';
  if (row.won > 0 || row.verifiedLeads > 0 || row.meetingsBooked > 0 || row.quotesSent > 0) return 'increase';
  if (row.candidatesGenerated >= 10 && row.deliveryCandidates === 0) return 'disable';
  if (row.candidatesGenerated >= 5 && row.deliveryCandidates === 0) return 'reduce';
  if (row.deliveryCandidates > 0) return performanceScore >= 8 ? 'increase' : 'keep';
  return 'needs_more_data';
}

interface SourcePerformanceMetadata {
  sourceId?: string;
  sourceCategory?: string;
  queryTemplateType?: 'standard' | 'social' | 'source_specific' | 'behavior' | 'dynamic' | 'unknown';
  expectedLeadQuality?: 'high' | 'medium' | 'low';
}

function keyFor(mode: 'source' | 'query' | 'group', source: string, query: string, clientId: string, metadata?: SourcePerformanceMetadata): string {
  const sourceKey = metadata?.sourceId ?? source;
  if (mode === 'source') return `${clientId}::${sourceKey}`;
  if (mode === 'query') return `${clientId}::${query}`;
  return `${clientId}::${sourceKey}::${query}`;
}

function candidateKey(clientId: string, url: string): string {
  return `${clientId}|${url}`;
}

function sourceQueryKey(clientId: string, source: string, query: string): string {
  return `${clientId}|${source}|${query}`;
}

function sourceMetadata(candidate: SearchCandidate): SourcePerformanceMetadata {
  return {
    sourceId: candidate.sourceId,
    sourceCategory: candidate.sourceCategory,
    queryTemplateType: candidate.queryTemplateType ?? 'standard',
    expectedLeadQuality: candidate.expectedLeadQuality,
  };
}

function readJsonOrNull<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function readVerificationSummary(): VerificationBatch | null {
  if (!fs.existsSync(verificationPath)) return null;
  const body = fs.readFileSync(verificationPath, 'utf8');
  const totalDeliveryCandidates = Number(body.match(/Total delivery candidates reviewed: (\d+)/)?.[1] ?? 0);
  const totalVerificationCandidates = Number(body.match(/Total verification candidates prepared: (\d+)/)?.[1] ?? 0);
  return {
    generatedAt: '',
    totalDeliveryCandidates,
    totalVerificationCandidates,
    queueItems: readVerificationQueueItems(totalVerificationCandidates),
    safetyRules: [],
  };
}

function readVerificationQueueItems(limit: number): VerificationQueueItem[] {
  const candidates = readJsonOrNull<DeliveryBatch>(deliveryPath)?.deliveryCandidates ?? [];
  return candidates
    .filter((candidate) => !candidate.excluded && candidate.deliveryQueue === 'interest_verification')
    .slice(0, limit)
    .map((candidate, index) => ({
      id: `verification-${String(index + 1).padStart(4, '0')}`,
      clientId: candidate.clientId,
      clientName: candidate.clientName,
      vertical: candidate.vertical,
      url: candidate.url,
      title: candidate.title,
      snippet: candidate.snippet,
      estimatedLeadType: candidate.estimatedLeadType,
      estimatedLocation: candidate.estimatedLocation,
      estimatedRecencyDays: candidate.estimatedRecencyDays,
      estimatedBudgetSignal: candidate.estimatedBudgetSignal,
      sourceQuality: candidate.sourceQuality,
      overallScore: candidate.overallScore,
      deliveryQueue: candidate.deliveryQueue,
      suggestedMessage: '',
      salesContext: '',
      approvalStatus: 'pending_daniel_review',
      manualReviewRequired: true,
      notes: '',
    }));
}

function readOutcomes(): LeadOutcomeRecord[] {
  const fromData = readJsonOrNull<LeadOutcomeRecord[]>(outcomesPath) ?? [];
  void generatedOutcomesPath;
  return fromData.filter((outcome) => !outcome.isSample);
}

function renderSummary(title: string, rows: SourcePerformanceRow[], generatedAt: string): string {
  return `# ${title}

Generated: ${generatedAt}

## Totals

- Rows tracked: ${rows.length}
- Social source rows: ${rows.filter((row) => row.queryTemplateType === 'social').length}
- Source-specific rows: ${rows.filter((row) => row.queryTemplateType === 'source_specific').length}
- Behavior rows: ${rows.filter((row) => row.queryTemplateType === 'behavior').length}
- Source IDs tracked: ${renderTopValues(rows.map((row) => row.sourceId ?? 'no_source_id'))}
- Source categories tracked: ${renderTopValues(rows.map((row) => row.sourceCategory ?? 'unknown'))}
- Expected quality tracked: ${renderTopValues(rows.map((row) => row.expectedLeadQuality ?? 'unknown'))}
- Candidates generated: ${sum(rows, 'candidatesGenerated')}
- Enriched candidates: ${sum(rows, 'enrichedCandidates')}
- Delivery candidates: ${sum(rows, 'deliveryCandidates')}
- Verification candidates: ${sum(rows, 'verificationCandidates')}
- Verified leads: ${sum(rows, 'verifiedLeads')}
- Meetings booked: ${sum(rows, 'meetingsBooked')}
- Quotes sent: ${sum(rows, 'quotesSent')}
- Won: ${sum(rows, 'won')}
- Lost: ${sum(rows, 'lost')}
- Bad fit: ${sum(rows, 'badFit')}
- No response: ${sum(rows, 'noResponse')}

## Top Rows

${rows.slice(0, 20).map((row, index) => `${index + 1}. ${row.sourceId ?? row.source} | ${row.clientId}
   - Source category: ${row.sourceCategory ?? 'unknown'}; template type: ${row.queryTemplateType ?? 'unknown'}; expected quality: ${row.expectedLeadQuality ?? 'unknown'}; source name: ${row.source}
   - Query: \`${row.query}\`
   - Candidates: ${row.candidatesGenerated}; delivery: ${row.deliveryCandidates}; verification: ${row.verificationCandidates}; won: ${row.won}; score: ${row.performanceScore}
   - Recommendation: ${row.recommendation}`).join('\n') || '- No performance data available yet.'}
`;
}

function renderRecommendations(batch: SourcePerformanceBatch): string {
  const rows = batch.recommendationRows
    .filter((row) => row.recommendation !== 'needs_more_data')
    .sort((left, right) => recommendationRank(left.recommendation) - recommendationRank(right.recommendation) || right.performanceScore - left.performanceScore);
  return `# Source and Query Recommendations

Generated: ${batch.generatedAt}

## Recommendation Rules

- Many candidates but zero delivery candidates: reduce or disable.
- Vendor-heavy sources or queries: reduce or disable.
- Public social and source-specific performance is tracked by sourceId, sourceCategory, expected quality, and template type.
- Delivery candidates: keep or increase.
- Verified real outcomes: increase.
- Sample outcomes are excluded from recommendation scoring.
- Duplicate recommendation groups are collapsed by clientId + sourceName + query.

## Summary

- Final recommendation groups: ${batch.recommendationRows.length}
- Recommendation deduplication count: ${batch.recommendationDeduplicationCount}

## Actions

${rows.map((row, index) => `${index + 1}. ${row.recommendation.toUpperCase()} - ${row.sourceId ?? row.source} (${row.clientId})
   - Source category: ${row.sourceCategory ?? 'unknown'}; template type: ${row.queryTemplateType ?? 'unknown'}; expected quality: ${row.expectedLeadQuality ?? 'unknown'}; source name: ${row.source}
   - Query: \`${row.query}\`
   - Candidates: ${row.candidatesGenerated}; delivery: ${row.deliveryCandidates}; verification: ${row.verificationCandidates}; verified: ${row.verifiedLeads}; won: ${row.won}; score: ${row.performanceScore}`).join('\n') || '- Needs more data before changing source/query allocation.'}
`;
}

function dedupeRecommendationRows(rows: SourcePerformanceRow[]): SourcePerformanceRow[] {
  const grouped = new Map<string, SourcePerformanceRow>();
  for (const row of rows) {
    const key = `${row.clientId}::${row.source}::${row.query}`;
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, row);
      continue;
    }
    const merged: SourcePerformanceRow = finalizeRow({
      ...existing,
      candidatesGenerated: existing.candidatesGenerated + row.candidatesGenerated,
      enrichedCandidates: existing.enrichedCandidates + row.enrichedCandidates,
      deliveryCandidates: existing.deliveryCandidates + row.deliveryCandidates,
      verificationCandidates: existing.verificationCandidates + row.verificationCandidates,
      verifiedLeads: existing.verifiedLeads + row.verifiedLeads,
      meetingsBooked: existing.meetingsBooked + row.meetingsBooked,
      quotesSent: existing.quotesSent + row.quotesSent,
      won: existing.won + row.won,
      lost: existing.lost + row.lost,
      badFit: existing.badFit + row.badFit,
      noResponse: existing.noResponse + row.noResponse,
    });
    merged.recommendation = safestRecommendation([existing.recommendation, row.recommendation, merged.recommendation]);
    grouped.set(key, merged);
  }
  return [...grouped.values()].sort((left, right) => recommendationRank(left.recommendation) - recommendationRank(right.recommendation) || right.performanceScore - left.performanceScore);
}

function safestRecommendation(recommendations: SourcePerformanceRecommendation[]): SourcePerformanceRecommendation {
  return recommendations.sort((left, right) => recommendationRank(left) - recommendationRank(right))[0];
}

function renderCsv(rows: SourcePerformanceRow[]): string {
  const headers: Array<keyof SourcePerformanceRow> = [
    'sourceId',
    'source',
    'sourceCategory',
    'queryTemplateType',
    'expectedLeadQuality',
    'query',
    'clientId',
    'candidatesGenerated',
    'enrichedCandidates',
    'deliveryCandidates',
    'verificationCandidates',
    'verifiedLeads',
    'meetingsBooked',
    'quotesSent',
    'won',
    'lost',
    'badFit',
    'noResponse',
    'performanceScore',
    'recommendation',
  ];
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvCell(String(row[header]))).join(',')),
  ].join('\n') + '\n';
}

function sum(rows: SourcePerformanceRow[], field: keyof Pick<SourcePerformanceRow, 'candidatesGenerated' | 'enrichedCandidates' | 'deliveryCandidates' | 'verificationCandidates' | 'verifiedLeads' | 'meetingsBooked' | 'quotesSent' | 'won' | 'lost' | 'badFit' | 'noResponse'>): number {
  return rows.reduce((total, row) => total + row[field], 0);
}

function renderTopValues(values: string[]): string {
  const rows = Object.entries(values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {})).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));

  return rows.map(([value, count]) => `${value}=${count}`).join(', ') || 'none';
}

function recommendationRank(recommendation: SourcePerformanceRecommendation): number {
  return ['disable', 'reduce', 'keep', 'increase', 'needs_more_data'].indexOf(recommendation);
}

function hostFor(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

async function main(): Promise<void> {
  try {
    const batch = generateSourcePerformance();
    console.log(`Source performance generated: ${batch.filesGenerated.join(', ')}`);
  } catch (error) {
    console.error('Source Performance Tracker: FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) {
  void main();
}
