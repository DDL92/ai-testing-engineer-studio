import fs = require('fs');
import path = require('path');
import { buildAutomationDeliveryReport, buildAutomationDeliveryReportForClient } from '../automationDelivery/automationRules';
import { AutomationDeliveryReport } from '../automationDelivery/types';
import { buildCurrentClientConversion } from '../clientConversion/conversionRules';
import { ClientRecord } from '../clientConversion/types';
import {
  CoverageFlow,
  RetainerHealth,
  RetainerOperationalMetrics,
  RetainerOperationsDashboard,
  RetainerOperationsReport,
  RenewalReadiness,
} from './types';

export const retainerOperationsOutputDir = path.join(process.cwd(), 'output', 'retainer-operations');

const safetyRules = [
  'Local-only retainer operations preparation.',
  'No completed work, client satisfaction, business impact, revenue, renewal, expansion sale, or delivered report is claimed.',
  'No invoices, payments, outreach, meetings, CRM actions, deployments, client repository changes, credentials, or private systems are used.',
  'Weekly and monthly reports are templates requiring real client data and Daniel review.',
  'Human approval and client-approved access remain mandatory.',
];

export function buildRetainerOperationsReport(): RetainerOperationsReport {
  const conversion = buildCurrentClientConversion();
  if (!conversion) throw new Error('No current client conversion exists. Run npm run client:convert first.');
  const automation = buildAutomationDeliveryReport();
  return buildRetainerOperationsReportForClient(conversion.record, automation);
}

export function buildRetainerOperationsReportForClient(
  client: ClientRecord,
  automation = buildAutomationDeliveryReportForClient(client),
): RetainerOperationsReport {
  const coverage = coverageFlows(automation);
  const health = clientHealth(client, coverage);
  const renewal = renewalReadiness(client, health, coverage);
  const maintenance = maintenancePlan();
  const expansionOpportunities = expansionRecommendations(coverage);
  const metrics = operationalMetrics(coverage, maintenance, health, renewal);

  return {
    generatedAt: new Date().toISOString(),
    client,
    retainerStatus: client.selectedPackage === 'retainer' ? 'NEEDS CLIENT INPUT' : 'PLANNING',
    monthlyRoadmap: {
      month1: [
        'Establish an approved automation and reporting baseline.',
        'Validate the highest-priority critical flows after access approval.',
        'Define the first month automation priorities and ownership.',
      ],
      month2: [
        'Expand approved smoke coverage.',
        'Add regression coverage around stable, high-value flows.',
        'Improve evidence collection and traceability.',
      ],
      month3: [
        'Stabilize the approved suite.',
        'Optimize execution time and maintenance effort.',
        'Improve client-ready reporting and the next-quarter roadmap.',
      ],
    },
    coverage,
    coverageTarget: `${coverage.filter((flow) => flow.priority === 'HIGH').length} high-priority flows reviewed and approved before implementation.`,
    recommendedNextCoverage: recommendedNextCoverage(coverage),
    maintenance,
    weeklyReportTemplate: weeklyTemplate(client, coverage),
    monthlyReportTemplate: monthlyTemplate(client, coverage, renewal, expansionOpportunities),
    health,
    renewal,
    expansionOpportunities,
    metrics,
    safetyRules,
  };
}

export function buildRetainerOperationsDashboard(): RetainerOperationsDashboard {
  try {
    const report = buildRetainerOperationsReport();
    return {
      retainerStatus: report.retainerStatus,
      clientHealth: report.health.status,
      coverageStatus: `${report.metrics.coveragePercent}% automated; ${report.metrics.plannedFlowsCount} planned`,
      maintenanceStatus: `${report.metrics.maintenanceTasks} recurring task recommendations`,
      renewalStatus: report.renewal.status,
      expansionOpportunities: report.expansionOpportunities.length,
    };
  } catch {
    return {
      retainerStatus: 'NOT READY',
      clientHealth: 'WATCH',
      coverageStatus: 'No current client conversion',
      maintenanceStatus: 'Not Ready',
      renewalStatus: 'NOT READY',
      expansionOpportunities: 0,
    };
  }
}

