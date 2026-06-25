import fs = require('fs');
import path = require('path');
import {
  ProviderHealthStatus,
  QueryExecutionDiagnostic,
  SearchDiagnosticsBatch,
  SearchFailureCategory,
} from './searchDiagnosticsTypes';

interface ProviderHealthRow {
  provider: string;
  totalQueries: number;
  queriesSent: number;
  queriesBlocked: number;
  successfulQueries: number;
  failedQueries: number;
  successRate: number;
  failureRate: number;
  emptyResponses: number;
  rateLimits: number;
  timeouts: number;
  parserFailures: number;
  averageDurationMs: number;
  status: ProviderHealthStatus;
}

const diagnosticsPath = path.join(process.cwd(), 'output', 'lead-discovery', 'diagnostics', 'search-execution-diagnostics.json');
const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'diagnostics');
const providerHealthMdPath = path.join(outputDir, 'provider-health.md');
const providerHealthCsvPath = path.join(outputDir, 'provider-health.csv');
const queryFailuresMdPath = path.join(outputDir, 'query-failures.md');
const queryFailuresCsvPath = path.join(outputDir, 'query-failures.csv');
const executionSummaryPath = path.join(outputDir, 'search-execution-summary.md');
const recommendationsPath = path.join(outputDir, 'recommendations.md');

export function generateProviderHealthReport(now = new Date()): { filesGenerated: string[]; rows: ProviderHealthRow[] } {
  const generatedAt = now.toISOString();
  const diagnostics = readDiagnostics();
  const rows = buildProviderRows(diagnostics);
  const failures = diagnostics.filter((diagnostic) => !diagnostic.success);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(providerHealthMdPath, renderProviderHealth(generatedAt, rows), 'utf8');
  fs.writeFileSync(providerHealthCsvPath, renderProviderCsv(rows), 'utf8');
  fs.writeFileSync(queryFailuresMdPath, renderQueryFailures(generatedAt, failures), 'utf8');
  fs.writeFileSync(queryFailuresCsvPath, renderFailureCsv(failures), 'utf8');
  fs.writeFileSync(executionSummaryPath, renderExecutionSummary(generatedAt, diagnostics), 'utf8');
  fs.writeFileSync(recommendationsPath, renderRecommendations(generatedAt, rows, diagnostics), 'utf8');

  return {
    filesGenerated: [providerHealthMdPath, providerHealthCsvPath, queryFailuresMdPath, queryFailuresCsvPath, executionSummaryPath, recommendationsPath]
      .map((file) => path.relative(process.cwd(), file)),
    rows,
  };
}

function readDiagnostics(): QueryExecutionDiagnostic[] {
  if (!fs.existsSync(diagnosticsPath)) return [];
  const batch = JSON.parse(fs.readFileSync(diagnosticsPath, 'utf8')) as SearchDiagnosticsBatch;
  return batch.diagnostics ?? [];
}

function buildProviderRows(diagnostics: QueryExecutionDiagnostic[]): ProviderHealthRow[] {
  const groups = new Map<string, QueryExecutionDiagnostic[]>();
  for (const diagnostic of diagnostics) {
    groups.set(diagnostic.providerUsed, [...(groups.get(diagnostic.providerUsed) ?? []), diagnostic]);
  }
  return [...groups.entries()]
    .map(([provider, rows]) => {
      const totalQueries = rows.length;
      const queriesSent = rows.filter((row) => row.wasSentToProvider).length;
      const queriesBlocked = rows.filter((row) => row.blockedByGuardrails).length;
      const successfulQueries = rows.filter((row) => row.success).length;
      const failedQueries = totalQueries - successfulQueries;
      const sentRows = rows.filter((row) => row.wasSentToProvider);
      const row: ProviderHealthRow = {
        provider,
        totalQueries,
        queriesSent,
        queriesBlocked,
        successfulQueries,
        failedQueries,
        successRate: percentage(successfulQueries, totalQueries),
        failureRate: percentage(failedQueries, totalQueries),
        emptyResponses: rows.filter((item) => item.response.emptyResponse || item.failureReason === 'provider_empty').length,
        rateLimits: rows.filter((item) => item.response.rateLimited || item.failureReason === 'rate_limit').length,
        timeouts: rows.filter((item) => item.response.timeout || item.failureReason === 'timeout').length,
        parserFailures: rows.filter((item) => item.response.parserFailure || item.failureReason === 'parser_error').length,
        averageDurationMs: average(sentRows.map((item) => item.durationMs)),
        status: 'unknown',
      };
      row.status = providerStatus(row);
      return row;
    })
    .sort((left, right) => providerRank(left.provider) - providerRank(right.provider) || left.provider.localeCompare(right.provider));
}

