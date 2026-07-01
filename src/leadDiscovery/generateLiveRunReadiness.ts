import fs = require('fs');
import path = require('path');
import { getTavilyRuntimeConfig } from '../integrations/tavily/tavilyClient';
import { runtimeOutputPath } from '../runtimePaths';
import { getBudgetDecision } from './tavilyBudgetManager';
import { TavilyBudgetDecision, TavilyQueryAllocation } from './tavilyBudgetTypes';

type LiveReadinessState = 'READY_FOR_LIVE_RUN' | 'OFFLINE_ONLY' | 'BLOCKED';
type CheckStatus = 'pass' | 'warn' | 'fail';

interface LiveReadinessCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
}

interface LiveRunReadinessReport {
  generatedAt: string;
  readinessState: LiveReadinessState;
  recommendedNextCommand: string;
  blockedReason: string | null;
  estimatedCreditsForNextRun: number;
  allowedClients: Array<{ clientId: string; clientName: string; searchCredits: number }>;
  liveCommandWhenReady: string | null;
  safetyChecklist: LiveReadinessCheck[];
  safetyRules: string[];
}

interface RepoCheckReport {
  status?: string;
  hardFailure?: boolean;
}

interface RegressionReport {
  generatedAt?: string;
  metrics?: {
    failed?: number;
    passed?: number;
    passRate?: number;
  };
}

interface LoopHealthReport {
  state?: {
    paused?: boolean;
    pauseReasons?: string[];
    consecutiveProviderFailures?: number;
    lastProviderHealth?: string;
  };
}

const outputDir = runtimeOutputPath('lead-discovery', 'live-readiness');
const markdownPath = path.join(outputDir, 'live-readiness.md');
const jsonPath = path.join(outputDir, 'live-readiness.json');

const queryAllocationPath = runtimeOutputPath('lead-discovery', 'tavily-budget', 'query-allocation.json');
const repoCheckPath = path.join(process.cwd(), 'output', 'operator', 'repo-check.json');
const regressionPath = path.join(process.cwd(), 'output', 'lead-discovery', 'regression', 'regression-results.json');
const loopHealthPath = path.join(process.cwd(), 'output', 'lead-discovery', 'loop-health', 'loop-health-summary.json');
const safeCommandsPath = path.join(process.cwd(), 'output', 'operator', 'safe-commands.json');
const operatorBriefPath = path.join(process.cwd(), 'output', 'operator', 'daily-operator-brief.json');

const doNotRunDocs = [
  'docs/status/do-not-run-until-credits-reset.md',
  'docs/status/tavily-reset-plan.md',
];

const safetyRules = [
  'Live readiness is local only and does not call Tavily, providers, network, browser automation, scraping, login, contact extraction, or outreach.',
  'Secrets are never printed; Tavily API key readiness is reported only as configured or missing.',
  'Live discovery is allowed only on policy run days, with healthy or warning budget health, basic search, crawl/research disabled, and max run credits <= 60.',
  'Human approval remains required before running any live Tavily command.',
];