export function writeRetainerOperationsOutputs(report = buildRetainerOperationsReport()): string[] {
  fs.mkdirSync(retainerOperationsOutputDir, { recursive: true });
  const outputs = [
    ['retainer-plan.md', renderRetainerPlan(report)],
    ['monthly-roadmap.md', renderMonthlyRoadmap(report)],
    ['coverage-roadmap.md', renderCoverageRoadmap(report)],
    ['maintenance-plan.md', renderMaintenancePlan(report)],
    ['weekly-report-template.md', renderWeeklyReportTemplate(report)],
    ['monthly-report-template.md', renderMonthlyReportTemplate(report)],
    ['client-health.md', renderClientHealth(report)],
    ['renewal-plan.md', renderRenewalPlan(report)],
    ['expansion-opportunities.md', renderExpansionOpportunities(report)],
    ['operational-metrics.md', renderOperationalMetrics(report)],
    ['retainer-summary.md', renderRetainerSummary(report)],
  ] as const;

  return outputs.map(([fileName, body]) => {
    const outputPath = path.join(retainerOperationsOutputDir, fileName);
    fs.writeFileSync(outputPath, body, 'utf8');
    return outputPath;
  });
}

export function renderRetainerPlan(report: RetainerOperationsReport): string {
  return document(report, 'Retainer Operations Plan', [
    bullets([
      `Client: ${report.client.clientName}`,
      `Current Package: ${report.client.selectedPackage}`,
      `Retainer Status: ${report.retainerStatus}`,
      `Client Health: ${report.health.status}`,
      `Renewal Readiness: ${report.renewal.status}`,
    ]),
    '',
    '## Retention Path',
    '',
    'QA Audit',
    '↓',
    'Starter Pack',
    '↓',
    'Retainer',
    '↓',
    'Expansion Opportunities',
    '',
    '## Operating Principles',
    '',
    bullets([
      'Prioritize evidence-backed critical flows.',
      'Expand coverage only after stability and approval.',
      'Use recurring maintenance and reporting templates.',
      'Review renewal and expansion opportunities manually.',
    ]),
  ]);
}

export function renderMonthlyRoadmap(report: RetainerOperationsReport): string {
  return document(report, 'Monthly Retainer Roadmap', [
    '## Month 1',
    '',
    bullets(report.monthlyRoadmap.month1),
    '',
    '## Month 2',
    '',
    bullets(report.monthlyRoadmap.month2),
    '',
    '## Month 3',
    '',
    bullets(report.monthlyRoadmap.month3),
    '',
    'No roadmap item is recorded as completed.',
  ]);
}

export function renderCoverageRoadmap(report: RetainerOperationsReport): string {
  return document(report, 'Coverage Roadmap', [
    bullets([
      `Coverage Status: ${report.metrics.coveragePercent}% automated`,
      `Coverage Target: ${report.coverageTarget}`,
      `Recommended Next Coverage: ${report.recommendedNextCoverage}`,
    ]),
    '',
    '| Critical Flow | Priority | Status | Access Boundary | Recommended Next Step |',
    '| --- | --- | --- | --- | --- |',
    ...report.coverage.map((flow) => `| ${escapeTable(flow.name)} | ${flow.priority} | ${flow.status} | ${flow.accessBoundary} | ${escapeTable(flow.recommendedNextStep)} |`),
  ]);
}

export function renderMaintenancePlan(report: RetainerOperationsReport): string {
  return document(report, 'Maintenance Plan', [
    '## Weekly',
    '',
    checklist(report.maintenance.weekly),
    '',
    '## Monthly',
    '',
    checklist(report.maintenance.monthly),
    '',
    'Tasks are recommended recurring reviews, not completed maintenance.',
  ]);
}

export function renderWeeklyReportTemplate(report: RetainerOperationsReport): string {
  const template = report.weeklyReportTemplate;
  return document(report, 'Weekly Report Template', [
    'TEMPLATE ONLY — REQUIRES REAL CLIENT DATA AND DANIEL REVIEW',
    '',
    '## Executive Summary',
    '',
    bullets(template.executiveSummary),
    '',
    '## Automation Status',
    '',
    bullets(template.automationStatus),
    '',
    '## Coverage Status',
    '',
    bullets(template.coverageStatus),
    '',
    '## Observed Signals',
    '',
    bullets(template.observedSignals),
    '',
    '## Recommendations',
    '',
    bullets(template.recommendations),
    '',
    '## Next Actions',
    '',
    checklist(template.nextActions),
  ]);
}

