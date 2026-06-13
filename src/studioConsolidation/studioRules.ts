import fs = require('fs');
import path = require('path');
import { buildFinanceReport, loadFinanceInput } from '../financeTracking/financeRules';
import {
  DailyOperationPlan,
  ReleaseReadiness,
  RevenueReadiness,
  StudioAssetCheck,
  StudioCommandCheck,
  StudioCommandStatus,
  StudioConsolidationReport,
  StudioHealthStatus,
  StudioModuleHealth,
  StudioReadinessStatus,
  StudioState,
} from './types';

const outputRoot = path.join(process.cwd(), 'output', 'studio');
const studioStatePath = path.join(process.cwd(), 'data', 'studio', 'studio-state.json');

const safetyRules = [
  'Local-only consolidation reports.',
  'Review-only outputs.',
  'Human approval is required before outreach, emails, proposals, invoices, payments, client communication, or external action.',
  'Do not invent revenue, clients, results, findings, replies, meetings, or delivery status.',
  'No APIs, scraping, browsing, CRM integrations, sending workflows, payment systems, credentials, banks, or external databases are used.',
];

const modules = [
  moduleDefinition('Lead Research', ['src/leadResearch/generateLeadResearch.ts', 'output/research', 'output/lead-packs']),
  moduleDefinition('Contact Research', ['src/contactReview/generateContactReview.ts', 'output/contact-research', 'data/contact-reviews.json']),
  moduleDefinition('Outreach Tracking', ['src/outreachTracking/generateOutreachStatus.ts', 'src/outreachTracking/generateFollowupQueue.ts', 'output/outreach-tracking']),
  moduleDefinition('Opportunity Engine', ['src/opportunityEngine/generateOpportunity.ts', 'src/opportunityEngine/generateOpportunitySummary.ts', 'output/opportunities/opportunity-summary.md']),
  moduleDefinition('Audit Engine', ['src/auditPackEngine/generateAuditPack.ts', 'src/auditPackEngine/generateAuditPortfolio.ts', 'output/audit-packs/audit-portfolio.md']),
  moduleDefinition('Evidence Engine', ['src/evidenceEngine/generateEvidence.ts', 'src/evidenceEngine/generateEvidencePortfolio.ts', 'output/evidence/evidence-portfolio.md']),
  moduleDefinition('Proposal Engine', ['src/proposalEngine/generateProposal.ts', 'src/proposalEngine/generatePortfolio.ts', 'output/proposals/proposal-summary.md']),
  moduleDefinition('Daily Revenue Loop', ['src/dailyRevenueLoop/generateDayPlan.ts', 'src/dailyRevenueLoop/generateDaySummary.ts', 'output/daily-revenue/today-plan.md']),
  moduleDefinition('Client Delivery', ['src/clientDelivery/clientOnboard.ts', 'src/clientDelivery/weeklyReport.ts', 'src/clientDelivery/monthlyReport.ts', 'output/client-delivery/monthly-report.md']),
  moduleDefinition('Finance Tracking', ['src/financeTracking/financeRules.ts', 'data/finance/finance.json', 'output/finance/finance-dashboard.md']),
  moduleDefinition('Dashboard', ['src/dashboard/generateDashboard.ts', 'dashboard/index.html', 'dashboard/dashboard.json', 'output/dashboard/dashboard.json']),
  moduleDefinition('Mobile Command Center', ['src/mobileCommandCenter/generateMobileReview.ts', 'output/mobile/mobile-review.md', 'output/mobile-command-center/mobile-command-center.md']),
];

const requiredCommands = [
  'lead:research',
  'outreach:status',
  'followup:queue',
  'pain:research',
  'pain:summary',
  'site:intelligence',
  'site:summary',
  'opportunity:generate',
  'opportunity:summary',
  'audit:generate',
  'audit:portfolio',
  'evidence:collect',
  'evidence:portfolio',
  'evidence:playwright-run',
  'evidence:lighthouse',
  'audit:unified',
  'audit:pdf',
  'sow:generate',
  'day:plan',
  'day:summary',
  'mobile:review',
  'mobile:summary',
  'mobile:queue',
  'client:onboard',
  'client:weekly-report',
  'client:monthly-report',
  'client:renewal-check',
  'finance:monthly',
  'finance:dashboard',
  'finance:forecast',
];

