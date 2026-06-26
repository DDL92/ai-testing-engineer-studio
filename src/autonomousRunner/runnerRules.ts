import childProcess = require('child_process');
import fs = require('fs');
import path = require('path');
import { getTavilyRuntimeConfig } from '../integrations/tavily/tavilyClient';
import { getRevenueSourceOfTruth } from '../revenueIntelligence/sourceOfTruth';
import { runtimeDataPath, runtimeOutputPath } from '../runtimePaths';
import {
  RunnerCommandDefinition,
  RunnerCommandResult,
  RunnerDashboardSummary,
  RunnerHealthCheck,
  RunnerHealthReport,
  RunnerHealthStatus,
  RunnerLastRun,
  RunnerPlan,
  RunnerState,
} from './types';

const dataDir = runtimeDataPath('autonomous-runner');
const outputDir = runtimeOutputPath('autonomous-runner');
const runnerStatePath = path.join(dataDir, 'runner-state.json');
const lastRunPath = path.join(dataDir, 'last-run.json');

export const runnerSequence: RunnerCommandDefinition[] = [
  { script: 'web:lead-discovery', description: 'Refresh public Tavily lead discovery.', phase: 'discovery' },
  { script: 'web:pain-mining', description: 'Refresh public Tavily pain signals.', phase: 'discovery' },
  { script: 'web:lead-normalize', description: 'Normalize raw web lead titles into company records.', phase: 'qualification' },
  { script: 'web:lead-classify', description: 'Classify normalized leads by SaaS category.', phase: 'qualification' },
  { script: 'web:lead-qualify', description: 'Score normalized leads for qualification.', phase: 'qualification' },
  { script: 'web:qualified-ranking', description: 'Generate final qualified web lead ranking.', phase: 'qualification' },
  { script: 'evidence:package', description: 'Refresh the local evidence package for commercial review.', phase: 'evidence' },
  { script: 'lead:rotation', description: 'Select the highest-ranked evidence-ready actionable lead.', phase: 'rotation' },
  { script: 'revenue:focus', description: 'Refresh the first-revenue focus report.', phase: 'revenue' },
  { script: 'day:plan', description: 'Refresh the daily revenue operating plan.', phase: 'planning' },
  { script: 'dashboard:generate', description: 'Regenerate the read-only dashboard data.', phase: 'dashboard' },
  { script: 'mobile:summary', description: 'Regenerate the mobile command center summary.', phase: 'mobile' },
  { script: 'revenue:morning', description: 'Generate the Revenue Mode morning brief.', phase: 'revenue' },
  { script: 'revenue:today', description: 'Generate the top three revenue-priority actions.', phase: 'revenue' },
  { script: 'revenue:summary', description: 'Generate the consolidated Revenue Mode summary.', phase: 'revenue' },
];

export const runnerSafetyRules = [
  'No outreach is sent.',
  'No emails or LinkedIn messages are sent.',
  'No CRM records, meetings, invoices, payments, revenue, or client activity are created.',
  'Only existing local Studio commands are executed.',
  'Human approval is required before any external business action.',
];

export function buildRunnerPlan(): RunnerPlan {
  ensureRunnerState();
  return {
    generatedAt: new Date().toISOString(),
    nextScheduledRun: nextScheduledRunLabel(),
    sequence: runnerSequence,
    safetyRules: runnerSafetyRules,
  };
}

export function writeRunnerPlan(): string[] {
  const plan = buildRunnerPlan();
  return writeOutputs([
    { fileName: 'runner-plan.md', body: renderRunnerPlan(plan) },
    { fileName: 'daily-execution-flow.md', body: renderDailyExecutionFlow(plan) },
  ]);
}

export function executeRunnerSequence(mode: RunnerLastRun['mode'] = 'test'): RunnerLastRun {
  ensureRunnerState();
  fs.mkdirSync(dataDir, { recursive: true });
  const startedAtMs = Date.now();
  const startedAt = new Date(startedAtMs).toISOString();
  const commandsExecuted: RunnerCommandResult[] = [];

  for (const command of runnerSequence) {
    commandsExecuted.push(runCommand(command));
  }

  const finishedAtMs = Date.now();
  const failed = commandsExecuted.filter((command) => command.status === 'failed');
  const lastRun: RunnerLastRun = {
    runId: `runner-${startedAt.replace(/[:.]/g, '-')}`,
    mode,
    startedAt,
    finishedAt: new Date(finishedAtMs).toISOString(),
    durationMs: finishedAtMs - startedAtMs,
    success: failed.length === 0,
    commandsExecuted,
    warnings: failed.map((command) => `${command.script} failed with exit code ${command.exitCode ?? 'unknown'}`),
  };

  fs.writeFileSync(lastRunPath, `${JSON.stringify(lastRun, null, 2)}\n`, 'utf8');
  writeRunnerSummary(lastRun);
  writeRunnerHealth();
  return lastRun;
}

