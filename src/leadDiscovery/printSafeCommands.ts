import fs = require('fs');
import path = require('path');
import { getBudgetDecision } from './tavilyBudgetManager';

interface SafeCommandsReport {
  generatedAt: string;
  currentReason: string;
  tavilyBudgetHealth: string;
  tavilyMonthlyLimit: number;
  tavilyEstimatedUsed: number;
  tavilyEstimatedRemaining: number;
  tavilyAllowedToday: boolean;
  tavilyNextAllowedRun: string;
  tavilyRecommendedMode: string;
  tavilyBlockedReason: string | null;
  safeOfflineCommands: string[];
  blockedTavilyCommands: Array<{ command: string; reason: string }>;
  recommendedNextCommand: string;
  safetyRules: string[];
}

const outputDir = path.join(process.cwd(), 'output', 'operator');
const markdownPath = path.join(outputDir, 'safe-commands.md');
const jsonPath = path.join(outputDir, 'safe-commands.json');

const safeOfflineCommands = [
  'npm run typecheck',
  'npm run leads:tavily-budget',
  'npm run leads:tavily-allocation',
  'npm run leads:safe-commands',
  'npm run leads:operator',
  'npm run leads:simulate',
  'npm run leads:regression',
  'npm run leads:review-simulate',
  'npm run leads:dashboard',
  'npm run leads:pilot-pack',
  'npm run leads:offer-pack',
  'npm run leads:meeting-prep',
  'npm run leads:call-tracker',
  'npm run leads:delivery-router',
];

const blockedTavilyCommands = [
  'npm run leads:search',
  'npm run leads:morning',
  'npm run leads:daily',
  'npm run leads:test-provider',
];

export function printSafeCommands(now = new Date()): SafeCommandsReport {
  const budget = getBudgetDecision(now);
  const blockedReason = budget.blockedReason ?? 'human_budget_approval_required_before_live_tavily_use';
  const report: SafeCommandsReport = {
    generatedAt: now.toISOString(),
    currentReason: blockedReason,
    tavilyBudgetHealth: budget.budgetHealth,
    tavilyMonthlyLimit: budget.monthlyCreditLimit,
    tavilyEstimatedUsed: budget.currentEstimatedCreditsUsed,
    tavilyEstimatedRemaining: budget.currentEstimatedCreditsRemaining,
    tavilyAllowedToday: budget.allowedToday,
    tavilyNextAllowedRun: budget.nextAllowedRunDay,
    tavilyRecommendedMode: budget.recommendedRunMode,
    tavilyBlockedReason: budget.blockedReason,
    safeOfflineCommands,
    blockedTavilyCommands: blockedTavilyCommands.map((command) => ({ command, reason: blockedReason })),
    recommendedNextCommand: budget.blockedReason ? 'npm run leads:tavily-budget' : 'npm run leads:tavily-allocation',
    safetyRules: [
      'No Tavily, providers, network calls, browser automation, login, scraping, contact extraction, outreach, emails, DMs, calls, or forms.',
      'Use offline validation, budget planning, query allocation, and commercial preparation commands before live discovery.',
      'Resume live discovery only on allowed run days, within allocation limits, and after human approval.',
      'Advanced search, crawl, and research remain disabled.',
    ],
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(markdownPath, renderReport(report), 'utf8');
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

export function getMaintenanceReadiness(): {
  statusDocsReady: string;
  generatedFilePolicyReady: string;
  safeCommandsReady: string;
  tavilyResetPlanReady: string;
  repoHygieneStatus: string;
  recommendedNextAction: string;
} {
  return {
    statusDocsReady: filesExist(
      'docs/status/current-system-status.md',
      'docs/status/commercial-readiness.md',
      'docs/status/do-not-run-until-credits-reset.md',
      'docs/status/next-sprint-options.md',
    ) ? 'READY' : 'MISSING',
    generatedFilePolicyReady: filesExist('docs/dev/generated-files-policy.md') ? 'READY' : 'MISSING',
    safeCommandsReady: filesExist('output/operator/safe-commands.md', 'output/operator/safe-commands.json') ? 'READY' : 'MISSING',
    tavilyResetPlanReady: filesExist('docs/status/tavily-reset-plan.md') ? 'READY' : 'MISSING',
    repoHygieneStatus: filesExist('.gitignore') ? 'READY' : 'MISSING',
    recommendedNextAction: 'Prepare and run the Flora conversation manually; keep live discovery paused until Tavily credits reset.',
  };
}

function renderReport(report: SafeCommandsReport): string {
  return `# Safe Commands

Generated: ${report.generatedAt}

Current reason: ${report.currentReason}

## Tavily Budget Status

- Budget health: ${report.tavilyBudgetHealth}
- Monthly limit: ${report.tavilyMonthlyLimit}
- Estimated used: ${report.tavilyEstimatedUsed}
- Estimated remaining: ${report.tavilyEstimatedRemaining}
- Allowed today: ${report.tavilyAllowedToday ? 'yes' : 'no'}
- Next allowed run: ${report.tavilyNextAllowedRun}
- Recommended mode: ${report.tavilyRecommendedMode}
- Blocked reason: ${report.tavilyBlockedReason ?? 'none'}

## Safe Offline Commands

${report.safeOfflineCommands.map((command) => `- \`${command}\``).join('\n')}

## Blocked Tavily Commands

${report.blockedTavilyCommands.map((row) => `- \`${row.command}\` - ${row.reason}`).join('\n')}

## Recommended Next Command

\`${report.recommendedNextCommand}\`

## Safety Rules

${report.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function filesExist(...relativePaths: string[]): boolean {
  return relativePaths.every((relativePath) => fs.existsSync(path.join(process.cwd(), relativePath)));
}

if (require.main === module) {
  const report = printSafeCommands();
  console.log(`Safe commands generated: ${path.relative(process.cwd(), markdownPath)}, ${path.relative(process.cwd(), jsonPath)}`);
  console.log(`Current reason: ${report.currentReason}`);
  console.log(`Tavily budget health: ${report.tavilyBudgetHealth}`);
  console.log(`Recommended next command: ${report.recommendedNextCommand}`);
}
