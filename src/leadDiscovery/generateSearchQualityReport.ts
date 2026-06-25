import fs = require('fs');
import path = require('path');
import { classifyLeadLikeCandidate } from './classifyLeadLikeCandidate';
import { LeadLikeClassification } from './leadLikeTypes';
import { SearchCandidate, SearchCandidateBatch } from './searchCandidateTypes';

type QueryRecommendation = 'increase' | 'keep' | 'reduce' | 'disable';

interface QueryQualityRow {
  clientId: string;
  query: string;
  queryTemplateId: string;
  sourceId: string;
  sourceCategory: string;
  candidatesGenerated: number;
  leadLikeCandidates: number;
  possiblyLeadLikeCandidates: number;
  leadLikePercentage: number;
  genericContent: number;
  articles: number;
  directories: number;
  definitions: number;
  landingPages: number;
  unknown: number;
  recommendation: QueryRecommendation;
}

const searchCandidatesPath = path.join(process.cwd(), 'output', 'lead-discovery', 'search-candidates', 'search-candidates.json');
const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'search-quality');
const summaryPath = path.join(outputDir, 'search-quality-summary.md');
const csvPath = path.join(outputDir, 'search-quality.csv');
const queryQualityPath = path.join(outputDir, 'query-quality.md');
const queryQualityCsvPath = path.join(outputDir, 'query-quality.csv');
const previewPath = path.join(outputDir, 'search-candidate-preview.md');
const sourcePerformancePreviewPath = path.join(outputDir, 'source-performance-preview.md');

export function generateSearchQualityReport(now = new Date()): { filesGenerated: string[]; rows: QueryQualityRow[] } {
  const generatedAt = now.toISOString();
  const searchBatch = readSearchCandidates();
  const candidates = searchBatch.candidates.map(ensureLeadLikeClassification);
  const rows = buildQueryRows(candidates);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(summaryPath, renderSummary(candidates, rows, generatedAt), 'utf8');
  fs.writeFileSync(csvPath, renderCandidateCsv(candidates), 'utf8');
  fs.writeFileSync(queryQualityPath, renderQueryQuality(rows, generatedAt), 'utf8');
  fs.writeFileSync(queryQualityCsvPath, renderQueryCsv(rows), 'utf8');
  fs.writeFileSync(previewPath, renderCandidatePreview(candidates, generatedAt), 'utf8');
  fs.writeFileSync(sourcePerformancePreviewPath, renderSourcePerformancePreview(searchBatch, candidates, generatedAt), 'utf8');

  return {
    filesGenerated: [summaryPath, csvPath, queryQualityPath, queryQualityCsvPath, previewPath, sourcePerformancePreviewPath].map((file) => path.relative(process.cwd(), file)),
    rows,
  };
}

function readSearchCandidates(): SearchCandidateBatch {
  if (!fs.existsSync(searchCandidatesPath)) {
    throw new Error(`Search candidates not found: ${path.relative(process.cwd(), searchCandidatesPath)}. Run npm run leads:search first.`);
  }
  return JSON.parse(fs.readFileSync(searchCandidatesPath, 'utf8')) as SearchCandidateBatch;
}

function ensureLeadLikeClassification(candidate: SearchCandidate): SearchCandidate {
  if (candidate.leadLikeClassification) return candidate;
  return {
    ...candidate,
    ...classifyLeadLikeCandidate({
      sourceUrl: candidate.url,
      sourceName: candidate.sourceName,
      sourceCategory: candidate.sourceCategory,
      title: candidate.title,
      snippet: candidate.snippet,
      query: candidate.query,
    }),
  };
}

