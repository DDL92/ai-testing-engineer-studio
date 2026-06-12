import fs = require('fs');
import path = require('path');
import { buildClientReadinessReport, loadClientReadinessInput } from '../clientReadiness/clientReadinessRules';
import { ClientReadinessCandidate } from '../clientReadiness/types';
import { Lead } from '../leads/types';
import { buildOsStabilizationReport } from '../osStabilization/stabilizationRules';
import { CommandAuditItem, OsStabilizationReport, WorkflowAuditStage } from '../osStabilization/types';
import { buildRevenueCommandCenterReport, loadRevenueCommandCenterInput } from '../revenueCommandCenter/revenueRules';
import {
  ArchitectureLayer,
  CommandCategory,
  CommandInventoryItem,
  CommandInventoryStatus,
  FirstClientReadinessItem,
  ReleaseCandidateReport,
  ReleaseCheckItem,
  ReleaseCheckStatus,
  ReleaseRecommendation,
  ReleaseScore,
  ReleaseScoreCategory,
  WorkflowInventoryItem,
} from './types';

const outputRoot = path.join(process.cwd(), 'output', 'v1-candidate');

const manualApprovalReminder = [
  'Human approval is required before outreach, follow-up, proposal, SOW, discovery call, audit delivery, client report, renewal, invoice, payment, or external action.',
  'This release package is local-only and deterministic from repository files and local JSON data.',
  'No APIs, scraping, browsing, CRM, outreach automation, sending, payments, credentials, or external databases were used.',
  'Revenue readiness uses booked revenue from commercial local client records only; opportunities are not booked revenue.',
];

const requiredReleaseReportFiles = [
  'output/revenue-command-center/revenue-command-center.md',
  'output/revenue-command-center/mrr-forecast.md',
  'output/real-client-readiness/real-client-readiness-pack.md',
  'output/first-audit-workflow/first-audit-workflow.md',
  'output/operator-os-dashboard/operator-dashboard.md',
  'output/action-cockpit/action-cockpit.md',
  'output/mobile-command-center/mobile-command-center.md',
  'output/os-stabilization/system-audit.md',
  'output/os-stabilization/system-health.md',
];

const requiredDocs = [
  'README.md',
  'docs/operations/command-reference.md',
  'docs/roadmap/next-sprint.md',
];

const targetFirstClientCompanies = ['PushPress', 'TeamUp', 'Wodify', 'ABC Glofox', 'Bookee'];

export function buildReleaseCandidateReport(): ReleaseCandidateReport {
  const stabilization = buildOsStabilizationReport();
  const revenue = buildRevenueCommandCenterReport(loadRevenueCommandCenterInput());
  const clientReadiness = buildClientReadinessReport(loadClientReadinessInput());
  const commands = buildCommandInventory(stabilization.commandAudit);
  const workflows = buildWorkflowInventory(stabilization.workflowAudit);
  const firstClientReadiness = buildFirstClientReadiness(clientReadiness.candidates);
  const knownWarnings = buildKnownWarnings(stabilization, commands, revenue.excludedClientRecords.length);
  const releaseChecks = buildReleaseChecks(stabilization, revenue, commands, workflows);
  const releaseScore = buildReleaseScore(stabilization, releaseChecks, knownWarnings);

  return {
    generatedAt: stabilization.generatedAt,
    releaseChecks,
    releaseScore,
    architecture: buildArchitectureSummary(),
    commands,
    workflows,
    revenue,
    firstClientReadiness,
    closestLead: findClosestLead(firstClientReadiness),
    knownWarnings,
    stabilization,
    clientReadinessCandidates: clientReadiness.candidates,
    commandAudit: stabilization.commandAudit,
  };
}

export function writeReleaseCheck(report: ReleaseCandidateReport): string {
  fs.mkdirSync(outputRoot, { recursive: true });
  const outputPath = path.join(outputRoot, 'v1-release-check.md');
  fs.writeFileSync(outputPath, renderReleaseCheck(report), 'utf8');
  return outputPath;
}