export function renderMonthlyReportTemplate(report: RetainerOperationsReport): string {
  const template = report.monthlyReportTemplate;
  return document(report, 'Monthly Report Template', [
    'TEMPLATE ONLY — REQUIRES REAL CLIENT DATA AND DANIEL REVIEW',
    '',
    '## Executive Summary',
    '',
    bullets(template.executiveSummary),
    '',
    '## Coverage Growth',
    '',
    bullets(template.coverageGrowth),
    '',
    '## Maintenance Summary',
    '',
    bullets(template.maintenanceSummary),
    '',
    '## Automation Status',
    '',
    bullets(template.automationStatus),
    '',
    '## Recommendations',
    '',
    bullets(template.recommendations),
    '',
    '## Renewal Recommendation',
    '',
    bullets(template.renewalRecommendation),
    '',
    '## Expansion Recommendation',
    '',
    bullets(template.expansionRecommendation),
  ]);
}

export function renderClientHealth(report: RetainerOperationsReport): string {
  return document(report, 'Client Health', [
    bullets([
      `Health Score: ${report.health.healthScore}/100`,
      `Coverage Score: ${report.health.coverageScore}/100`,
      `Maintenance Score: ${report.health.maintenanceScore}/100`,
      `Reporting Score: ${report.health.reportingScore}/100`,
      `Relationship Score: ${report.health.relationshipScore}/100`,
      `Health Status: ${report.health.status}`,
    ]),
    '',
    '## Reasons',
    '',
    bullets(report.health.reasons),
    '',
    'Neutral defaults are used because no real client history, satisfaction, or completed delivery record exists.',
  ]);
}

export function renderRenewalPlan(report: RetainerOperationsReport): string {
  return document(report, 'Renewal Plan', [
    bullets([
      `Renewal Readiness: ${report.renewal.status}`,
      `Client Health: ${report.health.status}`,
      `Coverage Status: ${report.metrics.coveragePercent}% automated`,
    ]),
    '',
    '## Business Value Summary',
    '',
    bullets(report.renewal.businessValueSummary),
    '',
    '## Coverage Value Summary',
    '',
    bullets(report.renewal.coverageValueSummary),
    '',
    '## Recommended Renewal Path',
    '',
    numbered(report.renewal.recommendedRenewalPath),
    '',
    '## Blockers',
    '',
    bullets(report.renewal.blockers),
    '',
    'No renewal is recorded or assumed.',
  ]);
}

export function renderExpansionOpportunities(report: RetainerOperationsReport): string {
  return document(report, 'Expansion Opportunities', [
    'Recommendations only. No expansion sale, client approval, or revenue is claimed.',
    '',
    numbered(report.expansionOpportunities),
  ]);
}

export function renderOperationalMetrics(report: RetainerOperationsReport): string {
  const metrics = report.metrics;
  return document(report, 'Operational Metrics', [
    '| Metric | Value |',
    '| --- | --- |',
    `| Coverage | ${metrics.coveragePercent}% |`,
    `| Critical Flows Count | ${metrics.criticalFlowsCount} |`,
    `| Automated Flows Count | ${metrics.automatedFlowsCount} |`,
    `| Planned Flows Count | ${metrics.plannedFlowsCount} |`,
    `| Pending Flows Count | ${metrics.pendingFlowsCount} |`,
    `| Maintenance Tasks | ${metrics.maintenanceTasks} |`,
    `| Report Status | ${metrics.reportStatus} |`,
    `| Client Health Status | ${metrics.clientHealthStatus} |`,
    `| Renewal Readiness | ${metrics.renewalReadiness} |`,
    '',
    'No revenue metrics are inferred.',
  ]);
}

export function renderRetainerSummary(report: RetainerOperationsReport): string {
  return document(report, 'Retainer Operations Summary', [
    bullets([
      `Client: ${report.client.clientName}`,
      `Retainer Status: ${report.retainerStatus}`,
      `Health Status: ${report.health.status}`,
      `Coverage Status: ${report.metrics.coveragePercent}% automated, ${report.metrics.plannedFlowsCount} planned`,
      `Maintenance Tasks: ${report.metrics.maintenanceTasks}`,
      `Renewal Readiness: ${report.renewal.status}`,
      `Expansion Opportunities: ${report.expansionOpportunities.length}`,
    ]),
    '',
    'All outputs remain planning templates and recommendations.',
  ]);
}

