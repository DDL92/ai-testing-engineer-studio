import fs = require('fs');
import path = require('path');
import { runtimeOutputPath } from '../runtimePaths';
import { classifyBuyerIntent } from './classifyBuyerIntent';
import { classifyBuyerRole } from './classifyBuyerRole';
import { classifyLeadLikeCandidate } from './classifyLeadLikeCandidate';
import { extractBuyerSignals } from './extractBuyerSignals';
import type { BuyerRole } from './buyerRoleTypes';
import type { LeadLikeClassification } from './leadLikeTypes';
import type { LeadSourceCategory } from './sourceTypes';
import type { LeadVertical } from './types';
import { ReviewDecisionInput, ReviewMetrics, reviewSafetyRules } from './reviewDecisionTypes';

type ExpectedOutcome = 'positive' | 'negative';
type ReviewSimulationSource = 'fixture' | 'golden';

interface FixtureCase {
  id: string;
  expectedOutcome: ExpectedOutcome;
  sourceCategory: LeadSourceCategory;
  title: string;
  snippet: string;
  query: string;
}

interface GoldenCase {
  id: string;
  title: string;
  snippet: string;
  expectedBuyerRole: BuyerRole;
  expectedLeadLikeClassification: LeadLikeClassification;
  expectedDeliveryEligibility: boolean;
  expectedVerificationEligibility: boolean;
  expectedIntentStrength: string;
  expectedCommercialValue: string;
}

interface ClientConfig {
  clientId: string;
  clientName: string;
  vertical: LeadVertical;
  fixturePath: string;
  goldenPath: string;
}

interface ReviewSimulationCandidate {
  candidateId: string;
  clientId: string;
  clientName: string;
  sourceType: ReviewSimulationSource;
  sourceCategory: LeadSourceCategory;
  expectedOutcome: ExpectedOutcome;
  predictedOutcome: ExpectedOutcome;
  title: string;
  snippet: string;
  query: string;
  buyerRole: string;
  buyerSignals: string[];
  intentSignals: string[];
  leadLikeClassification: string;
  leadLikeSignals: string[];
  deliveryEligible: boolean;
  verificationEligible: boolean;
  decision: ReviewDecisionInput['decision'];
  reviewReason: ReviewDecisionInput['reviewReason'];
  learningType: 'positive' | 'negative' | 'hold' | 'recency' | 'none';
}

interface ReviewSimulationReport {
  generatedAt: string;
  metrics: ReviewMetrics;
  candidates: ReviewSimulationCandidate[];
  safetyRules: string[];
}

const fixturesDir = path.join(process.cwd(), 'data', 'lead-discovery', 'fixtures');
const goldenDir = path.join(process.cwd(), 'data', 'lead-discovery', 'golden-dataset');
const outputDir = runtimeOutputPath('lead-discovery', 'review');
const simulationMdPath = path.join(outputDir, 'review-simulation.md');
const simulationJsonPath = path.join(outputDir, 'review-simulation.json');
const reviewSummaryPath = path.join(outputDir, 'review-summary.md');
const reviewSummaryCsvPath = path.join(outputDir, 'review-summary.csv');
const reviewLearningPath = path.join(outputDir, 'review-learning.md');
const reviewLearningCsvPath = path.join(outputDir, 'review-learning.csv');

const clients: ClientConfig[] = [
  {
    clientId: 'flora_and_fauna_foods_001',
    clientName: 'Flora and Fauna Foods',
    vertical: 'catering_leads',
    fixturePath: path.join(fixturesDir, 'flora-fixtures.json'),
    goldenPath: path.join(goldenDir, 'flora-golden.json'),
  },
  {
    clientId: 'lzt_costa_rica_001',
    clientName: 'LZT Costa Rica',
    vertical: 'real_estate_leads',
    fixturePath: path.join(fixturesDir, 'lzt-fixtures.json'),
    goldenPath: path.join(goldenDir, 'lzt-golden.json'),
  },
  {
    clientId: 'costa_retreats_001',
    clientName: 'Costa Retreats',
    vertical: 'travel_leads',
    fixturePath: path.join(fixturesDir, 'costa-fixtures.json'),
    goldenPath: path.join(goldenDir, 'costa-golden.json'),
  },
];

