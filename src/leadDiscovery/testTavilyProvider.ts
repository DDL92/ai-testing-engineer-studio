import fs = require('fs');
import path = require('path');
import { tavilySearch } from '../integrations/tavily/tavilyClient';
import { readProviderGuardrails, selectSearchProvider } from './providerRouter';

interface ProviderTestRow {
  query: string;
  providerUsed: string;
  durationMs: number;
  resultsReturned: number;
  success: boolean;
  failureReason: string | null;
}

interface ProviderTestReport {
  generatedAt: string;
  queriesExecuted: number;
  resultsReturned: number;
  averageDurationMs: number;
  failures: number;
  providerUsed: string;
  rows: ProviderTestRow[];
}

const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'diagnostics');
const markdownPath = path.join(outputDir, 'provider-test.md');
const jsonPath = path.join(outputDir, 'provider-test.json');
const floraQueries = [
  '"looking for caterer" "New York"',
  '"need catering recommendations" "New Jersey"',
  '"corporate event catering" "Pennsylvania"',
];

export async function testTavilyProvider(now = new Date()): Promise<ProviderTestReport> {
  const generatedAt = now.toISOString();
  const guardrails = readProviderGuardrails();
  const selection = selectSearchProvider();
  const rows: ProviderTestRow[] = [];
  const queries = floraQueries.slice(0, Math.max(0, Math.min(guardrails.maxTestQueries, 3)));

  if (selection.providerName !== 'tavily' || !selection.tavilyConfigured) {
    for (const query of queries) {
      rows.push({
        query,
        providerUsed: selection.providerName,
        durationMs: 0,
        resultsReturned: 0,
        success: false,
        failureReason: selection.tavilyConfigured ? 'provider_not_selected' : 'missing_api_key',
      });
    }
  } else {
    for (const query of queries) {
      const started = Date.now();
      try {
        const response = await tavilySearch(query, {
          maxResults: 5,
          searchDepth: 'basic',
          includeAnswer: false,
          timeoutMs: 10000,
        });
        rows.push({
          query,
          providerUsed: 'tavily',
          durationMs: Date.now() - started,
          resultsReturned: response.results.length,
          success: response.results.length > 0,
          failureReason: response.results.length > 0 ? null : 'provider_empty',
        });
      } catch (error) {
        rows.push({
          query,
          providerUsed: 'tavily',
          durationMs: Date.now() - started,
          resultsReturned: 0,
          success: false,
          failureReason: classifyError(error),
        });
      }
    }
  }

  const report: ProviderTestReport = {
    generatedAt,
    queriesExecuted: rows.length,
    resultsReturned: rows.reduce((sum, row) => sum + row.resultsReturned, 0),
    averageDurationMs: average(rows.map((row) => row.durationMs)),
    failures: rows.filter((row) => !row.success).length,
    providerUsed: rows[0]?.providerUsed ?? selection.providerName,
    rows,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(markdownPath, renderMarkdown(report), 'utf8');
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

function classifyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/api key/i.test(message)) return 'missing_api_key';
  if (/429|rate/i.test(message)) return 'rate_limit';
  if (/abort|timeout/i.test(message)) return 'timeout';
  if (/fetch|network|ENOTFOUND|ECONN/i.test(message)) return 'network_error';
  return 'provider_failure';
}

function renderMarkdown(report: ProviderTestReport): string {
  return `# Provider Test

Generated: ${report.generatedAt}

- Provider used: ${report.providerUsed}
- Queries executed: ${report.queriesExecuted}
- Results returned: ${report.resultsReturned}
- Average duration: ${report.averageDurationMs.toFixed(0)}ms
- Failures: ${report.failures}

## Rows

${report.rows.map((row, index) => `${index + 1}. ${row.success ? 'PASS' : 'FAIL'} | ${row.providerUsed} | ${row.resultsReturned} results | ${row.durationMs}ms
   - Query: \`${row.query}\`
   - Failure: ${row.failureReason ?? 'none'}`).join('\n') || '- No provider test rows.'}

Controlled provider test only. Maximum three Flora queries. No scraping, login, contact extraction, or outreach was performed.
`;
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

async function main(): Promise<void> {
  try {
    const report = await testTavilyProvider();
    console.log(`Provider test generated: ${path.relative(process.cwd(), markdownPath)}, ${path.relative(process.cwd(), jsonPath)}`);
    console.log(`Provider used: ${report.providerUsed}`);
    console.log(`Queries executed: ${report.queriesExecuted}`);
    console.log(`Results returned: ${report.resultsReturned}`);
    console.log('Controlled test only. No scraping, login, contact extraction, or outreach was performed.');
  } catch (error) {
    console.error('Provider Test: FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) void main();
