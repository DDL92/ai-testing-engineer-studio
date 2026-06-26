import fs = require('fs');
import path = require('path');
import { runtimeOutputPath } from '../runtimePaths';
import { classifyBuyerIntent } from './classifyBuyerIntent';
import { classifyBuyerRole } from './classifyBuyerRole';
import { classifyLeadLikeCandidate } from './classifyLeadLikeCandidate';
import { extractBuyerSignals } from './extractBuyerSignals';
import { LeadSourceCategory } from './sourceTypes';
import { LeadVertical } from './types';

type FixtureOutcome = 'positive' | 'negative';
type SimulationDecision = 'promote' | 'reject';

interface LeadFixture {
  id: string;
  expectedOutcome: FixtureOutcome;
  sourceCategory: LeadSourceCategory;
  title: string;
  snippet: string;
  query: string;
}

interface ClientFixtureConfig {
  clientId: string;
  clientName: string;
  vertical: LeadVertical;
  fixturePath: string;
  sourceName: string;
}

interface SimulationCandidate {
  id: string;
  fixtureId: string;
  clientId: string;
  clientName: string;
  expectedOutcome: FixtureOutcome;
  predictedOutcome: FixtureOutcome;
  decision: SimulationDecision;
  sourceCategory: LeadSourceCategory;
  query: string;
  title: string;
  snippet: string;
  buyerRole: string;
  buyerRoleConfidence: string;
  buyerRoleSignals: string[];
  buyerRoleReasons: string[];
  buyerSignals: string[];
  buyerSignalCount: number;
  buyerSignalStrength: string;
  leadLikeClassification: string;
  leadLikeScore: number;
  leadLikeConfidence: number;
  leadLikeSignals: string[];
  deliveryCandidate: boolean;
  verificationReview: boolean;
  rejectionReason: string | null;
  resultType: 'true_positive' | 'false_positive' | 'true_negative' | 'false_negative';
}

interface SimulationMetrics {
  fixtureCount: number;
  truePositives: number;
  falsePositives: number;
  trueNegatives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  buyerRoleAccuracy: number;
  verificationPromotionRate: number;
  falsePositiveRate: number;
}

interface SimulationReport {
  generatedAt: string;
  metrics: SimulationMetrics;
  clientMetrics: Record<string, SimulationMetrics>;
  candidates: SimulationCandidate[];
  safetyRules: string[];
}

const fixturesDir = path.join(process.cwd(), 'data', 'lead-discovery', 'fixtures');
const outputDir = runtimeOutputPath('lead-discovery', 'simulation');
const summaryPath = path.join(outputDir, 'simulation-summary.md');
const dashboardPath = path.join(outputDir, 'simulation-dashboard.md');
const candidatesPath = path.join(outputDir, 'simulation-candidates.json');
const deliveryPath = path.join(outputDir, 'simulation-delivery.md');
const verificationPath = path.join(outputDir, 'simulation-verification.md');
const failuresPath = path.join(outputDir, 'simulation-failures.md');

const clientConfigs: ClientFixtureConfig[] = [
  {
    clientId: 'flora_and_fauna_foods_001',
    clientName: 'Flora and Fauna Foods',
    vertical: 'catering_leads',
    fixturePath: path.join(fixturesDir, 'flora-fixtures.json'),
    sourceName: 'Offline Flora fixture lab',
  },
  {
    clientId: 'lzt_costa_rica_001',
    clientName: 'LZT Costa Rica',
    vertical: 'real_estate_leads',
    fixturePath: path.join(fixturesDir, 'lzt-fixtures.json'),
    sourceName: 'Offline LZT fixture lab',
  },
  {
    clientId: 'costa_retreats_001',
    clientName: 'Costa Retreats',
    vertical: 'travel_leads',
    fixturePath: path.join(fixturesDir, 'costa-fixtures.json'),
    sourceName: 'Offline Costa fixture lab',
  },
];

const safetyRules = [
  'Offline fixture simulation only: no provider calls are made.',
  'No Tavily, network requests, browser automation, login, scraping, contact extraction, outreach, email, DM, calls, or forms are used.',
  'Fixtures are synthetic training examples for local classifier validation.',
  'Human review remains required before delivery, contact, or client-facing use.',
];