function buildQueryRows(candidates: SearchCandidate[]): QueryQualityRow[] {
  const groups = new Map<string, SearchCandidate[]>();
  for (const candidate of candidates) {
    const key = `${candidate.clientId}|${candidate.query}`;
    groups.set(key, [...(groups.get(key) ?? []), candidate]);
  }
  return [...groups.values()]
    .map((items) => {
      const first = items[0];
      const leadLikeCandidates = countClass(items, 'lead_like');
      const possiblyLeadLikeCandidates = countClass(items, 'possibly_lead_like');
      const totalLeadLike = leadLikeCandidates + possiblyLeadLikeCandidates;
      const leadLikePercentage = items.length === 0 ? 0 : Math.round((totalLeadLike / items.length) * 1000) / 10;
      return {
        clientId: first.clientId,
        query: first.query,
        queryTemplateId: first.queryTemplateId ?? 'no_template',
        sourceId: first.sourceId ?? 'no_source_id',
        sourceCategory: first.sourceCategory,
        candidatesGenerated: items.length,
        leadLikeCandidates,
        possiblyLeadLikeCandidates,
        leadLikePercentage,
        genericContent: countClass(items, 'generic_content'),
        articles: countClass(items, 'article'),
        directories: countClass(items, 'directory'),
        definitions: countClass(items, 'definition'),
        landingPages: countClass(items, 'landing_page'),
        unknown: countClass(items, 'unknown'),
        recommendation: recommendationFor(items.length, totalLeadLike, leadLikePercentage),
      };
    })
    .sort((left, right) => {
      if (left.clientId === 'flora_and_fauna_foods_001' && right.clientId !== 'flora_and_fauna_foods_001') return -1;
      if (right.clientId === 'flora_and_fauna_foods_001' && left.clientId !== 'flora_and_fauna_foods_001') return 1;
      return right.leadLikePercentage - left.leadLikePercentage || right.leadLikeCandidates - left.leadLikeCandidates || left.query.localeCompare(right.query);
    });
}

function recommendationFor(candidatesGenerated: number, leadLikeTotal: number, leadLikePercentage: number): QueryRecommendation {
  if (leadLikeTotal === 0) return 'disable';
  if (leadLikePercentage >= 45 && leadLikeTotal >= 3) return 'increase';
  if (leadLikePercentage >= 20) return 'keep';
  if (candidatesGenerated >= 5) return 'reduce';
  return 'disable';
}

function renderSummary(candidates: SearchCandidate[], rows: QueryQualityRow[], generatedAt: string): string {
  const total = candidates.length;
  const leadLikeTotal = countClass(candidates, 'lead_like') + countClass(candidates, 'possibly_lead_like');
  return `# Search Quality Summary

Generated: ${generatedAt}

## Totals

- Total search candidates: ${total}
- Lead-like: ${countClass(candidates, 'lead_like')}
- Possibly lead-like: ${countClass(candidates, 'possibly_lead_like')}
- Generic content: ${countClass(candidates, 'generic_content')}
- Articles: ${countClass(candidates, 'article')}
- Directories: ${countClass(candidates, 'directory')}
- Definitions: ${countClass(candidates, 'definition')}
- Landing pages: ${countClass(candidates, 'landing_page')}
- Unknown: ${countClass(candidates, 'unknown')}
- Lead-like percentage: ${total === 0 ? '0.0' : ((leadLikeTotal / total) * 100).toFixed(1)}%

## Classification Distribution

${renderDistribution(candidates.map((candidate) => candidate.leadLikeClassification))}

## Query Recommendations

${renderDistribution(rows.map((row) => row.recommendation))}

## Top Lead-Like Queries

${rows.filter((row) => row.leadLikeCandidates + row.possiblyLeadLikeCandidates > 0).slice(0, 12).map(renderQueryRow).join('\n') || '- None.'}

## Top Failing Queries

${rows.filter((row) => row.recommendation === 'disable').slice(0, 12).map(renderQueryRow).join('\n') || '- None.'}

Search quality mode is local and auditable. No scraping, browser automation, contact extraction, outreach, emails, calls, DMs, or login flows were performed.
`;
}

function renderQueryQuality(rows: QueryQualityRow[], generatedAt: string): string {
  return `# Query Quality

Generated: ${generatedAt}

## Per Query

${rows.map(renderQueryRow).join('\n') || '- No query quality rows.'}
`;
}

