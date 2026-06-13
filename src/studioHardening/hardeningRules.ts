import fs = require('fs');
import path = require('path');
import { buildFirstRevenueExecutionPack } from '../executionPack/generateFirstRevenueChecklist';
import { buildStudioConsolidationReport } from '../studioConsolidation/studioRules';
import {
  AuditStatus,
  CommandAuditItem,
  DashboardReadiness,
  FileAuditItem,
  HardeningReport,
  LinkAuditItem,
  PushPressReadiness,
} from './types';

const outputRoot = path.join(process.cwd(), 'output', 'hardening');
const staleAfterDays = 7;

const safetyRules = [
  'No outreach sending.',
  'No emails.',
  'No proposals sent.',
  'No invoices.',
  'No payments.',
  'No invented replies.',
  'No invented revenue.',
  'Human approval remains required before external action.',
];

const majorCommands = [
  'studio:health',
  'studio:summary',
  'studio:release-check',
  'studio:hardening',
  'studio:monday-checklist',
  'studio:command-audit',
  'studio:output-audit',
  'dashboard:generate',
  'dashboard:mobile',
  'revenue:focus',
  'day:plan',
  'execute:first-client',
  'execute:decision-board',
  'message:pack',
  'message:review',
  'outcome:add',
  'outcome:dashboard',
  'followup:queue',
  'followup:daily',
  'winloss:analysis',
  'winloss:strategy',
  'typecheck',
  'test',
];

const expectedOutputs = [
  ['Dashboard JSON', 'output/dashboard/dashboard.json'],
  ['Dashboard summary', 'output/dashboard/dashboard-summary.md'],
  ['Dashboard health', 'output/dashboard/dashboard-health.md'],
  ['Revenue focus', 'output/revenue/revenue-focus.md'],
  ['Daily plan', 'output/daily-revenue/today-plan.md'],
  ['Execution decision board', 'output/execution/decision-board.md'],
  ['Execution first-client checklist', 'output/execution/first-client-checklist.md'],
  ['PushPress message pack', 'output/messages/pushpress-message-pack.md'],
  ['PushPress executive summary', 'output/executive/pushpress-executive-summary.md'],
  ['PushPress audit PDF', 'output/client-audit-reports/pushpress-qa-audit-report.pdf'],
  ['PushPress proposal PDF', 'output/proposals/pushpress-proposal.pdf'],
  ['Follow-up queue', 'output/followups/followup-queue.md'],
  ['Win/loss analysis', 'output/winloss/win-loss-analysis.md'],
] as const;

const pushPressFiles = [
  ['Message pack', 'output/messages/pushpress-message-pack.md'],
  ['Message review', 'output/messages/pushpress-message-review.md'],
  ['Executive summary', 'output/executive/pushpress-executive-summary.md'],
  ['Audit pack', 'output/audit-packs/pushpress-audit-pack.md'],
  ['Unified audit', 'output/unified-audits/pushpress-unified-audit.md'],
  ['Client audit markdown', 'output/client-audit-reports/pushpress-qa-audit-report.md'],
  ['Client audit PDF', 'output/client-audit-reports/pushpress-qa-audit-report.pdf'],
  ['Proposal markdown', 'output/proposals/pushpress-proposal.md'],
  ['Proposal PDF', 'output/proposals/pushpress-proposal.pdf'],
  ['Execution checklist', 'output/execution/first-client-checklist.md'],
] as const;

const dashboardFiles = [
  ['Dashboard HTML', 'dashboard/index.html'],
  ['Dashboard JS', 'dashboard/app.js'],
  ['Dashboard CSS', 'dashboard/styles.css'],
  ['Dashboard manifest', 'dashboard/manifest.json'],
  ['Dashboard icon', 'dashboard/icon.svg'],
  ['Dashboard data', 'dashboard/dashboard.json'],
  ['Output dashboard data', 'output/dashboard/dashboard.json'],
] as const;

