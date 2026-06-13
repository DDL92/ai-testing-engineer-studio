import fs = require('fs');
import path = require('path');
import { buildStudioConsolidationReport } from '../studioConsolidation/studioRules';
import {
  CommandInventoryItem,
  RecoveryCheckItem,
  RecoveryStatus,
  SnapshotModule,
  SourceInventoryItem,
  StudioSnapshotReport,
} from './types';

const outputRoot = path.join(process.cwd(), 'output', 'studio-snapshot');
const snapshotStatePath = path.join(process.cwd(), 'data', 'studio-snapshot', 'snapshot-state.json');

const safetyRules = [
  'Read-only documentation and recovery planning only.',
  'Do not send outreach.',
  'Do not send emails.',
  'Do not create meetings.',
  'Do not create invoices.',
  'Do not create payments.',
  'Do not modify financial records.',
  'Do not modify outcome records.',
];

const modules: SnapshotModule[] = [
  module('Lead Research', 'Find and summarize target companies for QA services.', ['data/leads', 'data/first-50-targets.json'], ['output/leads', 'output/lead-packs'], ['lead:research', 'lead:pack']),
  module('Contact Research', 'Track manually reviewed contacts and contact readiness.', ['data/contacts/contacts.json', 'data/contact-reviews.json'], ['output/contact-research'], ['contact:review']),
  module('Outreach Tracking', 'Track manual outreach status without sending messages.', ['data/outreach/outreach.json'], ['output/outreach-tracking'], ['outreach:status', 'followup:queue']),
  module('Opportunity Engine', 'Rank commercial QA opportunities from local evidence.', ['data/opportunities/opportunities.json'], ['output/opportunities'], ['opportunity:generate', 'opportunity:summary']),
  module('Audit Engine', 'Generate audit packs and portfolio audit priorities.', ['data/audit-packs/audit-packs.json'], ['output/audit-packs'], ['audit:generate', 'audit:portfolio']),
  module('Evidence Engine', 'Collect and summarize local evidence artifacts.', ['data/evidence/evidence.json'], ['output/evidence'], ['evidence:collect', 'evidence:portfolio']),
  module('Playwright Evidence', 'Store public-page Playwright observations.', ['data/evidence/playwright'], ['output/playwright-runner'], ['evidence:playwright-run', 'evidence:playwright-summary']),
  module('Lighthouse Evidence', 'Store objective public homepage Lighthouse reports.', ['data/evidence/lighthouse'], ['output/lighthouse'], ['evidence:lighthouse', 'evidence:lighthouse-summary']),
  module('Proposal Engine', 'Generate review-only proposal and SOW packages.', ['output/client-audit-reports', 'output/unified-audits'], ['output/proposals'], ['sow:generate', 'sow:portfolio']),
  module('Executive Layer', 'Translate QA evidence into executive business language.', ['output/unified-audits', 'output/client-audit-reports'], ['output/executive'], ['executive:summary', 'executive:portfolio']),
  module('Revenue Activation', 'Rank first-client and first-retainer execution targets.', ['output/opportunities', 'output/proposals', 'data/finance/finance.json'], ['output/revenue'], ['revenue:targets', 'revenue:pipeline', 'revenue:focus', 'revenue:score']),
  module('Execution Pack', 'Generate first-client GO / NO GO execution support.', ['output/revenue', 'output/executive'], ['output/execution'], ['execute:first-client', 'execute:decision-board', 'execute:outreach-review']),
  module('Outcome Tracking', 'Track manually entered outcomes after Daniel acts externally.', ['data/outcomes/outcomes.json'], ['output/outcomes'], ['outcome:add', 'outcome:dashboard', 'outcome:review']),
  module('Follow-Up OS', 'Prioritize manual follow-up reviews from local outcomes and revenue signals.', ['data/followups/followups.json', 'data/outcomes/outcomes.json'], ['output/followups'], ['followup:queue', 'followup:daily', 'followup:priorities', 'followup:review']),
  module('Win/Loss Intelligence', 'Learn from real manually recorded outcomes only.', ['data/outcomes/outcomes.json'], ['output/winloss'], ['winloss:analysis', 'winloss:patterns', 'winloss:insights', 'winloss:strategy']),
  module('Finance Tracking', 'Report booked finance data and forecasts from local finance records.', ['data/finance/finance.json'], ['output/finance'], ['finance:monthly', 'finance:dashboard', 'finance:forecast']),
  module('Dashboard', 'Generate static read-only PWA dashboard data and UI.', ['data/dashboard/dashboard.json', 'output/dashboard/dashboard.json'], ['dashboard'], ['dashboard:generate', 'dashboard:mobile']),
  module('Mobile Command Center', 'Generate mobile review, queue, and summary reports.', ['data/mobile/mobile-state.json', 'dashboard/dashboard.json'], ['output/mobile', 'output/mobile-command-center'], ['mobile:review', 'mobile:summary', 'mobile:queue']),
];

