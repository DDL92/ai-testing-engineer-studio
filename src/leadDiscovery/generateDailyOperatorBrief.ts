import fs = require('fs');
import path = require('path');
import { recommendNextAction, OperatorStatus } from './recommendNextAction';
import { getBudgetDecision } from './tavilyBudgetManager';

interface SimulationReport {
  generatedAt: string;
  metrics: {
    precision: number;
    recall: number;
    falsePositives: number;
  };
}

interface RegressionReport {
  generatedAt: string;
  metrics: {
    passed: number;
    failed: number;
    passRate: number;
  };
}

interface ReviewReport {
  generatedAt: string;
  metrics: {
    approvalRate: number;
    falsePositiveCount: number;
    totalDecisions: number;
  };
}

interface LoopHealthReport {
  generatedAt: string;
  state: {
    lastSuccessfulRunAt: string | null;
    lastLoopOutcome: string;
    paused: boolean;
    pauseReasons: string[];
    consecutiveFailures: number;
    consecutiveEmptyRuns: number;
    consecutiveNoDeliveryRuns: number;
    lastProviderHealth: string;
  };
  budget: {
    estimatedCreditsRemaining: number;
    costHealth: OperatorStatus;
  };
}

interface OperatorBrief {
  generatedAt: string;
  date: string;
  systemStatus: OperatorStatus;
  loopStatus: string;
  pausedStatus: boolean;
  pauseReasons: string[];
  lastSuccessfulRun: string | null;
  lastOutcome: string;
  costHealth: OperatorStatus;
  estimatedCreditsRemaining: number;
  tavilyMonthlyLimit: number;
  tavilyEstimatedUsed: number;
  tavilyEstimatedRemaining: number;
  tavilyAllowedToday: boolean;
  tavilyNextAllowedRun: string;
  tavilyRecommendedMode: string;
  tavilyBlockedReason: string | null;
  tavilySafeCommandRecommendation: string;
  providerHealth: string;
  regressionHealth: string;
  reviewHealth: string;
  simulationPrecision: number;
  simulationRecall: number;
  regressionPassRate: number;
  reviewApprovalRate: number;
  falsePositiveCount: number;
  consecutiveFailures: number;
  consecutiveEmptyRuns: number;
  consecutiveNoDeliveryRuns: number;
  thingsToReviewToday: string[];
  doFirst: string[];
  doNext: string[];
  optional: string[];
  safeCommands: string[];
  blockedCommands: Array<{ command: string; reason: string }>;
  nextBestAction: ReturnType<typeof recommendNextAction>;
  safetyRules: string[];
}

const outputDir = path.join(process.cwd(), 'output', 'operator');
const briefMdPath = path.join(outputDir, 'daily-operator-brief.md');
const briefJsonPath = path.join(outputDir, 'daily-operator-brief.json');
const simulationPath = path.join(process.cwd(), 'output', 'lead-discovery', 'simulation', 'simulation-candidates.json');
const regressionPath = path.join(process.cwd(), 'output', 'lead-discovery', 'regression', 'regression-results.json');
const reviewSimulationPath = path.join(process.cwd(), 'output', 'lead-discovery', 'review', 'review-simulation.json');
const loopHealthPath = path.join(process.cwd(), 'output', 'lead-discovery', 'loop-health', 'loop-health-summary.json');

const safeCommands = [
  'npm run leads:tavily-budget',
  'npm run leads:tavily-allocation',
  'npm run leads:simulate',
  'npm run leads:regression',
  'npm run leads:review-simulate',
  'npm run leads:dashboard',
  'npm run leads:loop-health',
];

const providerCommands = [
  'npm run leads:search',
  'npm run leads:morning',
  'npm run leads:daily',
  'npm run leads:test-provider',
];

const safetyRules = [
  'Daily operator brief is local only.',
  'No Tavily, provider calls, network requests, browser automation, login, scraping, contact extraction, outreach, emails, DMs, calls, or forms are used.',
  'Blocked commands require human budget approval before use.',
];