export function generateLiveRunReadiness(now = new Date()): LiveRunReadinessReport {
  const budget = getBudgetDecision(now);
  const allocation = readJsonOrNull<TavilyQueryAllocation>(queryAllocationPath);
  const checks = buildChecks(budget, allocation);
  const hardFailures = checks.filter((check) => check.status === 'fail');
  const offSchedule = checks.some((check) => check.id === 'allowed_run_day' && check.status === 'warn');
  const readinessState: LiveReadinessState = hardFailures.length > 0 ? 'BLOCKED' : offSchedule ? 'OFFLINE_ONLY' : 'READY_FOR_LIVE_RUN';
  const blockedReason = hardFailures[0]?.detail ?? (offSchedule ? 'Today is outside the allowed Tavily run schedule.' : null);
  const report: LiveRunReadinessReport = {
    generatedAt: now.toISOString(),
    readinessState,
    recommendedNextCommand: readinessState === 'READY_FOR_LIVE_RUN'
      ? 'npm run leads:morning'
      : readinessState === 'OFFLINE_ONLY'
        ? 'npm run leads:tavily-budget'
        : recommendedBlockedCommand(hardFailures),
    blockedReason,
    estimatedCreditsForNextRun: allocation?.estimatedTotalCredits ?? 0,
    allowedClients: (allocation?.clients ?? []).map((client) => ({
      clientId: client.clientId,
      clientName: client.clientName,
      searchCredits: client.searchCredits,
    })),
    liveCommandWhenReady: readinessState === 'READY_FOR_LIVE_RUN' ? 'npm run leads:morning' : null,
    safetyChecklist: checks,
    safetyRules,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(markdownPath, renderMarkdown(report), 'utf8');
  return report;
}

function buildChecks(budget: TavilyBudgetDecision, allocation: TavilyQueryAllocation | null): LiveReadinessCheck[] {
  const runtime = getTavilyRuntimeConfig();
  const repoCheck = readJsonOrNull<RepoCheckReport>(repoCheckPath);
  const regression = readJsonOrNull<RegressionReport>(regressionPath);
  const loopHealth = readJsonOrNull<LoopHealthReport>(loopHealthPath);
  const providerPaused = Boolean(loopHealth?.state?.paused && (
    (loopHealth.state.pauseReasons ?? []).some((reason) => reason.includes('provider'))
    || (loopHealth.state.consecutiveProviderFailures ?? 0) > 0
    || loopHealth.state.lastProviderHealth === 'failed'
  ));

  return [
    check('api_key', 'Tavily API key configured', runtime.hasApiKey, 'Tavily API key is configured without exposing its value.', 'Tavily API key is missing.'),
    check('budget_health', 'Budget health is usable', ['healthy', 'warning'].includes(budget.budgetHealth), `Budget health is ${budget.budgetHealth}.`, `Budget health is ${budget.budgetHealth}; live discovery is blocked.`),
    {
      id: 'allowed_run_day',
      label: 'Today is an allowed run day',
      status: budget.allowedToday ? 'pass' : 'warn',
      detail: budget.allowedToday ? `Today is allowed: ${budget.todayDayName}.` : `Today is ${budget.todayDayName}; next allowed run is ${budget.nextAllowedRunDay}.`,
    },
    check('query_allocation_exists', 'Query allocation exists', Boolean(allocation), 'Query allocation artifact exists.', 'Run npm run leads:tavily-allocation before live discovery.'),
    check('max_credits_per_run', 'Max credits per run <= 60', budget.maxCreditsPerRun <= 60 && (allocation?.estimatedTotalCredits ?? 0) <= 60, `Max run credits ${budget.maxCreditsPerRun}; next run estimate ${allocation?.estimatedTotalCredits ?? 0}.`, 'Credit cap exceeds 60 or allocation is missing.'),
    check('advanced_search_disabled', 'Advanced search disabled', !budget.allowAdvancedSearch && budget.defaultSearchDepth === 'basic', 'Basic search only.', 'Advanced search is enabled or default search depth is not basic.'),
    check('crawl_disabled', 'Crawl disabled', !budget.allowCrawl, 'Crawl is disabled.', 'Crawl is enabled.'),
    check('research_disabled', 'Research disabled', !budget.allowResearch, 'Research is disabled.', 'Research is enabled.'),
    check('extract_capped_filtered', 'Extract capped and filtered', budget.allowExtract && budget.maxExtractCreditsPerRun <= 8 && budget.extractOnlyAfterCandidateFiltering, `Extract cap is ${budget.maxExtractCreditsPerRun} and filtering is required first.`, 'Extract is uncapped, disabled unexpectedly, or not restricted to filtered candidates.'),
    check('repo_check_passes', 'Repo check passes', Boolean(repoCheck && repoCheck.status === 'pass' && !repoCheck.hardFailure), repoCheck ? `Repo check status: ${repoCheck.status}.` : 'Repo check is missing.', 'Run npm run repo:check and resolve failures before live discovery.'),
    check('regression_available', 'Regression suite latest status available', Boolean(regression?.metrics && (regression.metrics.failed ?? 1) === 0), regression?.metrics ? `Regression passed ${regression.metrics.passed ?? 0}; failed ${regression.metrics.failed ?? 0}.` : 'Regression status is missing.', 'Run npm run leads:regression and resolve failures before live discovery.'),
    check('loop_not_provider_paused', 'Loop not paused for provider failure', !providerPaused, 'No provider-failure pause detected.', 'Loop is paused for provider failure; run offline diagnostics first.'),
    check('safe_commands_exists', 'Safe commands file exists', fs.existsSync(safeCommandsPath), 'Safe commands artifact exists.', 'Run npm run leads:safe-commands.'),
    check('do_not_run_docs_exist', 'Do-not-run docs exist', doNotRunDocs.every((docPath) => fs.existsSync(path.join(process.cwd(), docPath))), 'Do-not-run and Tavily reset docs exist.', 'Required do-not-run docs are missing.'),
    check('operator_brief_exists', 'Operator brief exists', fs.existsSync(operatorBriefPath), 'Operator brief artifact exists.', 'Run npm run leads:operator.'),
  ];
}

function check(id: string, label: string, passed: boolean, passDetail: string, failDetail: string): LiveReadinessCheck {
  return {
    id,
    label,
    status: passed ? 'pass' : 'fail',
    detail: passed ? passDetail : failDetail,
  };
}

function recommendedBlockedCommand(failures: LiveReadinessCheck[]): string {
  const first = failures[0]?.id;
  if (first === 'query_allocation_exists') return 'npm run leads:tavily-allocation';
  if (first === 'repo_check_passes') return 'npm run repo:check';
  if (first === 'regression_available') return 'npm run leads:regression';
  if (first === 'safe_commands_exists') return 'npm run leads:safe-commands';
  if (first === 'operator_brief_exists') return 'npm run leads:operator';
  return 'npm run leads:live-readiness';
}

function renderMarkdown(report: LiveRunReadinessReport): string {
  return `# Live Tavily Run Readiness

Generated: ${report.generatedAt}

## Decision

- Readiness state: ${report.readinessState}
- Recommended next command: \`${report.recommendedNextCommand}\`
- Live command when ready: ${report.liveCommandWhenReady ? `\`${report.liveCommandWhenReady}\`` : 'not available'}
- Blocked reason: ${report.blockedReason ?? 'none'}
- Estimated credits for next run: ${report.estimatedCreditsForNextRun}
- Allowed clients: ${report.allowedClients.map((client) => `${client.clientName} (${client.searchCredits})`).join(', ') || 'none'}

## Safety Checklist

| Check | Status | Detail |
| --- | --- | --- |
${report.safetyChecklist.map((checkRow) => `| ${checkRow.label} | ${checkRow.status.toUpperCase()} | ${escapeTable(checkRow.detail)} |`).join('\n')}

## Safety Rules

${report.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function readJsonOrNull<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

if (require.main === module) {
  const report = generateLiveRunReadiness();
  console.log(`Live run readiness generated: ${path.relative(process.cwd(), markdownPath)}, ${path.relative(process.cwd(), jsonPath)}`);
  console.log(`Readiness state: ${report.readinessState}`);
  console.log(`Recommended next command: ${report.recommendedNextCommand}`);
  console.log(`Live command when ready: ${report.liveCommandWhenReady ?? 'not available'}`);
  console.log('Live readiness only. No Tavily, provider, network, scraping, browser, contact extraction, outreach, email, DM, calls, forms, or login was performed.');
}
