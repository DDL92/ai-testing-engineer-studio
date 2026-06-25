import fs = require('fs');
import path = require('path');
import { DeliveryLeadCandidate } from './deliveryLeadTypes';
import { LeadOutcomeRecord } from './outcomeTypes';
import { SearchCandidate, SearchCandidateBatch, SearchSourceResult } from './searchCandidateTypes';

type BehaviorRecommendation = 'promote' | 'increase' | 'keep' | 'reduce' | 'disable' | 'needs_more_data';

interface DeliveryBatch {
  deliveryCandidates: DeliveryLeadCandidate[];
}

interface BehaviorQueryPerformanceRow {
  query: string;
  clientId: string;
  source: string;
  candidateCount: number;
  leadLikeCount: number;
  deliveryCount: number;
  verificationCount: number;
  verifiedCount: number;
  wonCount: number;
  conversionScore: number;
  recommendation: BehaviorRecommendation;
}

const searchPath = path.join(process.cwd(), 'output', 'lead-discovery', 'search-candidates', 'search-candidates.json');
const deliveryPath = path.join(process.cwd(), 'output', 'lead-discovery', 'delivery-candidates', 'delivery-candidates.json');
const outcomesPath = path.join(process.cwd(), 'data', 'lead-discovery', 'outcomes', 'sample-outcomes.json');
const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'search-quality');
const reportPath = path.join(outputDir, 'behavior-query-performance.md');
const csvPath = path.join(outputDir, 'behavior-query-performance.csv');

export function learnBehaviorQueries(now = new Date()): { filesGenerated: string[]; rows: BehaviorQueryPerformanceRow[] } {
  const generatedAt = now.toISOString();
  const searchBatch = readJsonOrNull<SearchCandidateBatch>(searchPath);
  const delivery = readJsonOrNull<DeliveryBatch>(deliveryPath)?.deliveryCandidates ?? [];
  const outcomes = (readJsonOrNull<LeadOutcomeRecord[]>(outcomesPath) ?? []).filter((outcome) => !outcome.isSample);
  const rows = buildRows(searchBatch?.sourceResults ?? [], searchBatch?.candidates ?? [], delivery, outcomes);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(reportPath, renderReport(generatedAt, rows), 'utf8');
  fs.writeFileSync(csvPath, renderCsv(rows), 'utf8');

  return {
    filesGenerated: [reportPath, csvPath].map((file) => path.relative(process.cwd(), file)),
    rows,
  };
}

function buildRows(
  sourceResults: SearchSourceResult[],
  candidates: SearchCandidate[],
  delivery: DeliveryLeadCandidate[],
  outcomes: LeadOutcomeRecord[],
): BehaviorQueryPerformanceRow[] {
  const behaviorResults = sourceResults.filter((result) => result.queryTemplateType === 'behavior');
  const groups = new Map<string, SearchSourceResult[]>();
  for (const result of behaviorResults) {
    const key = `${result.clientId}|${result.sourceId ?? result.sourceCategory ?? 'behavior'}|${result.query}`;
    groups.set(key, [...(groups.get(key) ?? []), result]);
  }

  return [...groups.values()].map((results) => {
    const first = results[0];
    const resultCandidates = candidates.filter((candidate) => candidate.clientId === first.clientId && candidate.query === first.query);
    const deliveryForQuery = delivery.filter((candidate) => candidate.clientId === first.clientId && candidate.query === first.query && !candidate.excluded);
    const outcomesForClient = outcomes.filter((outcome) => outcome.clientId === first.clientId);
    const leadLikeCount = resultCandidates.filter((candidate) => candidate.leadLikeClassification === 'lead_like' || candidate.leadLikeClassification === 'possibly_lead_like').length;
    const verifiedCount = outcomesForClient.filter((outcome) => outcome.outcomeStatus === 'interest_verified').length;
    const wonCount = outcomesForClient.filter((outcome) => outcome.outcomeStatus === 'won').length;
    const verificationCount = deliveryForQuery.filter((candidate) => candidate.deliveryQueue === 'interest_verification').length;
    const conversionScore = scoreFor({
      candidateCount: resultCandidates.length,
      leadLikeCount,
      deliveryCount: deliveryForQuery.length,
      verificationCount,
      verifiedCount,
      wonCount,
    });
    return {
      query: first.query,
      clientId: first.clientId,
      source: first.sourceId ?? first.sourceCategory ?? 'behavior_search',
      candidateCount: resultCandidates.length,
      leadLikeCount,
      deliveryCount: deliveryForQuery.length,
      verificationCount,
      verifiedCount,
      wonCount,
      conversionScore,
      recommendation: recommendationFor(resultCandidates.length, leadLikeCount, deliveryForQuery.length, verificationCount, verifiedCount, wonCount, conversionScore),
    };
  }).sort((left, right) => {
    if (left.clientId === 'flora_and_fauna_foods_001' && right.clientId !== 'flora_and_fauna_foods_001') return -1;
    if (right.clientId === 'flora_and_fauna_foods_001' && left.clientId !== 'flora_and_fauna_foods_001') return 1;
    return right.conversionScore - left.conversionScore || left.query.localeCompare(right.query);
  });
}

