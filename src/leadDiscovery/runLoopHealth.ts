import fs = require('fs');
import path = require('path');
import { loadCostBudget } from './costBudgetManager';
import { generateFailureEscalation } from './failureEscalation';
import { loadLoopState } from './loopStateManager';

const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'loop-health');
const summaryPath = path.join(outputDir, 'loop-health-summary.md');
const summaryJsonPath = path.join(outputDir, 'loop-health-summary.json');

export function generateLoopHealth(): void {
  const escalation = generateFailureEscalation();
  const state = loadLoopState();
  const budget = loadCostBudget();
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(summaryPath, `# Loop Health Summary

Generated: ${new Date().toISOString()}

- Paused: ${state.paused ? 'yes' : 'no'}
- Stop reason: ${state.pauseReasons.join(', ') || 'none'}
- Consecutive failures: ${state.consecutiveFailures}
- Consecutive empty runs: ${state.consecutiveEmptyRuns}
- Consecutive no delivery runs: ${state.consecutiveNoDeliveryRuns}
- Consecutive provider failures: ${state.consecutiveProviderFailures}
- Provider health: ${state.lastProviderHealth}
- Estimated credits remaining: ${budget.estimatedCreditsRemaining}
- Cost health: ${budget.costHealth}
- Last successful run: ${state.lastSuccessfulRunAt ?? 'none'}
- Last outcome: ${state.lastLoopOutcome}
- Recommended next action: ${state.recommendations[0] ?? 'Continue local validation.'}
`, 'utf8');
  fs.writeFileSync(summaryJsonPath, `${JSON.stringify({ generatedAt: new Date().toISOString(), state, budget, escalation }, null, 2)}\n`, 'utf8');
}

function main(): void {
  generateLoopHealth();
  console.log(`Loop health generated: ${path.relative(process.cwd(), summaryPath)}, ${path.relative(process.cwd(), summaryJsonPath)}`);
  console.log('Local loop health only. No Tavily, provider calls, network, scraping, contact extraction, outreach, email, DM, calls, or login was performed.');
}

if (require.main === module) main();