export function writeRunnerSummary(lastRun = readLastRun()): string[] {
  return writeOutputs([
    { fileName: 'runner-summary.md', body: renderRunnerSummary(lastRun) },
  ]);
}

export function buildRunnerHealth(): RunnerHealthReport {
  ensureRunnerState();
  const lastRun = readLastRun();
  const checks: RunnerHealthCheck[] = [];
  const tavily = getTavilyRuntimeConfig();
  checks.push({
    label: 'Tavily API Key',
    status: tavily.hasApiKey ? 'Healthy' : 'Needs Review',
    detail: tavily.hasApiKey ? 'Tavily API key detected in local environment.' : 'Missing Tavily key. Web discovery can only use fallback/manual mode.',
  });

  checks.push(commandCheck(lastRun, 'web:lead-discovery', 'Lead Discovery'));
  checks.push(commandCheck(lastRun, 'web:pain-mining', 'Pain Mining'));
  checks.push(commandCheck(lastRun, 'web:qualified-ranking', 'Qualified Ranking'));
  checks.push(stalenessCheck('Dashboard Data', path.join(process.cwd(), 'output', 'dashboard', 'dashboard.json')));
  checks.push(stalenessCheck('Mobile Summary', path.join(process.cwd(), 'output', 'mobile', 'mobile-summary.md')));

  if (!lastRun) {
    checks.push({
      label: 'Runner Last Run',
      status: 'Warning',
      detail: 'No runner test or scheduled run has been recorded yet.',
    });
  }

  const warnings = checks.filter((check) => check.status !== 'Healthy').map((check) => `${check.label}: ${check.detail}`);
  const status: RunnerHealthStatus = checks.some((check) => check.status === 'Needs Review')
    ? 'Needs Review'
    : checks.some((check) => check.status === 'Warning') ? 'Warning' : 'Healthy';

  return {
    generatedAt: new Date().toISOString(),
    status,
    checks,
    warnings,
    lastRun,
    nextScheduledRun: nextScheduledRunLabel(),
  };
}

export function writeRunnerHealth(): string[] {
  const report = buildRunnerHealth();
  return writeOutputs([
    { fileName: 'runner-health.md', body: renderRunnerHealth(report) },
  ]);
}

export function writeLaunchdConfig(): string[] {
  ensureRunnerState();
  return writeOutputs([
    { fileName: 'launchd-setup.md', body: renderLaunchdSetup() },
    { fileName: 'launchd-plist.xml', body: renderLaunchdPlist() },
  ]);
}

export function buildRunnerDashboard(): RunnerDashboardSummary {
  const source = getRevenueSourceOfTruth();
  const health = buildRunnerHealth();
  const lastSuccessfulRun = health.lastRun?.success ? health.lastRun.finishedAt : 'No successful run recorded';
  const failedCommands = health.lastRun?.commandsExecuted.filter((command) => command.status === 'failed') ?? [];

  return {
    autonomousRunnerStatus: health.lastRun ? (health.lastRun.success ? 'Last run completed' : 'Last run completed with failures') : 'No run recorded',
    lastSuccessfulRun,
    nextScheduledRun: health.nextScheduledRun,
    runnerHealth: health.status,
    dailyRefreshStatus: failedCommands.length > 0 ? `${failedCommands.length} command(s) need review` : health.lastRun ? `Refresh sequence complete. Actionable lead: ${source.actionableLead}.` : `Waiting for first run. Actionable lead: ${source.actionableLead}.`,
  };
}

function runCommand(command: RunnerCommandDefinition): RunnerCommandResult {
  const startedAtMs = Date.now();
  const startedAt = new Date(startedAtMs).toISOString();
  const result = childProcess.spawnSync('npm', ['run', command.script], {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
    shell: false,
  });
  const finishedAtMs = Date.now();
  const exitCode = typeof result.status === 'number' ? result.status : null;
  const failed = result.error || exitCode !== 0;

  return {
    script: command.script,
    description: command.description,
    phase: command.phase,
    status: failed ? 'failed' : 'success',
    exitCode,
    startedAt,
    finishedAt: new Date(finishedAtMs).toISOString(),
    durationMs: finishedAtMs - startedAtMs,
    outputTail: tail(result.stdout),
    errorTail: tail([result.stderr, result.error?.message].filter(Boolean).join('\n')),
  };
}

