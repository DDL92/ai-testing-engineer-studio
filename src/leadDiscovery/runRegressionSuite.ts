import fs = require('fs');
import path = require('path');
import { runtimeOutputPath } from '../runtimePaths';
import { classifyBuyerIntent } from './classifyBuyerIntent';
import { classifyBuyerRole } from './classifyBuyerRole';
import { classifyLeadLikeCandidate } from './classifyLeadLikeCandidate';
import { extractBuyerSignals } from './extractBuyerSignals';
import { IntentStrength } from './buyerIntentTypes';
import { BuyerRole } from './buyerRoleTypes';
import { LeadLikeClassification } from './leadLikeTypes';
import { LeadSourceCategory } from './sourceTypes';
import { LeadVertical } from './types';

type CommercialValueBucket = 'none' | 'low' | 'medium' | 'high';

interface GoldenCase {
  id: string;
  title: string;
  snippet: string;
  expectedBuyerRole: BuyerRole;
  expectedLeadLikeClassification: LeadLikeClassification;
  expectedDeliveryEligibility: boolean;
  expectedVerificationEligibility: boolean;
  expectedIntentStrength: IntentStrength;
  expectedCommercialValue: CommercialValueBucket;
}

interface GoldenClientConfig {
  clientId: string;
  clientName: string;
  vertical: LeadVertical;
  sourceCategory: LeadSourceCategory;
  sourceName: string;
  filePath: string;
}

interface RegressionCaseResult {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  snippet: string;
  expected: {
    buyerRole: BuyerRole;
    leadLikeClassification: LeadLikeClassification;
    deliveryEligibility: boolean;
    verificationEligibility: boolean;
    intentStrength: IntentStrength;
    commercialValue: CommercialValueBucket;
  };
  actual: {
    buyerRole: BuyerRole;
    leadLikeClassification: LeadLikeClassification;
    deliveryEligibility: boolean;
    verificationEligibility: boolean;
    intentStrength: IntentStrength;
    commercialValue: CommercialValueBucket;
  };
  passed: boolean;
  failedAssertions: string[];
}

interface RegressionMetrics {
  totalCases: number;
  passed: number;
  failed: number;
  precision: number;
  recall: number;
  buyerRoleAccuracy: number;
  deliveryAccuracy: number;
  verificationAccuracy: number;
  passRate: number;
  falsePositives: number;
  falseNegatives: number;
}

interface RegressionReport {
  generatedAt: string;
  metrics: RegressionMetrics;
  previousPassRate: number | null;
  regressionTrend: string;
  results: RegressionCaseResult[];
  safetyRules: string[];
}

const datasetDir = path.join(process.cwd(), 'data', 'lead-discovery', 'golden-dataset');
const outputDir = runtimeOutputPath('lead-discovery', 'regression');
const summaryPath = path.join(outputDir, 'regression-summary.md');
const resultsPath = path.join(outputDir, 'regression-results.json');
const failuresPath = path.join(outputDir, 'regression-failures.md');
const dashboardPath = path.join(outputDir, 'regression-dashboard.md');

const clients: GoldenClientConfig[] = [
  {
    clientId: 'flora_and_fauna_foods_001',
    clientName: 'Flora and Fauna Foods',
    vertical: 'catering_leads',
    sourceCategory: 'public_forum',
    sourceName: 'Golden dataset Flora',
    filePath: path.join(datasetDir, 'flora-golden.json'),
  },
  {
    clientId: 'lzt_costa_rica_001',
    clientName: 'LZT Costa Rica',
    vertical: 'real_estate_leads',
    sourceCategory: 'public_forum',
    sourceName: 'Golden dataset LZT',
    filePath: path.join(datasetDir, 'lzt-golden.json'),
  },
  {
    clientId: 'costa_retreats_001',
    clientName: 'Costa Retreats',
    vertical: 'travel_leads',
    sourceCategory: 'public_forum',
    sourceName: 'Golden dataset Costa',
    filePath: path.join(datasetDir, 'costa-golden.json'),
  },
];

const safetyRules = [
  'Golden regression suite is local only.',
  'No Tavily, provider calls, network requests, browser automation, login, scraping, contact extraction, outreach, emails, DMs, calls, or forms are used.',
  'The suite validates deterministic lead classification, delivery, verification, and commercial-value logic.',
  'Any failed assertion exits non-zero for CI gating.',
];