export function runReviewSimulation(now = new Date()): ReviewSimulationReport {
  const generatedAt = now.toISOString();
  const candidates = clients.flatMap((client) => [
    ...readFixtureCases(client).map((fixture) => simulateCase(client, {
      id: fixture.id,
      sourceType: 'fixture',
      sourceCategory: fixture.sourceCategory,
      expectedOutcome: fixture.expectedOutcome,
      title: fixture.title,
      snippet: fixture.snippet,
      query: fixture.query,
    }, generatedAt)),
    ...readGoldenCases(client).map((goldenCase) => simulateCase(client, {
      id: goldenCase.id,
      sourceType: 'golden',
      sourceCategory: 'public_forum',
      expectedOutcome: goldenCase.expectedDeliveryEligibility ? 'positive' : 'negative',
      title: goldenCase.title,
      snippet: goldenCase.snippet,
      query: goldenCase.title,
    }, generatedAt)),
  ]);
  const report: ReviewSimulationReport = {
    generatedAt,
    metrics: metricsFor(candidates),
    candidates,
    safetyRules: reviewSafetyRules,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(simulationMdPath, renderSimulation(report), 'utf8');
  fs.writeFileSync(simulationJsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(reviewSummaryPath, renderReviewSummary(report), 'utf8');
  fs.writeFileSync(reviewSummaryCsvPath, renderReviewSummaryCsv(report.metrics), 'utf8');
  fs.writeFileSync(reviewLearningPath, renderReviewLearning(report), 'utf8');
  fs.writeFileSync(reviewLearningCsvPath, renderReviewLearningCsv(report.candidates), 'utf8');
  return report;
}

function simulateCase(
  client: ClientConfig,
  reviewCase: {
    id: string;
    sourceType: ReviewSimulationSource;
    sourceCategory: LeadSourceCategory;
    expectedOutcome: ExpectedOutcome;
    title: string;
    snippet: string;
    query: string;
  },
  generatedAt: string,
): ReviewSimulationCandidate {
  const sourceUrl = `https://review.simulation/${client.clientId}/${reviewCase.sourceType}/${reviewCase.id}`;
  const leadLike = classifyLeadLikeCandidate({
    sourceUrl,
    sourceName: `${reviewCase.sourceType} review simulation`,
    sourceCategory: reviewCase.sourceCategory,
    title: reviewCase.title,
    snippet: reviewCase.snippet,
    query: reviewCase.query,
  });
  const buyerIntent = classifyBuyerIntent({
    clientId: client.clientId,
    vertical: client.vertical,
    title: reviewCase.title,
    snippet: reviewCase.snippet,
    url: sourceUrl,
    sourceName: `${reviewCase.sourceType} review simulation`,
    sourceCategory: reviewCase.sourceCategory,
  });
  const buyerRole = classifyBuyerRole({
    clientId: client.clientId,
    vertical: client.vertical,
    title: reviewCase.title,
    snippet: reviewCase.snippet,
    url: sourceUrl,
    sourceName: `${reviewCase.sourceType} review simulation`,
    sourceCategory: reviewCase.sourceCategory,
    query: reviewCase.query,
    buyerType: buyerIntent.buyerType,
  });
  const buyerSignals = extractBuyerSignals({
    clientId: client.clientId,
    title: reviewCase.title,
    snippet: reviewCase.snippet,
    query: reviewCase.query,
  });
  const deliveryEligible = buyerRole.buyerRole === 'buyer_service' && (leadLike.leadLikeClassification === 'lead_like' || leadLike.leadLikeClassification === 'possibly_lead_like');
  const verificationEligible = deliveryEligible && (leadLike.leadLikeScore >= 5.5 || buyerSignals.buyerSignalCount >= 2);
  const predictedOutcome: ExpectedOutcome = deliveryEligible ? 'positive' : 'negative';
  const decision = decisionFor(reviewCase.expectedOutcome, predictedOutcome, verificationEligible);
  return {
    candidateId: `review-sim-${client.clientId}-${reviewCase.sourceType}-${reviewCase.id}`,
    clientId: client.clientId,
    clientName: client.clientName,
    sourceType: reviewCase.sourceType,
    sourceCategory: reviewCase.sourceCategory,
    expectedOutcome: reviewCase.expectedOutcome,
    predictedOutcome,
    title: reviewCase.title,
    snippet: reviewCase.snippet,
    query: reviewCase.query,
    buyerRole: buyerRole.buyerRole,
    buyerSignals: buyerSignals.buyerSignals,
    intentSignals: buyerIntent.intentSignals,
    leadLikeClassification: leadLike.leadLikeClassification,
    leadLikeSignals: leadLike.leadLikeSignals,
    deliveryEligible,
    verificationEligible,
    decision,
    reviewReason: reasonFor(decision, buyerRole.buyerRole, leadLike.leadLikeClassification, verificationEligible),
    learningType: learningTypeFor(decision),
  };
}

function decisionFor(expectedOutcome: ExpectedOutcome, predictedOutcome: ExpectedOutcome, verificationEligible: boolean): ReviewDecisionInput['decision'] {
  if (expectedOutcome === 'positive' && predictedOutcome === 'positive') return verificationEligible ? 'approve' : 'hold';
  if (expectedOutcome === 'negative' && predictedOutcome === 'positive') return 'false_positive';
  if (expectedOutcome === 'positive' && predictedOutcome === 'negative') return 'hold';
  return 'reject';
}

function reasonFor(
  decision: ReviewDecisionInput['decision'],
  buyerRole: string,
  leadLikeClassification: string,
  verificationEligible: boolean,
): ReviewDecisionInput['reviewReason'] {
  if (decision === 'approve') return verificationEligible ? 'high intent' : 'real buyer';
  if (decision === 'hold') return 'needs more evidence';
  if (decision === 'needs_recency_check') return 'needs more evidence';
  if (buyerRole === 'staffing_recruitment') return 'staffing';
  if (buyerRole === 'vendor') return 'vendor';
  if (buyerRole === 'directory' || leadLikeClassification === 'directory') return 'directory';
  if (leadLikeClassification === 'article') return 'article';
  return 'not buyer';
}

function metricsFor(candidates: ReviewSimulationCandidate[]): ReviewMetrics {
  const approvedCount = candidates.filter((candidate) => candidate.decision === 'approve').length;
  const rejectedCount = candidates.filter((candidate) => candidate.decision === 'reject').length;
  const holdCount = candidates.filter((candidate) => candidate.decision === 'hold').length;
  const needsRecencyCheckCount = candidates.filter((candidate) => candidate.decision === 'needs_recency_check').length;
  const falsePositiveCount = candidates.filter((candidate) => candidate.decision === 'false_positive').length;
  return {
    totalDecisions: candidates.length,
    approvedCount,
    rejectedCount,
    holdCount,
    needsRecencyCheckCount,
    falsePositiveCount,
    approvalRate: ratio(approvedCount, candidates.length),
    rejectionRate: ratio(rejectedCount + falsePositiveCount, candidates.length),
    topApprovalReasons: distributionText(candidates.filter((candidate) => candidate.decision === 'approve').map((candidate) => candidate.reviewReason)),
    topRejectionReasons: distributionText(candidates.filter((candidate) => candidate.decision === 'reject' || candidate.decision === 'false_positive').map((candidate) => candidate.reviewReason)),
    learningCount: candidates.filter((candidate) => candidate.learningType === 'positive' || candidate.learningType === 'negative').length,
    lastReviewDate: new Date().toISOString(),
  };
}

function renderSimulation(report: ReviewSimulationReport): string {
  return `# Review Simulation

Generated: ${report.generatedAt}

## Metrics

- Total decisions: ${report.metrics.totalDecisions}
- Approved: ${report.metrics.approvedCount}
- Rejected: ${report.metrics.rejectedCount}
- Hold: ${report.metrics.holdCount}
- Needs recency check: ${report.metrics.needsRecencyCheckCount}
- False positives: ${report.metrics.falsePositiveCount}
- Approval rate: ${toPercent(report.metrics.approvalRate)}
- Rejection rate: ${toPercent(report.metrics.rejectionRate)}
- Top approval reasons: ${report.metrics.topApprovalReasons}
- Top rejection reasons: ${report.metrics.topRejectionReasons}
- Learning count: ${report.metrics.learningCount}

## Decisions

${report.candidates.map((candidate) => `- ${candidate.clientName} ${candidate.candidateId}: ${candidate.decision} (${candidate.reviewReason}); expected ${candidate.expectedOutcome}; predicted ${candidate.predictedOutcome}; role ${candidate.buyerRole}; source ${candidate.sourceType}`).join('\n')}

## Safety

${reviewSafetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function renderReviewSummary(report: ReviewSimulationReport): string {
  return `# Human Review Summary

Generated: ${report.generatedAt}
Mode: simulation

## Metrics

- Total decisions: ${report.metrics.totalDecisions}
- Approved: ${report.metrics.approvedCount}
- Rejected: ${report.metrics.rejectedCount}
- Hold: ${report.metrics.holdCount}
- Needs recency check: ${report.metrics.needsRecencyCheckCount}
- False positives: ${report.metrics.falsePositiveCount}
- Approval rate: ${toPercent(report.metrics.approvalRate)}
- Rejection rate: ${toPercent(report.metrics.rejectionRate)}
- Top approval reasons: ${report.metrics.topApprovalReasons}
- Top rejection reasons: ${report.metrics.topRejectionReasons}
- Learning count: ${report.metrics.learningCount}
- Last review date: ${report.metrics.lastReviewDate ?? 'none'}

This summary was generated from fixture and golden-dataset review simulation. Real human decisions are applied with \`npm run leads:review\`.
`;
}

function renderReviewLearning(report: ReviewSimulationReport): string {
  const learningRows = report.candidates.filter((candidate) => candidate.learningType === 'positive' || candidate.learningType === 'negative');
  return `# Review Learning

Generated: ${report.generatedAt}
Mode: simulation

## Positive Learning

- Approved examples: ${learningRows.filter((candidate) => candidate.learningType === 'positive').length}
- Promoted signals: ${distributionText(learningRows.filter((candidate) => candidate.learningType === 'positive').flatMap((candidate) => [...candidate.buyerSignals, ...candidate.intentSignals, ...candidate.leadLikeSignals]))}

## False Positive Learning

- False-positive examples: ${learningRows.filter((candidate) => candidate.learningType === 'negative').length}
- Penalties increased for: ${distributionText(learningRows.filter((candidate) => candidate.learningType === 'negative').map((candidate) => reasonFor(candidate.decision, candidate.buyerRole, candidate.leadLikeClassification, candidate.verificationEligible)))}

## Learning Rows

${learningRows.map((candidate, index) => `${index + 1}. ${candidate.clientName} ${candidate.candidateId}
   - Type: ${candidate.learningType}
   - Decision: ${candidate.decision}
   - Reason: ${candidate.reviewReason}
   - Query: ${candidate.query}
   - Buyer role: ${candidate.buyerRole}
   - Signals: ${[...candidate.buyerSignals, ...candidate.intentSignals, ...candidate.leadLikeSignals].join(', ') || 'none'}`).join('\n') || '- No simulated learning rows.'}

Local simulation only. No provider calls, network requests, Tavily usage, browser automation, scraping, contact extraction, or outreach were performed.
`;
}

function renderReviewSummaryCsv(metrics: ReviewMetrics): string {
  const headers = ['metric', 'value'];
  const body = Object.entries(metrics).map(([key, value]) => [key, String(value)]);
  return csvRows(headers, body);
}

function renderReviewLearningCsv(candidates: ReviewSimulationCandidate[]): string {
  const headers = ['candidate_id', 'client_id', 'client_name', 'learning_type', 'decision', 'review_reason', 'query', 'buyer_role', 'buyer_signals', 'intent_signals', 'lead_like_signals'];
  const body = candidates
    .filter((candidate) => candidate.learningType === 'positive' || candidate.learningType === 'negative')
    .map((candidate) => [
      candidate.candidateId,
      candidate.clientId,
      candidate.clientName,
      candidate.learningType,
      candidate.decision,
      candidate.reviewReason,
      candidate.query,
      candidate.buyerRole,
      candidate.buyerSignals.join('|'),
      candidate.intentSignals.join('|'),
      candidate.leadLikeSignals.join('|'),
    ]);
  return csvRows(headers, body);
}

function readFixtureCases(client: ClientConfig): FixtureCase[] {
  return JSON.parse(fs.readFileSync(client.fixturePath, 'utf8')) as FixtureCase[];
}

function readGoldenCases(client: ClientConfig): GoldenCase[] {
  return JSON.parse(fs.readFileSync(client.goldenPath, 'utf8')) as GoldenCase[];
}

function learningTypeFor(decision: string): ReviewSimulationCandidate['learningType'] {
  if (decision === 'approve') return 'positive';
  if (decision === 'false_positive') return 'negative';
  if (decision === 'hold') return 'hold';
  if (decision === 'needs_recency_check') return 'recency';
  return 'none';
}

function distributionText(values: string[]): string {
  const rows = Object.entries(values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {})).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  return rows.map(([value, count]) => `${value}:${count}`).join('; ') || 'none';
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 1000) / 1000;
}

function toPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function csvRows(headers: string[], body: string[][]): string {
  return `${headers.map(csvCell).join(',')}\n${body.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function main(): void {
  const report = runReviewSimulation();
  console.log(`Review simulation generated: ${path.relative(process.cwd(), simulationMdPath)}, ${path.relative(process.cwd(), simulationJsonPath)}`);
  console.log(`Review decisions simulated: ${report.metrics.totalDecisions}`);
  console.log(`Approval rate: ${toPercent(report.metrics.approvalRate)}`);
  console.log(`False positives: ${report.metrics.falsePositiveCount}`);
  console.log('Local review simulation only. No Tavily, provider calls, network, browser automation, scraping, contact extraction, outreach, email, DM, calls, or login was performed.');
}

if (require.main === module) main();
