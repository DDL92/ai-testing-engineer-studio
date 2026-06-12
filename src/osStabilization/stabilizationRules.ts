import fs = require('fs');
import path = require('path');
import {
  CommandAuditItem,
  DocumentationAuditResult,
  OsHealthArea,
  OsStabilizationReport,
  ReadinessScore,
  ReportAuditItem,
  RevenueAuditResult,
  StabilizationStatus,
  WorkflowAuditStage,
  WorkflowStageStatus,
} from './types';

const outputRoot = path.join(process.cwd(), 'output', 'os-stabilization');

const manualApprovalRules = [
  'Audit-only local report generation.',
  'Do not modify existing business data.',
  'Human approval is required before outreach, follow-up, proposal, SOW, discovery call, client delivery, client report, renewal, expansion, invoice, payment, or external action.',
  'No APIs, scraping, browsing, CRM, outreach automation, email sending, LinkedIn automation, payments, credentials, external databases, or sending workflows were used.',
];

const healthDefinitions = [
  area('Lead Discovery', ['src/discovery/generateDiscoveryReport.ts', 'src/leadDiscoveryAutomation/generateLeadDiscoveryAssistant.ts', 'output/lead-discovery-automation/discovery-assistant.md']),
  area('Lead Intake', ['src/leadIntake/generateApprovedCandidates.ts', 'src/leadIntake/generateLeadAddBatch.ts', 'output/lead-intake/intake-summary.md']),
  area('Commercial Mode', ['src/commercialMode/commercialModeRules.ts', 'output/commercial-mode/commercial-mode-summary.md', 'output/commercial-mode/demo-isolation-report.md']),
  area('Pipeline Prioritization', ['src/pipelinePrioritization/generatePipelinePrioritization.ts', 'output/pipeline-prioritization/commercial-prioritized-pipeline.md', 'output/pipeline-prioritization/top-5-actions.md']),
  area('Outreach Operating Pack', ['src/outreachOperating/generateOutreachOperatingPack.ts', 'output/outreach-operating/real-outreach-operating-pack.md']),
  area('Client Ops', ['src/clientOps/generateClientOps.ts', 'output/client-ops/client-operations-center.md', 'output/client-ops/client-readiness.md']),
  area('Reporting', ['src/clientReporting/generateDeliveryReport.ts', 'src/clientReports/generateClientReport.ts', 'output/client-reporting/demo-retainer-client/monthly-report.md']),
  area('Renewals', ['src/renewals/generateRenewalTracker.ts', 'output/renewals/renewal-pipeline.md', 'output/renewals/client-health.md']),
  area('Revenue Command Center', ['src/revenueCommandCenter/generateRevenueCommandCenter.ts', 'output/revenue-command-center/revenue-command-center.md', 'output/revenue-command-center/mrr-forecast.md']),
  area('Daily Revenue Operator', ['src/dailyRevenueOperator/generateRevenueDaily.ts', 'output/daily-revenue-operator/daily-revenue-operator.md']),
  area('Mobile Command Center', ['src/mobileCommandCenter/generateMobileCenter.ts', 'output/mobile-command-center/mobile-command-center.md']),
  area('Action Cockpit', ['src/actionCockpit/generateActionCockpit.ts', 'output/action-cockpit/action-cockpit.md']),
  area('Operator Dashboard', ['src/operatorDashboard/generateOperatorDashboard.ts', 'output/operator-os-dashboard/operator-dashboard.md']),
  area('Proposal Center', ['src/proposalCenter/generateProposalCenter.ts', 'output/proposal-center/proposal-command-center.md']),
  area('Client Readiness', ['src/clientReadiness/generateClientReadinessPack.ts', 'output/real-client-readiness/real-client-readiness-pack.md']),
  area('First Audit Workflow', ['src/firstAuditWorkflow/generateFirstAuditWorkflow.ts', 'output/first-audit-workflow/first-audit-workflow.md']),
  area('Outreach Execution', ['src/outreachExecution/generateOutreachExecutionPack.ts', 'output/outreach-execution/outreach-execution-pack.md']),
];