export function runRegressionSuite(now = new Date()): RegressionReport {
  const generatedAt = now.toISOString();
  const previousPassRate = readPreviousPassRate();
  const results = clients.flatMap((client) => readGoldenCases(client).map((goldenCase) => evaluateCase(client, goldenCase)));
  const metrics = metricsFor(results);
  const report: RegressionReport = {
    generatedAt,
    metrics,
    previousPassRate,
    regressionTrend: trendFor(previousPassRate, metrics.passRate),
    results,
    safetyRules,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(summaryPath, renderSummary(report), 'utf8');
  fs.writeFileSync(resultsPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(failuresPath, renderFailures(report), 'utf8');
  fs.writeFileSync(dashboardPath, renderDashboard(report), 'utf8');

  return report;
}

function evaluateCase(client: GoldenClientConfig, goldenCase: GoldenCase): RegressionCaseResult {
  const sourceUrl = `https://golden.dataset/${client.clientId}/${goldenCase.id}`;
  const query = goldenCase.title;
  const leadLike = classifyLeadLikeCandidate({
    sourceUrl,
    sourceName: client.sourceName,
    sourceCategory: client.sourceCategory,
    title: goldenCase.title,
    snippet: goldenCase.snippet,
    query,
  });
  const buyerIntent = classifyBuyerIntent({
    clientId: client.clientId,
    vertical: client.vertical,
    title: goldenCase.title,
    snippet: goldenCase.snippet,
    url: sourceUrl,
    sourceName: client.sourceName,
    sourceCategory: client.sourceCategory,
  });
  const buyerRole = classifyBuyerRole({
    clientId: client.clientId,
    vertical: client.vertical,
    title: goldenCase.title,
    snippet: goldenCase.snippet,
    url: sourceUrl,
    sourceName: client.sourceName,
    sourceCategory: client.sourceCategory,
    query,
    buyerType: buyerIntent.buyerType,
  });
  const buyerSignals = extractBuyerSignals({
    clientId: client.clientId,
    title: goldenCase.title,
    snippet: goldenCase.snippet,
    query,
  });
  const deliveryEligibility = isDeliveryEligible(leadLike.leadLikeClassification, buyerRole.buyerRole);
  const verificationEligibility = deliveryEligibility && (leadLike.leadLikeScore >= 5.5 || buyerSignals.buyerSignalCount >= 2);
  const intentStrength = intentStrengthFor({
    buyerRole: buyerRole.buyerRole,
    leadLikeClassification: leadLike.leadLikeClassification,
    leadLikeScore: leadLike.leadLikeScore,
    buyerSignalCount: buyerSignals.buyerSignalCount,
  });
  const commercialValue = commercialValueFor(deliveryEligibility, verificationEligibility, intentStrength);
  const actual = {
    buyerRole: buyerRole.buyerRole,
    leadLikeClassification: leadLike.leadLikeClassification,
    deliveryEligibility,
    verificationEligibility,
    intentStrength,
    commercialValue,
  };
  const expected = {
    buyerRole: goldenCase.expectedBuyerRole,
    leadLikeClassification: goldenCase.expectedLeadLikeClassification,
    deliveryEligibility: goldenCase.expectedDeliveryEligibility,
    verificationEligibility: goldenCase.expectedVerificationEligibility,
    intentStrength: goldenCase.expectedIntentStrength,
    commercialValue: goldenCase.expectedCommercialValue,
  };
  const failedAssertions = failedAssertionsFor(expected, actual);
  return {
    id: goldenCase.id,
    clientId: client.clientId,
    clientName: client.clientName,
    title: goldenCase.title,
    snippet: goldenCase.snippet,
    expected,
    actual,
    passed: failedAssertions.length === 0,
    failedAssertions,
  };
}

function isDeliveryEligible(leadLikeClassification: LeadLikeClassification, buyerRole: BuyerRole): boolean {
  return buyerRole === 'buyer_service' && (leadLikeClassification === 'lead_like' || leadLikeClassification === 'possibly_lead_like');
}

function intentStrengthFor(input: {
  buyerRole: BuyerRole;
  leadLikeClassification: LeadLikeClassification;
  leadLikeScore: number;
  buyerSignalCount: number;
}): IntentStrength {
  if (input.buyerRole !== 'buyer_service') return 'weak';
  if (input.leadLikeClassification === 'lead_like' && (input.leadLikeScore >= 6 || input.buyerSignalCount >= 2)) return 'strong';
  if (input.leadLikeClassification === 'lead_like' || input.leadLikeClassification === 'possibly_lead_like' || input.buyerSignalCount >= 1) return 'medium';
  return 'weak';
}

function commercialValueFor(deliveryEligibility: boolean, verificationEligibility: boolean, intentStrength: IntentStrength): CommercialValueBucket {
  if (!deliveryEligibility) return 'none';
  if (verificationEligibility && intentStrength === 'strong') return 'high';
  if (deliveryEligibility) return 'medium';
  return 'low';
}

function failedAssertionsFor(
  expected: RegressionCaseResult['expected'],
  actual: RegressionCaseResult['actual'],
): string[] {
  const failures: string[] = [];
  if (expected.buyerRole !== actual.buyerRole) failures.push(`buyer role expected ${expected.buyerRole}, got ${actual.buyerRole}`);
  if (expected.leadLikeClassification !== actual.leadLikeClassification) failures.push(`lead-like expected ${expected.leadLikeClassification}, got ${actual.leadLikeClassification}`);
  if (expected.deliveryEligibility !== actual.deliveryEligibility) failures.push(`delivery expected ${expected.deliveryEligibility}, got ${actual.deliveryEligibility}`);
  if (expected.verificationEligibility !== actual.verificationEligibility) failures.push(`verification expected ${expected.verificationEligibility}, got ${actual.verificationEligibility}`);
  if (expected.intentStrength !== actual.intentStrength) failures.push(`intent expected ${expected.intentStrength}, got ${actual.intentStrength}`);
  if (expected.commercialValue !== actual.commercialValue) failures.push(`commercial value expected ${expected.commercialValue}, got ${actual.commercialValue}`);
  return failures;
}

function metricsFor(results: RegressionCaseResult[]): RegressionMetrics {
  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;
  const actualPositive = results.filter((result) => result.actual.deliveryEligibility).length;
  const expectedPositive = results.filter((result) => result.expected.deliveryEligibility).length;
  const truePositives = results.filter((result) => result.expected.deliveryEligibility && result.actual.deliveryEligibility).length;
  const falsePositives = results.filter((result) => !result.expected.deliveryEligibility && result.actual.deliveryEligibility).length;
  const falseNegatives = results.filter((result) => result.expected.deliveryEligibility && !result.actual.deliveryEligibility).length;
  return {
    totalCases: results.length,
    passed,
    failed,
    precision: ratio(truePositives, actualPositive),
    recall: ratio(truePositives, expectedPositive),
    buyerRoleAccuracy: ratio(results.filter((result) => result.expected.buyerRole === result.actual.buyerRole).length, results.length),
    deliveryAccuracy: ratio(results.filter((result) => result.expected.deliveryEligibility === result.actual.deliveryEligibility).length, results.length),
    verificationAccuracy: ratio(results.filter((result) => result.expected.verificationEligibility === result.actual.verificationEligibility).length, results.length),
    passRate: ratio(passed, results.length),
    falsePositives,
    falseNegatives,
  };
}

function readGoldenCases(client: GoldenClientConfig): GoldenCase[] {
  if (!fs.existsSync(client.filePath)) {
    throw new Error(`Golden dataset not found: ${path.relative(process.cwd(), client.filePath)}`);
  }
  return JSON.parse(fs.readFileSync(client.filePath, 'utf8')) as GoldenCase[];
}

function readPreviousPassRate(): number | null {
  if (!fs.existsSync(resultsPath)) return null;
  try {
    const previous = JSON.parse(fs.readFileSync(resultsPath, 'utf8')) as RegressionReport;
    return typeof previous.metrics?.passRate === 'number' ? previous.metrics.passRate : null;
  } catch {
    return null;
  }
}

function trendFor(previousPassRate: number | null, currentPassRate: number): string {
  if (previousPassRate === null) return 'baseline';
  if (currentPassRate > previousPassRate) return 'improved';
  if (currentPassRate < previousPassRate) return 'regressed';
  return 'stable';
}

function renderSummary(report: RegressionReport): string {
  return `# Lead Discovery Regression Summary

Generated: ${report.generatedAt}

${renderMetrics(report.metrics)}
- Regression trend: ${report.regressionTrend}
- Previous pass rate: ${report.previousPassRate === null ? 'none' : percent(report.previousPassRate)}

## Top Failing Rules

${renderTopFailingRules(report.results)}

## Safety Rules

${report.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function renderDashboard(report: RegressionReport): string {
  const byClient = clients.map((client) => {
    const rows = report.results.filter((result) => result.clientId === client.clientId);
    return { clientName: client.clientName, metrics: metricsFor(rows) };
  });
  return `# Regression Dashboard

Generated: ${report.generatedAt}

| Scope | Cases | Passed | Failed | Pass rate | Precision | Recall | Buyer role accuracy | Delivery accuracy | Verification accuracy | False positives | False negatives |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${byClient.map((row) => `| ${row.clientName} | ${row.metrics.totalCases} | ${row.metrics.passed} | ${row.metrics.failed} | ${percent(row.metrics.passRate)} | ${percent(row.metrics.precision)} | ${percent(row.metrics.recall)} | ${percent(row.metrics.buyerRoleAccuracy)} | ${percent(row.metrics.deliveryAccuracy)} | ${percent(row.metrics.verificationAccuracy)} | ${row.metrics.falsePositives} | ${row.metrics.falseNegatives} |`).join('\n')}
| Overall | ${report.metrics.totalCases} | ${report.metrics.passed} | ${report.metrics.failed} | ${percent(report.metrics.passRate)} | ${percent(report.metrics.precision)} | ${percent(report.metrics.recall)} | ${percent(report.metrics.buyerRoleAccuracy)} | ${percent(report.metrics.deliveryAccuracy)} | ${percent(report.metrics.verificationAccuracy)} | ${report.metrics.falsePositives} | ${report.metrics.falseNegatives} |

## Regression Health

- Last regression run: ${report.generatedAt}
- Pass rate: ${percent(report.metrics.passRate)}
- Failure count: ${report.metrics.failed}
- Top failing rules: ${inlineTopFailingRules(report.results)}
- Regression trend: ${report.regressionTrend}
`;
}

function renderFailures(report: RegressionReport): string {
  const failures = report.results.filter((result) => !result.passed);
  return `# Regression Failures

Generated: ${report.generatedAt}

- Failure count: ${failures.length}

${failures.map((result, index) => `${index + 1}. ${result.clientName}: ${result.id}
   - Title: ${result.title}
   - Failures: ${result.failedAssertions.join('; ')}
   - Expected: ${JSON.stringify(result.expected)}
   - Actual: ${JSON.stringify(result.actual)}`).join('\n') || '- No regression failures.'}
`;
}

function renderMetrics(metrics: RegressionMetrics): string {
  return [
    `- Total cases: ${metrics.totalCases}`,
    `- Passed: ${metrics.passed}`,
    `- Failed: ${metrics.failed}`,
    `- Precision: ${percent(metrics.precision)}`,
    `- Recall: ${percent(metrics.recall)}`,
    `- Buyer role accuracy: ${percent(metrics.buyerRoleAccuracy)}`,
    `- Delivery accuracy: ${percent(metrics.deliveryAccuracy)}`,
    `- Verification accuracy: ${percent(metrics.verificationAccuracy)}`,
    `- Pass rate: ${percent(metrics.passRate)}`,
    `- False positives: ${metrics.falsePositives}`,
    `- False negatives: ${metrics.falseNegatives}`,
  ].join('\n');
}

function renderTopFailingRules(results: RegressionCaseResult[]): string {
  const rows = failingRuleCounts(results);
  return rows.map(([rule, count]) => `- ${rule}: ${count}`).join('\n') || '- None.';
}

function inlineTopFailingRules(results: RegressionCaseResult[]): string {
  return failingRuleCounts(results).map(([rule, count]) => `${rule}:${count}`).join('; ') || 'none';
}

function failingRuleCounts(results: RegressionCaseResult[]): Array<[string, number]> {
  return Object.entries(results.flatMap((result) => result.failedAssertions.map((failure) => failure.split(' expected ')[0]))
    .reduce<Record<string, number>>((counts, rule) => {
      counts[rule] = (counts[rule] ?? 0) + 1;
      return counts;
    }, {})).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 1000) / 1000;
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function meetsSuccessTarget(metrics: RegressionMetrics): boolean {
  return metrics.precision > 0.95
    && metrics.recall > 0.95
    && metrics.falsePositives === 0
    && metrics.falseNegatives <= 1
    && metrics.passRate === 1;
}

function main(): void {
  try {
    const report = runRegressionSuite();
    console.log(`Regression generated: ${[
      path.relative(process.cwd(), summaryPath),
      path.relative(process.cwd(), resultsPath),
      path.relative(process.cwd(), failuresPath),
      path.relative(process.cwd(), dashboardPath),
    ].join(', ')}`);
    console.log(`Cases: ${report.metrics.totalCases}`);
    console.log(`Passed: ${report.metrics.passed}`);
    console.log(`Failed: ${report.metrics.failed}`);
    console.log(`Precision: ${percent(report.metrics.precision)}`);
    console.log(`Recall: ${percent(report.metrics.recall)}`);
    console.log('Local regression only. No Tavily, provider calls, network, browser automation, scraping, contact extraction, outreach, email, DM, calls, or login was performed.');
    if (!meetsSuccessTarget(report.metrics)) {
      process.exitCode = 1;
    }
  } catch (error) {
    console.error('Lead Discovery Regression Suite: FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) main();