const dailyCommands = [
  'npm run studio:health',
  'npm run day:plan',
  'npm run outreach:status',
  'npm run followup:queue',
  'npm run finance:dashboard',
  'npm run dashboard:generate',
];

const weeklyCommands = [
  'npm run studio:summary',
  'npm run day:summary',
  'npm run opportunity:summary',
  'npm run audit:portfolio',
  'npm run evidence:portfolio',
  'npm run sow:portfolio',
];

const monthlyCommands = [
  'npm run studio:release-check',
  'npm run finance:monthly',
  'npm run client:monthly-report',
  'npm run client:renewal-check',
  'npm run success:monthly',
];

export function loadStudioState(): StudioState {
  const generatedAt = new Date().toISOString();
  const fallback: StudioState = {
    schemaVersion: 1,
    updatedAt: generatedAt,
    releaseName: 'Sprint 71 Studio Consolidation',
    dailyOperatorEnabled: true,
    mobileDashboardEnabled: true,
    notes: [
      'Local-first Studio consolidation state.',
      'No sending, payments, external integrations, or client system access enabled.',
    ],
  };

  return readJson<StudioState>(studioStatePath, fallback);
}

export function buildStudioConsolidationReport(): StudioConsolidationReport {
  const generatedAt = new Date().toISOString();
  const packageJson = readJson<{ scripts?: Record<string, string> }>(path.join(process.cwd(), 'package.json'), { scripts: {} });
  const scripts = packageJson.scripts ?? {};
  const state = loadStudioState();
  const moduleHealth = modules.map(buildModuleHealth);
  const commandChecks = requiredCommands.map((command) => buildCommandCheck(command, scripts));
  const dashboardChecks = buildDashboardChecks();
  const mobileChecks = buildMobileChecks(scripts);
  const revenueReadiness = buildRevenueReadiness();
  const dailyOperation = buildDailyOperationPlan(moduleHealth, commandChecks, state);
  const releaseReadiness = buildReleaseReadiness(moduleHealth, commandChecks, dashboardChecks, mobileChecks, revenueReadiness, dailyOperation);

  return {
    generatedAt,
    state,
    modules: moduleHealth,
    commands: commandChecks,
    dashboard: dashboardChecks,
    mobile: mobileChecks,
    revenueReadiness,
    dailyOperation,
    releaseReadiness,
    safetyRules,
  };
}

export function writeStudioHealthOutputs(report: StudioConsolidationReport): string[] {
  return writeOutputs([
    { fileName: 'studio-health.md', body: renderStudioHealth(report) },
    { fileName: 'command-status.md', body: renderCommandStatus(report) },
    { fileName: 'system-readiness.md', body: renderSystemReadiness(report) },
  ]);
}

export function writeStudioSummaryOutputs(report: StudioConsolidationReport): string[] {
  return writeOutputs([
    { fileName: 'studio-summary.md', body: renderStudioSummary(report) },
    { fileName: 'daily-operation-readiness.md', body: renderDailyOperationReadiness(report) },
    { fileName: 'system-readiness.md', body: renderSystemReadiness(report) },
  ]);
}

export function writeReleaseCheckOutputs(report: StudioConsolidationReport): string[] {
  return writeOutputs([
    { fileName: 'release-check.md', body: renderReleaseCheck(report) },
    { fileName: 'system-readiness.md', body: renderSystemReadiness(report) },
    { fileName: 'daily-operation-readiness.md', body: renderDailyOperationReadiness(report) },
    { fileName: 'command-status.md', body: renderCommandStatus(report) },
  ]);
}

export function writeAllStudioOutputs(report: StudioConsolidationReport): string[] {
  return writeOutputs([
    { fileName: 'studio-health.md', body: renderStudioHealth(report) },
    { fileName: 'studio-summary.md', body: renderStudioSummary(report) },
    { fileName: 'release-check.md', body: renderReleaseCheck(report) },
    { fileName: 'command-status.md', body: renderCommandStatus(report) },
    { fileName: 'system-readiness.md', body: renderSystemReadiness(report) },
    { fileName: 'daily-operation-readiness.md', body: renderDailyOperationReadiness(report) },
  ]);
}