function coverageFlows(automation: AutomationDeliveryReport): CoverageFlow[] {
  return automation.criticalFlows.map((flow) => ({
    name: flow.name,
    priority: flow.priority,
    status: flow.type === 'client-access-required' ? 'PENDING' : 'PLANNED',
    accessBoundary: flow.type === 'client-access-required' ? 'client-access-required' : 'public-only',
    recommendedNextStep: flow.type === 'client-access-required'
      ? 'Confirm client-approved access before implementation.'
      : `Review and approve the recommended ${flow.name} automation scope.`,
  }));
}

function clientHealth(client: ClientRecord, coverage: CoverageFlow[]): RetainerHealth {
  const hasRealHistory = client.status === 'delivery-active' || client.status === 'completed';
  const coverageScore = percentage(coverage.filter((flow) => flow.status === 'AUTOMATED').length, coverage.length);
  const maintenanceScore = hasRealHistory ? 60 : 50;
  const reportingScore = hasRealHistory ? 60 : 50;
  const relationshipScore = 50;
  const healthScore = Math.round((coverageScore + maintenanceScore + reportingScore + relationshipScore) / 4);
  const status = healthScore >= 70 ? 'HEALTHY' : healthScore >= 30 ? 'WATCH' : 'AT RISK';

  return {
    healthScore,
    coverageScore,
    maintenanceScore,
    reportingScore,
    relationshipScore,
    status,
    reasons: [
      hasRealHistory ? 'Client delivery activity exists locally.' : 'No real delivery history exists; neutral maintenance, reporting, and relationship values are used.',
      `${coverage.filter((flow) => flow.status === 'PLANNED').length} flow(s) are planned and ${coverage.filter((flow) => flow.status === 'AUTOMATED').length} are recorded as automated.`,
      'Health is an internal preparation signal, not client satisfaction or retention probability.',
    ],
  };
}

function renewalReadiness(client: ClientRecord, health: RetainerHealth, coverage: CoverageFlow[]): RenewalReadiness {
  const automatedFlows = coverage.filter((flow) => flow.status === 'AUTOMATED').length;
  const blockers = [
    ...(client.status !== 'delivery-active' && client.status !== 'completed' ? ['No active or completed client delivery history exists.'] : []),
    ...(automatedFlows === 0 ? ['No flows are recorded as automated.'] : []),
    'No client-approved business value or relationship history is recorded.',
  ];
  const status = blockers.length === 0 && health.status === 'HEALTHY'
    ? 'RECOMMENDED'
    : client.status === 'delivery-active' && automatedFlows > 0 ? 'READY FOR REVIEW' : 'NOT READY';

  return {
    status,
    businessValueSummary: [
      'Automation delivery recommendations and reporting templates are available locally.',
      'Real business value must be documented from approved delivery history before renewal discussion.',
    ],
    coverageValueSummary: [
      `${automatedFlows} flow(s) recorded as automated.`,
      `${coverage.filter((flow) => flow.status === 'PLANNED').length} flow(s) planned.`,
      `${coverage.filter((flow) => flow.status === 'PENDING').length} flow(s) pending access or approval.`,
    ],
    recommendedRenewalPath: [
      'Document approved work and reviewed evidence.',
      'Review coverage stability and maintenance effort.',
      'Prepare a client-safe monthly value summary.',
      'Review renewal scope manually.',
    ],
    blockers,
  };
}

function operationalMetrics(
  coverage: CoverageFlow[],
  maintenance: RetainerOperationsReport['maintenance'],
  health: RetainerHealth,
  renewal: RenewalReadiness,
): RetainerOperationalMetrics {
  const automatedFlowsCount = coverage.filter((flow) => flow.status === 'AUTOMATED').length;
  const plannedFlowsCount = coverage.filter((flow) => flow.status === 'PLANNED').length;
  const pendingFlowsCount = coverage.filter((flow) => flow.status === 'PENDING').length;
  return {
    coveragePercent: percentage(automatedFlowsCount, coverage.length),
    criticalFlowsCount: coverage.length,
    automatedFlowsCount,
    plannedFlowsCount,
    pendingFlowsCount,
    maintenanceTasks: maintenance.weekly.length + maintenance.monthly.length,
    reportStatus: 'Templates Ready; No Completed Reports Claimed',
    clientHealthStatus: health.status,
    renewalReadiness: renewal.status,
  };
}