function scoreFor(input: {
  candidateCount: number;
  leadLikeCount: number;
  deliveryCount: number;
  verificationCount: number;
  verifiedCount: number;
  wonCount: number;
}): number {
  const score = input.leadLikeCount * 2
    + input.deliveryCount * 4
    + input.verificationCount * 6
    + input.verifiedCount * 10
    + input.wonCount * 20
    - (input.candidateCount >= 10 && input.leadLikeCount === 0 ? 4 : 0);
  return Math.max(0, Math.round(score * 10) / 10);
}

function recommendationFor(
  candidateCount: number,
  leadLikeCount: number,
  deliveryCount: number,
  verificationCount: number,
  verifiedCount: number,
  wonCount: number,
  conversionScore: number,
): BehaviorRecommendation {
  if (wonCount > 0 || verifiedCount > 0 || verificationCount > 0) return 'promote';
  if (deliveryCount > 0 || conversionScore >= 8) return 'increase';
  if (leadLikeCount > 0) return 'keep';
  if (candidateCount >= 5) return 'reduce';
  if (candidateCount === 0) return 'disable';
  return 'needs_more_data';
}

function renderReport(generatedAt: string, rows: BehaviorQueryPerformanceRow[]): string {
  return `# Behavior Query Performance

Generated: ${generatedAt}

## Totals

- Behavior query rows: ${rows.length}
- Promoted queries: ${rows.filter((row) => row.recommendation === 'promote').length}
- Increased queries: ${rows.filter((row) => row.recommendation === 'increase').length}
- Reduced queries: ${rows.filter((row) => row.recommendation === 'reduce').length}
- Disabled queries: ${rows.filter((row) => row.recommendation === 'disable').length}
- Lead-like candidates: ${rows.reduce((sum, row) => sum + row.leadLikeCount, 0)}
- Delivery candidates: ${rows.reduce((sum, row) => sum + row.deliveryCount, 0)}
- Verification candidates: ${rows.reduce((sum, row) => sum + row.verificationCount, 0)}

## Rows

${rows.map((row, index) => `${index + 1}. ${row.recommendation.toUpperCase()} | ${row.clientId} | ${row.source}
   - Query: \`${row.query}\`
   - Candidates: ${row.candidateCount}; lead-like: ${row.leadLikeCount}; delivery: ${row.deliveryCount}; verification: ${row.verificationCount}; verified: ${row.verifiedCount}; won: ${row.wonCount}; score: ${row.conversionScore}`).join('\n') || '- No behavior query performance rows.'}

No automatic deletion was performed. Human review is required before changing live query allocation.
`;
}

function renderCsv(rows: BehaviorQueryPerformanceRow[]): string {
  const headers: Array<keyof BehaviorQueryPerformanceRow> = ['query', 'clientId', 'source', 'candidateCount', 'leadLikeCount', 'deliveryCount', 'verificationCount', 'verifiedCount', 'wonCount', 'conversionScore', 'recommendation'];
  return `${headers.map(csvCell).join(',')}\n${rows.map((row) => headers.map((header) => csvCell(String(row[header]))).join(',')).join('\n')}\n`;
}

function readJsonOrNull<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function main(): void {
  try {
    const result = learnBehaviorQueries();
    console.log(`Behavior query performance generated: ${result.filesGenerated.join(', ')}`);
    console.log(`Behavior query rows: ${result.rows.length}`);
    console.log('Learning report only. No ML, deletion, scraping, contact extraction, or outreach was performed.');
  } catch (error) {
    console.error('Behavior Query Learning: FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) main();