function renderQueryRow(row: QueryQualityRow): string {
  return `- ${row.recommendation.toUpperCase()} | ${row.clientId} | ${row.sourceId}
  - Query: \`${row.query}\`
  - Candidates: ${row.candidatesGenerated}; lead-like: ${row.leadLikeCandidates}; possible: ${row.possiblyLeadLikeCandidates}; lead-like percentage: ${row.leadLikePercentage.toFixed(1)}%
  - Generic: ${row.genericContent}; articles: ${row.articles}; directories: ${row.directories}; definitions: ${row.definitions}; landing pages: ${row.landingPages}; unknown: ${row.unknown}`;
}

function renderCandidatePreview(candidates: SearchCandidate[], generatedAt: string): string {
  const leadLike = candidates
    .filter((candidate) => ['lead_like', 'possibly_lead_like'].includes(candidate.leadLikeClassification))
    .sort((left, right) => right.leadLikeScore - left.leadLikeScore || left.title.localeCompare(right.title));
  const generic = candidates
    .filter((candidate) => !['lead_like', 'possibly_lead_like'].includes(candidate.leadLikeClassification))
    .sort((left, right) => right.leadLikeScore - left.leadLikeScore || left.title.localeCompare(right.title));
  return `# Search Candidate Preview

Generated: ${generatedAt}

## Top Lead-Like Candidates

${leadLike.slice(0, 25).map(renderCandidateRow).join('\n') || '- None.'}

## Top Generic Candidates

${generic.slice(0, 25).map(renderCandidateRow).join('\n') || '- None.'}

## Top Blocked Candidates

${generic.filter((candidate) => ['directory', 'definition', 'article', 'landing_page'].includes(candidate.leadLikeClassification)).slice(0, 25).map(renderCandidateRow).join('\n') || '- None.'}
`;
}

function renderSourcePerformancePreview(searchBatch: SearchCandidateBatch, candidates: SearchCandidate[], generatedAt: string): string {
  return `# Source Performance Preview

Generated: ${generatedAt}

## Source ID Distribution

${renderDistribution(searchBatch.sourceResults.map((result) => result.sourceId ?? 'no_source_id'))}

## Source Category Distribution

${renderDistribution(searchBatch.sourceResults.map((result) => result.sourceCategory ?? 'unknown'))}

## Source Query Distribution

${renderDistribution(searchBatch.sourceResults.map((result) => result.queryTemplateType ?? 'standard'))}

## Expected Quality Distribution

${renderDistribution(searchBatch.sourceResults.map((result) => result.expectedLeadQuality ?? 'unknown'))}

## Source Rows

${sourceRows(searchBatch, candidates).map((row, index) => `${index + 1}. ${row.sourceId}
   - Category: ${row.sourceCategory}; expected quality: ${row.expectedLeadQuality}; query type: ${row.queryTemplateType}
   - Queries: ${row.queries}; candidates: ${row.candidates}; lead-like: ${row.leadLike}; possible: ${row.possibleLeadLike}; recommendation: ${row.recommendation}`).join('\n') || '- No source rows.'}
`;
}

function renderCandidateRow(candidate: SearchCandidate, index: number): string {
  return `${index + 1}. [${cell(candidate.title)}](${candidate.url})
   - Classification: ${candidate.leadLikeClassification}; score: ${candidate.leadLikeScore}; confidence: ${candidate.leadLikeConfidence}
   - Client: ${candidate.clientId}; source: ${candidate.sourceId ?? candidate.sourceName}; query: \`${candidate.query}\`
   - Signals: ${candidate.leadLikeSignals.join(', ') || 'none'}
   - Reasons: ${candidate.leadLikeReasons.map(cell).join(' ')}`;
}