const expectedRecoveryPaths = [
  'package.json',
  'tsconfig.json',
  'README.md',
  'docs/operations/command-reference.md',
  'src',
  'data',
  'output',
  'dashboard/index.html',
  'dashboard/app.js',
  'dashboard/styles.css',
  'dashboard/manifest.json',
  'dashboard/dashboard.json',
  'data/finance/finance.json',
  'data/outcomes/outcomes.json',
  'output/executive/pushpress-executive-summary.md',
  'output/client-audit-reports/pushpress-qa-audit-report.pdf',
  'output/proposals/pushpress-proposal.pdf',
  'output/messages/pushpress-message-pack.md',
  'output/hardening/monday-launch-checklist.md',
];

export function buildStudioSnapshotReport(): StudioSnapshotReport {
  ensureSnapshotState();
  const packageJson = readJson<{ name?: string; version?: string; scripts?: Record<string, string> }>('package.json', {});
  const studio = buildStudioConsolidationReport();
  const commands = buildCommandInventory(packageJson.scripts ?? {});
  const dataSources = buildSourceInventory('data');
  const outputSources = buildSourceInventory('output');
  const recoveryChecks = buildRecoveryChecks(packageJson.scripts ?? {});
  const recoveryStatus = overallRecoveryStatus(recoveryChecks);
  const releaseReadiness = studio.releaseReadiness.criticalIssues.length > 0
    ? 'Not Ready'
    : studio.releaseReadiness.warnings.length > 0 ? 'Warning' : 'Ready';

  return {
    generatedAt: new Date().toISOString(),
    projectName: packageJson.name ?? 'ai-testing-engineer-studio',
    currentVersion: packageJson.version ?? '0.0.0',
    currentStatus: releaseReadiness === 'Ready' ? 'Operational' : 'Operational with review notes',
    majorModules: modules,
    revenueReadiness: `Current MRR: $${studio.revenueReadiness.currentMrr}. Audit pipeline: ${studio.revenueReadiness.auditPipelineReady}. Proposal pipeline: ${studio.revenueReadiness.proposalPipelineReady}.`,
    dashboardStatus: fileExists('dashboard/dashboard.json') ? 'Ready: static local dashboard data exists.' : 'Missing dashboard data.',
    mobileStatus: fileExists('dashboard/manifest.json') && fileExists('dashboard/icon.svg') ? 'Ready: PWA manifest and icon exist.' : 'Warning: mobile PWA assets need review.',
    financeStatus: fileExists('data/finance/finance.json') ? 'Ready: local finance source exists.' : 'Missing local finance source.',
    clientDeliveryStatus: studio.releaseReadiness.readyForClientDelivery,
    releaseReadiness,
    commands,
    dataSources,
    outputSources,
    recoveryChecks,
    recoveryStatus,
    safetyRules,
  };
}

