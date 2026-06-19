import fs = require('fs');
import path = require('path');
import { buildArchitectureAudit } from '../studioArchitecture/architectureRules';
import { buildTestingReportBundle } from '../testing/testingRules';
import { scanCommandHealth } from './scanCommands';
import { scanDashboardHealth } from './scanDashboardHealth';
import { scanEvidenceHealth } from './scanEvidenceHealth';
import { scanMobileHealth } from './scanMobileHealth';
import { scanOutputHealth } from './scanOutputs';
import { scanRuntimeHealth } from './scanRuntimeData';
import { scanSourceOfTruthHealth } from './scanSourceOfTruth';
import { DoctorStatus, HealthIssue, HealthLevel, StudioHealthDashboard, StudioHealthReport } from './types';

export const studioHealthOutputDir = path.join(process.cwd(), 'output', 'studio-health');

const safetyRules = [
  'Studio Health is local-only and read-only except for its own generated reports.',
  'No source, runtime, client, outcome, command, or generated artifact is modified, moved, deleted, repaired, or regenerated automatically.',
  'Repair, cleanup, and backup outputs are recommendations requiring human approval.',
  'No cloud backup, outreach, client action, payment, deployment, or repository modification is performed.',
];

export function buildStudioHealthReport(): StudioHealthReport {
  const commands = scanCommandHealth();
  const runtime = scanRuntimeHealth();
  const outputs = scanOutputHealth();
  const sourceOfTruth = scanSourceOfTruthHealth();
  const dashboard = scanDashboardHealth();
  const mobile = scanMobileHealth();
  const evidence = scanEvidenceHealth();
  const architecture = buildArchitectureAudit();
  const testing = buildTestingReportBundle();

  const architectureScore = architecture.risks.length === 0 ? 100 : Math.max(50, 100 - architecture.risks.length * 8);
  const commandScore = score(commands.status, commands.brokenCommands, commands.deprecatedCommands);
  const runtimeScore = score(runtime.status, runtime.invalidJsonFiles, runtime.emptyFiles + runtime.oversizedFiles + runtime.duplicateFiles);
  const dashboardScore = componentScore(dashboard.status, dashboard.healthyItems, dashboard.checkedItems);
  const evidenceScore = componentScore(evidence.status, evidence.healthyItems, evidence.checkedItems);
  const testingScore = testing.readiness.qualityGateStatus === 'PASS' && testing.readiness.missingCategories === 0 ? 100 : 60;
  const healthScore = Math.round(
    architectureScore * 0.15
    + commandScore * 0.2
    + runtimeScore * 0.2
    + dashboardScore * 0.15
    + evidenceScore * 0.15
    + testingScore * 0.15,
  );
  const allIssues = [
    ...commands.issues,
    ...runtime.issues,
    ...outputs.issues,
    ...sourceOfTruth.issues,
    ...dashboard.issues,
    ...mobile.issues,
    ...evidence.issues,
  ];

  return {
    generatedAt: new Date().toISOString(),
    score: healthScore,
    doctorStatus: doctorStatus(healthScore, allIssues),
    architectureScore,
    commandScore,
    runtimeScore,
    dashboardScore,
    evidenceScore,
    testingScore,
    commands,
    runtime,
    outputs,
    sourceOfTruth,
    dashboard,
    mobile,
    evidence,
    repairRecommendations: repairRecommendations(allIssues),
    backupRecommendations: backupRecommendations(),
    cleanupRecommendations: cleanupRecommendations(runtime, outputs),
    safetyRules,
  };
}

export function buildStudioHealthDashboard(): StudioHealthDashboard {
  const report = buildStudioHealthReport();
  return {
    studioHealth: `${report.score}/100`,
    commandHealth: `${report.commands.status}; ${report.commands.brokenCommands} broken`,
    runtimeHealth: `${report.runtime.status}; ${report.runtime.invalidJsonFiles} invalid JSON`,
    evidenceHealth: report.evidence.status,
    doctorStatus: report.doctorStatus,
    repairRecommendations: report.repairRecommendations.length,
  };
}

