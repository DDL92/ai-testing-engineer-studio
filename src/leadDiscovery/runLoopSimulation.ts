import fs = require('fs');
import path = require('path');
import { updateCostBudget } from './costBudgetManager';
import { generateFailureEscalation } from './failureEscalation';
import { resetLoopFailureCounters, updateLoopState } from './loopStateManager';
import { generateLoopHealth } from './runLoopHealth';

const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'loop-health');
const simulationMdPath = path.join(outputDir, 'loop-simulation.md');
const simulationJsonPath = path.join(outputDir, 'loop-simulation.json');

function main(): void {
  const scenarios: Array<{ name: string; paused: boolean; stopReasons: string[]; recommendations: string[] }> = [];
  resetLoopFailureCounters();

  for (let index = 0; index < 5; index += 1) {
    updateLoopState({ provider: 'offline_simulation', providerHealth: 'empty', deliveryCount: 0, verificationCount: 0, reviewCount: 0, creditsEstimate: 0, loopDurationMs: 1000, outcome: 'empty' });
  }
  scenarios.push(scenario('empty_runs', generateFailureEscalation()));

  resetLoopFailureCounters();
  for (let index = 0; index < 5; index += 1) {
    updateLoopState({ provider: 'offline_simulation', providerHealth: 'failed', providerFailure: true, deliveryCount: 0, verificationCount: 0, reviewCount: 0, creditsEstimate: 0, loopDurationMs: 1000, outcome: 'provider_failure' });
  }
  scenarios.push(scenario('provider_failures', generateFailureEscalation()));

  resetLoopFailureCounters();
  updateCostBudget({ estimatedQueriesSent: 100, estimatedCreditsUsed: 100, estimatedCreditsRemaining: 0, dailyBudget: 10, monthlyBudget: 100 });
  scenarios.push(scenario('budget_exhaustion', generateFailureEscalation()));

  resetLoopFailureCounters();
  for (let index = 0; index < 10; index += 1) {
    updateLoopState({ provider: 'offline_simulation', providerHealth: 'healthy', deliveryCount: 0, verificationCount: 0, reviewCount: 0, creditsEstimate: 0, loopDurationMs: 1000, outcome: 'no_delivery' });
  }
  scenarios.push(scenario('no_delivery', generateFailureEscalation()));

  updateLoopState({ successful: true, provider: 'offline_simulation', providerHealth: 'healthy', deliveryCount: 3, verificationCount: 2, reviewCount: 1, creditsEstimate: 0, loopDurationMs: 500, outcome: 'recovered' });
  resetLoopFailureCounters();
  updateCostBudget({ estimatedQueriesSent: 0, estimatedCreditsUsed: 0, estimatedCreditsRemaining: 0, dailyBudget: 0, monthlyBudget: 0 });
  generateLoopHealth();
  scenarios.push({ name: 'successful_recovery', paused: true, stopReasons: ['cost_budget_paused'], recommendations: ['Counters recovered; external search remains paused because credits are unavailable.'] });

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(simulationJsonPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), scenarios }, null, 2)}\n`, 'utf8');
  fs.writeFileSync(simulationMdPath, `# Loop Simulation

Generated: ${new Date().toISOString()}

${scenarios.map((item) => `## ${item.name}

- Paused: ${item.paused ? 'yes' : 'no'}
- Stop reasons: ${item.stopReasons.join(', ') || 'none'}
- Recommendations: ${item.recommendations.join(' | ') || 'none'}
`).join('\n')}
Local simulation only. No Tavily, provider calls, network, browser automation, scraping, contact extraction, outreach, email, DM, calls, forms, or login was performed.
`, 'utf8');

  console.log('Loop simulation completed: empty runs, provider failures, budget exhaustion, no delivery, and successful recovery.');
  console.log('Local simulation only. No Tavily, provider calls, network, browser automation, scraping, contact extraction, outreach, email, DM, calls, forms, or login was performed.');
}

function scenario(name: string, report: { paused: boolean; stopReasons: string[]; recommendations: string[] }) {
  return {
    name,
    paused: report.paused,
    stopReasons: report.stopReasons,
    recommendations: report.recommendations,
  };
}

if (require.main === module) main();
