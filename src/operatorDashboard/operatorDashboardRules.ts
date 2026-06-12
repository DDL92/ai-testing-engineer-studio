import fs = require('fs');
import path = require('path');
import { buildActionCockpitReport, loadActionCockpitInput } from '../actionCockpit/actionCockpitRules';
import { CockpitAction, CockpitApprovalItem, CockpitFollowUpItem, CockpitOpportunity } from '../actionCockpit/types';
import { buildCommercialModeSummary } from '../commercialMode/commercialModeRules';
import { Lead } from '../leads/types';
import { CurrencyRange } from '../revenueCommandCenter/types';
import {
  OperatorDashboardExecutiveSummary,
  OperatorDashboardHealthGroup,
  OperatorDashboardHealthStatus,
  OperatorDashboardInput,
  OperatorDashboardReport,
  OperatorDashboardSource,
} from './types';

const outputRoot = path.join(process.cwd(), 'output', 'operator-os-dashboard');

const healthGroups = [
  {
    label: 'Action Cockpit',
    reports: [
      'output/action-cockpit/action-cockpit.md',
      'output/action-cockpit/daily-focus.md',
      'output/action-cockpit/approval-queue.md',
      'output/action-cockpit/system-health.md',
    ],
  },
  {
    label: 'Revenue Command Center',
    reports: [
      'output/revenue-command-center/revenue-command-center.md',
      'output/revenue-command-center/mrr-forecast.md',
      'output/revenue-command-center/audit-opportunities.md',
      'output/revenue-command-center/retainer-opportunities.md',
    ],
  },
  {
    label: 'Mobile Command Center',
    reports: [
      'output/mobile-command-center/mobile-command-center.md',
      'output/mobile-command-center/mobile-summary.md',
      'output/mobile-command-center/revenue-mobile.md',
      'output/mobile-command-center/followup-queue-mobile.md',
    ],
  },
  {
    label: 'Proposal Center',
    reports: [
      'output/proposal-center/proposal-command-center.md',
      'output/proposal-center/proposal-priority-list.md',
      'output/proposal-center/sow-readiness-report.md',
      'output/proposal-center/approval-checklist.md',
    ],
  },
  {
    label: 'Client Readiness',
    reports: [
      'output/real-client-readiness/real-client-readiness-pack.md',
      'output/real-client-readiness/first-audit-sales-pack.md',
      'output/real-client-readiness/top-5-contact-plan.md',
      'output/real-client-readiness/manual-outreach-checklist.md',
    ],
  },
  {
    label: 'First Audit Workflow',
    reports: [
      'output/first-audit-workflow/first-audit-workflow.md',
      'output/first-audit-workflow/discovery-call-prep.md',
      'output/first-audit-workflow/audit-scope-confirmation.md',
      'output/first-audit-workflow/approval-checklist.md',
    ],
  },
];

const contextPaths = [
  ...healthGroups.flatMap((group) => group.reports.map((reportPath) => [`${group.label}: ${path.basename(reportPath)}`, reportPath] as const)),
  ['Daily Revenue Operator', 'output/daily-revenue-operator/daily-revenue-operator.md'],
  ['Action Cockpit Top Opportunities', 'output/action-cockpit/top-opportunities.md'],
  ['Action Cockpit Follow-Up Watchlist', 'output/action-cockpit/followup-watchlist.md'],
  ['Action Cockpit Revenue Snapshot', 'output/action-cockpit/revenue-snapshot.md'],
  ['Mac Daily Summary', 'output/mac-daily/mac-daily-summary.md'],
] as const;

const manualApprovalReminder = [
  'Human approval is required before outreach, follow-up, proposal, SOW, discovery call, client delivery, client report, renewal, expansion, invoice, payment, or external action.',
  'Never auto-approve.',
  'No outreach is sent from this dashboard.',
  'No CRM is connected or updated.',
  'No APIs, scraping, browsing, external databases, credentials, payments, invoices, or sending workflows were used.',
  'Revenue values use Revenue Command Center as the source of truth.',
];

export function loadOperatorDashboardInput(): OperatorDashboardInput {
  const generatedAt = new Date().toISOString();
  const actionInput = loadActionCockpitInput();
  const actionCockpit = buildActionCockpitReport(actionInput);
  const leads = readJson<Lead[]>('data/leads.json', []);
  const commercialSummary = buildCommercialModeSummary(leads);

  return {
    generatedAt,
    today: generatedAt.slice(0, 10),
    actionCockpit,
    revenueReport: actionInput.revenueReport,
    commercialLeads: commercialSummary.commercialLeads.length,
    contextSources: contextPaths.map(([label, reportPath]) => readContextSource(label, reportPath)),
  };
}

