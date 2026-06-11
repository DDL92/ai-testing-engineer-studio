import fs = require('fs');
import path = require('path');
import { Client } from '../clientReports/types';
import { buildCommercialModeReport, filterCommercialContactReviews } from '../commercialMode/commercialModeRules';
import { ContactReviewRecord } from '../contactReview/types';
import { Lead } from '../leads/types';
import { buildRevenueSummary } from '../metrics/revenueRules';
import { buildOpportunityTracker } from '../pipeline/pipelineRules';
import { OpportunityItem } from '../pipeline/types';
import { buildPipelinePrioritizationReport } from '../pipelinePrioritization/pipelinePrioritizationRules';
import { LocalContextSource, PrioritizedOpportunity } from '../pipelinePrioritization/types';
import {
  MacDailyCommand,
  MacDailyCommandResult,
  MacDailyData,
  MacDailyOutputPaths,
  MacHealthStatus,
  MacOpportunityLike,
  MacSystemHealthCheck,
} from './types';

const outputDir = path.join(process.cwd(), 'output', 'mac-daily');

export const macDailyCommands: MacDailyCommand[] = [
  {
    script: 'dashboard',
    command: 'npm run dashboard',
    expectedOutputs: [
      'output/dashboard/dashboard.md',
      'output/dashboard/dashboard.html',
      'output/dashboard/commercial-dashboard.md',
    ],
  },
  {
    script: 'operator:daily',
    command: 'npm run operator:daily',
    expectedOutputs: ['output/operator/daily-command-center.md'],
  },
  {
    script: 'pipeline:prioritize',
    command: 'npm run pipeline:prioritize',
    expectedOutputs: [
      'output/pipeline-prioritization/prioritized-pipeline.md',
      'output/pipeline-prioritization/commercial-prioritized-pipeline.md',
      'output/pipeline-prioritization/top-10-revenue-opportunities.md',
      'output/pipeline-prioritization/top-5-actions.md',
      'output/pipeline-prioritization/stalled-opportunities.md',
    ],
  },
  {
    script: 'client:ops',
    command: 'npm run client:ops',
    expectedOutputs: [
      'output/client-ops/client-operations-center.md',
      'output/client-ops/client-readiness.md',
      'output/client-ops/next-actions.md',
    ],
  },
  {
    script: 'renewal:tracker',
    command: 'npm run renewal:tracker',
    expectedOutputs: [
      'output/renewals/renewal-pipeline.md',
      'output/renewals/client-health.md',
      'output/renewals/renewal-risk-report.md',
      'output/renewals/expansion-opportunities.md',
      'output/renewals/renewal-actions.md',
    ],
  },
  {
    script: 'commercial:summary',
    command: 'npm run commercial:summary',
    expectedOutputs: [
      'output/commercial-mode/demo-isolation-report.md',
      'output/commercial-mode/commercial-mode-summary.md',
    ],
  },
];

export function macDailyOutputPaths(): MacDailyOutputPaths {
  return {
    summary: path.join(outputDir, 'mac-daily-summary.md'),
    executedReports: path.join(outputDir, 'executed-reports.md'),
    systemHealth: path.join(outputDir, 'system-health.md'),
    actionCockpit: path.join(outputDir, 'action-cockpit.md'),
  };
}