const workflowDefinitions = [
  workflow('Lead', ['src/leads/addLeadCli.ts', 'data/leads.json'], ['npm run lead:add']),
  workflow('Research', ['src/research/generateResearchPack.ts', 'output/research'], ['npm run lead:research']),
  workflow('Audit', ['src/auditPack/generateAuditPack.ts', 'src/audit/auditSite.ts', 'output/audit-packs'], ['npm run audit:pack', 'npm run audit:site']),
  workflow('Outreach', ['src/outreachPack/generateOutreachPack.ts', 'src/outreachExecution/generateOutreachExecutionPack.ts', 'output/outreach-execution/outreach-execution-pack.md'], ['npm run outreach:pack', 'npm run outreach:execute-pack']),
  workflow('Proposal', ['src/proposalCenter/generateProposalCenter.ts', 'src/sow/generateSow.ts', 'output/proposal-center/proposal-command-center.md'], ['npm run proposal:center', 'npm run sow:generate']),
  workflow('Discovery Call', ['src/firstAuditWorkflow/generateFirstAuditWorkflow.ts', 'output/first-audit-workflow/discovery-call-prep.md'], ['npm run first-audit:workflow']),
  workflow('Audit Sale', ['output/first-audit-workflow/audit-scope-confirmation.md', 'output/first-audit-workflow/audit-kickoff-plan.md'], ['npm run first-audit:kickoff']),
  workflow('Delivery', ['src/clientDelivery/generateClientDelivery.ts', 'output/client-delivery/demo-retainer-client/delivery-plan.md'], ['npm run client:delivery']),
  workflow('Retainer', ['src/clientReporting/generateDeliveryReport.ts', 'output/client-reporting/demo-retainer-client/monthly-report.md'], ['npm run client:delivery-report']),
  workflow('Renewal', ['src/renewals/generateRenewalTracker.ts', 'output/renewals/renewal-pipeline.md'], ['npm run renewal:tracker']),
];

const requiredDocCommands = [
  'npm run os:dashboard',
  'npm run os:today',
  'npm run cockpit:daily',
  'npm run cockpit:approve',
  'npm run revenue:daily',
  'npm run revenue:next-actions',
  'npm run mobile:center',
  'npm run revenue:command-center',
];

export function buildOsStabilizationReport(): OsStabilizationReport {
  const generatedAt = new Date().toISOString();
  const packageJson = readJson<{ scripts?: Record<string, string> }>('package.json', { scripts: {} });
  const scripts = packageJson.scripts ?? {};
  const healthAreas = buildHealthAreas();
  const commandAudit = buildCommandAudit(scripts);
  const reportAudit = buildReportAudit();
  const revenueAudit = buildRevenueAudit();
  const workflowAudit = buildWorkflowAudit(scripts);
  const documentationAudit = buildDocumentationAudit(scripts);
  const criticalIssues = buildCriticalIssues(healthAreas, revenueAudit, documentationAudit);
  const warnings = buildWarnings(healthAreas, commandAudit, reportAudit, revenueAudit, workflowAudit, documentationAudit);
  const readinessScore = buildReadinessScore(healthAreas, commandAudit, reportAudit, revenueAudit, workflowAudit, documentationAudit, criticalIssues, warnings);

  return {
    generatedAt,
    healthAreas,
    commandAudit,
    reportAudit,
    revenueAudit,
    workflowAudit,
    documentationAudit,
    criticalIssues,
    warnings,
    readinessScore,
  };
}

export function writeSystemAuditOutputs(report: OsStabilizationReport): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });

  const outputs = [
    { fileName: 'system-audit.md', body: renderSystemAudit(report) },
    { fileName: 'system-health.md', body: renderSystemHealth(report) },
    { fileName: 'command-audit.md', body: renderCommandAudit(report) },
    { fileName: 'report-audit.md', body: renderReportAudit(report) },
    { fileName: 'revenue-audit.md', body: renderRevenueAudit(report) },
    { fileName: 'workflow-audit.md', body: renderWorkflowAudit(report) },
    { fileName: 'documentation-audit.md', body: renderDocumentationAudit(report) },
    { fileName: 'stabilization-summary.md', body: renderStabilizationSummary(report) },
  ];

  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }

  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