function commandCheck(lastRun: RunnerLastRun | null, script: string, label: string): RunnerHealthCheck {
  if (!lastRun) {
    return {
      label,
      status: 'Warning',
      detail: 'No runner run recorded yet.',
    };
  }

  const command = lastRun.commandsExecuted.find((item) => item.script === script);
  if (!command) {
    return {
      label,
      status: 'Warning',
      detail: `${script} has not been executed by the runner yet.`,
    };
  }

  return {
    label,
    status: command.status === 'success' ? 'Healthy' : 'Needs Review',
    detail: command.status === 'success' ? `${script} completed successfully in ${formatDuration(command.durationMs)}.` : `${script} failed with exit code ${command.exitCode ?? 'unknown'}.`,
  };
}

function stalenessCheck(label: string, filePath: string): RunnerHealthCheck {
  if (!fs.existsSync(filePath)) {
    return {
      label,
      status: 'Needs Review',
      detail: `${path.relative(process.cwd(), filePath)} is missing.`,
    };
  }

  const ageMs = Date.now() - fs.statSync(filePath).mtimeMs;
  const stale = ageMs > 26 * 60 * 60 * 1000;
  return {
    label,
    status: stale ? 'Warning' : 'Healthy',
    detail: stale ? `${path.relative(process.cwd(), filePath)} is older than 26 hours.` : `${path.relative(process.cwd(), filePath)} is fresh.`,
  };
}