export function buildHardeningReport(): HardeningReport {
  const commandAudit = buildCommandAudit();
  const outputAudit = buildOutputAudit();
  const staleReports = outputAudit.filter((item) => item.status === 'Stale');
  const dashboardReadiness = buildDashboardReadiness();
  const pushPressReadiness = buildPushPressReadiness();
  const studioReport = buildStudioConsolidationReport();
  const executionPack = buildFirstRevenueExecutionPack();
  const criticalIssues = [
    ...commandAudit.filter((item) => item.status === 'Missing' || item.status === 'Broken').map((item) => `${item.command}: ${item.detail}`),
    ...outputAudit.filter((item) => item.status === 'Missing').map((item) => `${item.label}: ${item.detail}`),
    ...dashboardReadiness.brokenLinks.map((item) => `Broken dashboard link: ${item.href}`),
    ...pushPressReadiness.requiredFiles.filter((item) => item.status === 'Missing').map((item) => `PushPress missing: ${item.label}`),
  ];
  const warnings = [
    ...staleReports.map((item) => `${item.label}: ${item.detail}`),
    ...studioReport.releaseReadiness.warnings,
    ...executionPack.remainingBlockers.map((blocker) => `Execution blocker: ${blocker}`),
  ];

  return {
    generatedAt: new Date().toISOString(),
    overallStatus: criticalIssues.length > 0 ? 'Broken' : warnings.length > 0 ? 'Warning' : 'Ready',
    commandAudit,
    outputAudit,
    staleReports,
    dashboardReadiness,
    pushPressReadiness,
    mondayChecklist: mondayChecklistItems(),
    criticalIssues,
    warnings,
    safetyRules,
  };
}

export function buildCommandAudit(): CommandAuditItem[] {
  const packageJson = readJson<{ scripts?: Record<string, string> }>('package.json', {});
  const scripts = packageJson.scripts ?? {};

  return majorCommands.map((command) => {
    const script = scripts[command] ?? '';
    if (!script) {
      return { command, status: 'Missing', script: 'Not configured', detail: 'Command is missing from package.json scripts.' };
    }

    const target = sourceTargetFromScript(script);
    if (target && !fs.existsSync(path.join(process.cwd(), target))) {
      return { command, status: 'Broken', script, detail: `Script target is missing: ${target}` };
    }

    return { command, status: 'Ready', script, detail: target ? `Script target exists: ${target}` : 'Command is configured.' };
  });
}

export function buildOutputAudit(): FileAuditItem[] {
  return expectedOutputs.map(([label, relativePath]) => auditFile(label, relativePath));
}

export function buildPushPressReadiness(): PushPressReadiness {
  const requiredFiles = pushPressFiles.map(([label, relativePath]) => auditFile(label, relativePath));
  const missing = requiredFiles.filter((item) => item.status === 'Missing');
  const stale = requiredFiles.filter((item) => item.status === 'Stale');
  const status: AuditStatus = missing.length > 0 ? 'Missing' : stale.length > 0 ? 'Stale' : 'Ready';

  return {
    status,
    requiredFiles,
    detail: missing.length > 0
      ? `${missing.length} PushPress package file(s) missing.`
      : stale.length > 0
        ? `${stale.length} PushPress package file(s) are older than ${staleAfterDays} days.`
        : 'PushPress first-client package is complete from local files.',
  };
}

export function buildDashboardReadiness(): DashboardReadiness {
  const files = dashboardFiles.map(([label, relativePath]) => auditFile(label, relativePath));
  const dashboardData = readJson<Record<string, unknown>>('dashboard/dashboard.json', {});
  const requiredData = [
    dataCheck('Read-only mode', dashboardData.mode === 'read-only'),
    dataCheck('Mobile command center', Boolean(dashboardData.mobileCommandCenter)),
    dataCheck('First revenue execution', Boolean(dashboardData.executionPack)),
    dataCheck('Outcome tracking', Boolean(dashboardData.outcomeTracking)),
    dataCheck('Follow-up engine', Boolean(dashboardData.followUpEngine)),
    dataCheck('Win/loss intelligence', Boolean(dashboardData.winLossIntelligence)),
    dataCheck('Safety notes', Array.isArray(dashboardData.safety)),
  ];
  const brokenLinks = collectDashboardLinks(dashboardData).filter((item) => item.status === 'Broken');
  const missingFiles = files.filter((item) => item.status === 'Missing');
  const missingData = requiredData.filter((item) => item.status === 'Missing');
  const status: AuditStatus = missingFiles.length || missingData.length || brokenLinks.length ? 'Broken' : 'Ready';

  return {
    status,
    files,
    requiredData,
    brokenLinks,
    detail: status === 'Ready'
      ? 'Dashboard mobile data and local report links are ready.'
      : `${missingFiles.length} dashboard files missing, ${missingData.length} data checks missing, ${brokenLinks.length} broken links.`,
  };
}

