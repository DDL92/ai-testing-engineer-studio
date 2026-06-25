import fs = require('fs');
import path = require('path');
import { DeliveryLeadCandidate } from './deliveryLeadTypes';
import { SearchCandidate, SearchCandidateBatch, SearchSourceResult } from './searchCandidateTypes';

type QueryLearningRecommendation = 'promote' | 'keep' | 'reduce' | 'disable';

interface DeliveryBatch {
  deliveryCandidates: DeliveryLeadCandidate[];
}

interface QueryLearningRow {
  clientId: string;
  query: string;
  queryTemplateType: string;
  candidateCount: number;
  leadLikeCount: number;
  possibleCount: number;
  deliveryCount: number;
  verificationCount: number;
  buyerServiceCount: number;
  directoryCount: number;
  vendorCount: number;
  articleLikeCount: number;
  staffingRecruitmentCount: number;
  emptyResponseCount: number;
  estimatedValue: number;
  performanceScore: number;
  recommendation: QueryLearningRecommendation;
}

const searchPath = path.join(process.cwd(), 'output', 'lead-discovery', 'search-candidates', 'search-candidates.json');
const deliveryPath = path.join(process.cwd(), 'output', 'lead-discovery', 'delivery-candidates', 'delivery-candidates.json');
const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'query-learning');
const markdownPath = path.join(outputDir, 'query-learning.md');
const csvPath = path.join(outputDir, 'query-learning.csv');

export function updateQueryLearning(now = new Date()): { filesGenerated: string[]; rows: QueryLearningRow[] } {
  const generatedAt = now.toISOString();
  const searchBatch = readJsonOrNull<SearchCandidateBatch>(searchPath);
  const delivery = readJsonOrNull<DeliveryBatch>(deliveryPath)?.deliveryCandidates ?? [];
  const rows = buildRows(searchBatch?.sourceResults ?? [], searchBatch?.candidates ?? [], delivery);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(markdownPath, renderMarkdown(generatedAt, rows), 'utf8');
  fs.writeFileSync(csvPath, renderCsv(rows), 'utf8');
  return { filesGenerated: [markdownPath, csvPath].map((file) => path.relative(process.cwd(), file)), rows };
}

function buildRows(sourceResults: SearchSourceResult[], candidates: SearchCandidate[], delivery: DeliveryLeadCandidate[]): QueryLearningRow[] {
  const queries = new Map<string, { sourceResults: SearchSourceResult[]; candidates: SearchCandidate[] }>();
  for (const result of sourceResults) {
    const key = `${result.clientId}|${result.query}`;
    const row = queries.get(key) ?? { sourceResults: [], candidates: [] };
    row.sourceResults.push(result);
    queries.set(key, row);
  }
  for (const candidate of candidates) {
    const key = `${candidate.clientId}|${candidate.query}`;
    const row = queries.get(key) ?? { sourceResults: [], candidates: [] };
    row.candidates.push(candidate);
    queries.set(key, row);
  }

  return [...queries.values()].map((group) => {
    const firstResult = group.sourceResults[0];
    const firstCandidate = group.candidates[0];
    const clientId = firstResult?.clientId ?? firstCandidate?.clientId ?? 'unknown';
    const query = firstResult?.query ?? firstCandidate?.query ?? 'unknown';
    const queryTemplateType = firstResult?.queryTemplateType ?? firstCandidate?.queryTemplateType ?? 'unknown';
    const candidateCount = group.candidates.length;
    const leadLikeCount = group.candidates.filter((candidate) => candidate.leadLikeClassification === 'lead_like').length;
    const possibleCount = group.candidates.filter((candidate) => candidate.leadLikeClassification === 'possibly_lead_like').length;
    const allDeliveryForQuery = delivery.filter((candidate) => candidate.clientId === clientId && candidate.query === query);
    const deliveryForQuery = allDeliveryForQuery.filter((candidate) => !candidate.excluded);
    const verificationCount = deliveryForQuery.filter((candidate) => candidate.deliveryQueue === 'interest_verification').length;
    const buyerServiceCount = allDeliveryForQuery.filter((candidate) => candidate.buyerRole === 'buyer_service' && !candidate.excluded).length;
    const directoryCount = allDeliveryForQuery.filter((candidate) => candidate.resultRelevance === 'directory' || candidate.buyerRole === 'directory').length;
    const vendorCount = allDeliveryForQuery.filter((candidate) => candidate.resultRelevance === 'vendor' || candidate.buyerRole === 'vendor').length;
    const articleLikeCount = allDeliveryForQuery.filter((candidate) => ['definition_page', 'reference_page'].includes(candidate.resultRelevance)).length;
    const staffingRecruitmentCount = allDeliveryForQuery.filter((candidate) => candidate.buyerRole === 'staffing_recruitment').length;
    const emptyResponseCount = group.sourceResults.filter((result) => result.candidateCount === 0 || result.error === 'provider returned zero results').length;
    const estimatedValue = estimateValue(group.candidates, deliveryForQuery);
    const performanceScore = scoreFor({
      candidateCount,
      leadLikeCount,
      possibleCount,
      deliveryCount: deliveryForQuery.length,
      verificationCount,
      buyerServiceCount,
      directoryCount,
      vendorCount,
      articleLikeCount,
      staffingRecruitmentCount,
      emptyResponseCount,
      estimatedValue,
    });
    return {
      clientId,
      query,
      queryTemplateType,
      candidateCount,
      leadLikeCount,
      possibleCount,
      deliveryCount: deliveryForQuery.length,
      verificationCount,
      buyerServiceCount,
      directoryCount,
      vendorCount,
      articleLikeCount,
      staffingRecruitmentCount,
      emptyResponseCount,
      estimatedValue,
      performanceScore,
      recommendation: recommendationFor({
        candidateCount,
        leadLikeCount,
        possibleCount,
        deliveryCount: deliveryForQuery.length,
        verificationCount,
        buyerServiceCount,
        directoryCount,
        vendorCount,
        articleLikeCount,
        staffingRecruitmentCount,
        emptyResponseCount,
        performanceScore,
      }),
    };
  }).sort((left, right) => {
    if (left.clientId === 'flora_and_fauna_foods_001' && right.clientId !== 'flora_and_fauna_foods_001') return -1;
    if (right.clientId === 'flora_and_fauna_foods_001' && left.clientId !== 'flora_and_fauna_foods_001') return 1;
    return right.performanceScore - left.performanceScore || left.query.localeCompare(right.query);
  });
}