export function writeV1ReportPackage(report: ReleaseCandidateReport): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });

  const outputs = [
    { fileName: 'v1-release-check.md', body: renderReleaseCheck(report) },
    { fileName: 'v1-report.md', body: renderV1Report(report) },
    { fileName: 'architecture-summary.md', body: renderArchitectureSummary(report) },
    { fileName: 'command-inventory.md', body: renderCommandInventory(report) },
    { fileName: 'workflow-inventory.md', body: renderWorkflowInventory(report) },
    { fileName: 'revenue-readiness.md', body: renderRevenueReadiness(report) },
    { fileName: 'first-client-readiness.md', body: renderFirstClientReadiness(report) },
    { fileName: 'known-warnings.md', body: renderKnownWarnings(report) },
    { fileName: 'roadmap-after-v1.md', body: renderRoadmapAfterV1(report) },
  ];

  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }

  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

export function renderReleaseCheck(report: ReleaseCandidateReport): string {
  return [
    '# AI Studio OS v1.0 Release Check',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Overall Release Score',
    renderScore(report.releaseScore),
    '',
    '## Release Checks',
    '| Area | Status | Evidence | Notes |',
    '| --- | --- | --- | --- |',
    ...report.releaseChecks.map((item) => `| ${escapeTable(item.area)} | ${item.status} | ${escapeTable(item.evidence.join('<br>'))} | ${escapeTable(item.notes.join('<br>'))} |`),
    '',
    '## Overall Release Recommendation',
    `${report.releaseScore.recommendation}`,
    '',
    '## Human Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderV1Report(report: ReleaseCandidateReport): string {
  return [
    '# AI Studio OS v1.0 Candidate',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Executive Summary',
    renderList([
      `Overall release score: ${report.releaseScore.overall}/100`,
      `Release recommendation: ${report.releaseScore.recommendation}`,
      `Booked MRR: ${formatCurrency(report.revenue.bookedMrr)}`,
      `Projected MRR: ${formatRange(report.revenue.projectedExpectedMrr)}/month speculative pipeline view`,
      `Commercial audit opportunities: ${report.revenue.auditOpportunities.length}`,
      `Commercial retainer opportunities: ${report.revenue.retainerOpportunities.length}`,
      `Closest lead to first revenue: ${report.closestLead?.company ?? 'No ready local lead found'}`,
      `Known warnings: ${report.knownWarnings.length}`,
    ]),
    '',
    '## Architecture Summary',
    renderArchitectureTable(report.architecture),
    '',
    '## Command Inventory',
    renderCommandSummary(report.commands),
    '',
    '## Workflow Inventory',
    renderWorkflowTable(report.workflows),
    '',
    '## Revenue Readiness',
    renderRevenueSummary(report),
    '',
    '## First Client Readiness',
    renderFirstClientTable(report.firstClientReadiness),
    '',
    '## Known Warnings',
    renderList(report.knownWarnings),
    '',
    '## Recommended Next Milestones',
    renderList([
      'Sprint 50: First Revenue Validation Pack.',
      '`npm run revenue:validate` to verify first-revenue conversion path from local records.',
      '`npm run first-client:path` to focus on the strongest first audit candidate.',
      'Stop building infrastructure until first audit sale and first retainer opportunity are validated.',
    ]),
    '',
    '## Release Recommendation',
    `${report.releaseScore.recommendation}: ${recommendationReason(report)}`,
    '',
    '## Human Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderArchitectureSummary(report: ReleaseCandidateReport): string {
  return [
    '# Architecture Summary',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderArchitectureTable(report.architecture),
    '',
    '## Human Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderCommandInventory(report: ReleaseCandidateReport): string {
  const categories: CommandCategory[] = ['Lead', 'Revenue', 'Client', 'Operations', 'Reporting', 'Dashboard', 'Mobile', 'System'];

  return [
    '# Command Inventory',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    ...categories.flatMap((category) => [
      `## ${category}`,
      '',
      renderCommandTable(report.commands.filter((item) => item.category === category)),
      '',
    ]),
    '## Status Definitions',
    renderList([
      'active: current command with no detected overlap warning.',
      'legacy: retained older surface where a newer OS command is preferred.',
      'overlapping: command family or script overlap needs manual review before removing anything.',
    ]),
    '',
  ].join('\n');
}

export function renderWorkflowInventory(report: ReleaseCandidateReport): string {
  return [
    '# Workflow Inventory',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'Lead -> Research -> Audit -> Outreach -> Proposal -> Discovery Call -> Audit Sale -> Delivery -> Retainer -> Renewal',
    '',
    renderWorkflowTable(report.workflows),
    '',
    '## Human Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderRevenueReadiness(report: ReleaseCandidateReport): string {
  return [
    '# Revenue Readiness',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    renderRevenueSummary(report),
    '',
    '## Top Revenue Opportunities',
    renderTopRevenueTable(report),
    '',
    '## Revenue Risks',
    renderList(report.revenue.revenueRisks),
    '',
    '## Revenue Boundary',
    renderList([
      'Booked MRR is counted only from active commercial retainer client records.',
      'Projected MRR is speculative pipeline math from existing local opportunity rules.',
      'Audit and retainer opportunities are not booked revenue.',
      `Excluded demo/sample client records: ${report.revenue.excludedClientRecords.length}`,
    ]),
    '',
    '## Human Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderFirstClientReadiness(report: ReleaseCandidateReport): string {
  return [
    '# First Client Readiness',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderFirstClientTable(report.firstClientReadiness),
    '',
    '## Closest Lead To First Revenue',
    report.closestLead
      ? renderList([
        `${report.closestLead.company}: ${report.closestLead.readiness}`,
        `Next action: ${report.closestLead.nextAction}`,
      ])
      : '- No local first-client candidate is ready.',
    '',
    '## Notes',
    renderList([
      'Companies without a local lead record are marked NOT READY instead of being inferred.',
      'PARTIAL means a local lead exists but supporting research, audit, outreach, or proposal assets are incomplete.',
      'Readiness is based on local lead data and generated artifacts only.',
      'No contacts, audit findings, proposal status, or revenue were invented.',
    ]),
    '',
    '## Human Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderKnownWarnings(report: ReleaseCandidateReport): string {
  return [
    '# Known Warnings',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderList(report.knownWarnings),
    '',
    '## Handling',
    renderList([
      'Do not remove overlapping commands during the v1.0 candidate package unless a replacement is already validated.',
      'Keep demo/sample client fee records excluded from booked revenue.',
      'Treat warnings as manual review items, not blockers unless they become revenue consistency issues.',
    ]),
    '',
  ].join('\n');
}

export function renderRoadmapAfterV1(report: ReleaseCandidateReport): string {
  return [
    '# Roadmap After v1',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Immediate Priority',
    renderList([
      'Sprint 50: First Revenue Validation Pack.',
      'Stop building infrastructure and focus on converting one commercial lead into a paid audit.',
    ]),
    '',
    '## First Client',
    renderList([
      `Prioritize ${report.closestLead?.company ?? 'the strongest ready local lead'} for manual first-audit path review.`,
      'Confirm company fit, contact path, audit angle, and outreach approval manually.',
    ]),
    '',
    '## First Audit Sold',
    renderList([
      'Validate a narrow QA Audit offer before expanding platform scope.',
      'Use existing proposal, first-audit workflow, and audit pack assets only after Daniel approval.',
    ]),
    '',
    '## First Retainer',
    renderList([
      'Convert audit evidence into a Playwright Starter Pack or QA Automation Retainer only when the client need is validated.',
      'Keep retainer revenue unbooked until a real commercial local client record exists.',
    ]),
    '',
    '## Revenue Validation',
    renderList([
      'Add `npm run revenue:validate` in Sprint 50.',
      'Add `npm run first-client:path` in Sprint 50.',
      'Use local records only and keep opportunity math separate from booked MRR.',
    ]),
    '',
    '## Mobile Evolution',
    renderList([
      'Keep the current Mobile Command Center as Markdown/local reporting.',
      'Consider a mobile/PWA surface only after first revenue validates daily operating value.',
    ]),
    '',
    '## Future Modules',
    renderList([
      'AI Operations Audit Studio - future roadmap only.',
      'AI Lead Response Studio - future roadmap only.',
      'AI Client Reporting Studio - future roadmap only.',
    ]),
    '',
  ].join('\n');
}

function buildReleaseChecks(
  stabilization: OsStabilizationReport,
  revenue: ReleaseCandidateReport['revenue'],
  commands: CommandInventoryItem[],
  workflows: WorkflowInventoryItem[],
): ReleaseCheckItem[] {
  const scriptSet = new Set(stabilization.commandAudit.map((item) => item.command));
  const releaseWarnings = filterReleaseRelevantWarnings(stabilization.warnings);
  const missingCommandScripts = ['os:dashboard', 'revenue:daily', 'cockpit:daily', 'mobile:center', 'os:audit', 'os:health']
    .filter((command) => !scriptSet.has(command));
  const missingReports = requiredReleaseReportFiles.filter((reportPath) => !pathExists(reportPath));
  const missingDocs = requiredDocs.filter((docPath) => !pathExists(docPath));
  const workflowGaps = workflows.filter((workflow) => workflow.status !== 'implemented');

  return [
    {
      area: 'Commands',
      status: missingCommandScripts.length === 0 ? 'PASS' : 'FAIL',
      evidence: [
        `${stabilization.commandAudit.length} npm scripts audited.`,
        `${commands.filter((command) => command.status === 'legacy').length} legacy command(s).`,
        `${commands.filter((command) => command.status === 'overlapping').length} overlapping command(s).`,
      ],
      notes: missingCommandScripts.length === 0 ? ['Required OS commands are present.'] : missingCommandScripts.map((command) => `Missing npm run ${command}`),
    },
    {
      area: 'Reports',
      status: missingReports.length === 0 ? 'PASS' : 'FAIL',
      evidence: requiredReleaseReportFiles.filter(pathExists),
      notes: missingReports.length === 0 ? ['Required source reports are available.'] : missingReports.map((reportPath) => `Missing ${reportPath}`),
    },
    {
      area: 'Workflows',
      status: workflowGaps.length === 0 ? 'PASS' : 'WARNING',
      evidence: workflows.map((workflow) => `${workflow.stage}: ${workflow.status}`),
      notes: workflowGaps.length === 0 ? ['Lead-to-renewal workflow is implemented.'] : workflowGaps.map((workflow) => `${workflow.stage}: ${workflow.status}`),
    },
    {
      area: 'Revenue Consistency',
      status: stabilization.revenueAudit.consistencyWarnings.length === 0 ? 'PASS' : 'FAIL',
      evidence: [
        `Booked MRR: ${formatCurrency(revenue.bookedMrr)}`,
        `Excluded demo/sample client records: ${revenue.excludedClientRecords.length}`,
      ],
      notes: stabilization.revenueAudit.consistencyWarnings.length === 0
        ? ['Revenue Command Center remains the booked MRR source of truth.']
        : stabilization.revenueAudit.consistencyWarnings,
    },
    {
      area: 'Documentation',
      status: missingDocs.length === 0 && stabilization.documentationAudit.missingCommands.length === 0 ? 'PASS' : 'WARNING',
      evidence: requiredDocs.filter(pathExists),
      notes: missingDocs.concat(stabilization.documentationAudit.missingCommands).length === 0
        ? ['README, command reference, and roadmap are available for v1.0 candidate context.']
        : missingDocs.concat(stabilization.documentationAudit.missingCommands),
    },
    {
      area: 'System Health',
      status: stabilization.criticalIssues.length === 0 ? releaseWarnings.length === 0 ? 'PASS' : 'WARNING' : 'FAIL',
      evidence: [
        `Health areas: ${stabilization.healthAreas.length}`,
        `Critical issues: ${stabilization.criticalIssues.length}`,
        `Warnings: ${releaseWarnings.length}`,
      ],
      notes: stabilization.criticalIssues.length > 0 ? stabilization.criticalIssues : releaseWarnings.slice(0, 8),
    },
  ];
}

function buildReleaseScore(
  stabilization: OsStabilizationReport,
  releaseChecks: ReleaseCheckItem[],
  knownWarnings: string[],
): ReleaseScore {
  const commandCheck = releaseChecks.find((check) => check.area === 'Commands');
  const reportCheck = releaseChecks.find((check) => check.area === 'Reports');
  const workflowCheck = releaseChecks.find((check) => check.area === 'Workflows');
  const revenueCheck = releaseChecks.find((check) => check.area === 'Revenue Consistency');
  const documentationCheck = releaseChecks.find((check) => check.area === 'Documentation');
  const systemHealthCheck = releaseChecks.find((check) => check.area === 'System Health');
  const architectureGreen = percentage(stabilization.healthAreas.filter((area) => area.status === 'GREEN').length, stabilization.healthAreas.length);

  const categories: ReleaseScoreCategory[] = [
    categoryScore('Architecture', Math.round(architectureGreen), releaseStatusForScore(architectureGreen), [`${stabilization.healthAreas.length} OS health areas checked.`]),
    categoryScore('Commands', scoreFromCheck(commandCheck), commandCheck?.status ?? 'FAIL', commandCheck?.notes ?? []),
    categoryScore('Reports', scoreFromCheck(reportCheck), reportCheck?.status ?? 'FAIL', reportCheck?.notes ?? []),
    categoryScore('Revenue', scoreFromCheck(revenueCheck), revenueCheck?.status ?? 'FAIL', revenueCheck?.notes ?? []),
    categoryScore('Workflows', scoreFromCheck(workflowCheck), workflowCheck?.status ?? 'FAIL', workflowCheck?.notes ?? []),
    categoryScore('Documentation', scoreFromCheck(documentationCheck), documentationCheck?.status ?? 'FAIL', documentationCheck?.notes ?? []),
    categoryScore('System Health', scoreFromCheck(systemHealthCheck), systemHealthCheck?.status ?? 'FAIL', systemHealthCheck?.notes ?? []),
  ];
  const weighted = Math.round(categories.reduce((sum, item) => sum + item.score, 0) / categories.length);
  const warningPenalty = Math.min(5, knownWarnings.length);
  const overall = Math.max(0, Math.min(100, weighted - warningPenalty));
  const recommendation: ReleaseRecommendation = stabilization.criticalIssues.length > 0 || overall < 85
    ? 'NOT READY'
    : knownWarnings.length === 0 && overall >= 95
      ? 'READY'
      : 'CANDIDATE';

  return {
    overall,
    recommendation,
    categories,
  };
}

function buildArchitectureSummary(): ArchitectureLayer[] {
  return [
    {
      name: 'Lead Layer',
      purpose: 'Capture, score, research, and prepare commercial leads for manual review.',
      inputs: ['data/leads.json', 'data/contact-reviews.json', 'manual candidate queue'],
      outputs: ['lead packs', 'research packs', 'contact reviews', 'commercial opportunity lists'],
    },
    {
      name: 'Revenue Layer',
      purpose: 'Separate booked MRR from speculative opportunities and prioritize revenue actions.',
      inputs: ['commercial leads', 'data/clients.json', 'Revenue Command Center rules'],
      outputs: ['booked MRR', 'MRR forecast', 'audit opportunities', 'retainer opportunities', 'daily revenue actions'],
    },
    {
      name: 'Client Layer',
      purpose: 'Prepare onboarding, delivery, reporting, renewal, and retainer workflows after manual approval.',
      inputs: ['client records', 'approved lead context', 'delivery evidence'],
      outputs: ['client prep', 'delivery plans', 'client reports', 'renewal and expansion reports'],
    },
    {
      name: 'Operations Layer',
      purpose: 'Turn local reports into daily operating priorities without sending or external integrations.',
      inputs: ['pipeline reports', 'revenue reports', 'client reports', 'approval queues'],
      outputs: ['daily operator', 'Action Cockpit', 'Mac daily summary', 'approval checklist'],
    },
    {
      name: 'Reporting Layer',
      purpose: 'Generate evidence-first Markdown reports for audits, clients, revenue, and system health.',
      inputs: ['local JSON data', 'generated artifacts', 'Playwright evidence when explicitly run'],
      outputs: ['audit reports', 'client reports', 'stabilization reports', 'v1 candidate reports'],
    },
    {
      name: 'Dashboard Layer',
      purpose: 'Provide local command-center views for manual operating decisions.',
      inputs: ['Revenue Command Center', 'Action Cockpit', 'operator reports', 'mobile reports'],
      outputs: ['Operator OS Dashboard', 'Mobile Command Center', 'legacy dashboard surfaces'],
    },
  ];
}

function buildCommandInventory(commandAudit: CommandAuditItem[]): CommandInventoryItem[] {
  return commandAudit.map((item) => ({
    category: categoryForCommand(item.command),
    command: `npm run ${item.command}`,
    purpose: item.purpose,
    status: commandStatus(item),
    note: item.duplicateRisk === 'none' ? item.replacementRecommendation : `${item.duplicateRisk}; ${item.replacementRecommendation}`,
  })).sort((a, b) => a.category.localeCompare(b.category) || a.command.localeCompare(b.command));
}

function buildWorkflowInventory(workflowAudit: WorkflowAuditStage[]): WorkflowInventoryItem[] {
  return workflowAudit.map((stage) => ({
    stage: stage.stage,
    status: stage.status,
    supportingReports: stage.evidence.filter((item) => item.startsWith('output/')),
    supportingCommands: stage.evidence.filter((item) => item.startsWith('npm run')),
    missing: stage.missing,
  }));
}

function buildFirstClientReadiness(candidates: ClientReadinessCandidate[]): FirstClientReadinessItem[] {
  return targetFirstClientCompanies.map((company) => {
    const candidate = findCandidate(company, candidates);
    if (!candidate) {
      return {
        company,
        readiness: 'NOT READY',
        proposalStatus: 'No local lead record found.',
        outreachStatus: 'No local outreach status found.',
        auditStatus: 'No local audit status found.',
        nextAction: 'Add and manually verify a local lead record before including this company in first-client workflow.',
      };
    }

    return {
      company: candidate.lead.companyName,
      sourceLeadId: candidate.lead.id,
      readiness: candidate.readinessStatus,
      proposalStatus: pathExists(path.join('output', 'sows', `${candidate.lead.id}-sow.md`)) ? 'SOW draft exists locally.' : 'No local SOW draft found.',
      outreachStatus: candidate.outreachStatus,
      auditStatus: candidate.auditStatus,
      nextAction: candidate.nextAction,
    };
  });
}

function buildKnownWarnings(
  stabilization: OsStabilizationReport,
  commands: CommandInventoryItem[],
  excludedClientRecords: number,
): string[] {
  const warnings = new Set<string>();
  const overlapFamilies = new Map<string, string>();

  for (const command of commands.filter((item) => item.status === 'overlapping')) {
    const familyMatch = command.note.match(/large command family \((\d+) ([^:]+):\* commands\)/);
    if (familyMatch) {
      overlapFamilies.set(familyMatch[2], `${familyMatch[2]} command family overlap exists: ${familyMatch[1]} ${familyMatch[2]}:* commands need manual ownership review before any cleanup.`);
    } else {
      warnings.add(`${command.command}: ${command.note}`);
    }
  }

  for (const warning of overlapFamilies.values()) {
    warnings.add(warning);
  }
  if (commands.some((item) => item.command === 'npm run dashboard')) {
    warnings.add('Legacy dashboard overlap exists: `npm run dashboard` remains alongside `npm run os:dashboard`.');
  }
  if (commands.some((item) => item.command === 'npm run cockpit')) {
    warnings.add('Legacy cockpit overlap exists: `npm run cockpit` remains alongside `npm run cockpit:daily`.');
  }
  if (excludedClientRecords > 0) {
    warnings.add(`Demo/sample client fee records exist and are excluded from booked revenue: ${excludedClientRecords}.`);
  }
  for (const warning of stabilization.warnings) {
    if (!isReleaseRelevantWarning(warning)) continue;
    if (warning.includes('large command family')) continue;
    if (warning.includes('legacy cockpit overlaps')) continue;
    if (warning.includes('dashboard overlaps with os:dashboard')) continue;
    warnings.add(warning);
  }

  return Array.from(warnings).sort();
}

function filterReleaseRelevantWarnings(warnings: string[]): string[] {
  return warnings.filter(isReleaseRelevantWarning);
}

function isReleaseRelevantWarning(warning: string): boolean {
  return !warning.includes('output/v1-candidate/') && !warning.includes('output/first-revenue-validation/');
}

function findClosestLead(items: FirstClientReadinessItem[]): FirstClientReadinessItem | undefined {
  const rank = (item: FirstClientReadinessItem): number => {
    if (item.readiness === 'READY') return 3;
    if (item.readiness === 'PARTIAL') return 2;
    return 1;
  };

  return items
    .filter((item) => item.sourceLeadId)
    .sort((a, b) => rank(b) - rank(a) || a.company.localeCompare(b.company))[0];
}

function findCandidate(company: string, candidates: ClientReadinessCandidate[]): ClientReadinessCandidate | undefined {
  const normalized = normalize(company);
  return candidates.find((candidate) => normalize(candidate.lead.companyName) === normalized || normalize(candidate.lead.id) === normalized);
}

function categoryForCommand(command: string): CommandCategory {
  if (command.startsWith('os:')) return command.includes('dashboard') ? 'Dashboard' : 'System';
  if (command.startsWith('lead') || command.startsWith('outreach') || command.startsWith('contact') || command.startsWith('pipeline') || command.startsWith('commercial')) return 'Lead';
  if (command.includes('revenue') || command.includes('metrics')) return 'Revenue';
  if (command.startsWith('client') || command.startsWith('renewal') || command.startsWith('first-audit') || command.startsWith('proposal') || command.startsWith('sow')) return 'Client';
  if (command.startsWith('operator') || command.startsWith('mac') || command.startsWith('day') || command.includes('cockpit') || command.startsWith('actions') || command.startsWith('business')) return 'Operations';
  if (command.includes('report') || command.startsWith('content') || command.startsWith('success')) return 'Reporting';
  if (command.includes('dashboard')) return 'Dashboard';
  if (command.includes('mobile')) return 'Mobile';
  return 'System';
}

function commandStatus(item: CommandAuditItem): CommandInventoryStatus {
  if (item.command === 'dashboard' || item.command === 'cockpit') return 'legacy';
  if (item.duplicateRisk !== 'none') return 'overlapping';
  return 'active';
}

function scoreFromCheck(check: ReleaseCheckItem | undefined): number {
  if (!check) return 0;
  if (check.status === 'PASS') return 100;
  if (check.status === 'WARNING') return 90;
  return 60;
}

function categoryScore(
  category: ReleaseScoreCategory['category'],
  score: number,
  status: ReleaseCheckStatus,
  notes: string[],
): ReleaseScoreCategory {
  return {
    category,
    score,
    status,
    notes,
  };
}

function releaseStatusForScore(score: number): ReleaseCheckStatus {
  if (score >= 95) return 'PASS';
  if (score >= 80) return 'WARNING';
  return 'FAIL';
}

function recommendationReason(report: ReleaseCandidateReport): string {
  if (report.releaseScore.recommendation === 'READY') return 'All release checks pass without known warnings.';
  if (report.releaseScore.recommendation === 'CANDIDATE') return 'Core system is release-candidate ready, with known warnings requiring manual review.';
  return 'Blocking release checks or critical issues remain.';
}

function renderScore(score: ReleaseScore): string {
  return [
    `Overall Release Score: ${score.overall}/100`,
    `Release Recommendation: ${score.recommendation}`,
    '',
    '| Category | Score | Status | Notes |',
    '| --- | ---: | --- | --- |',
    ...score.categories.map((item) => `| ${item.category} | ${item.score} | ${item.status} | ${escapeTable(item.notes.join('<br>'))} |`),
  ].join('\n');
}

function renderArchitectureTable(items: ArchitectureLayer[]): string {
  return [
    '| Layer | Purpose | Inputs | Outputs |',
    '| --- | --- | --- | --- |',
    ...items.map((item) => `| ${escapeTable(item.name)} | ${escapeTable(item.purpose)} | ${escapeTable(item.inputs.join('<br>'))} | ${escapeTable(item.outputs.join('<br>'))} |`),
  ].join('\n');
}

function renderCommandSummary(items: CommandInventoryItem[]): string {
  const categories: CommandCategory[] = ['Lead', 'Revenue', 'Client', 'Operations', 'Reporting', 'Dashboard', 'Mobile', 'System'];

  return renderList(categories.map((category) => {
    const categoryItems = items.filter((item) => item.category === category);
    return `${category}: ${categoryItems.length} commands (${categoryItems.filter((item) => item.status === 'active').length} active, ${categoryItems.filter((item) => item.status === 'legacy').length} legacy, ${categoryItems.filter((item) => item.status === 'overlapping').length} overlapping)`;
  }));
}

function renderCommandTable(items: CommandInventoryItem[]): string {
  if (items.length === 0) return 'No commands in this category.';
  return [
    '| Command | Purpose | Status | Note |',
    '| --- | --- | --- | --- |',
    ...items.map((item) => `| \`${escapeTable(item.command)}\` | ${escapeTable(item.purpose)} | ${item.status} | ${escapeTable(item.note)} |`),
  ].join('\n');
}

function renderWorkflowTable(items: WorkflowInventoryItem[]): string {
  return [
    '| Stage | Implemented | Supporting Reports | Supporting Commands | Missing |',
    '| --- | --- | --- | --- | --- |',
    ...items.map((item) => `| ${escapeTable(item.stage)} | ${item.status} | ${escapeTable(formatCellList(item.supportingReports))} | ${escapeTable(formatCellList(item.supportingCommands))} | ${escapeTable(formatCellList(item.missing))} |`),
  ].join('\n');
}

function renderRevenueSummary(report: ReleaseCandidateReport): string {
  return renderList([
    `Booked MRR: ${formatCurrency(report.revenue.bookedMrr)}`,
    `Projected MRR: ${formatRange(report.revenue.projectedExpectedMrr)}/month speculative expected 90-day view`,
    `Audit opportunities: ${report.revenue.auditOpportunities.length}`,
    `Retainer opportunities: ${report.revenue.retainerOpportunities.length}`,
    `Revenue risks: ${report.revenue.revenueRisks.length}`,
    `Commercial lead count: ${report.revenue.auditOpportunities.length}`,
    `Top revenue opportunities: ${report.revenue.auditOpportunities.slice(0, 5).map((item) => item.lead.companyName).join(', ') || 'None'}`,
  ]);
}

function renderTopRevenueTable(report: ReleaseCandidateReport): string {
  const opportunities = report.revenue.auditOpportunities.slice(0, 10);
  if (opportunities.length === 0) return 'No commercial revenue opportunities found.';
  return [
    '| Company | Score | Probability | Offer | Audit Range | Monthly Range | Next Action |',
    '| --- | ---: | --- | --- | ---: | ---: | --- |',
    ...opportunities.map((item) => `| ${escapeTable(item.lead.companyName)} | ${item.revenuePriorityScore} | ${item.probability} | ${item.recommendedOffer} | ${formatRange(item.estimatedAuditValueRange)} | ${formatRange(item.estimatedMonthlyRange)} | ${escapeTable(item.nextAction)} |`),
  ].join('\n');
}

function renderFirstClientTable(items: FirstClientReadinessItem[]): string {
  return [
    '| Company | Readiness | Proposal Status | Outreach Status | Audit Status | Next Action |',
    '| --- | --- | --- | --- | --- | --- |',
    ...items.map((item) => `| ${escapeTable(item.company)} | ${item.readiness} | ${escapeTable(item.proposalStatus)} | ${escapeTable(item.outreachStatus)} | ${escapeTable(item.auditStatus)} | ${escapeTable(item.nextAction)} |`),
  ].join('\n');
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function formatCellList(items: string[]): string {
  if (items.length === 0) return 'None';
  return items.join('<br>');
}

function formatRange(range: { min: number; max: number; cadence: 'one-time' | 'monthly' }): string {
  if (range.min === range.max) return formatCurrency(range.min);
  return `${formatCurrency(range.min)}-${formatCurrency(range.max)}`;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US')}`;
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function percentage(numerator: number, denominator: number): number {
  if (denominator === 0) return 100;
  return (numerator / denominator) * 100;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function pathExists(relativePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}