export function buildOperatorDashboardReport(input: OperatorDashboardInput): OperatorDashboardReport {
  const healthGroups = buildHealthGroups();
  const systemHealth = overallHealth(healthGroups);
  const topRisk = topRiskFor(input.revenueReport.revenueRisks, systemHealth);
  const executiveSummary: OperatorDashboardExecutiveSummary = {
    systemHealth,
    bookedMrr: input.revenueReport.bookedMrr,
    projectedMrr: `${formatRange(input.revenueReport.projectedExpectedMrr)}/month`,
    auditOpportunities: input.revenueReport.auditOpportunities.length,
    retainerOpportunities: input.revenueReport.retainerOpportunities.length,
    commercialLeads: input.commercialLeads,
    approvalItems: input.actionCockpit.approvalQueue.length,
    topRisk,
    topOpportunity: input.actionCockpit.topOpportunities[0]?.company ?? 'No top opportunity found.',
  };

  return {
    generatedAt: input.generatedAt,
    today: input.today,
    executiveSummary,
    actionCockpit: input.actionCockpit,
    revenueReport: input.revenueReport,
    opportunities: input.actionCockpit.topOpportunities.slice(0, 10),
    approvals: input.actionCockpit.approvalQueue,
    followUps: input.actionCockpit.followUpWatchlist,
    healthGroups,
    nextRecommendedCommand: input.actionCockpit.nextRecommendedCommand,
    contextSources: input.contextSources,
  };
}

export function writeOperatorDashboardOutputs(report: OperatorDashboardReport): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });

  const outputs = [
    { fileName: 'operator-dashboard.md', body: renderOperatorDashboard(report) },
    { fileName: 'today-view.md', body: renderTodayView(report) },
    { fileName: 'executive-summary.md', body: renderExecutiveSummary(report) },
    { fileName: 'opportunity-center.md', body: renderOpportunityCenter(report) },
    { fileName: 'revenue-center.md', body: renderRevenueCenter(report) },
    { fileName: 'approval-center.md', body: renderApprovalCenter(report) },
    { fileName: 'followup-center.md', body: renderFollowUpCenter(report) },
    { fileName: 'system-status.md', body: renderSystemStatus(report) },
  ];

  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }

  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

export function writeTodayViewOutput(report: OperatorDashboardReport): string {
  fs.mkdirSync(outputRoot, { recursive: true });
  const outputPath = path.join(outputRoot, 'today-view.md');
  fs.writeFileSync(outputPath, renderTodayView(report), 'utf8');
  return outputPath;
}

