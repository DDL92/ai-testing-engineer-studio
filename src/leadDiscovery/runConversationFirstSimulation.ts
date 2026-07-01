import fs = require('fs');
import path = require('path');

type SimulationDecision = 'accept' | 'reject';
type SimulationExpected = 'accept' | 'reject';

interface ConversationSimulationFixture {
  id: string;
  clientId: string;
  clientName: string;
  scenario: string;
  sourceType: string;
  title: string;
  snippet: string;
  expected: SimulationExpected;
}

interface ConversationSimulationResult extends ConversationSimulationFixture {
  decision: SimulationDecision;
  passed: boolean;
  matchedPositiveSignals: string[];
  matchedNegativeSignals: string[];
  reason: string;
}

interface ConversationFirstSimulationReport {
  generatedAt: string;
  status: 'passed' | 'failed';
  totalFixtures: number;
  passedFixtures: number;
  failedFixtures: number;
  results: ConversationSimulationResult[];
  safetyRules: string[];
}

const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'conversation-first');
const jsonPath = path.join(outputDir, 'conversation-first-simulation.json');
const markdownPath = path.join(outputDir, 'conversation-first-simulation.md');

const positiveSignals = [
  'our caterer cancelled',
  'caterer backed out',
  'need someone for saturday',
  'planning costa rica honeymoon',
  'planning costa rica family trip',
  'need help deciding where to stay',
  'tanque séptico se rebalsa',
  'terreno no drena',
  'necesito planta de tratamiento',
  'permiso minsa aguas residuales',
];

const negativeSignals = [
  'directory',
  'best caterers',
  'top caterers',
  'business listing',
  'vendor profile',
  'staffing',
  'hiring',
  'travel guide',
  'article',
  'septic cleaning',
  'limpieza de tanque',
  'camión cisterna',
];

const fixtures: ConversationSimulationFixture[] = [
  {
    id: 'flora-success-buyer-conversation',
    clientId: 'flora_and_fauna_foods_001',
    clientName: 'Flora and Fauna Foods',
    scenario: 'successful Flora buyer conversation',
    sourceType: 'public_forum',
    title: 'Our caterer cancelled and wedding is next week',
    snippet: 'We need someone for Saturday for about 85 guests near our venue.',
    expected: 'accept',
  },
  {
    id: 'flora-directory-rejection',
    clientId: 'flora_and_fauna_foods_001',
    clientName: 'Flora and Fauna Foods',
    scenario: 'Flora vendor/directory rejection',
    sourceType: 'public_directory',
    title: 'Top caterers directory and vendor profile list',
    snippet: 'Business listing page with reviews page and pricing page links.',
    expected: 'reject',
  },
  {
    id: 'flora-staffing-rejection',
    clientId: 'flora_and_fauna_foods_001',
    clientName: 'Flora and Fauna Foods',
    scenario: 'Flora staffing rejection',
    sourceType: 'public_job_board',
    title: 'Catering staffing agency hiring bartenders',
    snippet: 'Now hiring event staff for weekend shifts.',
    expected: 'reject',
  },
  {
    id: 'costa-success-planning-conversation',
    clientId: 'costa_retreats_001',
    clientName: 'Costa Retreats',
    scenario: 'successful Costa planning conversation',
    sourceType: 'public_forum',
    title: 'Planning Costa Rica honeymoon and need help deciding where to stay',
    snippet: 'First time in Costa Rica and trying to choose between Tamarindo and Uvita.',
    expected: 'accept',
  },
  {
    id: 'costa-generic-article-rejection',
    clientId: 'costa_retreats_001',
    clientName: 'Costa Retreats',
    scenario: 'Costa generic travel article rejection',
    sourceType: 'public_review',
    title: 'Costa Rica travel guide article',
    snippet: 'Best hotels and top resorts affiliate guide for 2026.',
    expected: 'reject',
  },
  {
    id: 'lzt-success-pain-conversation',
    clientId: 'lzt_costa_rica_001',
    clientName: 'LZT Costa Rica',
    scenario: 'successful LZT pain/problem conversation',
    sourceType: 'public_forum',
    title: 'Terreno no drena y necesito planta de tratamiento',
    snippet: 'Estoy construyendo cabinas en Guanacaste y MINSA pide solución de aguas residuales.',
    expected: 'accept',
  },
  {
    id: 'lzt-septic-cleaning-rejection',
    clientId: 'lzt_costa_rica_001',
    clientName: 'LZT Costa Rica',
    scenario: 'LZT septic cleaning rejection',
    sourceType: 'public_business_listing',
    title: 'Servicio de limpieza de tanque séptico',
    snippet: 'Camión cisterna para mantenimiento y limpieza de tanque séptico.',
    expected: 'reject',
  },
];

const safetyRules = [
  'Conversation-first simulation uses in-memory fixtures only.',
  'No Tavily, provider, network calls, scraping, browser automation, login, contact extraction, or outreach are used.',
  'Simulation outcomes are local guardrails; human review remains required before delivery.',
];

export function runConversationFirstSimulation(now = new Date()): ConversationFirstSimulationReport {
  const results = fixtures.map(scoreFixture);
  const failedFixtures = results.filter((result) => !result.passed).length;
  const report: ConversationFirstSimulationReport = {
    generatedAt: now.toISOString(),
    status: failedFixtures === 0 ? 'passed' : 'failed',
    totalFixtures: results.length,
    passedFixtures: results.length - failedFixtures,
    failedFixtures,
    results,
    safetyRules,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(markdownPath, renderMarkdown(report), 'utf8');
  if (report.status === 'failed') process.exitCode = 1;
  return report;
}

function scoreFixture(fixture: ConversationSimulationFixture): ConversationSimulationResult {
  const text = `${fixture.title} ${fixture.snippet}`.toLowerCase();
  const matchedPositiveSignals = positiveSignals.filter((signal) => text.includes(signal));
  const matchedNegativeSignals = negativeSignals.filter((signal) => text.includes(signal));
  const decision: SimulationDecision = matchedNegativeSignals.length > 0 ? 'reject' : matchedPositiveSignals.length > 0 ? 'accept' : 'reject';
  return {
    ...fixture,
    decision,
    passed: decision === fixture.expected,
    matchedPositiveSignals,
    matchedNegativeSignals,
    reason: decision === 'accept'
      ? `Accepted from buyer conversation signals: ${matchedPositiveSignals.join(', ')}.`
      : `Rejected from negative/page-type signals: ${matchedNegativeSignals.join(', ') || 'missing buyer conversation signal'}.`,
  };
}

function renderMarkdown(report: ConversationFirstSimulationReport): string {
  return `# Conversation-First Simulation

Generated: ${report.generatedAt}

## Summary

- Status: ${report.status}
- Fixtures: ${report.totalFixtures}
- Passed: ${report.passedFixtures}
- Failed: ${report.failedFixtures}

## Results

${report.results.map((result) => `- ${result.passed ? 'PASS' : 'FAIL'} | ${result.scenario} | expected ${result.expected}, got ${result.decision}
  - ${result.reason}`).join('\n')}

## Safety

${report.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

if (require.main === module) {
  const report = runConversationFirstSimulation();
  console.log(`Conversation-first simulation ${report.status}: ${report.passedFixtures}/${report.totalFixtures} passed`);
  console.log(`JSON: ${path.relative(process.cwd(), jsonPath)}`);
  console.log(`Markdown: ${path.relative(process.cwd(), markdownPath)}`);
  console.log('Fixture simulation only. No Tavily, provider, network, scraping, browser automation, contact extraction, outreach, or login ran.');
}