export function writeStudioSnapshotOutputs(report: StudioSnapshotReport): string[] {
  writeSnapshotState(report);
  return writeOutputs([
    { fileName: 'studio-snapshot.md', body: renderStudioSnapshot(report) },
    { fileName: 'system-map.md', body: renderSystemMap(report) },
    { fileName: 'operator-guide.md', body: renderOperatorGuide(report) },
    { fileName: 'monday-operator-guide.md', body: renderMondayOperatorGuide(report) },
  ]);
}

export function writeArchitectureSummary(report: StudioSnapshotReport): string[] {
  return writeOutputs([
    { fileName: 'architecture-summary.md', body: renderArchitectureSummary(report) },
  ]);
}

export function writeInventoryReports(report: StudioSnapshotReport): string[] {
  return writeOutputs([
    { fileName: 'all-commands.md', body: renderCommandInventory(report) },
    { fileName: 'all-data-sources.md', body: renderSourceInventory('All Data Sources', report.dataSources) },
    { fileName: 'all-output-sources.md', body: renderSourceInventory('All Output Sources', report.outputSources) },
  ]);
}

export function writeRebuildGuides(report: StudioSnapshotReport): string[] {
  return writeOutputs([
    { fileName: 'studio-rebuild-guide.md', body: renderStudioRebuildGuide(report) },
    { fileName: 'disaster-recovery-guide.md', body: renderDisasterRecoveryGuide(report) },
  ]);
}

export function writeRecoveryCheck(report: StudioSnapshotReport): string[] {
  return writeOutputs([
    { fileName: 'recovery-check.md', body: renderRecoveryCheck(report) },
  ]);
}

export function readSnapshotState(): { lastSnapshot: string; snapshotStatus: string; recoveryStatus: string; version: string } {
  return readJson('data/studio-snapshot/snapshot-state.json', {
    lastSnapshot: 'Not generated yet',
    snapshotStatus: 'Missing',
    recoveryStatus: 'Missing',
    version: '0.0.0',
  });
}

