import fs = require('fs');
import path = require('path');
import { loadCostBudget } from './costBudgetManager';
import { loadLoopState, saveLoopState } from './loopStateManager';
import { getStopReasons, recommendationsForStopReasons, shouldStopLoop, StopReason } from './loopStopConditions';
import type { LoopState } from './loopStateTypes';

interface EscalationReport {
  generatedAt: string;
  paused: boolean;
  stopReasons: string[];
  recommendations: string[];
  state: LoopState;
  costHealth: string;
  safetyRules: string[];
}

const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'loop-health');
const escalationMdPath = path.join(outputDir, 'escalation-report.md');
const escalationJsonPath = path.join(outputDir, 'escalation-report.json');

const safetyRules = [
  'Loop health monitoring is local only.',
  'No Tavily, provider calls, network requests, browser automation, login, scraping, contact extraction, outreach, emails, DMs, calls, or forms are used.',
  'Stop conditions pause the loop and require human approval before resuming.',
];

export function generateFailureEscalation(now = new Date()): EscalationReport {
  const costBudget = loadCostBudget();
  const existing = loadLoopState();
  const stopReasons = getEscalationReasons(existing, costBudget.costHealth);
  const paused = shouldStopLoop(existing) || costBudget.costHealth === 'paused' || stopReasons.length > 0;
  const recommendations = recommendationsFor(existing, stopReasons, costBudget.costHealth);
  const state = saveLoopState({
    ...existing,
    paused,
    pauseReasons: stopReasons,
    recommendations,
    humanApprovalRequired: paused,
    lastLoopOutcome: paused ? 'paused' : existing.lastLoopOutcome,
  });
  const report: EscalationReport = {
    generatedAt: now.toISOString(),
    paused,
    stopReasons,
    recommendations,
    state,
    costHealth: costBudget.costHealth,
    safetyRules,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(escalationMdPath, renderEscalation(report), 'utf8');
  fs.writeFileSync(escalationJsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

function getEscalationReasons(state: LoopState, costHealth: string): string[] {
  const reasons = [...getStopReasons(state)];
  if (state.consecutiveProviderFailures >= 5 && !reasons.includes('too_many_provider_failures')) reasons.push('too_many_provider_failures');
  if (state.consecutiveNoDeliveryRuns >= 10 && !reasons.includes('too_many_no_delivery_runs')) reasons.push('too_many_no_delivery_runs');
  if (state.consecutiveEmptyRuns >= 5 && !reasons.includes('too_many_empty_runs')) reasons.push('too_many_empty_runs');
  if (costHealth === 'paused') return [...reasons, 'cost_budget_paused'];
  return reasons;
}

function recommendationsFor(state: LoopState, reasons: string[], costHealth: string): string[] {
  const stopReasons = reasons.filter((reason): reason is StopReason => [
    'too_many_empty_runs',
    'too_many_provider_failures',
    'too_many_no_delivery_runs',
    'max_duration_reached',
  ].includes(reason));
  const recommendations = stopReasons.length ? recommendationsForStopReasons(stopReasons) : [];
  if (state.consecutiveProviderFailures >= 5) recommendations.push('Generate escalation report and keep provider search disabled until manually approved.');
  if (state.consecutiveNoDeliveryRuns >= 10) recommendations.push('Generate tuning recommendation for buyer-role, lead-like, and delivery thresholds.');
  if (state.consecutiveEmptyRuns >= 5) recommendations.push('Run `npm run leads:simulate` and inspect fixture failures before resuming.');
  if (costHealth === 'paused') recommendations.push('External search remains disabled because estimated budget health is paused.');
  return [...new Set(recommendations)];
}

function renderEscalation(report: EscalationReport): string {
  return `# Lead Discovery Loop Escalation Report

Generated: ${report.generatedAt}

## Status

- Paused: ${report.paused ? 'yes' : 'no'}
- Stop reasons: ${report.stopReasons.join(', ') || 'none'}
- Cost health: ${report.costHealth}
- Consecutive failures: ${report.state.consecutiveFailures}
- Consecutive empty runs: ${report.state.consecutiveEmptyRuns}
- Consecutive no delivery runs: ${report.state.consecutiveNoDeliveryRuns}
- Consecutive provider failures: ${report.state.consecutiveProviderFailures}
- Last provider: ${report.state.lastProvider}
- Last provider health: ${report.state.lastProviderHealth}
- Last successful run: ${report.state.lastSuccessfulRunAt ?? 'none'}
- Last outcome: ${report.state.lastLoopOutcome}

## Recommendations

${report.recommendations.map((recommendation) => `- ${recommendation}`).join('\n') || '- None.'}

## Safety

${report.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function main(): void {
  const report = generateFailureEscalation();
  console.log(`Loop escalation generated: ${path.relative(process.cwd(), escalationMdPath)}, ${path.relative(process.cwd(), escalationJsonPath)}`);
  console.log(`Paused: ${report.paused ? 'yes' : 'no'}`);
  console.log(`Stop reasons: ${report.stopReasons.join(', ') || 'none'}`);
}

if (require.main === module) main();