export function buildMacDailyData(generatedAt: string): MacDailyData {
  const leads = readJson<Lead[]>(path.join('data', 'leads.json'), []);
  const clients = readJson<Client[]>(path.join('data', 'clients.json'), []);
  const contactReviews = readJson<ContactReviewRecord[]>(path.join('data', 'contact-reviews.json'), []);
  const commercialReport = buildCommercialModeReport({ generatedAt, leads, contactReviews });
  const commercialContactReviews = filterCommercialContactReviews(contactReviews, commercialReport.summary.commercialLeads);
  const opportunityTracker = buildOpportunityTracker(commercialReport.summary.commercialLeads, commercialContactReviews);
  const revenue = buildRevenueSummary(commercialReport.summary.commercialLeads, clients);
  const pipelineReport = buildPipelinePrioritizationReport({
    generatedAt,
    today: generatedAt.slice(0, 10),
    leads: commercialReport.summary.commercialLeads,
    contactReviews: commercialContactReviews,
    clients,
    contextSources: [
      readContextSource('Dashboard', 'output/dashboard/dashboard.md'),
      readContextSource('Commercial dashboard', 'output/dashboard/commercial-dashboard.md'),
      readContextSource('Daily operator', 'output/operator/daily-command-center.md'),
      readContextSource('Commercial pipeline', 'output/pipeline-prioritization/commercial-prioritized-pipeline.md'),
      readContextSource('Client operations', 'output/client-ops/client-operations-center.md'),
      readContextSource('Renewals', 'output/renewals/renewal-pipeline.md'),
      readContextSource('Commercial mode', 'output/commercial-mode/commercial-mode-summary.md'),
    ],
  });

  return {
    generatedAt,
    totalLeads: leads.length,
    commercialLeads: commercialReport.summary.commercialLeads,
    demoLeadCount: commercialReport.summary.demoLeads.length,
    clients,
    estimatedMrr: revenue.estimatedMrr,
    topCommercialOpportunities: opportunityTracker.topOpportunities.slice(0, 10),
    pipelineReport,
    topActions: pipelineReport.topActions.slice(0, 5),
    followUps: opportunityTracker.followUpsNeeded.slice(0, 5),
    renewalRisks: clients.filter((client) => client.status === 'at-risk' || client.openRisks.length > 0).slice(0, 5),
    expansionOpportunities: clients.filter((client) => client.status === 'active' && (client.monthlyFee === 0 || client.recommendedNextSteps.length > 0)).slice(0, 5),
    healthChecks: buildSystemHealthChecks(leads.length),
  };
}

export function writeMacSummaryOutputs(data: MacDailyData): MacDailyOutputPaths {
  const paths = macDailyOutputPaths();

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(paths.summary, renderMacDailySummary(data), 'utf8');
  fs.writeFileSync(paths.systemHealth, renderSystemHealth(data), 'utf8');
  fs.writeFileSync(paths.actionCockpit, renderActionCockpit(data), 'utf8');

  return paths;
}

export function writeExecutedReports(results: MacDailyCommandResult[]): string {
  const paths = macDailyOutputPaths();
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(paths.executedReports, renderExecutedReports(results), 'utf8');
  return paths.executedReports;
}

export function renderMacDailySummary(data: MacDailyData): string {
  const activeClients = data.clients.filter((client) => client.status === 'active');

  return [
    '# AI Studio Daily Summary',
    '',
    `Generated At: ${data.generatedAt}`,
    '',
    '## Commercial Snapshot',
    '',
    `- Commercial Leads: ${data.commercialLeads.length}`,
    `- Demo Leads: ${data.demoLeadCount}`,
    '',
    'Top Commercial Opportunities:',
    renderOpportunityBullets(data.topCommercialOpportunities.slice(0, 5)),
    '',
    '## Revenue Snapshot',
    '',
    `- Estimated MRR: ${formatCurrency(data.estimatedMrr)}`,
    `- Renewal Opportunities: ${activeClients.length}`,
    `- Expansion Opportunities: ${data.expansionOpportunities.length}`,
    '- Revenue values come from local client and lead files only. Opportunity values are not booked revenue.',
    '',
    '## Pipeline Snapshot',
    '',
    'Top 5 Opportunities:',
    renderPriorityOpportunityBullets(data.pipelineReport.topRevenueOpportunities.slice(0, 5)),
    '',
    `- Stalled Opportunities: ${data.pipelineReport.stalledOpportunities.length}`,
    '',
    '## Client Snapshot',
    '',
    'Client Health:',
    renderClientHealth(data.clients),
    '',
    'Renewal Watchlist:',
    renderClientBullets(activeClients, 'No active clients currently found in local data.'),
    '',
    "## Today's Actions",
    '',
    'Top 5 Actions:',
    renderActionBullets(data.topActions),
    '',
    '## Suggested Commands',
    '',
    renderCommandBullets(data.topActions.map((action) => action.command)),
    '',
    '## Manual Approval Reminder',
    '',
    renderSafetyRules(),
    '',
  ].join('\n');
}

export function renderSystemHealth(data: MacDailyData): string {
  const overall = overallHealth(data.healthChecks);

  return [
    '# Mac Daily System Health',
    '',
    `Generated At: ${data.generatedAt}`,
    '',
    `Overall Status: ${overall}`,
    '',
    '## Checks',
    '',
    '| Check | Status | Details |',
    '| --- | --- | --- |',
    ...data.healthChecks.map((check) => `| ${escapeTable(check.label)} | ${check.status} | ${escapeTable(check.details)} |`),
    '',
    '## Manual Approval Reminder',
    '',
    renderSafetyRules(),
    '',
  ].join('\n');
}