export function writeSystemHealthOutput(report: OsStabilizationReport): string {
  fs.mkdirSync(outputRoot, { recursive: true });
  const outputPath = path.join(outputRoot, 'system-health.md');
  fs.writeFileSync(outputPath, renderSystemHealth(report), 'utf8');
  return outputPath;
}

export function renderSystemAudit(report: OsStabilizationReport): string {
  return [
    '# System Audit',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Scope',
    renderList([
      'Commands',
      'Reports',
      'Workflows',
      'Dependencies',
      'Generated outputs',
    ]),
    '',
    '## Findings',
    renderList([
      `Commands audited: ${report.commandAudit.length}`,
      `Reports audited: ${report.reportAudit.length}`,
      `Workflow stages audited: ${report.workflowAudit.length}`,
      `Health areas checked: ${report.healthAreas.length}`,
      `Critical issues: ${report.criticalIssues.length}`,
      `Warnings: ${report.warnings.length}`,
    ]),
    '',
    '## Duplicates / Overlap',
    renderList(report.commandAudit.filter((item) => item.duplicateRisk !== 'none').slice(0, 20).map((item) => `${item.command}: ${item.duplicateRisk}`)),
    '',
    '## Missing Outputs',
    renderList(report.healthAreas.flatMap((item) => item.missingPaths.map((missingPath) => `${item.name}: ${missingPath}`))),
    '',
    '## Missing Validations',
    renderList(missingValidationWarnings(report.commandAudit)),
    '',
    '## Consistency Risks',
    renderList(report.warnings),
    '',
    '## Audit Rules',
    renderList(manualApprovalRules),
    '',
  ].join('\n');
}

export function renderSystemHealth(report: OsStabilizationReport): string {
  return [
    '# System Health',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Overall Status: ${overallStatus(report.healthAreas)}`,
    '',
    '| Area | Status | Available | Missing | Notes |',
    '| --- | --- | ---: | ---: | --- |',
    ...report.healthAreas.map((area) => `| ${escapeTable(area.name)} | ${area.status} | ${area.availablePaths.length} | ${area.missingPaths.length} | ${escapeTable(area.notes.join(' '))} |`),
    '',
    '## Human Approval Reminder',
    renderList(manualApprovalRules),
    '',
  ].join('\n');
}

export function renderCommandAudit(report: OsStabilizationReport): string {
  return [
    '# Command Audit',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Command | Purpose | Status | Duplicate Risk | Replacement Recommendation |',
    '| --- | --- | --- | --- | --- |',
    ...report.commandAudit.map((item) => `| \`npm run ${escapeTable(item.command)}\` | ${escapeTable(item.purpose)} | ${item.status} | ${escapeTable(item.duplicateRisk)} | ${escapeTable(item.replacementRecommendation)} |`),
    '',
    '## Audit Rules',
    renderList(manualApprovalRules),
    '',
  ].join('\n');
}

export function renderReportAudit(report: OsStabilizationReport): string {
  return [
    '# Report Audit',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Report | Status | Duplicate Risk | Source-Of-Truth Risk | Notes |',
    '| --- | --- | --- | --- | --- |',
    ...report.reportAudit.map((item) => `| ${escapeTable(item.path)} | ${item.status} | ${escapeTable(item.duplicateRisk)} | ${escapeTable(item.sourceOfTruthRisk)} | ${escapeTable(item.notes.join(' '))} |`),
    '',
    '## Audit Rules',
    renderList(manualApprovalRules),
    '',
  ].join('\n');
}