export function writeStudioHealthReports(report = buildStudioHealthReport()): string[] {
  fs.mkdirSync(studioHealthOutputDir, { recursive: true });
  const reports = [
    ['health-report.md', renderHealthReport(report)],
    ['command-health.md', renderCommandHealth(report)],
    ['runtime-health.md', renderRuntimeHealth(report)],
    ['output-health.md', renderOutputHealth(report)],
    ['source-of-truth-health.md', renderSourceOfTruthHealth(report)],
    ['dashboard-health.md', renderComponentHealth('Dashboard Health', report.dashboard.status, report.dashboard.issues, report)],
    ['mobile-health.md', renderComponentHealth('Mobile Health', report.mobile.status, report.mobile.issues, report)],
    ['evidence-health.md', renderComponentHealth('Evidence Health', report.evidence.status, report.evidence.issues, report)],
    ['repair-plan.md', renderRepairPlan(report)],
    ['backup-plan.md', renderBackupPlan(report)],
    ['cleanup-plan.md', renderCleanupPlan(report)],
    ['health-summary.md', renderHealthSummary(report)],
  ] as const;
  return reports.map(([fileName, body]) => {
    const outputPath = path.join(studioHealthOutputDir, fileName);
    fs.writeFileSync(outputPath, body, 'utf8');
    return outputPath;
  });
}

export function renderHealthReport(report: StudioHealthReport): string {
  return document(report, 'Studio Doctor Report', [
    bullets([
      `Overall Health Score: ${report.score}/100`,
      `Doctor Status: ${report.doctorStatus}`,
      `Architecture Health: ${report.architectureScore}/100`,
      `Command Health: ${report.commandScore}/100`,
      `Runtime Health: ${report.runtimeScore}/100`,
      `Dashboard Health: ${report.dashboardScore}/100`,
      `Evidence Health: ${report.evidenceScore}/100`,
      `Testing Health: ${report.testingScore}/100`,
    ]),
  ]);
}

export function renderCommandHealth(report: StudioHealthReport): string {
  const command = report.commands;
  return document(report, 'Command Health', [
    bullets([
      `Status: ${command.status}`,
      `Total Commands: ${command.totalCommands}`,
      `Healthy Commands: ${command.healthyCommands}`,
      `Broken Commands: ${command.brokenCommands}`,
      `Deprecated Commands: ${command.deprecatedCommands}`,
      `Duplicate Commands: ${command.duplicateCommands}`,
    ]),
    '',
    issueTable(command.issues),
  ]);
}

export function renderRuntimeHealth(report: StudioHealthReport): string {
  const runtime = report.runtime;
  return document(report, 'Runtime Health', [
    bullets([
      `Status: ${runtime.status}`,
      `Runtime Files: ${runtime.runtimeFiles}`,
      `Generated Files: ${runtime.generatedFiles}`,
      `Cache Files: ${runtime.cacheFiles}`,
      `Temporary Files: ${runtime.temporaryFiles}`,
      `Duplicate Files: ${runtime.duplicateFiles}`,
      `Empty Files: ${runtime.emptyFiles}`,
      `Oversized Files: ${runtime.oversizedFiles}`,
      `Invalid JSON Files: ${runtime.invalidJsonFiles}`,
    ]),
    '',
    issueTable(runtime.issues.slice(0, 80)),
  ]);
}

export function renderOutputHealth(report: StudioHealthReport): string {
  return document(report, 'Output Health', [
    bullets([
      `Status: ${report.outputs.status}`,
      `Required Reports: ${report.outputs.requiredReports}`,
      `Present Reports: ${report.outputs.presentReports}`,
      `Missing Reports: ${report.outputs.missingReports.length}`,
      `Stale Reports: ${report.outputs.staleReports.length}`,
      `Unexpected Reports: ${report.outputs.unexpectedReports.length}`,
    ]),
    '',
    issueTable(report.outputs.issues),
  ]);
}

export function renderSourceOfTruthHealth(report: StudioHealthReport): string {
  return document(report, 'Source Of Truth Health', [
    '| Authority | Path | Status | Detail |',
    '| --- | --- | --- | --- |',
    ...report.sourceOfTruth.authorities.map((item) => `| ${escapeTable(item.authority)} | ${escapeTable(item.path)} | ${item.status} | ${escapeTable(item.detail)} |`),
  ]);
}

export function renderRepairPlan(report: StudioHealthReport): string {
  return document(report, 'Repair Plan', numbered(report.repairRecommendations));
}

export function renderBackupPlan(report: StudioHealthReport): string {
  return document(report, 'Backup Plan', [
    '## Critical Files',
    '',
    bullets(['package.json', 'tsconfig.json', 'src/', 'dashboard/', '.github/workflows/']),
    '',
    '## Source Of Truth Files',
    '',
    bullets(report.sourceOfTruth.authorities.map((item) => item.path)),
    '',
    '## Runtime Files',
    '',
    bullets(['data/', 'output/ when evidence/history matters', 'dashboard/dashboard.json']),
    '',
    '## Recommendations',
    '',
    bullets(report.backupRecommendations),
  ]);
}