export function generateDailyOperatorBrief(now = new Date()): OperatorBrief {
  const simulation = readJsonOrNull<SimulationReport>(simulationPath);
  const regression = readJsonOrNull<RegressionReport>(regressionPath);
  const review = readJsonOrNull<ReviewReport>(reviewSimulationPath);
  const loop = readJsonOrNull<LoopHealthReport>(loopHealthPath);
  const tavilyBudget = getBudgetDecision(now);
  const pauseReasons = loop?.state.pauseReasons ?? [];
  const costHealth = loop?.budget.costHealth ?? 'paused';
  const regressionFailed = regression?.metrics.failed ?? 0;
  const simulationPrecision = simulation?.metrics.precision ?? 0;
  const simulationRecall = simulation?.metrics.recall ?? 0;
  const reviewFalsePositiveCount = review?.metrics.falsePositiveCount ?? 0;
  const nextBestAction = recommendNextAction({
    loopPaused: loop?.state.paused ?? true,
    pauseReasons,
    costHealth,
    creditsRemaining: loop?.budget.estimatedCreditsRemaining ?? 0,
    regressionFailed,
    reviewFalsePositiveCount,
    simulationPrecision,
    simulationRecall,
  });
  const blockedCommands = providerCommands.map((command) => ({
    command,
    reason: tavilyBudget.blockedReason ?? (pauseReasons.join(', ') || 'human_budget_approval_required'),
  }));
  const brief: OperatorBrief = {
    generatedAt: now.toISOString(),
    date: now.toISOString().slice(0, 10),
    systemStatus: statusFor({ costHealth, regressionFailed, loopPaused: loop?.state.paused ?? true }),
    loopStatus: loop?.state.paused ? 'paused' : 'active',
    pausedStatus: loop?.state.paused ?? true,
    pauseReasons,
    lastSuccessfulRun: loop?.state.lastSuccessfulRunAt ?? null,
    lastOutcome: loop?.state.lastLoopOutcome ?? 'unknown',
    costHealth,
    estimatedCreditsRemaining: loop?.budget.estimatedCreditsRemaining ?? 0,
    tavilyMonthlyLimit: tavilyBudget.monthlyCreditLimit,
    tavilyEstimatedUsed: tavilyBudget.currentEstimatedCreditsUsed,
    tavilyEstimatedRemaining: tavilyBudget.currentEstimatedCreditsRemaining,
    tavilyAllowedToday: tavilyBudget.allowedToday,
    tavilyNextAllowedRun: tavilyBudget.nextAllowedRunDay,
    tavilyRecommendedMode: tavilyBudget.recommendedRunMode,
    tavilyBlockedReason: tavilyBudget.blockedReason,
    tavilySafeCommandRecommendation: tavilyBudget.safeCommandRecommendation,
    providerHealth: loop?.state.lastProviderHealth ?? 'unknown',
    regressionHealth: regressionFailed === 0 ? 'healthy' : 'critical',
    reviewHealth: reviewFalsePositiveCount === 0 ? 'healthy' : 'warning',
    simulationPrecision,
    simulationRecall,
    regressionPassRate: regression?.metrics.passRate ?? 0,
    reviewApprovalRate: review?.metrics.approvalRate ?? 0,
    falsePositiveCount: reviewFalsePositiveCount,
    consecutiveFailures: loop?.state.consecutiveFailures ?? 0,
    consecutiveEmptyRuns: loop?.state.consecutiveEmptyRuns ?? 0,
    consecutiveNoDeliveryRuns: loop?.state.consecutiveNoDeliveryRuns ?? 0,
    thingsToReviewToday: thingsToReview({ regressionFailed, reviewFalsePositiveCount, loopPaused: loop?.state.paused ?? true }),
    doFirst: doFirstFor(pauseReasons, costHealth),
    doNext: ['Run regression suite.', 'Run review simulation.', 'Refresh dashboard after local checks.'],
    optional: ['Add fixture examples.', 'Review dashboard trends.', 'Review false-positive learning notes.'],
    safeCommands,
    blockedCommands,
    nextBestAction,
    safetyRules,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(briefJsonPath, `${JSON.stringify(brief, null, 2)}\n`, 'utf8');
  fs.writeFileSync(briefMdPath, renderBrief(brief), 'utf8');
  return brief;
}

function statusFor(input: { costHealth: OperatorStatus; regressionFailed: number; loopPaused: boolean }): OperatorStatus {
  if (input.loopPaused || input.costHealth === 'paused') return 'paused';
  if (input.regressionFailed > 0 || input.costHealth === 'critical') return 'critical';
  if (input.costHealth === 'warning') return 'warning';
  return 'healthy';
}

function thingsToReview(input: { regressionFailed: number; reviewFalsePositiveCount: number; loopPaused: boolean }): string[] {
  const items = ['Review loop health', 'Review approval decisions'];
  if (input.loopPaused) items.push('Review escalation report');
  if (input.reviewFalsePositiveCount > 0) items.push('Review false positives');
  if (input.regressionFailed > 0) items.push('Review regression failures');
  items.push('Review verification candidates');
  return items;
}

function doFirstFor(pauseReasons: string[], costHealth: OperatorStatus): string[] {
  if (pauseReasons.includes('cost_budget_paused') || costHealth === 'paused') return ['Wait for Tavily credits reset.'];
  return ['Run local health check before any external search.'];
}

function renderBrief(brief: OperatorBrief): string {
  return `# Daily Operator Brief

Generated: ${brief.generatedAt}

## Operator Summary

- Date: ${brief.date}
- System status: ${brief.systemStatus}
- Loop status: ${brief.loopStatus}
- Paused status: ${brief.pausedStatus ? 'paused' : 'active'}
- Pause reasons: ${brief.pauseReasons.join(', ') || 'none'}
- Last successful run: ${brief.lastSuccessfulRun ?? 'none'}
- Last outcome: ${brief.lastOutcome}
- Cost health: ${brief.costHealth}
- Estimated credits remaining: ${brief.estimatedCreditsRemaining}
- Tavily monthly limit: ${brief.tavilyMonthlyLimit}
- Tavily estimated used: ${brief.tavilyEstimatedUsed}
- Tavily estimated remaining: ${brief.tavilyEstimatedRemaining}
- Tavily allowed today: ${brief.tavilyAllowedToday ? 'yes' : 'no'}
- Tavily next allowed run: ${brief.tavilyNextAllowedRun}
- Tavily recommended mode: ${brief.tavilyRecommendedMode}
- Tavily blocked reason: ${brief.tavilyBlockedReason ?? 'none'}
- Tavily safe command recommendation: ${brief.tavilySafeCommandRecommendation}
- Provider health: ${brief.providerHealth}
- Regression health: ${brief.regressionHealth}
- Review health: ${brief.reviewHealth}

## Things To Review Today

${brief.thingsToReviewToday.map((item) => `- ${item}`).join('\n')}

## Recommended Actions

### Do First

${brief.doFirst.map((item) => `- ${item}`).join('\n')}

### Do Next

${brief.doNext.map((item) => `- ${item}`).join('\n')}

### Optional

${brief.optional.map((item) => `- ${item}`).join('\n')}

## Commands

### Safe Commands

${brief.safeCommands.map((command) => `- \`${command}\``).join('\n')}