export function renderRevenueAudit(report: OsStabilizationReport): string {
  const revenue = report.revenueAudit;

  return [
    '# Revenue Audit',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Revenue Command Center MRR: ${revenue.revenueCommandCenterMrr === undefined ? 'not found' : formatCurrency(revenue.revenueCommandCenterMrr)}`,
    '',
    '## Reports Checked',
    '| Report | Status | MRR | Warning |',
    '| --- | --- | ---: | --- |',
    ...revenue.checkedReports.map((item) => `| ${escapeTable(item.label)} | ${item.status} | ${item.mrr === undefined ? 'n/a' : formatCurrency(item.mrr)} | ${escapeTable(item.warning)} |`),
    '',
    '## Demo/Sample Revenue Warnings',
    renderList(revenue.demoRevenueWarnings),
    '',
    '## Consistency Warnings',
    renderList(revenue.consistencyWarnings),
    '',
    '## Source Of Truth',
    renderList([
      'Revenue Command Center is the sole source of truth for booked MRR.',
      'Dashboard, Mobile, Operator, Action Cockpit, and Operator Dashboard should display or derive booked revenue from Revenue Command Center rules.',
    ]),
    '',
  ].join('\n');
}

export function renderWorkflowAudit(report: OsStabilizationReport): string {
  return [
    '# Workflow Audit',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Stage | Status | Evidence | Missing |',
    '| --- | --- | --- | --- |',
    ...report.workflowAudit.map((stage) => `| ${escapeTable(stage.stage)} | ${stage.status} | ${escapeTable(stage.evidence.join('<br>'))} | ${escapeTable(stage.missing.join('<br>'))} |`),
    '',
    '## Lifecycle',
    'Lead -> Research -> Audit -> Outreach -> Proposal -> Discovery Call -> Audit Sale -> Delivery -> Retainer -> Renewal',
    '',
  ].join('\n');
}

export function renderDocumentationAudit(report: OsStabilizationReport): string {
  const docs = report.documentationAudit;

  return [
    '# Documentation Audit',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `- README Status: ${docs.readmeStatus}`,
    `- Command Reference Status: ${docs.commandReferenceStatus}`,
    `- Roadmap Status: ${docs.roadmapStatus}`,
    '',
    '## Missing Commands',
    renderList(docs.missingCommands),
    '',
    '## Stale References',
    renderList(docs.staleReferences),
    '',
    '## Notes',
    renderList(docs.notes),
    '',
  ].join('\n');
}

export function renderStabilizationSummary(report: OsStabilizationReport): string {
  return [
    '# Studio OS Stabilization Summary',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## System Health',
    `Overall: ${overallStatus(report.healthAreas)}`,
    '',
    '## Commands Audited',
    `${report.commandAudit.length} npm scripts audited.`,
    '',
    '## Reports Audited',
    `${report.reportAudit.length} generated report files audited.`,
    '',
    '## Revenue Status',
    report.revenueAudit.consistencyWarnings.length === 0 ? 'Revenue reports are consistent with Revenue Command Center.' : renderList(report.revenueAudit.consistencyWarnings),
    '',
    '## Workflow Status',
    workflowStatusSummary(report.workflowAudit),
    '',
    '## Documentation Status',
    documentationStatusSummary(report.documentationAudit),
    '',
    '## Critical Issues',
    renderList(report.criticalIssues),
    '',
    '## Warnings',
    renderList(report.warnings),
    '',
    '## v1.0 Candidate Readiness Score',
    renderScore(report.readinessScore),
    '',
    '## Recommended Next Sprint',
    'Sprint 49: AI Studio OS v1.0 Candidate',
    '',
    '## Human Approval Reminder',
    renderList(manualApprovalRules),
    '',
  ].join('\n');
}

function buildHealthAreas(): OsHealthArea[] {
  return healthDefinitions.map((definition) => {
    const availablePaths = definition.requiredPaths.filter(pathExists);
    const missingPaths = definition.requiredPaths.filter((item) => !pathExists(item));
    const status: StabilizationStatus = missingPaths.length === 0 ? 'GREEN' : availablePaths.length === 0 ? 'RED' : 'YELLOW';
    const notes = missingPaths.length === 0
      ? ['Required local source/report paths are available.']
      : [`Missing ${missingPaths.length} required path(s).`];

    return {
      name: definition.name,
      status,
      requiredPaths: definition.requiredPaths,
      availablePaths,
      missingPaths,
      notes,
    };
  });
}

function buildCommandAudit(scripts: Record<string, string>): CommandAuditItem[] {
  return Object.entries(scripts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([command, script]) => {
      const purpose = purposeFor(command);
      const duplicateRisk = duplicateRiskFor(command, script, scripts);
      const replacementRecommendation = replacementFor(command, duplicateRisk);
      const status: StabilizationStatus = script.includes('tsx ') ? 'YELLOW' : 'GREEN';

      return {
        command,
        script,
        purpose,
        status,
        duplicateRisk,
        replacementRecommendation,
      };
    });
}

function buildReportAudit(): ReportAuditItem[] {
  const reports = listFiles('output').filter((filePath) => filePath.endsWith('.md') || filePath.endsWith('.html'));
  const basenameCounts = countBy(reports.map((filePath) => path.basename(filePath)));

  return reports.sort().map((filePath) => {
    const duplicateRisk = (basenameCounts.get(path.basename(filePath)) ?? 0) > 1 ? `filename repeats ${basenameCounts.get(path.basename(filePath))} times` : 'none';
    const sourceOfTruthRisk = sourceTruthRiskFor(filePath);
    const status: StabilizationStatus = sourceOfTruthRisk === 'none' && duplicateRisk === 'none' ? 'GREEN' : 'YELLOW';

    return {
      path: filePath,
      status,
      duplicateRisk,
      sourceOfTruthRisk,
      notes: [ageNoteFor(filePath)],
    };
  });
}

function buildRevenueAudit(): RevenueAuditResult {
  const rcc = readFile('output/revenue-command-center/revenue-command-center.md');
  const rccMrr = parseCurrency(rcc, 'Current booked MRR') ?? parseCurrency(rcc, 'Booked MRR');
  const checked = [
    checkRevenueReport('Dashboard', 'output/dashboard/dashboard.md', 'Estimated MRR', rccMrr),
    checkRevenueReport('Mobile Command Center', 'output/mobile-command-center/mobile-summary.md', 'Booked MRR', rccMrr),
    checkRevenueReport('Operator', 'output/operator/daily-command-center.md', 'Estimated MRR', rccMrr),
    checkRevenueReport('Action Cockpit', 'output/action-cockpit/revenue-snapshot.md', 'Booked MRR', rccMrr),
    checkRevenueReport('Operator OS Dashboard', 'output/operator-os-dashboard/executive-summary.md', 'Booked MRR', rccMrr),
  ];
  const clients = readJson<Array<{ id: string; companyName: string; website: string; status: string; monthlyFee: number }>>('data/clients.json', []);
  const demoRevenueWarnings = clients
    .filter((client) => client.status === 'active' && client.monthlyFee > 0 && !isCommercialClient(client))
    .map((client) => `Excluded non-commercial active client has local monthlyFee ${formatCurrency(client.monthlyFee)}: ${client.companyName}.`);
  const consistencyWarnings = checked
    .filter((item) => item.status !== 'GREEN')
    .map((item) => `${item.label}: ${item.warning}`);

  return {
    revenueCommandCenterMrr: rccMrr,
    checkedReports: checked,
    demoRevenueWarnings,
    consistencyWarnings,
  };
}

function buildWorkflowAudit(scripts: Record<string, string>): WorkflowAuditStage[] {
  return workflowDefinitions.map((definition) => {
    const availableEvidence = definition.evidence.filter(pathExists);
    const missingEvidence = definition.evidence.filter((item) => !pathExists(item));
    const missingCommands = definition.commands.filter((command) => !scripts[command.replace('npm run ', '').split(' ')[0]]);
    const status: WorkflowStageStatus = missingEvidence.length === 0 && missingCommands.length === 0
      ? 'implemented'
      : availableEvidence.length > 0
        ? 'partial'
        : 'missing';

    return {
      stage: definition.stage,
      status,
      evidence: availableEvidence.concat(definition.commands.filter((command) => missingCommands.includes(command) === false)),
      missing: missingEvidence.concat(missingCommands),
    };
  });
}

function buildDocumentationAudit(scripts: Record<string, string>): DocumentationAuditResult {
  const readme = readFile('README.md');
  const commandReference = readFile('docs/operations/command-reference.md');
  const roadmap = readFile('docs/roadmap/next-sprint.md');
  const missingCommands = requiredDocCommands.filter((command) => !readme.includes(command) || !commandReference.includes(command));
  const staleReferences = [
    readme.includes('Revenue uses local client records for booked MRR') ? 'README still contains stale local-client booked MRR language.' : undefined,
    roadmap.includes('Revenue uses local client records for booked MRR') ? 'Roadmap still contains stale local-client booked MRR language.' : undefined,
    commandReference.includes('auto-approve') && !commandReference.includes('Never auto-approve') ? 'Command reference approval wording may be incomplete.' : undefined,
  ].filter((item): item is string => Boolean(item));

  return {
    readmeStatus: missingCommands.some((command) => !readme.includes(command)) ? 'YELLOW' : 'GREEN',
    commandReferenceStatus: missingCommands.some((command) => !commandReference.includes(command)) ? 'YELLOW' : 'GREEN',
    roadmapStatus: roadmap.includes('Sprint 48') && roadmap.includes('Sprint 49') ? 'GREEN' : 'YELLOW',
    missingCommands,
    staleReferences,
    notes: [
      'README, command reference, and roadmap were reviewed for current OS commands.',
      'Documentation audit is deterministic text presence checking only.',
    ],
  };
}

function buildCriticalIssues(
  healthAreas: OsHealthArea[],
  revenueAudit: RevenueAuditResult,
  docs: DocumentationAuditResult,
): string[] {
  return [
    ...healthAreas.filter((area) => area.status === 'RED').map((area) => `${area.name} has no required paths available.`),
    ...revenueAudit.consistencyWarnings.map((warning) => `Revenue consistency issue: ${warning}`),
    docs.missingCommands.length > 0 ? 'Documentation is missing required OS commands.' : undefined,
  ].filter((item): item is string => Boolean(item));
}

function buildWarnings(
  healthAreas: OsHealthArea[],
  commands: CommandAuditItem[],
  reports: ReportAuditItem[],
  revenue: RevenueAuditResult,
  workflows: WorkflowAuditStage[],
  docs: DocumentationAuditResult,
): string[] {
  return [
    ...healthAreas.filter((area) => area.status === 'YELLOW').map((area) => `${area.name}: ${area.missingPaths.length} missing path(s).`),
    ...commands.filter((command) => command.duplicateRisk !== 'none').slice(0, 12).map((command) => `${command.command}: ${command.duplicateRisk}`),
    ...reports.filter((report) => report.sourceOfTruthRisk !== 'none').slice(0, 12).map((report) => `${report.path}: ${report.sourceOfTruthRisk}`),
    ...revenue.demoRevenueWarnings,
    ...workflows.filter((stage) => stage.status !== 'implemented').map((stage) => `${stage.stage}: ${stage.status}`),
    ...docs.staleReferences,
  ];
}

function buildReadinessScore(
  healthAreas: OsHealthArea[],
  commands: CommandAuditItem[],
  reports: ReportAuditItem[],
  revenue: RevenueAuditResult,
  workflows: WorkflowAuditStage[],
  docs: DocumentationAuditResult,
  criticalIssues: string[],
  warnings: string[],
): ReadinessScore {
  const commandConsistency = percentage(commands.filter((item) => item.status !== 'RED').length, commands.length);
  const reportConsistency = percentage(reports.filter((item) => item.status !== 'RED').length, reports.length);
  const workflowCompleteness = percentage(workflows.filter((item) => item.status === 'implemented').length, workflows.length);
  const revenueConsistency = revenue.consistencyWarnings.length === 0 ? 100 : Math.max(0, 100 - revenue.consistencyWarnings.length * 25);
  const documentationCompleteness = [docs.readmeStatus, docs.commandReferenceStatus, docs.roadmapStatus].filter((status) => status === 'GREEN').length / 3 * 100;
  const healthStatus = percentage(healthAreas.filter((item) => item.status === 'GREEN').length, healthAreas.length);
  const raw = Math.round(
    commandConsistency * 0.15
    + reportConsistency * 0.15
    + workflowCompleteness * 0.2
    + revenueConsistency * 0.2
    + documentationCompleteness * 0.15
    + healthStatus * 0.15
  );
  const penalty = criticalIssues.length * 8 + Math.min(10, warnings.length);
  const score = Math.max(0, Math.min(100, raw - penalty));
  const requiredWorkRemaining = [
    ...criticalIssues,
    ...warnings.slice(0, 10),
    score >= 90 ? 'No blocking work before v1.0 candidate; review warnings manually.' : undefined,
  ].filter((item): item is string => Boolean(item));

  return {
    score,
    commandConsistency: Math.round(commandConsistency),
    reportConsistency: Math.round(reportConsistency),
    workflowCompleteness: Math.round(workflowCompleteness),
    revenueConsistency,
    documentationCompleteness: Math.round(documentationCompleteness),
    healthStatus: Math.round(healthStatus),
    requiredWorkRemaining,
  };
}

function checkRevenueReport(label: string, reportPath: string, mrrLabel: string, expectedMrr: number | undefined): RevenueAuditResult['checkedReports'][number] {
  const content = readFile(reportPath);
  const mrr = parseCurrency(content, mrrLabel);

  if (!content) {
    return { label, path: reportPath, mrr, status: 'RED', warning: 'Report missing.' };
  }
  if (expectedMrr === undefined) {
    return { label, path: reportPath, mrr, status: 'YELLOW', warning: 'Revenue Command Center MRR not parseable.' };
  }
  if (mrr === undefined) {
    return { label, path: reportPath, mrr, status: 'YELLOW', warning: `${mrrLabel} not parseable.` };
  }
  if (mrr !== expectedMrr) {
    return { label, path: reportPath, mrr, status: 'YELLOW', warning: `MRR ${formatCurrency(mrr)} differs from Revenue Command Center ${formatCurrency(expectedMrr)}.` };
  }
  return { label, path: reportPath, mrr, status: 'GREEN', warning: 'none' };
}

function purposeFor(command: string): string {
  if (command.startsWith('os:')) return 'Studio OS dashboard, health, or stabilization command.';
  if (command.includes('revenue')) return 'Revenue reporting or revenue operations.';
  if (command.includes('cockpit')) return 'Operating cockpit or action prioritization.';
  if (command.includes('mobile')) return 'Mobile-ready local report generation.';
  if (command.includes('lead')) return 'Lead management or lead operations.';
  if (command.includes('client')) return 'Client operations, delivery, or reporting.';
  if (command.includes('outreach')) return 'Manual outreach preparation.';
  if (command.includes('proposal') || command.includes('sow')) return 'Proposal or SOW preparation.';
  if (command.includes('audit')) return 'Audit evidence or audit pack workflow.';
  if (command.includes('test')) return 'Playwright validation.';
  return 'Local project command.';
}

function duplicateRiskFor(command: string, script: string, scripts: Record<string, string>): string {
  const sameScript = Object.entries(scripts).filter(([otherCommand, otherScript]) => otherCommand !== command && otherScript === script).map(([otherCommand]) => otherCommand);
  if (sameScript.length > 0) return `same script as ${sameScript.join(', ')}`;

  const family = command.split(':')[0];
  const familyCount = Object.keys(scripts).filter((item) => item.split(':')[0] === family).length;
  if (familyCount >= 8) return `large command family (${familyCount} ${family}:* commands); review overlap manually`;

  if (command === 'cockpit') return 'legacy cockpit overlaps with cockpit:daily';
  if (command === 'dashboard') return 'dashboard overlaps with os:dashboard as an older view';
  return 'none';
}

function replacementFor(command: string, duplicateRisk: string): string {
  if (command === 'cockpit') return 'Prefer npm run cockpit:daily for current Action Cockpit v1.';
  if (command === 'dashboard') return 'Prefer npm run os:dashboard for primary operating view.';
  if (duplicateRisk !== 'none') return 'Keep only if this command serves a distinct workflow stage.';
  return 'none';
}

function sourceTruthRiskFor(reportPath: string): string {
  if (
    reportPath.includes('revenue-command-center')
    || reportPath.includes('daily-revenue-operator')
    || reportPath.includes('operator-os-dashboard')
    || reportPath.includes('action-cockpit')
    || reportPath.includes('mobile-command-center')
    || reportPath.includes('os-stabilization')
  ) {
    return 'none';
  }
  if (reportPath.includes('revenue') && !reportPath.includes('revenue-command-center') && !reportPath.includes('daily-revenue-operator') && !reportPath.includes('operator-os-dashboard')) {
    return 'revenue-like report should defer booked MRR to Revenue Command Center';
  }
  if (reportPath.includes('dashboard') && !reportPath.includes('operator-os-dashboard')) {
    return 'older dashboard surface may overlap with Operator OS Dashboard';
  }
  return 'none';
}

function missingValidationWarnings(commands: CommandAuditItem[]): string[] {
  const required = ['typecheck', 'test', 'os:audit', 'os:health', 'os:dashboard'];
  const commandSet = new Set(commands.map((command) => command.command));
  const missing = required.filter((command) => !commandSet.has(command));
  return missing.length > 0 ? missing.map((command) => `Missing validation command: npm run ${command}`) : ['No required validation command gaps detected.'];
}

function workflowStatusSummary(workflows: WorkflowAuditStage[]): string {
  const implemented = workflows.filter((stage) => stage.status === 'implemented').length;
  const partial = workflows.filter((stage) => stage.status === 'partial').length;
  const missing = workflows.filter((stage) => stage.status === 'missing').length;
  return `Implemented: ${implemented}; Partial: ${partial}; Missing: ${missing}.`;
}

function documentationStatusSummary(docs: DocumentationAuditResult): string {
  return `README: ${docs.readmeStatus}; Command Reference: ${docs.commandReferenceStatus}; Roadmap: ${docs.roadmapStatus}.`;
}

function renderScore(score: ReadinessScore): string {
  return [
    `- Current Score: ${score.score}/100`,
    `- Command Consistency: ${score.commandConsistency}/100`,
    `- Report Consistency: ${score.reportConsistency}/100`,
    `- Workflow Completeness: ${score.workflowCompleteness}/100`,
    `- Revenue Consistency: ${score.revenueConsistency}/100`,
    `- Documentation Completeness: ${score.documentationCompleteness}/100`,
    `- Health Status: ${score.healthStatus}/100`,
    '',
    '### Required Work Remaining',
    renderList(score.requiredWorkRemaining),
  ].join('\n');
}

function overallStatus(areas: OsHealthArea[]): StabilizationStatus {
  if (areas.some((area) => area.status === 'RED')) return 'RED';
  if (areas.some((area) => area.status === 'YELLOW')) return 'YELLOW';
  return 'GREEN';
}

function area(name: string, requiredPaths: string[]): { name: string; requiredPaths: string[] } {
  return { name, requiredPaths };
}

function workflow(stage: string, evidence: string[], commands: string[]): { stage: string; evidence: string[]; commands: string[] } {
  return { stage, evidence, commands };
}

function listFiles(relativeDir: string): string[] {
  const absoluteDir = path.join(process.cwd(), relativeDir);
  if (!fs.existsSync(absoluteDir)) return [];
  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) return listFiles(relativePath);
    return [relativePath];
  });
}

function countBy(items: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return counts;
}

function ageNoteFor(relativePath: string): string {
  const absolutePath = path.join(process.cwd(), relativePath);
  const stats = fs.statSync(absolutePath);
  const ageHours = Math.round((Date.now() - stats.mtimeMs) / (1000 * 60 * 60));
  if (ageHours <= 24) return 'Generated or modified within last 24 hours.';
  if (ageHours <= 24 * 7) return `Generated or modified ${ageHours} hours ago.`;
  return `Potentially stale: generated or modified ${Math.round(ageHours / 24)} days ago.`;
}

function parseCurrency(content: string, label: string): number | undefined {
  if (!content) return undefined;
  const match = content.match(new RegExp(`${escapeRegExp(label)}:\\s*\\$([\\d,]+)`, 'i'));
  return match ? Number(match[1].replace(/,/g, '')) : undefined;
}

function isCommercialClient(client: { id: string; companyName: string; website: string }): boolean {
  const id = client.id.toLowerCase();
  const companyName = client.companyName.toLowerCase();
  const website = client.website.toLowerCase();
  return !(
    id.startsWith('sample-')
    || id.includes('demo')
    || companyName.includes('demo')
    || companyName.includes('sample')
    || companyName.includes('sandbox')
    || companyName.includes('test')
    || website.includes('.example')
  );
}

function percentage(numerator: number, denominator: number): number {
  if (denominator === 0) return 100;
  return (numerator / denominator) * 100;
}

function pathExists(relativePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

function readJson<T>(relativePath: string, fallback: T): T {
  const absolutePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) return fallback;
  const raw = fs.readFileSync(absolutePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function readFile(relativePath: string): string {
  const absolutePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) return '';
  return fs.readFileSync(absolutePath, 'utf8');
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US')}`;
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