export function renderOperatorDashboard(report: OperatorDashboardReport): string {
  return [
    '# AI Studio OS Dashboard',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Executive Summary',
    renderExecutiveSummaryBody(report),
    '',
    "## Today's Top Actions",
    renderActionList(report.actionCockpit.topActions),
    '',
    '## Top Opportunities',
    renderOpportunityList(report.opportunities.slice(0, 5)),
    '',
    '## Revenue Center',
    renderRevenueCenterBody(report),
    '',
    '## Client Center',
    renderClientCenterBody(report),
    '',
    '## Follow-Up Center',
    renderFollowUpList(report.followUps),
    '',
    '## Approval Center',
    renderApprovalList(report.approvals.slice(0, 10)),
    '',
    '## System Status',
    `Overall: ${report.executiveSummary.systemHealth}`,
    '',
    '## Recommended Next Command',
    `\`${report.nextRecommendedCommand}\``,
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderTodayView(report: OperatorDashboardReport): string {
  return [
    '# Today View',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'If Daniel only works 30 minutes today, what should he do?',
    '',
    renderActionList(report.actionCockpit.topActions.slice(0, 3)),
    '',
    '## Priority Rules',
    renderList([
      'Prioritize revenue.',
      'Then client retention.',
      'Then proposal progress.',
      'Do not send, schedule, invoice, approve, or update external systems from this report.',
    ]),
    '',
  ].join('\n');
}

export function renderExecutiveSummary(report: OperatorDashboardReport): string {
  return [
    '# Executive Summary',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderExecutiveSummaryBody(report),
    '',
    '## Sources Of Truth',
    renderList([
      'Revenue Command Center',
      'Action Cockpit',
    ]),
    '',
  ].join('\n');
}

export function renderOpportunityCenter(report: OperatorDashboardReport): string {
  return [
    '# Opportunity Center',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Rank | Company | Opportunity Type | Readiness | Next Action | Revenue Potential |',
    '| ---: | --- | --- | --- | --- | --- |',
    ...report.opportunities.slice(0, 10).map((opportunity, index) => (
      `| ${index + 1} | ${escapeTable(opportunity.company)} | ${escapeTable(opportunity.opportunityType)} | ${escapeTable(opportunity.readiness)} | ${escapeTable(opportunity.nextStep)} | ${escapeTable(opportunity.revenuePotential)} |`
    )),
    report.opportunities.length === 0 ? '| 1 | None | None | Not ready | Review Revenue Command Center. | $0 |' : '',
    '',
    '## Exclusions',
    renderList([
      'Demo leads excluded.',
      'Sample leads excluded.',
      'Sandbox leads excluded.',
      'Paused leads excluded.',
      'Lost leads excluded.',
      'Use local data only.',
    ]),
    '',
  ].filter((line) => line !== '').join('\n');
}

export function renderRevenueCenter(report: OperatorDashboardReport): string {
  return [
    '# Revenue Center',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderRevenueCenterBody(report),
    '',
    '## Source Of Truth',
    renderList([
      'Revenue Command Center is the revenue source of truth.',
      'No invented revenue.',
      'Projected MRR and opportunities are not booked revenue.',
    ]),
    '',
  ].join('\n');
}

export function renderApprovalCenter(report: OperatorDashboardReport): string {
  return [
    '# Approval Center',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderApprovalList(report.approvals),
    '',
    '## Rules',
    renderList([
      'Never auto-approve.',
      'Human approval only.',
      ...manualApprovalReminder,
    ]),
    '',
  ].join('\n');
}

export function renderFollowUpCenter(report: OperatorDashboardReport): string {
  return [
    '# Follow-Up Center',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderFollowUpList(report.followUps),
    '',
    '## Rules',
    renderList([
      'Manual follow-up queue only.',
      'No automation.',
      'No CRM.',
      'No sending.',
      'Daniel must approve, send, and record any follow-up manually.',
    ]),
    '',
  ].join('\n');
}

export function renderSystemStatus(report: OperatorDashboardReport): string {
  return [
    '# System Status',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Overall: ${report.executiveSummary.systemHealth}`,
    '',
    '| Report Group | Status | Available | Missing |',
    '| --- | --- | ---: | ---: |',
    ...report.healthGroups.map((group) => `| ${escapeTable(group.label)} | ${group.status} | ${group.availableReports.length} | ${group.missingReports.length} |`),
    '',
    '## Missing Reports',
    renderList(report.healthGroups.flatMap((group) => group.missingReports.map((reportPath) => `${group.label}: ${reportPath}`))),
    '',
  ].join('\n');
}

function renderExecutiveSummaryBody(report: OperatorDashboardReport): string {
  const summary = report.executiveSummary;
  return [
    `- System Health: ${summary.systemHealth}`,
    `- Booked MRR: ${formatCurrency(summary.bookedMrr)}`,
    `- Projected MRR: ${summary.projectedMrr}`,
    `- Audit Opportunities: ${summary.auditOpportunities}`,
    `- Retainer Opportunities: ${summary.retainerOpportunities}`,
    `- Commercial Leads: ${summary.commercialLeads}`,
    `- Approval Items: ${summary.approvalItems}`,
    `- Top Risk: ${summary.topRisk}`,
    `- Top Opportunity: ${summary.topOpportunity}`,
  ].join('\n');
}

function renderRevenueCenterBody(report: OperatorDashboardReport): string {
  return [
    `- Booked MRR: ${formatCurrency(report.revenueReport.bookedMrr)}`,
    `- Projected MRR: ${formatRange(report.revenueReport.projectedExpectedMrr)}/month`,
    `- Audit Opportunities: ${report.revenueReport.auditOpportunities.length}`,
    `- Retainer Opportunities: ${report.revenueReport.retainerOpportunities.length}`,
    `- Renewal Opportunities: ${report.revenueReport.renewalOpportunities.length}`,
    `- Expansion Opportunities: ${report.revenueReport.expansionOpportunities.length}`,
    '',
    '### Revenue Risks',
    renderList(report.revenueReport.revenueRisks.slice(0, 8)),
  ].join('\n');
}

function renderClientCenterBody(report: OperatorDashboardReport): string {
  return [
    '### Active',
    renderClientList(report.actionCockpit.activeClients, 'No active commercial clients found.'),
    '',
    '### At Risk',
    renderClientList(report.actionCockpit.atRiskClients, 'No at-risk commercial clients found.'),
    '',
    '### Paused',
    renderClientList(report.actionCockpit.pausedClients, 'No paused commercial clients found.'),
    '',
    '### Renewal Watch',
    renderClientList(report.actionCockpit.renewalWatch, 'No renewal watch clients found.'),
  ].join('\n');
}

function renderActionList(actions: CockpitAction[]): string {
  if (actions.length === 0) return '- No actions found.';
  return actions
    .map((action, index) => `${index + 1}. ${action.title}\n   - Reason: ${action.reason}\n   - Expected Outcome: ${action.expectedOutcome}\n   - Command: ${action.command}\n   - Approval: ${action.approvalRequired}`)
    .join('\n');
}

function renderOpportunityList(opportunities: CockpitOpportunity[]): string {
  if (opportunities.length === 0) return '- No opportunities found.';
  return opportunities
    .map((opportunity, index) => `${index + 1}. ${opportunity.company}\n   - Type: ${opportunity.opportunityType}\n   - Readiness: ${opportunity.readiness}\n   - Next Action: ${opportunity.nextStep}\n   - Revenue Potential: ${opportunity.revenuePotential}`)
    .join('\n');
}

function renderApprovalList(approvals: CockpitApprovalItem[]): string {
  if (approvals.length === 0) return '- No approval items found.';
  return approvals
    .map((approval, index) => `${index + 1}. ${approval.item}\n   - Category: ${approval.category}\n   - Reason: ${approval.reason}\n   - Command: ${approval.command}\n   - Approval Required: ${approval.approvalRequired}`)
    .join('\n');
}

function renderFollowUpList(followUps: CockpitFollowUpItem[]): string {
  if (followUps.length === 0) return '- No manual follow-ups found.';
  return followUps
    .map((followUp, index) => `${index + 1}. ${followUp.company}\n   - Reason: ${followUp.reason}\n   - Recommended Timing: ${followUp.recommendedTiming}\n   - Next Action: ${followUp.command}`)
    .join('\n');
}

function renderClientList(clients: OperatorDashboardReport['actionCockpit']['activeClients'], emptyText: string): string {
  if (clients.length === 0) return `- ${emptyText}`;
  return clients.map((client) => `- ${client.companyName}: ${client.status}, ${client.serviceType}, ${formatCurrency(client.monthlyFee)}/month`).join('\n');
}

function buildHealthGroups(): OperatorDashboardHealthGroup[] {
  return healthGroups.map((group) => {
    const availableReports = group.reports.filter(exists);
    const missingReports = group.reports.filter((reportPath) => !exists(reportPath));
    const status: OperatorDashboardHealthStatus = missingReports.length === 0 ? 'GREEN' : availableReports.length === 0 ? 'RED' : 'YELLOW';
    return { label: group.label, status, availableReports, missingReports };
  });
}

function overallHealth(groups: OperatorDashboardHealthGroup[]): OperatorDashboardHealthStatus {
  if (groups.every((group) => group.status === 'GREEN')) return 'GREEN';
  if (groups.every((group) => group.status === 'RED')) return 'RED';
  return 'YELLOW';
}

function topRiskFor(revenueRisks: string[], health: OperatorDashboardHealthStatus): string {
  if (health !== 'GREEN') return 'Some dashboard source reports are missing.';
  return revenueRisks[0] ?? 'No top risk found.';
}

function readContextSource(label: string, reportPath: string): OperatorDashboardSource {
  const content = readFile(reportPath);
  return {
    label,
    path: reportPath,
    exists: Boolean(content),
    excerpt: content.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 4).join(' '),
  };
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

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

function formatRange(range: CurrencyRange): string {
  if (range.min === range.max) return formatCurrency(range.min);
  return `${formatCurrency(range.min)}-${formatCurrency(range.max)}`;
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