export function renderStudioHealth(report: StudioConsolidationReport): string {
  return [
    '# Studio Health',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Overall status: ${overallHealth(report.modules)}`,
    '',
    '## Module Health',
    renderModuleTable(report.modules),
    '',
    '## Dashboard Validation',
    renderAssetTable(report.dashboard),
    '',
    '## Mobile Validation',
    renderAssetTable(report.mobile),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderStudioSummary(report: StudioConsolidationReport): string {
  return [
    '# Studio Summary',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    renderList([
      `Release: ${report.state.releaseName}`,
      `Overall studio health: ${overallHealth(report.modules)}`,
      `Commands present: ${report.commands.filter((command) => command.status === 'Present').length}/${report.commands.length}`,
      `Current MRR from local finance data: ${formatCurrency(report.revenueReadiness.currentMrr)}`,
      `Daily operation readiness: ${report.dailyOperation.canRunDaily}`,
      `Ready for outreach: ${report.releaseReadiness.readyForOutreach}`,
      `Ready for audit sales: ${report.releaseReadiness.readyForAuditSales}`,
      `Ready for retainers: ${report.releaseReadiness.readyForRetainers}`,
      `Ready for client delivery: ${report.releaseReadiness.readyForClientDelivery}`,
    ]),
    '',
    '## Revenue Readiness',
    renderRevenueReadiness(report.revenueReadiness),
    '',
    '## Recommended Operating Rhythm',
    renderOperationRhythm(report.dailyOperation),
    '',
    '## Sprint 72 Recommendation',
    renderList([
      'Mobile Notifications & Daily Operator Assistant.',
      'Suggested commands: npm run notify:daily, npm run notify:priority, npm run notify:review.',
      'Goal: move Studio from a dashboard Daniel opens manually to a system that proactively identifies daily attention points.',
    ]),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderReleaseCheck(report: StudioConsolidationReport): string {
  return [
    '# Release Check',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Critical Issues',
    renderList(report.releaseReadiness.criticalIssues),
    '',
    '## Warnings',
    renderList(report.releaseReadiness.warnings),
    '',
    '## Recommendations',
    renderList(report.releaseReadiness.recommendations),
    '',
    '## Readiness',
    renderList([
      `Ready For Outreach: ${report.releaseReadiness.readyForOutreach}`,
      `Ready For Audit Sales: ${report.releaseReadiness.readyForAuditSales}`,
      `Ready For Retainers: ${report.releaseReadiness.readyForRetainers}`,
      `Ready For Client Delivery: ${report.releaseReadiness.readyForClientDelivery}`,
      `Current MRR from local finance data: ${formatCurrency(report.revenueReadiness.currentMrr)}`,
    ]),
    '',
    '## Evidence Used',
    renderList([
      'package.json scripts',
      'local src modules',
      'local data JSON',
      'local output reports',
      'dashboard PWA files',
      'finance tracking JSON',
    ]),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderCommandStatus(report: StudioConsolidationReport): string {
  return [
    '# Command Status',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Command | Status | Script | Notes |',
    '| --- | --- | --- | --- |',
    ...report.commands.map((command) => `| \`${command.command}\` | ${command.status} | ${escapeTable(command.script ?? 'n/a')} | ${escapeTable(command.notes.join(' '))} |`),
    '',
  ].join('\n');
}