function sourceRows(searchBatch: SearchCandidateBatch, candidates: SearchCandidate[]): Array<{
  sourceId: string;
  sourceCategory: string;
  expectedLeadQuality: string;
  queryTemplateType: string;
  queries: number;
  candidates: number;
  leadLike: number;
  possibleLeadLike: number;
  recommendation: QueryRecommendation;
}> {
  const groups = searchBatch.sourceResults.reduce<Record<string, { results: typeof searchBatch.sourceResults; candidates: SearchCandidate[] }>>((acc, result) => {
    const sourceId = result.sourceId ?? 'no_source_id';
    const key = `${sourceId}|${result.sourceCategory ?? 'unknown'}|${result.expectedLeadQuality ?? 'unknown'}|${result.queryTemplateType ?? 'standard'}`;
    acc[key] = acc[key] ?? { results: [], candidates: [] };
    acc[key].results.push(result);
    acc[key].candidates.push(...candidates.filter((candidate) => candidate.clientId === result.clientId && candidate.query === result.query));
    return acc;
  }, {});
  return Object.entries(groups)
    .map(([key, group]) => {
      const [sourceId, sourceCategory, expectedLeadQuality, queryTemplateType] = key.split('|');
      const items = group.candidates;
      const leadLike = countClass(items, 'lead_like');
      const possibleLeadLike = countClass(items, 'possibly_lead_like');
      const leadLikeTotal = leadLike + possibleLeadLike;
      const leadLikePercentage = items.length === 0 ? 0 : Math.round((leadLikeTotal / items.length) * 1000) / 10;
      return {
        sourceId,
        sourceCategory,
        expectedLeadQuality,
        queryTemplateType,
        queries: group.results.length,
        candidates: items.length,
        leadLike,
        possibleLeadLike,
        recommendation: recommendationFor(items.length, leadLikeTotal, leadLikePercentage),
      };
    })
    .sort((left, right) => right.leadLike - left.leadLike || right.candidates - left.candidates || left.sourceId.localeCompare(right.sourceId));
}

function renderCandidateCsv(candidates: SearchCandidate[]): string {
  const headers = ['client_id', 'source_id', 'source_category', 'query_template_id', 'query', 'url', 'title', 'lead_like_classification', 'lead_like_score', 'lead_like_confidence', 'lead_like_signals', 'lead_like_reasons'];
  const body = candidates.map((candidate) => [
    candidate.clientId,
    candidate.sourceId ?? '',
    candidate.sourceCategory,
    candidate.queryTemplateId ?? '',
    candidate.query,
    candidate.url,
    candidate.title,
    candidate.leadLikeClassification,
    String(candidate.leadLikeScore),
    String(candidate.leadLikeConfidence),
    candidate.leadLikeSignals.join('; '),
    candidate.leadLikeReasons.join(' '),
  ]);
  return `${headers.map(csvCell).join(',')}\n${body.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function renderQueryCsv(rows: QueryQualityRow[]): string {
  const headers: Array<keyof QueryQualityRow> = ['clientId', 'query', 'queryTemplateId', 'sourceId', 'sourceCategory', 'candidatesGenerated', 'leadLikeCandidates', 'possiblyLeadLikeCandidates', 'leadLikePercentage', 'genericContent', 'articles', 'directories', 'definitions', 'landingPages', 'unknown', 'recommendation'];
  return `${headers.map(csvCell).join(',')}\n${rows.map((row) => headers.map((header) => csvCell(String(row[header]))).join(',')).join('\n')}\n`;
}

function countClass(candidates: SearchCandidate[], classification: LeadLikeClassification): number {
  return candidates.filter((candidate) => candidate.leadLikeClassification === classification).length;
}

function renderDistribution(values: string[]): string {
  const rows = Object.entries(values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {})).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  return rows.map(([value, count]) => `- ${value}: ${count}`).join('\n') || '- None.';
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function cell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

function main(): void {
  try {
    const result = generateSearchQualityReport();
    console.log(`Search quality generated: ${result.filesGenerated.join(', ')}`);
    console.log(`Query quality rows: ${result.rows.length}`);
    console.log('Search quality mode only. No scraping, browser automation, contact extraction, outreach, emails, calls, DMs, or login flows were performed.');
  } catch (error) {
    console.error('Search Quality Mode: FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) main();
