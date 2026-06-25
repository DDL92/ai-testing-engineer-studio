import fs = require('fs');
import path = require('path');

interface SafeCommandsReport {
  generatedAt: string;
  currentReason: 'cost_budget_paused';
  safeOfflineCommands: string[];
  blockedTavilyCommands: string[];
  recommendedNextCommand: string;
  safetyRules: string[];
}

const outputDir = path.join(process.cwd(), 'output', 'operator');
const markdownPath = path.join(outputDir, 'safe-commands.md');
const jsonPath = path.join(outputDir, 'safe-commands.json');

const safeOfflineCommands = [
  'npm run typecheck',
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
  const report: SafeCommandsReport = {
    generatedAt: now.toISOString(),
    currentReason: 'cost_budget_paused',
    safeOfflineCommands,
    blockedTavilyCommands,
    recommendedNextCommand: 'npm run leads:operator',
    safetyRules: [
      'No Tavily, providers, network calls, browser automation, login, scraping, contact extraction, outreach, emails, DMs, calls, or forms.',
      'Use offline validation and commercial preparation commands while credits are exhausted.',
      'Resume live discovery only after credits reset and Tavily health is checked manually.',
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

## Safe Offline Commands

${report.safeOfflineCommands.map((command) => `- \`${command}\``).join('\n')}

## Blocked Tavily Commands

${report.blockedTavilyCommands.map((command) => `- \`${command}\``).join('\n')}

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
  console.log(`Recommended next command: ${report.recommendedNextCommand}`);
}