export function renderCleanupPlan(report: StudioHealthReport): string {
  return document(report, 'Cleanup Plan', [
    'Recommendations only. No file was deleted or moved.',
    '',
    numbered(report.cleanupRecommendations).join('\n'),
  ]);
}

export function renderHealthSummary(report: StudioHealthReport): string {
  return document(report, 'Studio Health Summary', [
    bullets([
      `Health Score: ${report.score}/100`,
      `Doctor Status: ${report.doctorStatus}`,
      `Command Health: ${report.commands.status}`,
      `Runtime Health: ${report.runtime.status}`,
      `Source Of Truth Health: ${report.sourceOfTruth.status}`,
      `Output Health: ${report.outputs.status}`,
      `Dashboard Health: ${report.dashboard.status}`,
      `Mobile Health: ${report.mobile.status}`,
      `Evidence Health: ${report.evidence.status}`,
      `Repair Recommendations: ${report.repairRecommendations.length}`,
    ]),
  ]);
}

function renderComponentHealth(title: string, status: HealthLevel, issues: HealthIssue[], report: StudioHealthReport): string {
  return document(report, title, [`Status: ${status}`, '', issueTable(issues)]);
}

function repairRecommendations(issues: HealthIssue[]): string[] {
  const recommendations = [...new Set(issues.map((issue) => `${issue.area}: ${issue.recommendation}`))];
  return recommendations.length > 0 ? recommendations : ['No repair action required. Continue routine health review.'];
}

function backupRecommendations(): string[] {
  return [
    'Daily: back up source-of-truth JSON after verified manual changes.',
    'Weekly: create a local encrypted backup of src/, data/, dashboard/, docs/, package.json, and configuration files.',
    'Monthly: test restoration with npm install, npm run typecheck, npm test, and npm run studio:doctor.',
    'Exclude .env files, credentials, private tokens, and sensitive screenshots from shared or cloud backups.',
    'Keep backups local unless Daniel explicitly approves another destination.',
  ];
}

function cleanupRecommendations(runtime: StudioHealthReport['runtime'], outputs: StudioHealthReport['outputs']): string[] {
  return [
    `Review ${runtime.duplicateFiles} duplicate file candidate(s) before archiving.`,
    `Review ${runtime.temporaryFiles} temporary file candidate(s).`,
    `Review ${outputs.staleReports.length} stale required report(s) and regenerate only when needed.`,
    `Review ${outputs.unexpectedReports.length} unexpected output artifact(s).`,
    'Review legacy and candidate-deprecation npm scripts; do not remove automatically.',
    'Keep source-of-truth JSON, client records, and evidence artifacts out of automatic cleanup.',
  ];
}

function score(status: HealthLevel, failures: number, warnings: number): number {
  if (status === 'FAIL') return Math.max(20, 70 - failures * 15 - warnings);
  if (status === 'WARNING') return Math.max(55, 90 - warnings);
  return 100;
}

function componentScore(status: HealthLevel, healthy: number, total: number): number {
  if (total === 0) return 0;
  const coverage = Math.round((healthy / total) * 100);
  return status === 'FAIL' ? Math.min(coverage, 60) : status === 'WARNING' ? Math.min(coverage, 85) : coverage;
}

function doctorStatus(scoreValue: number, issues: HealthIssue[]): DoctorStatus {
  if (issues.some((issue) => issue.level === 'FAIL') || scoreValue < 65) return 'AT RISK';
  if (issues.some((issue) => issue.level === 'WARNING') || scoreValue < 85) return 'WATCH';
  return 'HEALTHY';
}

function document(report: StudioHealthReport, title: string, body: string[]): string {
  return [`# ${title}`, '', `Generated: ${report.generatedAt}`, '', ...body, '', '## Safety Rules', '', bullets(report.safetyRules), ''].join('\n');
}

function issueTable(issues: HealthIssue[]): string {
  if (issues.length === 0) return 'No issues detected.';
  return [
    '| Level | Area | Path | Issue | Recommendation |',
    '| --- | --- | --- | --- | --- |',
    ...issues.map((issue) => `| ${issue.level} | ${escapeTable(issue.area)} | ${escapeTable(issue.path)} | ${escapeTable(issue.message)} | ${escapeTable(issue.recommendation)} |`),
  ].join('\n');
}

function bullets(items: string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : '- None.';
}

function numbered(items: string[]): string[] {
  return items.length > 0 ? items.map((item, index) => `${index + 1}. ${item}`) : ['1. None.'];
}

function escapeTable(value: string): string {
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