export function renderActionCockpit(data: MacDailyData): string {
  return [
    '# Mac Daily Action Cockpit',
    '',
    `Generated At: ${data.generatedAt}`,
    '',
    '## Top 5 Actions',
    '',
    renderActionBullets(data.topActions),
    '',
    '## Top 5 Opportunities',
    '',
    renderOpportunityBullets(data.topCommercialOpportunities.slice(0, 5)),
    '',
    '## Top 5 Follow-Ups',
    '',
    renderOpportunityBullets(data.followUps),
    '',
    '## Top Renewal Risks',
    '',
    renderClientRiskBullets(data.renewalRisks),
    '',
    '## Top Expansion Opportunities',
    '',
    renderExpansionBullets(data.expansionOpportunities),
    '',
    '## Suggested Commands',
    '',
    renderCommandBullets([
      ...data.topActions.map((action) => action.command),
      ...data.topCommercialOpportunities.slice(0, 2).map((item) => commandForOpportunity(item)),
    ]),
    '',
    '## Manual Approval Reminder',
    '',
    renderSafetyRules(),
    '',
  ].join('\n');
}

export function renderExecutedReports(results: MacDailyCommandResult[]): string {
  return [
    '# Mac Daily Executed Reports',
    '',
    `Generated At: ${new Date().toISOString()}`,
    '',
    '## Command Results',
    '',
    '| Command Executed | Success/Failure | Timestamp | Generated Outputs |',
    '| --- | --- | --- | --- |',
    ...results.map((result) => {
      const status = result.status === 'success' ? 'success' : `failure${result.errorMessage ? `: ${result.errorMessage}` : ''}`;
      const outputs = result.generatedOutputs.length > 0 ? result.generatedOutputs.join('<br>') : 'No expected outputs detected.';
      return `| ${escapeTable(result.command)} | ${escapeTable(status)} | ${result.completedAt} | ${escapeTable(outputs)} |`;
    }),
    '',
    '## Manual Approval Reminder',
    '',
    renderSafetyRules(),
    '',
  ].join('\n');
}

function buildSystemHealthChecks(totalLeads: number): MacSystemHealthCheck[] {
  return [
    fileCheck('Leads file exists', 'data/leads.json', totalLeads > 0 ? 'GREEN' : 'YELLOW', `${totalLeads} leads loaded.`),
    fileCheck('Dashboard exists', 'output/dashboard/commercial-dashboard.md'),
    fileCheck('Operator exists', 'output/operator/daily-command-center.md'),
    fileCheck('Pipeline exists', 'output/pipeline-prioritization/commercial-prioritized-pipeline.md'),
    fileCheck('Renewals exist', 'output/renewals/renewal-pipeline.md'),
    compoundCheck('Commercial mode exists', [
      'src/commercialMode/commercialModeRules.ts',
      'output/commercial-mode/commercial-mode-summary.md',
      'output/commercial-mode/demo-isolation-report.md',
    ]),
  ];
}

function fileCheck(label: string, relativePath: string, presentStatus: MacHealthStatus = 'GREEN', presentDetails?: string): MacSystemHealthCheck {
  const exists = fs.existsSync(path.join(process.cwd(), relativePath));
  return {
    label,
    status: exists ? presentStatus : 'RED',
    details: exists ? presentDetails ?? `${relativePath} found.` : `${relativePath} missing.`,
  };
}

function compoundCheck(label: string, relativePaths: string[]): MacSystemHealthCheck {
  const missing = relativePaths.filter((relativePath) => !fs.existsSync(path.join(process.cwd(), relativePath)));

  return {
    label,
    status: missing.length === 0 ? 'GREEN' : missing.length === relativePaths.length ? 'RED' : 'YELLOW',
    details: missing.length === 0 ? 'Commercial Mode helper and reports found.' : `Missing: ${missing.join(', ')}`,
  };
}

function overallHealth(checks: MacSystemHealthCheck[]): MacHealthStatus {
  if (checks.some((check) => check.status === 'RED')) return 'RED';
  if (checks.some((check) => check.status === 'YELLOW')) return 'YELLOW';
  return 'GREEN';
}