export function writeHardeningReport(report: HardeningReport): string[] {
  return writeOutputs([
    { fileName: 'hardening-report.md', body: renderHardeningReport(report) },
    { fileName: 'pushpress-readiness.md', body: renderPushPressReadiness(report) },
    { fileName: 'dashboard-readiness.md', body: renderDashboardReadiness(report) },
  ]);
}

export function writeMondayChecklist(report: HardeningReport): string[] {
  return writeOutputs([
    { fileName: 'monday-launch-checklist.md', body: renderMondayChecklist(report) },
  ]);
}

export function writeCommandAudit(report: HardeningReport): string[] {
  return writeOutputs([
    { fileName: 'command-audit.md', body: renderCommandAudit(report) },
  ]);
}

export function writeOutputAudit(report: HardeningReport): string[] {
  return writeOutputs([
    { fileName: 'output-audit.md', body: renderOutputAudit(report) },
  ]);
}

export function renderHardeningReport(report: HardeningReport): string {
  return [
    '# Studio Hardening Report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Status',
    renderList([
      `Overall status: ${report.overallStatus}`,
      `Critical issues: ${report.criticalIssues.length}`,
      `Warnings: ${report.warnings.length}`,
      `Dashboard readiness: ${report.dashboardReadiness.status}`,
      `PushPress readiness: ${report.pushPressReadiness.status}`,
    ]),
    '',
    '## Critical Issues',
    renderList(report.criticalIssues),
    '',
    '## Warnings',
    renderList(report.warnings),
    '',
    '## Monday Launch Readiness',
    renderChecklist(report.mondayChecklist),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderMondayChecklist(report: HardeningReport): string {
  return [
    '# Monday Launch Checklist',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderChecklist(report.mondayChecklist),
    '',
    '## Decision Rule',
    renderList([
      'SEND only if Daniel manually approves the exact message after review.',
      'WAIT if the package feels incomplete or timing is wrong.',
      'REWRITE if the message is unclear, too pushy, or not aligned with public-page evidence.',
    ]),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderCommandAudit(report: HardeningReport): string {
  return [
    '# Command Audit',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Command | Status | Detail | Script |',
    '| --- | --- | --- | --- |',
    ...report.commandAudit.map((item) => `| ${item.command} | ${item.status} | ${escapeTable(item.detail)} | ${escapeTable(item.script)} |`),
    '',
    '## Note',
    'This audit verifies package script wiring and local source targets. Runtime validation is handled by the explicit validation commands.',
    '',
  ].join('\n');
}

export function renderOutputAudit(report: HardeningReport): string {
  return [
    '# Output Audit',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderFileTable(report.outputAudit),
    '',
    '## Stale Generated Reports',
    report.staleReports.length > 0 ? renderFileTable(report.staleReports) : '- None.',
    '',
  ].join('\n');
}

export function renderPushPressReadiness(report: HardeningReport): string {
  return [
    '# PushPress Readiness',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Status: ${report.pushPressReadiness.status}`,
    '',
    report.pushPressReadiness.detail,
    '',
    renderFileTable(report.pushPressReadiness.requiredFiles),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderDashboardReadiness(report: HardeningReport): string {
  return [
    '# Dashboard Readiness',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Status: ${report.dashboardReadiness.status}`,
    '',
    report.dashboardReadiness.detail,
    '',
    '## Dashboard Files',
    renderFileTable(report.dashboardReadiness.files),
    '',
    '## Required Mobile Data',
    renderFileTable(report.dashboardReadiness.requiredData),
    '',
    '## Broken Links',
    report.dashboardReadiness.brokenLinks.length > 0
      ? renderLinkTable(report.dashboardReadiness.brokenLinks)
      : '- None.',
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

function mondayChecklistItems(): string[] {
  return [
    'Open mobile dashboard.',
    'Run npm run revenue:focus.',
    'Run npm run day:plan.',
    'Review PushPress message pack.',
    'Review PushPress executive summary.',
    'Review PushPress audit PDF.',
    'Review PushPress proposal PDF.',
    'Decide: SEND / WAIT / REWRITE.',
    'If sent, record outcome.',
    'Do not send automated outreach.',
  ];
}

function auditFile(label: string, relativePath: string): FileAuditItem {
  const absolutePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) {
    return { label, path: relativePath, status: 'Missing', detail: 'File is missing.' };
  }

  const stat = fs.statSync(absolutePath);
  const ageDays = (Date.now() - stat.mtimeMs) / 86_400_000;
  if (ageDays > staleAfterDays) {
    return { label, path: relativePath, status: 'Stale', detail: `File exists but is ${Math.floor(ageDays)} day(s) old.` };
  }

  return { label, path: relativePath, status: 'Ready', detail: `File exists; updated ${stat.mtime.toISOString()}.` };
}

function dataCheck(label: string, passed: boolean): FileAuditItem {
  return {
    label,
    path: 'dashboard/dashboard.json',
    status: passed ? 'Ready' : 'Missing',
    detail: passed ? 'Required dashboard data is present.' : 'Required dashboard data is missing.',
  };
}

function collectDashboardLinks(value: unknown): LinkAuditItem[] {
  const links: LinkAuditItem[] = [];
  collectLinks(value, links);
  return links;
}

function collectLinks(value: unknown, links: LinkAuditItem[]): void {
  if (Array.isArray(value)) {
    value.forEach((item) => collectLinks(item, links));
    return;
  }

  if (!value || typeof value !== 'object') return;

  const record = value as Record<string, unknown>;
  const href = record.href;
  if (typeof href === 'string') {
    const resolved = resolveDashboardHref(href);
    const exists = resolved.startsWith('external:') || fs.existsSync(resolved);
    links.push({
      href,
      status: exists ? 'Ready' : 'Broken',
      resolvedPath: resolved.startsWith('external:') ? resolved : path.relative(process.cwd(), resolved),
    });
  }

  Object.values(record).forEach((item) => collectLinks(item, links));
}

function resolveDashboardHref(href: string): string {
  if (/^https?:\/\//.test(href)) return `external:${href}`;
  return path.resolve(process.cwd(), 'dashboard', href);
}

function sourceTargetFromScript(script: string): string | undefined {
  const match = script.match(/(?:node --import tsx|tsx)\s+([^\s]+)/);
  return match?.[1];
}

function writeOutputs(outputs: { fileName: string; body: string }[]): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });
  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }
  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

function readJson<T>(relativePath: string, fallback: T): T {
  const filePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function renderFileTable(items: FileAuditItem[]): string {
  if (items.length === 0) return '- None.';
  return [
    '| Item | Status | Path | Detail |',
    '| --- | --- | --- | --- |',
    ...items.map((item) => `| ${escapeTable(item.label)} | ${item.status} | ${escapeTable(item.path)} | ${escapeTable(item.detail)} |`),
  ].join('\n');
}

function renderLinkTable(items: LinkAuditItem[]): string {
  return [
    '| Link | Status | Resolved Path |',
    '| --- | --- | --- |',
    ...items.map((item) => `| ${escapeTable(item.href)} | ${item.status} | ${escapeTable(item.resolvedPath)} |`),
  ].join('\n');
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function renderChecklist(items: string[]): string {
  return items.map((item) => `- [ ] ${item}`).join('\n');
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