export function runFixtureSimulation(now = new Date()): SimulationReport {
  const generatedAt = now.toISOString();
  const candidates = clientConfigs.flatMap((client) => simulateClient(client, generatedAt));
  const report: SimulationReport = {
    generatedAt,
    metrics: metricsFor(candidates),
    clientMetrics: Object.fromEntries(clientConfigs.map((client) => [
      client.clientId,
      metricsFor(candidates.filter((candidate) => candidate.clientId === client.clientId)),
    ])),
    candidates,
    safetyRules,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(summaryPath, renderSummary(report), 'utf8');
  fs.writeFileSync(dashboardPath, renderDashboard(report), 'utf8');
  fs.writeFileSync(candidatesPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(deliveryPath, renderDelivery(report), 'utf8');
  fs.writeFileSync(verificationPath, renderVerification(report), 'utf8');
  fs.writeFileSync(failuresPath, renderFailures(report), 'utf8');

  return report;
}

function simulateClient(client: ClientFixtureConfig, generatedAt: string): SimulationCandidate[] {
  const fixtures = readFixtures(client.fixturePath);
  return fixtures.map((fixture, index) => simulateFixture(client, fixture, generatedAt, index + 1));
}

function simulateFixture(client: ClientFixtureConfig, fixture: LeadFixture, generatedAt: string, index: number): SimulationCandidate {
  const sourceUrl = `https://offline.fixture/${client.clientId}/${fixture.id}`;
  const leadLike = classifyLeadLikeCandidate({
    sourceUrl,
    sourceName: client.sourceName,
    sourceCategory: fixture.sourceCategory,
    title: fixture.title,
    snippet: fixture.snippet,
    query: fixture.query,
  });
  const buyerSignals = extractBuyerSignals({
    clientId: client.clientId,
    title: fixture.title,
    snippet: fixture.snippet,
    query: fixture.query,
  });
  const buyerIntent = classifyBuyerIntent({
    clientId: client.clientId,
    vertical: client.vertical,
    title: fixture.title,
    snippet: fixture.snippet,
    url: sourceUrl,
    sourceName: client.sourceName,
    sourceCategory: fixture.sourceCategory,
  });
  const buyerRole = classifyBuyerRole({
    clientId: client.clientId,
    vertical: client.vertical,
    title: fixture.title,
    snippet: fixture.snippet,
    url: sourceUrl,
    sourceName: client.sourceName,
    sourceCategory: fixture.sourceCategory,
    query: fixture.query,
    buyerType: buyerIntent.buyerType,
  });
  const leadLikePositive = leadLike.leadLikeClassification === 'lead_like' || leadLike.leadLikeClassification === 'possibly_lead_like';
  const deliveryCandidate = leadLikePositive && buyerRole.buyerRole === 'buyer_service';
  const verificationReview = deliveryCandidate && (leadLike.leadLikeScore >= 5.5 || buyerSignals.buyerSignalCount >= 2);
  const predictedOutcome: FixtureOutcome = deliveryCandidate ? 'positive' : 'negative';
  const resultType = resultTypeFor(fixture.expectedOutcome, predictedOutcome);

  return {
    id: `simulation-candidate-${client.clientId}-${String(index).padStart(3, '0')}`,
    fixtureId: fixture.id,
    clientId: client.clientId,
    clientName: client.clientName,
    expectedOutcome: fixture.expectedOutcome,
    predictedOutcome,
    decision: deliveryCandidate ? 'promote' : 'reject',
    sourceCategory: fixture.sourceCategory,
    query: fixture.query,
    title: fixture.title,
    snippet: fixture.snippet,
    buyerRole: buyerRole.buyerRole,
    buyerRoleConfidence: buyerRole.buyerRoleConfidence,
    buyerRoleSignals: buyerRole.buyerRoleSignals,
    buyerRoleReasons: buyerRole.buyerRoleReasons,
    buyerSignals: buyerSignals.buyerSignals,
    buyerSignalCount: buyerSignals.buyerSignalCount,
    buyerSignalStrength: buyerSignals.buyerSignalStrength,
    leadLikeClassification: leadLike.leadLikeClassification,
    leadLikeScore: leadLike.leadLikeScore,
    leadLikeConfidence: leadLike.leadLikeConfidence,
    leadLikeSignals: leadLike.leadLikeSignals,
    deliveryCandidate,
    verificationReview,
    rejectionReason: deliveryCandidate ? null : rejectionReasonFor(leadLike.leadLikeClassification, buyerRole.buyerRole),
    resultType,
  };
}

function readFixtures(filePath: string): LeadFixture[] {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fixture file not found: ${path.relative(process.cwd(), filePath)}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as LeadFixture[];
}

function metricsFor(candidates: SimulationCandidate[]): SimulationMetrics {
  const truePositives = candidates.filter((candidate) => candidate.resultType === 'true_positive').length;
  const falsePositives = candidates.filter((candidate) => candidate.resultType === 'false_positive').length;
  const trueNegatives = candidates.filter((candidate) => candidate.resultType === 'true_negative').length;
  const falseNegatives = candidates.filter((candidate) => candidate.resultType === 'false_negative').length;
  const positiveFixtures = candidates.filter((candidate) => candidate.expectedOutcome === 'positive').length;
  const predictedPositive = candidates.filter((candidate) => candidate.predictedOutcome === 'positive').length;
  const buyerRoleCorrect = candidates.filter((candidate) => (
    candidate.expectedOutcome === 'positive'
      ? candidate.buyerRole === 'buyer_service'
      : candidate.buyerRole !== 'buyer_service'
  )).length;
  return {
    fixtureCount: candidates.length,
    truePositives,
    falsePositives,
    trueNegatives,
    falseNegatives,
    precision: ratio(truePositives, truePositives + falsePositives),
    recall: ratio(truePositives, truePositives + falseNegatives),
    buyerRoleAccuracy: ratio(buyerRoleCorrect, candidates.length),
    verificationPromotionRate: ratio(candidates.filter((candidate) => candidate.verificationReview).length, positiveFixtures),
    falsePositiveRate: ratio(falsePositives, predictedPositive),
  };
}

function renderSummary(report: SimulationReport): string {
  return `# Offline Fixture Simulation Summary

Generated: ${report.generatedAt}

## Overall Metrics

${renderMetrics(report.metrics)}

## Client Metrics

${Object.entries(report.clientMetrics).map(([clientId, metrics]) => `### ${clientNameFor(clientId)}

${renderMetrics(metrics)}`).join('\n\n')}

## Safety Rules

${report.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function renderDashboard(report: SimulationReport): string {
  return `# Simulation Dashboard

Generated: ${report.generatedAt}

| Client | Fixtures | Precision | Recall | Buyer role accuracy | Verification promotion rate | False positive rate | TP | FP | TN | FN |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${Object.entries(report.clientMetrics).map(([clientId, metrics]) => `| ${clientNameFor(clientId)} | ${metrics.fixtureCount} | ${percent(metrics.precision)} | ${percent(metrics.recall)} | ${percent(metrics.buyerRoleAccuracy)} | ${percent(metrics.verificationPromotionRate)} | ${percent(metrics.falsePositiveRate)} | ${metrics.truePositives} | ${metrics.falsePositives} | ${metrics.trueNegatives} | ${metrics.falseNegatives} |`).join('\n')}
| Overall | ${report.metrics.fixtureCount} | ${percent(report.metrics.precision)} | ${percent(report.metrics.recall)} | ${percent(report.metrics.buyerRoleAccuracy)} | ${percent(report.metrics.verificationPromotionRate)} | ${percent(report.metrics.falsePositiveRate)} | ${report.metrics.truePositives} | ${report.metrics.falsePositives} | ${report.metrics.trueNegatives} | ${report.metrics.falseNegatives} |
`;
}

function renderDelivery(report: SimulationReport): string {
  const delivery = report.candidates.filter((candidate) => candidate.deliveryCandidate);
  return `# Simulation Delivery Candidates

Generated: ${report.generatedAt}

- Delivery candidates: ${delivery.length}

${delivery.map((candidate, index) => `${index + 1}. ${candidate.clientName}: ${candidate.title}
   - Fixture: ${candidate.fixtureId}; expected: ${candidate.expectedOutcome}; result: ${candidate.resultType}
   - Buyer role: ${candidate.buyerRole} (${candidate.buyerRoleConfidence})
   - Lead-like: ${candidate.leadLikeClassification}; score: ${candidate.leadLikeScore}
   - Buyer signals: ${candidate.buyerSignals.join(', ') || 'none'}`).join('\n') || '- No delivery candidates.'}
`;
}

function renderVerification(report: SimulationReport): string {
  const verification = report.candidates.filter((candidate) => candidate.verificationReview);
  return `# Simulation Verification Review

Generated: ${report.generatedAt}

- Verification review candidates: ${verification.length}
- Verification promotion rate: ${percent(report.metrics.verificationPromotionRate)}

${verification.map((candidate, index) => `${index + 1}. ${candidate.clientName}: ${candidate.title}
   - Fixture: ${candidate.fixtureId}; result: ${candidate.resultType}
   - Query: \`${candidate.query}\`
   - Buyer role reasons: ${candidate.buyerRoleReasons.join('; ') || 'none'}`).join('\n') || '- No verification review candidates.'}
`;
}

function renderFailures(report: SimulationReport): string {
  const failures = report.candidates.filter((candidate) => candidate.resultType === 'false_positive' || candidate.resultType === 'false_negative');
  return `# Simulation Failures

Generated: ${report.generatedAt}

- False positives: ${report.metrics.falsePositives}
- False negatives: ${report.metrics.falseNegatives}

${failures.map((candidate, index) => `${index + 1}. ${candidate.resultType.toUpperCase()} | ${candidate.clientName}: ${candidate.title}
   - Expected: ${candidate.expectedOutcome}; predicted: ${candidate.predictedOutcome}
   - Buyer role: ${candidate.buyerRole}; lead-like: ${candidate.leadLikeClassification}; score: ${candidate.leadLikeScore}
   - Rejection reason: ${candidate.rejectionReason ?? 'none'}
   - Snippet: ${candidate.snippet}`).join('\n') || '- No simulation failures.'}
`;
}

function renderMetrics(metrics: SimulationMetrics): string {
  return [
    `- Fixture count: ${metrics.fixtureCount}`,
    `- True positives: ${metrics.truePositives}`,
    `- False positives: ${metrics.falsePositives}`,
    `- True negatives: ${metrics.trueNegatives}`,
    `- False negatives: ${metrics.falseNegatives}`,
    `- Precision: ${percent(metrics.precision)}`,
    `- Recall: ${percent(metrics.recall)}`,
    `- Buyer role accuracy: ${percent(metrics.buyerRoleAccuracy)}`,
    `- Verification promotion rate: ${percent(metrics.verificationPromotionRate)}`,
    `- False positive rate: ${percent(metrics.falsePositiveRate)}`,
  ].join('\n');
}

function resultTypeFor(expected: FixtureOutcome, predicted: FixtureOutcome): SimulationCandidate['resultType'] {
  if (expected === 'positive' && predicted === 'positive') return 'true_positive';
  if (expected === 'negative' && predicted === 'positive') return 'false_positive';
  if (expected === 'negative' && predicted === 'negative') return 'true_negative';
  return 'false_negative';
}

function rejectionReasonFor(leadLikeClassification: string, buyerRole: string): string {
  if (buyerRole !== 'buyer_service') return `buyer_role_${buyerRole}`;
  return `lead_like_${leadLikeClassification}`;
}

function clientNameFor(clientId: string): string {
  return clientConfigs.find((client) => client.clientId === clientId)?.clientName ?? clientId;
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 1000) / 1000;
}

function percent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function main(): void {
  try {
    const report = runFixtureSimulation();
    console.log(`Fixture simulation generated: ${[
      path.relative(process.cwd(), summaryPath),
      path.relative(process.cwd(), dashboardPath),
      path.relative(process.cwd(), candidatesPath),
      path.relative(process.cwd(), deliveryPath),
      path.relative(process.cwd(), verificationPath),
      path.relative(process.cwd(), failuresPath),
    ].join(', ')}`);
    console.log(`Fixtures: ${report.metrics.fixtureCount}`);
    console.log(`Precision: ${percent(report.metrics.precision)}`);
    console.log(`Recall: ${percent(report.metrics.recall)}`);
    console.log('Offline only. No Tavily, network, scraping, browser automation, contact extraction, outreach, email, DM, calls, or login was performed.');
  } catch (error) {
    console.error('Fixture Simulation: FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) main();