function readJson<T>(relativePath: string, fallback: T): T {
  const absolutePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) return fallback;
  const raw = fs.readFileSync(absolutePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function readContextSource(label: string, relativePath: string): LocalContextSource {
  const absolutePath = path.join(process.cwd(), relativePath);
  const exists = fs.existsSync(absolutePath);
  const content = exists ? fs.readFileSync(absolutePath, 'utf8') : '';

  return {
    label,
    path: relativePath,
    exists,
    excerpt: content.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 4).join(' '),
  };
}

function renderOpportunityBullets(items: OpportunityItem[]): string {
  if (items.length === 0) return '- No commercial opportunities found.';

  return items
    .map((item, index) => `${index + 1}. ${item.lead.companyName} - score ${item.opportunityScore}, ${item.pipelineStage}, ${item.nextAction}`)
    .join('\n');
}

function renderPriorityOpportunityBullets(items: PrioritizedOpportunity[]): string {
  if (items.length === 0) return '- No prioritized opportunities found.';

  return items
    .map((item, index) => `${index + 1}. ${item.lead.companyName} - score ${item.priorityScore}, ${item.stage}, ${item.nextAction}`)
    .join('\n');
}

function renderActionBullets(actions: MacDailyData['topActions']): string {
  if (actions.length === 0) return '- No top actions found.';

  return actions
    .map((action, index) => `${index + 1}. ${action.company} - ${action.title}\n   - Command: ${action.command}\n   - Approval: ${action.manualApprovalNote}`)
    .join('\n');
}

function renderClientHealth(clients: Client[]): string {
  if (clients.length === 0) return '- No clients found in local data.';

  return clients
    .map((client) => `- ${client.companyName}: ${client.status}, ${formatCurrency(client.monthlyFee)}/month, ${client.openRisks.length} open risks.`)
    .join('\n');
}

function renderClientBullets(clients: Client[], emptyText: string): string {
  if (clients.length === 0) return `- ${emptyText}`;

  return clients
    .map((client) => `- ${client.companyName}: ${formatCurrency(client.monthlyFee)}/month, next review requires Daniel approval.`)
    .join('\n');
}

function renderClientRiskBullets(clients: Client[]): string {
  if (clients.length === 0) return '- No renewal risks found in local client data.';

  return clients
    .map((client, index) => `${index + 1}. ${client.companyName} - ${client.openRisks[0] ?? 'Manual renewal review required.'}`)
    .join('\n');
}

function renderExpansionBullets(clients: Client[]): string {
  if (clients.length === 0) return '- No expansion opportunities found in local client data.';

  return clients
    .map((client, index) => `${index + 1}. ${client.companyName} - ${client.recommendedNextSteps[0] ?? 'Review expansion path manually.'}`)
    .join('\n');
}

function renderCommandBullets(commands: string[]): string {
  const uniqueCommands = Array.from(new Set(commands.filter(Boolean))).slice(0, 8);
  if (uniqueCommands.length === 0) return '- npm run mac:summary';

  return uniqueCommands.map((command) => `- ${command}`).join('\n');
}

function commandForOpportunity(item: MacOpportunityLike): string {
  if ('suggestedCommand' in item) return item.suggestedCommand;
  const leadId = item.lead.id;

  if (item.pipelineStage === 'FOLLOW_UP') return `npm run contact:review -- --id ${leadId}`;
  if (item.pipelineStage === 'RESEARCH_READY' || item.pipelineStage === 'AUDIT_READY') return `npm run audit:pack -- --id ${leadId}`;
  if (item.pipelineStage === 'NEW_LEAD') return `npm run lead:research -- --id ${leadId}`;
  if (item.pipelineStage === 'OUTREACH_READY' || item.pipelineStage === 'CONTACT_REVIEW') return `npm run contact:review -- --id ${leadId}`;
  if (item.pipelineStage === 'SOW_READY') return `npm run sow:generate -- --id ${leadId}`;
  if (item.pipelineStage === 'CLIENT_READY') return `npm run client:onboard -- --id ${leadId}`;
  return `npm run lead:pack -- --id ${leadId}`;
}

function renderSafetyRules(): string {
  return [
    '- Human approval required before outreach, follow-up, proposals, client reports, invoices, payments, renewals, expansion, or delivery changes.',
    '- Local-only deterministic reports. No APIs, scraping, browsing, CRM, outreach automation, email sending, LinkedIn automation, payments, credentials, or external databases.',
    '- Suggested commands generate local preparation assets only unless Daniel manually approves the next step.',
  ].join('\n');
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US')}`;
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}