### Blocked Commands

${brief.blockedCommands.map((row) => `- \`${row.command}\` - ${row.reason}`).join('\n')}

## Next Best Action

- Action: ${brief.nextBestAction.nextAction}
- Command: \`${brief.nextBestAction.nextCommand}\`
- Reason: ${brief.nextBestAction.reason}
- Estimated time: ${brief.nextBestAction.estimatedTimeMinutes} minutes

## Daily Metrics

- Simulation precision: ${toPercent(brief.simulationPrecision)}
- Simulation recall: ${toPercent(brief.simulationRecall)}
- Regression pass rate: ${toPercent(brief.regressionPassRate)}
- Review approval rate: ${toPercent(brief.reviewApprovalRate)}
- False positive count: ${brief.falsePositiveCount}
- Loop health: ${brief.loopStatus}
- Credits remaining estimate: ${brief.estimatedCreditsRemaining}
- Consecutive failures: ${brief.consecutiveFailures}
- Consecutive empty runs: ${brief.consecutiveEmptyRuns}
- Consecutive no delivery runs: ${brief.consecutiveNoDeliveryRuns}

## Safety

${brief.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function readJsonOrNull<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function toPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function main(): void {
  const brief = generateDailyOperatorBrief();
  console.log(`Daily operator brief generated: ${path.relative(process.cwd(), briefMdPath)}, ${path.relative(process.cwd(), briefJsonPath)}`);
  console.log(`System status: ${brief.systemStatus}`);
  console.log(`Next action: ${brief.nextBestAction.nextAction}`);
  console.log('Local operator brief only. No Tavily, provider calls, network, browser automation, scraping, contact extraction, outreach, email, DM, calls, forms, or login was performed.');
}

if (require.main === module) main();