function scoreFor(input: {
  candidateCount: number;
  leadLikeCount: number;
  possibleCount: number;
  deliveryCount: number;
  verificationCount: number;
  buyerServiceCount: number;
  directoryCount: number;
  vendorCount: number;
  articleLikeCount: number;
  staffingRecruitmentCount: number;
  emptyResponseCount: number;
  estimatedValue: number;
}): number {
  const score = input.leadLikeCount * 8
    + input.possibleCount * 4
    + input.deliveryCount * 10
    + input.verificationCount * 18
    + input.buyerServiceCount * 6
    + Math.min(20, input.estimatedValue / 250)
    - input.directoryCount * 4
    - input.vendorCount * 4
    - input.articleLikeCount * 3
    - input.staffingRecruitmentCount * 8
    - input.emptyResponseCount * 4
    - (input.candidateCount >= 8 && input.leadLikeCount + input.possibleCount === 0 ? 8 : 0);
  return Math.max(0, Math.round(score * 10) / 10);
}

function recommendationFor(input: {
  candidateCount: number;
  leadLikeCount: number;
  possibleCount: number;
  deliveryCount: number;
  verificationCount: number;
  buyerServiceCount: number;
  directoryCount: number;
  vendorCount: number;
  articleLikeCount: number;
  staffingRecruitmentCount: number;
  emptyResponseCount: number;
  performanceScore: number;
}): QueryLearningRecommendation {
  if (input.verificationCount > 0 || input.deliveryCount >= 2 || input.buyerServiceCount >= 2 || input.leadLikeCount >= 2 || input.performanceScore >= 18) return 'promote';
  if (input.leadLikeCount + input.possibleCount > 0) return 'keep';
  if (input.staffingRecruitmentCount > 0 || input.directoryCount + input.vendorCount + input.articleLikeCount >= 3) return 'reduce';
  if (input.candidateCount >= 5) return 'reduce';
  if (input.emptyResponseCount >= 2) return 'disable';
  return 'disable';
}

function estimateValue(candidates: SearchCandidate[], delivery: DeliveryLeadCandidate[]): number {
  const strongSignals = candidates.filter((candidate) => candidate.buyerSignalStrength === 'strong').length;
  const mediumSignals = candidates.filter((candidate) => candidate.buyerSignalStrength === 'medium').length;
  return strongSignals * 750 + mediumSignals * 350 + delivery.length * 1000;
}

function renderMarkdown(generatedAt: string, rows: QueryLearningRow[]): string {
  return `# Query Learning

Generated: ${generatedAt}

- Query rows: ${rows.length}
- Promoted queries: ${rows.filter((row) => row.recommendation === 'promote').length}
- Kept queries: ${rows.filter((row) => row.recommendation === 'keep').length}
- Reduced queries: ${rows.filter((row) => row.recommendation === 'reduce').length}
- Disabled queries: ${rows.filter((row) => row.recommendation === 'disable').length}

## Rows

${rows.map((row, index) => `${index + 1}. ${row.recommendation.toUpperCase()} | ${row.clientId} | ${row.queryTemplateType}
   - Query: \`${row.query}\`
   - Candidates: ${row.candidateCount}; lead-like: ${row.leadLikeCount}; possible: ${row.possibleCount}; buyer service: ${row.buyerServiceCount}; delivery: ${row.deliveryCount}; verification: ${row.verificationCount}; empty: ${row.emptyResponseCount}; directories: ${row.directoryCount}; vendors: ${row.vendorCount}; articles: ${row.articleLikeCount}; staffing: ${row.staffingRecruitmentCount}; estimated value: $${row.estimatedValue}; score: ${row.performanceScore}`).join('\n') || '- No query learning rows.'}

No automatic query deletion or outreach was performed. Human review is required before changing query allocation.
`;
}

function renderCsv(rows: QueryLearningRow[]): string {
  const headers: Array<keyof QueryLearningRow> = ['clientId', 'queryTemplateType', 'query', 'candidateCount', 'leadLikeCount', 'possibleCount', 'buyerServiceCount', 'deliveryCount', 'verificationCount', 'emptyResponseCount', 'directoryCount', 'vendorCount', 'articleLikeCount', 'staffingRecruitmentCount', 'estimatedValue', 'performanceScore', 'recommendation'];
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
    const result = updateQueryLearning();
    console.log(`Query learning generated: ${result.filesGenerated.join(', ')}`);
    console.log(`Query learning rows: ${result.rows.length}`);
    console.log('Learning only. No query deletion, scraping, contact extraction, or outreach was performed.');
  } catch (error) {
    console.error('Query Learning: FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) main();