function maintenancePlan(): RetainerOperationsReport['maintenance'] {
  return {
    weekly: [
      'Review flaky test candidates.',
      'Review failed run evidence and classification.',
      'Review screenshots, traces, console, and network observations.',
      'Review the weekly report template and next actions.',
    ],
    monthly: [
      'Review coverage against critical-flow priorities.',
      'Review Playwright and supporting dependency updates.',
      'Review execution time, retries, and maintenance cost.',
      'Review monthly report, health, renewal, and expansion recommendations.',
    ],
  };
}

function weeklyTemplate(client: ClientRecord, coverage: CoverageFlow[]): RetainerOperationsReport['weeklyReportTemplate'] {
  return {
    executiveSummary: [
      `Client: ${client.clientName}`,
      'Replace this line with a reviewed summary of real weekly activity.',
      'Do not claim completed work without recorded evidence.',
    ],
    automationStatus: [
      `${coverage.filter((flow) => flow.status === 'AUTOMATED').length} flow(s) recorded as automated.`,
      `${coverage.filter((flow) => flow.status === 'PLANNED').length} candidate improvement(s) planned.`,
    ],
    coverageStatus: [
      `${coverage.length} critical flow recommendation(s) tracked.`,
      'Coverage changes require real implementation records.',
    ],
    observedSignals: [
      'Record only reviewed observed signals from approved runs.',
      'Use potential area to review and candidate improvement language.',
    ],
    recommendations: [
      'Prioritize high-risk approved flows.',
      'Review maintenance signals before expanding coverage.',
    ],
    nextActions: [
      'Confirm real activity for the reporting period.',
      'Review evidence and update flow statuses.',
      'Approve the next bounded maintenance or coverage task.',
    ],
  };
}

function monthlyTemplate(
  client: ClientRecord,
  coverage: CoverageFlow[],
  renewal: RenewalReadiness,
  expansionOpportunities: string[],
): RetainerOperationsReport['monthlyReportTemplate'] {
  return {
    executiveSummary: [
      `Client: ${client.clientName}`,
      'Replace this line with reviewed monthly delivery context.',
      'No completed work or business outcome is inferred.',
    ],
    coverageGrowth: [
      `${coverage.filter((flow) => flow.status === 'AUTOMATED').length} automated flow(s) currently recorded.`,
      `${coverage.filter((flow) => flow.status === 'PLANNED').length} planned flow(s).`,
    ],
    maintenanceSummary: [
      'Record actual flaky-test, failed-run, evidence, reporting, coverage, and dependency review activity.',
    ],
    automationStatus: [
      'Use real execution history before describing automation stability or progress.',
    ],
    recommendations: [
      'Review the next approved critical flow.',
      'Balance coverage expansion with maintenance effort.',
    ],
    renewalRecommendation: [
      `Internal renewal readiness: ${renewal.status}.`,
      'Do not present this as a completed or guaranteed renewal.',
    ],
    expansionRecommendation: expansionOpportunities.slice(0, 3),
  };
}

function expansionRecommendations(coverage: CoverageFlow[]): string[] {
  const names = new Set(coverage.map((flow) => flow.name));
  return [
    !names.has('Mobile Smoke') ? 'Add mobile coverage planning.' : 'Expand mobile coverage to approved responsive and device scenarios.',
    'Evaluate approved API coverage for stable non-destructive endpoints.',
    'Add performance trend review after a stable baseline exists.',
    'Add an accessibility review based on approved public and authenticated scope.',
    'Prepare release-confidence reporting from real execution history.',
    'Review additional critical flows based on client-approved priorities.',
  ];
}

function recommendedNextCoverage(coverage: CoverageFlow[]): string {
  return coverage.find((flow) => flow.priority === 'HIGH' && flow.status !== 'AUTOMATED')?.name
    ?? coverage.find((flow) => flow.status !== 'AUTOMATED')?.name
    ?? 'Review existing coverage stability.';
}

function percentage(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function document(report: RetainerOperationsReport, title: string, body: string[]): string {
  return [
    `# ${title}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    ...body,
    '',
    '## Safety Rules',
    '',
    bullets(report.safetyRules),
    '',
  ].join('\n');
}

function bullets(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function numbered(items: string[]): string {
  if (items.length === 0) return '1. None.';
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

function checklist(items: string[]): string {
  if (items.length === 0) return '- [ ] None.';
  return items.map((item) => `- [ ] ${item}`).join('\n');
}

function escapeTable(value: string): string {
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