function providerStatus(row: ProviderHealthRow): ProviderHealthStatus {
  if (row.totalQueries === 0) return 'unknown';
  if (row.queriesBlocked === row.totalQueries) return 'query_blocked';
  if (row.rateLimits > 0) return 'rate_limited';
  if (row.timeouts > 0 && row.timeouts >= row.failedQueries) return 'timeouts';
  if (row.parserFailures > 0) return 'provider_failure';
  if (row.emptyResponses > 0 && row.emptyResponses >= row.failedQueries) return 'empty_responses';
  if (row.successRate >= 80) return 'healthy';
  if (row.successRate > 0) return 'degraded';
  if (row.failedQueries > 0) return 'provider_failure';
  return 'unknown';
}

function renderProviderHealth(generatedAt: string, rows: ProviderHealthRow[]): string {
  return `# Provider Health

Generated: ${generatedAt}

| Provider | Status | Total queries | Sent | Blocked | Successful | Failed | Success rate | Failure rate | Empty | Rate limits | Timeouts | Parser failures | Avg duration ms |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${rows.map((row) => `| ${row.provider} | ${row.status} | ${row.totalQueries} | ${row.queriesSent} | ${row.queriesBlocked} | ${row.successfulQueries} | ${row.failedQueries} | ${row.successRate.toFixed(1)}% | ${row.failureRate.toFixed(1)}% | ${row.emptyResponses} | ${row.rateLimits} | ${row.timeouts} | ${row.parserFailures} | ${row.averageDurationMs.toFixed(0)} |`).join('\n') || '| none | unknown | 0 | 0 | 0 | 0 | 0 | 0.0% | 0.0% | 0 | 0 | 0 | 0 | 0 |'}

## Tavily Status

- Tavily provider used by lead search: ${rows.some((row) => row.provider === 'tavily') ? 'yes' : 'no'}
- Current lead search provider(s): ${rows.map((row) => row.provider).join(', ') || 'none'}
- Secrets/API keys are not logged in diagnostics.
`;
}

function renderQueryFailures(generatedAt: string, failures: QueryExecutionDiagnostic[]): string {
  return `# Query Failures

Generated: ${generatedAt}

## Summary

- Failed or blocked queries: ${failures.length}
- Failure distribution: ${inlineDistribution(failures.map((failure) => failure.failureReason ?? 'unknown'))}
- Provider distribution: ${inlineDistribution(failures.map((failure) => failure.providerUsed))}

## Rows

${failures.map((failure, index) => `${index + 1}. ${failure.failureReason ?? 'unknown'} | ${failure.clientId} | ${failure.providerUsed}
   - Query: \`${failure.query}\`
   - Source: ${failure.sourceId ?? failure.sourceCategory ?? 'unknown'}
   - Response size: ${failure.response.responseSize}; results: ${failure.response.resultsReturned}; duration: ${failure.durationMs}ms
   - Guardrail blocked: ${failure.blockedByGuardrails ? 'yes' : 'no'}; sent to provider: ${failure.wasSentToProvider ? 'yes' : 'no'}
   - Notes: ${failure.response.notes}`).join('\n') || '- No query failures.'}
`;
}

function renderExecutionSummary(generatedAt: string, diagnostics: QueryExecutionDiagnostic[]): string {
  const sent = diagnostics.filter((diagnostic) => diagnostic.wasSentToProvider);
  const blocked = diagnostics.filter((diagnostic) => diagnostic.blockedByGuardrails);
  const failed = diagnostics.filter((diagnostic) => !diagnostic.success);
  return `# Search Execution Summary

Generated: ${generatedAt}

- Total queries: ${diagnostics.length}
- Queries sent: ${sent.length}
- Queries blocked: ${blocked.length}
- Successful queries: ${diagnostics.filter((diagnostic) => diagnostic.success).length}
- Failed queries: ${failed.length}
- Average duration: ${average(sent.map((diagnostic) => diagnostic.durationMs)).toFixed(0)}ms
- Provider distribution: ${inlineDistribution(diagnostics.map((diagnostic) => diagnostic.providerUsed))}
- Failure distribution: ${inlineDistribution(failed.map((diagnostic) => diagnostic.failureReason ?? 'unknown'))}
- Empty responses: ${diagnostics.filter((diagnostic) => diagnostic.response.emptyResponse || diagnostic.failureReason === 'provider_empty').length}
- Rate limits: ${diagnostics.filter((diagnostic) => diagnostic.response.rateLimited).length}
- Timeouts: ${diagnostics.filter((diagnostic) => diagnostic.response.timeout).length}
- Parser failures: ${diagnostics.filter((diagnostic) => diagnostic.response.parserFailure).length}