function ensureRunnerState(): RunnerState {
  fs.mkdirSync(dataDir, { recursive: true });
  const state: RunnerState = {
    version: 1,
    mode: 'local-only-human-approved',
    schedule: {
      weekdays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      time: '07:00',
      timezone: 'America/Costa_Rica',
    },
    sequence: runnerSequence,
    safetyRules: runnerSafetyRules,
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(runnerStatePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  if (!fs.existsSync(lastRunPath)) {
    fs.writeFileSync(lastRunPath, `${JSON.stringify(null, null, 2)}\n`, 'utf8');
  }
  return state;
}

function readLastRun(): RunnerLastRun | null {
  return readJson<RunnerLastRun | null>(lastRunPath, null);
}

function renderRunnerPlan(plan: RunnerPlan): string {
  return [
    '# Autonomous Runner Plan',
    '',
    `Generated: ${plan.generatedAt}`,
    '',
    `Schedule: Monday-Friday at 07:00 America/Costa_Rica`,
    `Next Scheduled Run: ${plan.nextScheduledRun}`,
    '',
    '## Execution Order',
    ...plan.sequence.map((command, index) => `${index + 1}. npm run ${command.script} - ${command.description}`),
    '',
    '## Safety Rules',
    bullets(plan.safetyRules),
    '',
  ].join('\n');
}

function renderDailyExecutionFlow(plan: RunnerPlan): string {
  return [
    '# Daily Execution Flow',
    '',
    'The autonomous runner executes these commands sequentially. It does not send outreach, install launchd, or create client activity.',
    '',
    '```bash',
    ...plan.sequence.map((command) => `npm run ${command.script}`),
    '```',
    '',
  ].join('\n');
}

function renderRunnerSummary(lastRun: RunnerLastRun | null): string {
  const source = getRevenueSourceOfTruth();
  if (!lastRun) {
    return [
      '# Autonomous Runner Summary',
      '',
      'No runner execution has been recorded yet.',
      '',
      `Revenue Intelligence Top Lead: ${source.topLead}`,
      `Recommended Offer: ${source.recommendedOffer}`,
      `Next Action: ${source.nextAction}`,
      '',
      'Run `npm run runner:test` to execute the daily refresh sequence once.',
      '',
    ].join('\n');
  }

  return [
    '# Autonomous Runner Summary',
    '',
    `Run ID: ${lastRun.runId}`,
    `Mode: ${lastRun.mode}`,
    `Started: ${lastRun.startedAt}`,
    `Finished: ${lastRun.finishedAt}`,
    `Duration: ${formatDuration(lastRun.durationMs)}`,
    `Status: ${lastRun.success ? 'Success' : 'Needs Review'}`,
    `Revenue Intelligence Top Lead: ${source.topLead}`,
    `Recommended Offer: ${source.recommendedOffer}`,
    `Next Action: ${source.nextAction}`,
    '',
    '## Commands Executed',
    '| # | Command | Status | Duration |',
    '| ---: | --- | --- | ---: |',
    ...lastRun.commandsExecuted.map((command, index) => `| ${index + 1} | npm run ${command.script} | ${command.status} | ${formatDuration(command.durationMs)} |`),
    '',
    '## Warnings',
    lastRun.warnings.length > 0 ? bullets(lastRun.warnings) : '- None',
    '',
    '## Safety',
    bullets(runnerSafetyRules),
    '',
  ].join('\n');
}

function renderRunnerHealth(report: RunnerHealthReport): string {
  return [
    '# Autonomous Runner Health',
    '',
    `Generated: ${report.generatedAt}`,
    `Runner Health: ${report.status}`,
    `Next Scheduled Run: ${report.nextScheduledRun}`,
    '',
    '## Checks',
    '| Check | Status | Detail |',
    '| --- | --- | --- |',
    ...report.checks.map((check) => `| ${escapeTable(check.label)} | ${check.status} | ${escapeTable(check.detail)} |`),
    '',
    '## Warnings',
    report.warnings.length > 0 ? bullets(report.warnings) : '- None',
    '',
  ].join('\n');
}

function renderLaunchdSetup(): string {
  const plistPath = path.join(outputDir, 'launchd-plist.xml');
  return [
    '# Launchd Setup',
    '',
    'Target schedule: Monday-Friday at 07:00 AM America/Costa_Rica.',
    '',
    'This file is instructions only. The runner does not install launchd automatically.',
    '',
    '## Manual Install Steps',
    '1. Review `output/autonomous-runner/launchd-plist.xml`.',
    '2. Copy it manually to `~/Library/LaunchAgents/com.danieldeleon.ai-testing-engineer-studio.runner.plist`.',
    '3. Load it manually with `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.danieldeleon.ai-testing-engineer-studio.runner.plist`.',
    '4. Confirm with `launchctl print gui/$(id -u)/com.danieldeleon.ai-testing-engineer-studio.runner`.',
    '',
    '## Test Command',
    '```bash',
    'npm run runner:test',
    '```',
    '',
    `Generated plist source: ${plistPath}`,
    '',
    '## Safety Rules',
    bullets(runnerSafetyRules),
    '',
  ].join('\n');
}

function renderLaunchdPlist(): string {
  const repo = process.cwd();
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.danieldeleon.ai-testing-engineer-studio.runner</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/zsh</string>
    <string>-lc</string>
    <string>cd ${escapeXml(repo)} &amp;&amp; npm run runner:test</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>TZ</key>
    <string>America/Costa_Rica</string>
  </dict>
  <key>StartCalendarInterval</key>
  <array>
    <dict><key>Weekday</key><integer>1</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>2</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>3</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>4</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>0</integer></dict>
    <dict><key>Weekday</key><integer>5</integer><key>Hour</key><integer>7</integer><key>Minute</key><integer>0</integer></dict>
  </array>
  <key>StandardOutPath</key>
  <string>${escapeXml(path.join(repo, 'output', 'autonomous-runner', 'launchd-stdout.log'))}</string>
  <key>StandardErrorPath</key>
  <string>${escapeXml(path.join(repo, 'output', 'autonomous-runner', 'launchd-stderr.log'))}</string>
  <key>WorkingDirectory</key>
  <string>${escapeXml(repo)}</string>
</dict>
</plist>
`;
}

function writeOutputs(outputs: { fileName: string; body: string }[]): string[] {
  fs.mkdirSync(outputDir, { recursive: true });
  return outputs.map((output) => {
    const outputPath = path.join(outputDir, output.fileName);
    fs.writeFileSync(outputPath, output.body, 'utf8');
    return outputPath;
  });
}

function nextScheduledRunLabel(): string {
  const now = new Date();
  const next = new Date(now);
  next.setHours(7, 0, 0, 0);
  while (next <= now || next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1);
    next.setHours(7, 0, 0, 0);
  }
  return `${next.toISOString()} (07:00 America/Costa_Rica)`;
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function tail(value: string | undefined): string {
  const clean = String(value ?? '').trim();
  if (!clean) return '';
  return clean.split(/\r?\n/).slice(-20).join('\n');
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function bullets(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function escapeTable(value: string): string {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