export function renderSystemReadiness(report: StudioConsolidationReport): string {
  return [
    '# System Readiness',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Health Counts',
    renderList([
      `Healthy modules: ${report.modules.filter((item) => item.status === 'Healthy').length}`,
      `Warning modules: ${report.modules.filter((item) => item.status === 'Warning').length}`,
      `Not Ready modules: ${report.modules.filter((item) => item.status === 'Not Ready').length}`,
      `Present commands: ${report.commands.filter((item) => item.status === 'Present').length}`,
      `Missing commands: ${report.commands.filter((item) => item.status === 'Missing').length}`,
      `Needs Review commands: ${report.commands.filter((item) => item.status === 'Needs Review').length}`,
    ]),
    '',
    '## Revenue Readiness',
    renderRevenueReadiness(report.revenueReadiness),
    '',
    '## Dashboard Readiness',
    renderAssetTable(report.dashboard),
    '',
    '## Mobile Readiness',
    renderAssetTable(report.mobile),
    '',
    '## Release Readiness',
    renderList([
      `Ready for outreach: ${report.releaseReadiness.readyForOutreach}`,
      `Ready for audit sales: ${report.releaseReadiness.readyForAuditSales}`,
      `Ready for retainers: ${report.releaseReadiness.readyForRetainers}`,
      `Ready for client delivery: ${report.releaseReadiness.readyForClientDelivery}`,
    ]),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderDailyOperationReadiness(report: StudioConsolidationReport): string {
  return [
    '# Daily Operation Readiness',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Can Daniel run Studio daily? ${report.dailyOperation.canRunDaily}`,
    '',
    '## Daily Commands',
    renderList(report.dailyOperation.dailyCommands),
    '',
    '## Weekly Commands',
    renderList(report.dailyOperation.weeklyCommands),
    '',
    '## Monthly Commands',
    renderList(report.dailyOperation.monthlyCommands),
    '',
    '## Practical Operating Checklist',
    renderChecklist(report.dailyOperation.checklist),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

function buildModuleHealth(definition: { module: string; paths: string[] }): StudioModuleHealth {
  const available = definition.paths.filter(pathExists);
  const missing = definition.paths.filter((item) => !pathExists(item));
  const status = statusFromCounts(available.length, missing.length);

  return {
    module: definition.module,
    status,
    available,
    missing,
    notes: missing.length === 0
      ? ['Required local source and output paths are available.']
      : [`${missing.length} required path(s) need review.`],
  };
}

function buildCommandCheck(command: string, scripts: Record<string, string>): StudioCommandCheck {
  const script = scripts[command];
  if (!script) {
    return {
      command,
      status: 'Missing',
      notes: ['No package.json script found.'],
    };
  }

  const status: StudioCommandStatus = script.includes('<') || script.includes('TODO') ? 'Needs Review' : 'Present';

  return {
    command,
    status,
    script,
    notes: status === 'Present' ? ['Script exists.'] : ['Script exists but needs manual review.'],
  };
}

function buildDashboardChecks(): StudioAssetCheck[] {
  return [
    assetCheck('Dashboard JSON exists', ['output/dashboard/dashboard.json', 'dashboard/dashboard.json']),
    assetCheck('Dashboard outputs exist', ['output/dashboard/dashboard-summary.md', 'output/dashboard/dashboard-health.md']),
    assetCheck('PWA assets exist', ['dashboard/index.html', 'dashboard/styles.css', 'dashboard/app.js']),
    assetCheck('Manifest exists', ['dashboard/manifest.json']),
    assetCheck('Mobile dashboard enabled', ['dashboard/manifest.json', 'dashboard/icon.svg']),
  ];
}

function buildMobileChecks(scripts: Record<string, string>): StudioAssetCheck[] {
  return [
    assetCheck('PWA files', ['dashboard/index.html', 'dashboard/styles.css', 'dashboard/app.js', 'dashboard/manifest.json']),
    {
      label: 'Dashboard mobile server',
      status: scripts['dashboard:mobile'] ? 'Healthy' : 'Not Ready',
      evidence: scripts['dashboard:mobile'] ? [`dashboard:mobile -> ${scripts['dashboard:mobile']}`] : [],
      missing: scripts['dashboard:mobile'] ? [] : ['dashboard:mobile package script'],
      notes: scripts['dashboard:mobile'] ? ['Mobile server command exists.'] : ['Missing mobile server command.'],
    },
    assetCheck('Local network access', ['src/dashboard/generateDashboard.ts']),
    assetCheck('Manifest', ['dashboard/manifest.json']),
    assetCheck('Icons', ['dashboard/icon.svg']),
    assetCheck('Responsive layout', ['dashboard/styles.css']),
  ];
}

function buildRevenueReadiness(): RevenueReadiness {
  const financeReport = buildFinanceReport(loadFinanceInput());
  const leadPipelineReady = pathExists('data/leads.json') && pathExists('output/opportunities/opportunity-summary.md') ? 'Ready' : 'Needs Review';
  const auditPipelineReady = pathExists('output/audit-packs/audit-portfolio.md') && pathExists('output/client-audit-reports/report-readiness.md') ? 'Ready' : 'Needs Review';
  const proposalPipelineReady = pathExists('output/proposals/proposal-summary.md') ? 'Ready' : 'Needs Review';
  const clientDeliveryReady = pathExists('output/client-delivery/monthly-report.md') && pathExists('src/clientDelivery/monthlyReport.ts') ? 'Ready' : 'Needs Review';
  const financeReady = pathExists('data/finance/finance.json') && pathExists('output/finance/finance-dashboard.md') ? 'Ready' : 'Needs Review';

  return {
    leadPipelineReady,
    auditPipelineReady,
    proposalPipelineReady,
    clientDeliveryReady,
    financeReady,
    currentMrr: financeReport.currentMrr,
    notes: [
      'Current MRR comes from local finance data only.',
      'Lead candidates, forecasts, and pipeline estimates are not booked revenue.',
      `Finance records counted as booked or received: ${financeReport.countedRevenueActivity.length}.`,
    ],
  };
}

function buildDailyOperationPlan(modulesHealth: StudioModuleHealth[], commands: StudioCommandCheck[], state: StudioState): DailyOperationPlan {
  const missingCommands = commands.filter((command) => command.status === 'Missing');
  const notReadyModules = modulesHealth.filter((module) => module.status === 'Not Ready');
  const canRunDaily: StudioReadinessStatus = !state.dailyOperatorEnabled || missingCommands.length > 0 || notReadyModules.length > 0
    ? 'Needs Review'
    : 'Ready';

  return {
    canRunDaily,
    dailyCommands,
    weeklyCommands,
    monthlyCommands,
    checklist: [
      'Run studio health before external work.',
      'Review follow-up queue and outreach status manually.',
      'Open dashboard PWA and check Studio Health, Release Readiness, and System Status.',
      'Confirm no outreach, proposals, invoices, or client updates are sent without Daniel approval.',
      'Record booked or received revenue only in data/finance/finance.json.',
      'Run weekly and monthly reports on cadence instead of adding new systems.',
    ],
  };
}

function buildReleaseReadiness(
  modulesHealth: StudioModuleHealth[],
  commands: StudioCommandCheck[],
  dashboard: StudioAssetCheck[],
  mobile: StudioAssetCheck[],
  revenue: RevenueReadiness,
  dailyOperation: DailyOperationPlan,
): ReleaseReadiness {
  const criticalIssues = [
    ...modulesHealth.filter((module) => module.status === 'Not Ready').map((module) => `${module.module} is Not Ready.`),
    ...commands.filter((command) => command.status === 'Missing').map((command) => `${command.command} command is missing.`),
    ...dashboard.filter((item) => item.status === 'Not Ready').map((item) => `${item.label} is Not Ready.`),
    ...mobile.filter((item) => item.status === 'Not Ready').map((item) => `${item.label} is Not Ready.`),
  ];
  const warnings = [
    ...modulesHealth.filter((module) => module.status === 'Warning').map((module) => `${module.module}: ${module.missing.join(', ')}`),
    ...commands.filter((command) => command.status === 'Needs Review').map((command) => `${command.command} needs review.`),
    revenue.currentMrr === 0 ? 'Current MRR is $0 from local finance data. This is valid if no booked finance records exist.' : '',
    dailyOperation.canRunDaily !== 'Ready' ? 'Daily operation is not fully ready.' : '',
  ].filter(Boolean);

  return {
    criticalIssues,
    warnings,
    recommendations: [
      'Use studio:health as the first daily verification command.',
      'Use finance:dashboard for local MRR and savings visibility before revenue decisions.',
      'Use dashboard:generate before mobile review so PWA data is fresh.',
      'Keep output/studio reports as the consolidation source for release readiness.',
      'Sprint 72 should focus on notifications only after Sprint 71 reports are stable.',
    ],
    readyForOutreach: readinessFromPaths(['output/outreach-tracking/outreach-status.md', 'output/outreach-tracking/followup-queue.md', 'output/outreach-operating/real-outreach-operating-pack.md']),
    readyForAuditSales: readinessFromPaths(['output/audit-packs/audit-portfolio.md', 'output/client-audit-reports/report-readiness.md', 'output/proposals/proposal-summary.md']),
    readyForRetainers: readinessFromValues([revenue.proposalPipelineReady, revenue.clientDeliveryReady, revenue.financeReady]),
    readyForClientDelivery: readinessFromPaths(['output/client-delivery/monthly-report.md', 'output/client-reporting/demo-retainer-client/monthly-report.md', 'src/clientDelivery/monthlyReport.ts']),
  };
}

function moduleDefinition(module: string, paths: string[]): { module: string; paths: string[] } {
  return { module, paths };
}

function assetCheck(label: string, paths: string[]): StudioAssetCheck {
  const evidence = paths.filter(pathExists);
  const missing = paths.filter((item) => !pathExists(item));

  return {
    label,
    status: statusFromCounts(evidence.length, missing.length),
    evidence,
    missing,
    notes: missing.length === 0 ? ['Required local assets are available.'] : [`${missing.length} local asset(s) need review.`],
  };
}

function statusFromCounts(available: number, missing: number): StudioHealthStatus {
  if (missing === 0) return 'Healthy';
  if (available === 0) return 'Not Ready';
  return 'Warning';
}

function readinessFromPaths(paths: string[]): StudioReadinessStatus {
  const available = paths.filter(pathExists).length;
  if (available === paths.length) return 'Ready';
  if (available === 0) return 'Not Ready';
  return 'Needs Review';
}

function readinessFromValues(values: StudioReadinessStatus[]): StudioReadinessStatus {
  if (values.every((value) => value === 'Ready')) return 'Ready';
  if (values.every((value) => value === 'Not Ready')) return 'Not Ready';
  return 'Needs Review';
}

function overallHealth(items: StudioModuleHealth[]): StudioHealthStatus {
  if (items.some((item) => item.status === 'Not Ready')) return 'Not Ready';
  if (items.some((item) => item.status === 'Warning')) return 'Warning';
  return 'Healthy';
}

function renderModuleTable(items: StudioModuleHealth[]): string {
  return [
    '| Module | Status | Available | Missing | Notes |',
    '| --- | --- | ---: | ---: | --- |',
    ...items.map((item) => `| ${escapeTable(item.module)} | ${item.status} | ${item.available.length} | ${item.missing.length} | ${escapeTable(item.notes.join(' '))} |`),
  ].join('\n');
}

function renderAssetTable(items: StudioAssetCheck[]): string {
  return [
    '| Check | Status | Evidence | Missing | Notes |',
    '| --- | --- | --- | --- | --- |',
    ...items.map((item) => `| ${escapeTable(item.label)} | ${item.status} | ${escapeTable(item.evidence.join('<br>') || 'None')} | ${escapeTable(item.missing.join('<br>') || 'None')} | ${escapeTable(item.notes.join(' '))} |`),
  ].join('\n');
}

function renderRevenueReadiness(readiness: RevenueReadiness): string {
  return renderList([
    `Lead Pipeline Ready: ${readiness.leadPipelineReady}`,
    `Audit Pipeline Ready: ${readiness.auditPipelineReady}`,
    `Proposal Pipeline Ready: ${readiness.proposalPipelineReady}`,
    `Client Delivery Ready: ${readiness.clientDeliveryReady}`,
    `Finance Ready: ${readiness.financeReady}`,
    `Current MRR: ${formatCurrency(readiness.currentMrr)}`,
    ...readiness.notes,
  ]);
}

function renderOperationRhythm(plan: DailyOperationPlan): string {
  return [
    'Daily:',
    renderList(plan.dailyCommands),
    '',
    'Weekly:',
    renderList(plan.weeklyCommands),
    '',
    'Monthly:',
    renderList(plan.monthlyCommands),
  ].join('\n');
}

function renderChecklist(items: string[]): string {
  return items.map((item) => `- [ ] ${item}`).join('\n');
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function writeOutputs(outputs: { fileName: string; body: string }[]): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });

  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }

  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function pathExists(relativeOrAbsolutePath: string): boolean {
  const targetPath = path.isAbsolute(relativeOrAbsolutePath)
    ? relativeOrAbsolutePath
    : path.join(process.cwd(), relativeOrAbsolutePath);

  return fs.existsSync(targetPath);
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US')}`;
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