No scraping, login, browser automation, contact extraction, or outreach was performed.
`;
}

function renderRecommendations(generatedAt: string, rows: ProviderHealthRow[], diagnostics: QueryExecutionDiagnostic[]): string {
  const recommendations = recommendationRows(rows, diagnostics);
  return `# Search Diagnostics Recommendations

Generated: ${generatedAt}

${recommendations.map((item, index) => `${index + 1}. ${item.action.toUpperCase()}: ${item.reason}`).join('\n') || '1. HEALTHY: No search diagnostics action required.'}

Human review required before changing providers, guardrails, query limits, or delivery behavior.
`;
}

function recommendationRows(rows: ProviderHealthRow[], diagnostics: QueryExecutionDiagnostic[]): Array<{ action: 'investigate' | 'reduce' | 'disable' | 'retry' | 'healthy'; reason: string }> {
  const items: Array<{ action: 'investigate' | 'reduce' | 'disable' | 'retry' | 'healthy'; reason: string }> = [];
  if (!rows.some((row) => row.provider === 'tavily')) {
    items.push({ action: 'investigate', reason: 'Tavily did not run in the lead search path; current provider is fallback public RSS search.' });
  }
  for (const row of rows) {
    if (row.status === 'rate_limited') items.push({ action: 'reduce', reason: `${row.provider} rate limiting observed.` });
    if (row.status === 'timeouts') items.push({ action: 'retry', reason: `${row.provider} timed out; retry with network access or lower query volume.` });
    if (row.status === 'empty_responses') items.push({ action: 'investigate', reason: `${row.provider} returned empty responses for sent queries.` });
    if (row.parserFailures > 0) items.push({ action: 'investigate', reason: `${row.provider} parser failures detected.` });
    if (row.status === 'query_blocked') items.push({ action: 'investigate', reason: `${row.provider} rows were blocked by guardrails before provider execution.` });
    if (row.status === 'healthy') items.push({ action: 'healthy', reason: `${row.provider} is returning usable results.` });
  }
  if (diagnostics.some((diagnostic) => diagnostic.failureReason === 'network_error')) {
    items.push({ action: 'retry', reason: 'Network failures detected; rerun search with confirmed outbound network access.' });
  }
  if (items.length === 0) items.push({ action: 'investigate', reason: 'Diagnostics are inconclusive; run leads:search then leads:health again.' });
  return items;
}

function renderProviderCsv(rows: ProviderHealthRow[]): string {
  const headers: Array<keyof ProviderHealthRow> = ['provider', 'status', 'totalQueries', 'queriesSent', 'queriesBlocked', 'successfulQueries', 'failedQueries', 'successRate', 'failureRate', 'emptyResponses', 'rateLimits', 'timeouts', 'parserFailures', 'averageDurationMs'];
  return `${headers.map(csvCell).join(',')}\n${rows.map((row) => headers.map((header) => csvCell(String(row[header]))).join(',')).join('\n')}\n`;
}

function renderFailureCsv(failures: QueryExecutionDiagnostic[]): string {
  const headers = ['query', 'client', 'source', 'failure_reason', 'provider', 'response_size', 'results_returned', 'duration_ms', 'blocked_by_guardrails', 'was_sent_to_provider', 'notes'];
  const rows = failures.map((failure) => [
    failure.query,
    failure.clientId,
    failure.sourceId ?? failure.sourceCategory ?? 'unknown',
    failure.failureReason ?? 'unknown',
    failure.providerUsed,
    String(failure.response.responseSize),
    String(failure.response.resultsReturned),
    String(failure.durationMs),
    failure.blockedByGuardrails ? 'yes' : 'no',
    failure.wasSentToProvider ? 'yes' : 'no',
    failure.response.notes,
  ]);
  return `${headers.map(csvCell).join(',')}\n${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function average(values: number[]): number {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function percentage(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 1000) / 10;
}

function inlineDistribution(values: string[]): string {
  return Object.entries(values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {}))
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([value, count]) => `${value}:${count}`)
    .join('; ') || 'none';
}

function providerRank(provider: string): number {
  if (provider === 'tavily') return 0;
  if (provider === 'bing_rss') return 1;
  if (provider === 'none') return 2;
  return 3;
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function main(): void {
  try {
    const result = generateProviderHealthReport();
    console.log(`Provider health generated: ${result.filesGenerated.join(', ')}`);
    console.log(`Providers: ${result.rows.map((row) => `${row.provider}:${row.status}`).join(', ') || 'none'}`);
    console.log('Diagnostics only. No scraping, login, contact extraction, outreach, email, DMs, calls, or forms were performed.');
  } catch (error) {
    console.error('Provider Health Report: FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) main();