export function renderStudioSnapshot(report: StudioSnapshotReport): string {
  return [
    '# Studio Snapshot',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderList([
      `Project Name: ${report.projectName}`,
      `Current Version: ${report.currentVersion}`,
      `Current Status: ${report.currentStatus}`,
      `Major Modules: ${report.majorModules.length}`,
      `Revenue Readiness: ${report.revenueReadiness}`,
      `Dashboard Status: ${report.dashboardStatus}`,
      `Mobile Status: ${report.mobileStatus}`,
      `Finance Status: ${report.financeStatus}`,
      `Client Delivery Status: ${report.clientDeliveryStatus}`,
      `Release Readiness: ${report.releaseReadiness}`,
    ]),
    '',
    '## Major Modules',
    renderList(report.majorModules.map((item) => item.name)),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderArchitectureSummary(report: StudioSnapshotReport): string {
  return [
    '# Architecture Summary',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    ...report.majorModules.flatMap((item) => [
      `## ${item.name}`,
      '',
      `Purpose: ${item.purpose}`,
      '',
      'Inputs:',
      renderList(item.inputs),
      '',
      'Outputs:',
      renderList(item.outputs),
      '',
      'Commands:',
      renderList(item.commands.map((command) => `npm run ${command}`)),
      '',
    ]),
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderCommandInventory(report: StudioSnapshotReport): string {
  return [
    '# All Commands',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Command | Module | Description | Expected Outputs | Script |',
    '| --- | --- | --- | --- | --- |',
    ...report.commands.map((item) => `| ${item.command} | ${item.module} | ${escapeTable(item.description)} | ${escapeTable(item.expectedOutputs.join(', ') || 'Varies')} | ${escapeTable(item.script)} |`),
    '',
  ].join('\n');
}

export function renderSourceInventory(title: string, sources: SourceInventoryItem[]): string {
  return [
    `# ${title}`,
    '',
    '| Path | Purpose | Files |',
    '| --- | --- | --- |',
    ...sources.map((item) => `| ${escapeTable(item.path)} | ${escapeTable(item.purpose)} | ${escapeTable(item.files.join(', ') || 'No direct files')} |`),
    '',
  ].join('\n');
}

export function renderSystemMap(report: StudioSnapshotReport): string {
  return [
    '# System Map',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '```text',
    'Lead',
    '↓',
    'Research',
    '↓',
    'Opportunity',
    '↓',
    'Audit',
    '↓',
    'Evidence',
    '↓',
    'Proposal',
    '↓',
    'Revenue Activation',
    '↓',
    'Execution',
    '↓',
    'Outcome Tracking',
    '↓',
    'Win/Loss Learning',
    '```',
    '',
    '## Operating Note',
    'Each stage reads local files and produces local reports. External action remains manual and human-approved.',
    '',
  ].join('\n');
}

export function renderOperatorGuide(report: StudioSnapshotReport): string {
  return [
    '# Operator Guide',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Daily Commands',
    renderList(['npm run dashboard:generate', 'npm run revenue:focus', 'npm run day:plan', 'npm run followup:daily', 'npm run outcome:dashboard']),
    '',
    '## Weekly Commands',
    renderList(['npm run week:review', 'npm run studio:hardening', 'npm run winloss:strategy', 'npm run finance:dashboard']),
    '',
    '## Monthly Commands',
    renderList(['npm run finance:monthly', 'npm run client:monthly-report', 'npm run studio:snapshot', 'npm run studio:recovery-check']),
    '',
    '## When To Use Each Module',
    renderList(report.majorModules.map((item) => `${item.name}: ${item.purpose}`)),
    '',
    '## Recommended Workflow',
    renderList([
      'Start with dashboard:generate to refresh the local dashboard.',
      'Use revenue:focus and day:plan to choose the day’s work.',
      'Review PushPress execution and message assets before any manual send.',
      'Record real outcomes only after Daniel acts externally.',
      'Use followup and winloss reports to learn from actual recorded outcomes.',
    ]),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderMondayOperatorGuide(report: StudioSnapshotReport): string {
  return [
    '# Monday Operator Guide',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderChecklist([
      'Open Dashboard.',
      'Run npm run revenue:focus.',
      'Run npm run day:plan.',
      'Review PushPress.',
      'Review Message Pack.',
      'Decide Send / Wait / Rewrite.',
      'Record Outcome if Daniel manually sends.',
      'Review Follow-Up Queue.',
    ]),
    '',
    '## Safety Boundary',
    'Studio does not send outreach. Daniel decides and acts manually outside Studio.',
    '',
  ].join('\n');
}

export function renderStudioRebuildGuide(report: StudioSnapshotReport): string {
  return [
    '# Studio Rebuild Guide',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderNumbered([
      'Fresh Mac: install macOS updates and create a local development folder.',
      'Install Node: use the project-compatible Node version available on the machine.',
      'Install Dependencies: run npm install from the repo root.',
      'Clone Repo: clone the GitHub repository or restore the full repo folder from backup.',
      'Run Validation: run npm run typecheck and npm test.',
      'Generate Dashboard: run npm run dashboard:generate.',
      'Verify Mobile: run npm run dashboard:mobile and open the same-WiFi URL on a phone.',
      'Verify Outputs: run npm run studio:inventory and npm run studio:output-audit.',
      'Verify Studio Health: run npm run studio:health, npm run studio:release-check, and npm run studio:recovery-check.',
    ]),
    '',
    '## Critical Local Folders',
    renderList(['src', 'data', 'output', 'dashboard', 'docs']),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderDisasterRecoveryGuide(report: StudioSnapshotReport): string {
  return [
    '# Disaster Recovery Guide',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## GitHub Recovery',
    renderList([
      'Clone the repository from GitHub.',
      'Run npm install.',
      'Restore any intentionally backed-up local data and output folders.',
      'Run npm run studio:recovery-check.',
    ]),
    '',
    '## Machine Migration',
    renderList([
      'Copy repo folder or clone from GitHub.',
      'Preserve data/ and output/ if generated local history matters.',
      'Regenerate dashboard with npm run dashboard:generate.',
      'Validate with npm run typecheck and npm test.',
    ]),
    '',
    '## Backup Strategy',
    renderList([
      'Commit source, docs, dashboard assets, and safe local JSON templates.',
      'Back up data/ and output/ when local operating history matters.',
      'Do not back up secrets, credentials, .env files, private client credentials, or sensitive screenshots.',
    ]),
    '',
    '## Critical Files',
    renderList(expectedRecoveryPaths),
    '',
    '## Validation Checklist',
    renderChecklist(['npm install', 'npm run studio:recovery-check', 'npm run dashboard:generate', 'npm run typecheck', 'npm test']),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderRecoveryCheck(report: StudioSnapshotReport): string {
  return [
    '# Recovery Check',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Recovery Status: ${report.recoveryStatus}`,
    '',
    '| Item | Status | Detail |',
    '| --- | --- | --- |',
    ...report.recoveryChecks.map((item) => `| ${escapeTable(item.label)} | ${item.status} | ${escapeTable(item.detail)} |`),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

function buildCommandInventory(scripts: Record<string, string>): CommandInventoryItem[] {
  return Object.entries(scripts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([command, script]) => ({
      command: `npm run ${command}`,
      module: moduleForCommand(command),
      description: descriptionForCommand(command),
      script,
      expectedOutputs: expectedOutputsForCommand(command),
    }));
}

function buildSourceInventory(root: 'data' | 'output'): SourceInventoryItem[] {
  const absoluteRoot = path.join(process.cwd(), root);
  if (!fs.existsSync(absoluteRoot)) return [];
  return fs.readdirSync(absoluteRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const relativePath = `${root}/${entry.name}`;
      const absolutePath = path.join(process.cwd(), relativePath);
      const files = fs.readdirSync(absolutePath, { withFileTypes: true })
        .filter((file) => file.isFile())
        .map((file) => file.name)
        .sort();
      return {
        path: relativePath,
        purpose: purposeForPath(relativePath),
        files,
      };
    })
    .sort((left, right) => left.path.localeCompare(right.path));
}

function buildRecoveryChecks(scripts: Record<string, string>): RecoveryCheckItem[] {
  const pathChecks = expectedRecoveryPaths.map((relativePath) => ({
    label: relativePath,
    status: fileExists(relativePath) ? 'Ready' as const : 'Missing' as const,
    detail: fileExists(relativePath) ? 'Exists.' : 'Missing required recovery asset.',
  }));
  const commandChecks = ['studio:snapshot', 'studio:inventory', 'studio:rebuild-guide', 'studio:recovery-check', 'dashboard:generate', 'typecheck', 'test']
    .map((command) => ({
      label: `Command ${command}`,
      status: scripts[command] ? 'Ready' as const : 'Missing' as const,
      detail: scripts[command] ? 'Configured in package.json.' : 'Missing from package.json scripts.',
    }));
  return [...pathChecks, ...commandChecks];
}

function overallRecoveryStatus(items: RecoveryCheckItem[]): RecoveryStatus {
  if (items.some((item) => item.status === 'Missing')) return 'Missing';
  if (items.some((item) => item.status === 'Warning')) return 'Warning';
  return 'Ready';
}

function writeSnapshotState(report: StudioSnapshotReport): void {
  fs.mkdirSync(path.dirname(snapshotStatePath), { recursive: true });
  fs.writeFileSync(snapshotStatePath, `${JSON.stringify({
    lastSnapshot: report.generatedAt,
    snapshotStatus: 'Ready',
    recoveryStatus: report.recoveryStatus,
    version: report.currentVersion,
    output: 'output/studio-snapshot/studio-snapshot.md',
  }, null, 2)}\n`, 'utf8');
}

function ensureSnapshotState(): void {
  fs.mkdirSync(path.dirname(snapshotStatePath), { recursive: true });
  if (!fs.existsSync(snapshotStatePath)) {
    fs.writeFileSync(snapshotStatePath, `${JSON.stringify({
      lastSnapshot: 'Not generated yet',
      snapshotStatus: 'Missing',
      recoveryStatus: 'Missing',
      version: packageVersion(),
    }, null, 2)}\n`, 'utf8');
  }
}

function writeOutputs(outputs: { fileName: string; body: string }[]): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });
  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }
  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

function module(name: string, purpose: string, inputs: string[], outputs: string[], commands: string[]): SnapshotModule {
  return { name, purpose, inputs, outputs, commands };
}

function moduleForCommand(command: string): string {
  if (command.startsWith('lead:')) return 'Lead Research';
  if (command.startsWith('contact:')) return 'Contact Research';
  if (command.startsWith('outreach:')) return 'Outreach';
  if (command.startsWith('opportunity:')) return 'Opportunity Engine';
  if (command.startsWith('audit:')) return 'Audit Engine';
  if (command.startsWith('evidence:')) return 'Evidence Engine';
  if (command.startsWith('sow:') || command.startsWith('proposal:')) return 'Proposal Engine';
  if (command.startsWith('executive:')) return 'Executive Layer';
  if (command.startsWith('revenue:')) return 'Revenue';
  if (command.startsWith('execute:')) return 'Execution Pack';
  if (command.startsWith('outcome:')) return 'Outcome Tracking';
  if (command.startsWith('followup:')) return 'Follow-Up OS';
  if (command.startsWith('winloss:')) return 'Win/Loss Intelligence';
  if (command.startsWith('finance:')) return 'Finance Tracking';
  if (command.startsWith('dashboard:') || command === 'dashboard') return 'Dashboard';
  if (command.startsWith('mobile:')) return 'Mobile Command Center';
  if (command.startsWith('studio:')) return 'Studio Operations';
  return 'General';
}

function descriptionForCommand(command: string): string {
  if (command.includes('snapshot')) return 'Generate or support Studio snapshot documentation.';
  if (command.includes('inventory')) return 'Inventory local commands, data, and outputs.';
  if (command.includes('rebuild')) return 'Generate rebuild and disaster recovery instructions.';
  if (command.includes('recovery')) return 'Check recovery readiness.';
  if (command.includes('generate')) return 'Generate local report output.';
  if (command.includes('summary')) return 'Summarize local module state.';
  if (command.includes('dashboard')) return 'Generate dashboard or dashboard report.';
  if (command.includes('review')) return 'Generate local review output.';
  if (command.includes('queue')) return 'Generate local queue output.';
  return 'Project command from package.json.';
}

function expectedOutputsForCommand(command: string): string[] {
  if (command.startsWith('studio:')) return ['output/studio-snapshot', 'output/studio', 'output/hardening'];
  if (command.startsWith('dashboard')) return ['output/dashboard', 'dashboard/dashboard.json'];
  if (command.startsWith('revenue:')) return ['output/revenue'];
  if (command.startsWith('followup:')) return ['output/followups'];
  if (command.startsWith('winloss:')) return ['output/winloss'];
  if (command.startsWith('finance:')) return ['output/finance'];
  if (command.startsWith('message:')) return ['output/messages'];
  if (command.startsWith('outcome:')) return ['output/outcomes', 'data/outcomes'];
  return [];
}

function purposeForPath(relativePath: string): string {
  const name = path.basename(relativePath);
  return `${name.replace(/-/g, ' ')} local ${relativePath.startsWith('data') ? 'data source' : 'report output'} folder.`;
}

function packageVersion(): string {
  return readJson<{ version?: string }>('package.json', {}).version ?? '0.0.0';
}

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

function readJson<T>(relativePath: string, fallback: T): T {
  const filePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function renderChecklist(items: string[]): string {
  return items.map((item) => `- [ ] ${item}`).join('\n');
}

function renderNumbered(items: string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
