import fs = require('fs');
import path = require('path');
import { Client } from '../clientReports/types';
import { getRevenueSourceOfTruth } from '../revenueIntelligence/sourceOfTruth';
import { buildRevenueCommandCenterReport, loadRevenueCommandCenterInput } from '../revenueCommandCenter/revenueRules';
import { CurrencyRange, RevenueCommandCenterReport, RevenuePriorityOpportunity, RetainerOpportunity } from '../revenueCommandCenter/types';
import {
  ActionCockpitContextSource,
  ActionCockpitHealthStatus,
  ActionCockpitInput,
  ActionCockpitReport,
  CockpitAction,
  CockpitApprovalItem,
  CockpitFollowUpItem,
  CockpitOpportunity,
  CockpitRevenueSnapshot,
  CockpitSystemHealthGroup,
} from './types';

const outputRoot = path.join(process.cwd(), 'output', 'action-cockpit');

const healthGroups = [
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
    label: 'First Audit Workflow',
    reports: [
      'output/first-audit-workflow/first-audit-workflow.md',
      'output/first-audit-workflow/discovery-call-prep.md',
      'output/first-audit-workflow/audit-scope-confirmation.md',
      'output/first-audit-workflow/approval-checklist.md',
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
    label: 'Daily Revenue Operator',
    reports: [
      'output/daily-revenue-operator/daily-revenue-operator.md',
      'output/daily-revenue-operator/revenue-next-actions.md',
      'output/daily-revenue-operator/revenue-priority-list.md',
      'output/daily-revenue-operator/approval-checklist.md',
    ],
  },
];

const contextPaths = [
  ...healthGroups.flatMap((group) => group.reports.map((reportPath) => [`${group.label}: ${path.basename(reportPath)}`, reportPath] as const)),
  ['Revenue focus today', 'output/daily-revenue-operator/revenue-focus-today.md'],
  ['Revenue risks', 'output/daily-revenue-operator/revenue-risks.md'],
  ['Mac action cockpit', 'output/mac-daily/action-cockpit.md'],
  ['Client operations', 'output/client-ops/client-operations-center.md'],
  ['Renewals', 'output/renewals/renewal-pipeline.md'],
  ['Outreach execution', 'output/outreach-execution/outreach-execution-pack.md'],
  ['Clients', 'data/clients.json'],
] as const;

const manualApprovalRules = [
  'Human approval is required before outreach, follow-up, proposal, SOW, discovery call, client delivery, client report, renewal, expansion, invoice, payment, or external action.',
  'Approval queue items are review-only. Never auto-approve.',
  'No APIs, scraping, browsing, CRM, outreach automation, email sending, LinkedIn automation, external databases, credentials, payments, invoices, or sending were used.',
  'Revenue values come from Revenue Command Center. Opportunities and projected MRR are not booked revenue.',
];

export function loadActionCockpitInput(): ActionCockpitInput {
  const generatedAt = new Date().toISOString();
  const revenueReport = buildRevenueCommandCenterReport(loadRevenueCommandCenterInput());

  return {
    generatedAt,
    today: generatedAt.slice(0, 10),
    revenueReport,
    clients: readJson<Client[]>('data/clients.json', []),
    contextSources: contextPaths.map(([label, reportPath]) => readContextSource(label, reportPath)),
  };
}

export function buildActionCockpitReport(input: ActionCockpitInput): ActionCockpitReport {
  const revenueSnapshot = buildRevenueSnapshot(input.revenueReport);
  const topOpportunities = buildTopOpportunities(input.revenueReport);
  const topActions = buildTopActions(input.revenueReport, topOpportunities).slice(0, 3);
  const followUpWatchlist = buildFollowUpWatchlist(input.revenueReport).slice(0, 5);
  const approvalQueue = buildApprovalQueue(input.revenueReport, topOpportunities, followUpWatchlist).slice(0, 12);
  const systemHealthGroups = buildSystemHealthGroups();
  const nextRecommendedCommand = recommendNextCommand(topActions, topOpportunities, systemHealthGroups);

  return {
    generatedAt: input.generatedAt,
    today: input.today,
    topActions,
    topOpportunities: topOpportunities.slice(0, 10),
    revenueSnapshot,
    activeClients: input.revenueReport.activeRetainerClients.concat(input.revenueReport.activeOneTimeClients).slice(0, 10),
    atRiskClients: input.clients.filter((client) => isCommercialClient(client) && client.status === 'at-risk').slice(0, 10),
    pausedClients: input.clients.filter((client) => isCommercialClient(client) && client.status === 'paused').slice(0, 10),
    renewalWatch: input.revenueReport.renewalOpportunities.map((opportunity) => opportunity.client).slice(0, 10),
    followUpWatchlist,
    approvalQueue,
    systemHealth: overallHealth(systemHealthGroups),
    systemHealthGroups,
    nextRecommendedCommand,
    contextSources: input.contextSources,
  };
}

export function writeActionCockpitOutputs(report: ActionCockpitReport): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });

  const outputs = [
    { fileName: 'action-cockpit.md', body: renderActionCockpit(report) },
    { fileName: 'daily-focus.md', body: renderDailyFocus(report) },
    { fileName: 'top-opportunities.md', body: renderTopOpportunities(report) },
    { fileName: 'approval-queue.md', body: renderApprovalQueue(report) },
    { fileName: 'revenue-snapshot.md', body: renderRevenueSnapshotReport(report) },
    { fileName: 'client-watchlist.md', body: renderClientWatchlist(report) },
    { fileName: 'followup-watchlist.md', body: renderFollowUpWatchlist(report) },
    { fileName: 'system-health.md', body: renderSystemHealth(report) },
  ];

  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }

  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

export function writeApprovalQueueOutput(report: ActionCockpitReport): string {
  fs.mkdirSync(outputRoot, { recursive: true });
  const outputPath = path.join(outputRoot, 'approval-queue.md');
  fs.writeFileSync(outputPath, renderApprovalQueue(report), 'utf8');
  return outputPath;
}

export function renderActionCockpit(report: ActionCockpitReport): string {
  return [
    '# Today',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Top 3 Actions',
    renderActionList(report.topActions),
    '',
    '## Top 5 Opportunities',
    renderOpportunityList(report.topOpportunities.slice(0, 5)),
    '',
    '## Revenue Snapshot',
    renderRevenueSnapshot(report.revenueSnapshot),
    '',
    '## Client Watchlist',
    renderClientWatchlistBody(report),
    '',
    '## Follow-Up Watchlist',
    renderFollowUpList(report.followUpWatchlist),
    '',
    '## Approval Queue',
    renderApprovalList(report.approvalQueue.slice(0, 8)),
    '',
    '## System Health',
    `Overall: ${report.systemHealth}`,
    '',
    '## Next Recommended Command',
    `\`${report.nextRecommendedCommand}\``,
    '',
    '## Safety Rules',
    renderList(manualApprovalRules),
    '',
  ].join('\n');
}

export function renderDailyFocus(report: ActionCockpitReport): string {
  return [
    '# Daily Focus',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'If Daniel only had 30 minutes today, what should he do?',
    '',
    renderActionList(report.topActions.slice(0, 3)),
    '',
    '## Priority Rules',
    renderList([
      'Prioritize revenue first.',
      'Then active opportunities.',
      'Then client retention.',
      'Do not send, approve, schedule, invoice, or update external systems from this report.',
    ]),
    '',
  ].join('\n');
}

export function renderTopOpportunities(report: ActionCockpitReport): string {
  return [
    '# Top Opportunities',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Rank | Company | Opportunity Type | Readiness | Next Step | Revenue Potential |',
    '| ---: | --- | --- | --- | --- | --- |',
    ...report.topOpportunities.slice(0, 10).map((opportunity, index) => (
      `| ${index + 1} | ${escapeTable(opportunity.company)} | ${escapeTable(opportunity.opportunityType)} | ${escapeTable(opportunity.readiness)} | ${escapeTable(opportunity.nextStep)} | ${escapeTable(opportunity.revenuePotential)} |`
    )),
    report.topOpportunities.length === 0 ? '| 1 | None | None | Not ready | Review local revenue command center. | $0 |' : '',
    '',
    '## Rules',
    renderList(manualApprovalRules),
    '',
  ].filter((line) => line !== '').join('\n');
}

export function renderApprovalQueue(report: ActionCockpitReport): string {
  return [
    '# Approval Queue',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderApprovalList(report.approvalQueue),
    '',
    '## Approval Rules',
    renderList([
      'Never auto-approve.',
      'Human approval only.',
      ...manualApprovalRules,
    ]),
    '',
  ].join('\n');
}

export function renderRevenueSnapshotReport(report: ActionCockpitReport): string {
  return [
    '# Revenue Snapshot',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderRevenueSnapshot(report.revenueSnapshot),
    '',
    '## Source Of Truth',
    renderList([
      'Revenue Command Center is the source of truth.',
      'Booked MRR excludes demo, sample, sandbox, test, and example client records.',
      'No invented revenue.',
    ]),
    '',
  ].join('\n');
}

export function renderClientWatchlist(report: ActionCockpitReport): string {
  return [
    '# Client Watchlist',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderClientWatchlistBody(report),
    '',
    '## Rules',
    renderList(manualApprovalRules),
    '',
  ].join('\n');
}

export function renderFollowUpWatchlist(report: ActionCockpitReport): string {
  return [
    '# Follow-Up Watchlist',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderFollowUpList(report.followUpWatchlist),
    '',
    '## Manual Follow-Up Rules',
    renderList([
      'Manual follow-ups only.',
      'No automation.',
      'No CRM.',
      'No sending.',
      'Daniel must approve, send, and record any follow-up manually.',
    ]),
    '',
  ].join('\n');
}

export function renderSystemHealth(report: ActionCockpitReport): string {
  return [
    '# System Health',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Overall: ${report.systemHealth}`,
    '',
    '| Report Group | Status | Available | Missing |',
    '| --- | --- | ---: | ---: |',
    ...report.systemHealthGroups.map((group) => `| ${escapeTable(group.label)} | ${group.status} | ${group.availableReports.length} | ${group.missingReports.length} |`),
    '',
    '## Missing Reports',
    renderList(report.systemHealthGroups.flatMap((group) => group.missingReports.map((reportPath) => `${group.label}: ${reportPath}`))),
    '',
  ].join('\n');
}

function buildRevenueSnapshot(revenueReport: RevenueCommandCenterReport): CockpitRevenueSnapshot {
  return {
    bookedMrr: revenueReport.bookedMrr,
    projectedMrr: revenueReport.projectedExpectedMrr,
    auditOpportunities: revenueReport.auditOpportunities.length,
    retainerOpportunities: revenueReport.retainerOpportunities.length,
  };
}

function buildTopOpportunities(revenueReport: RevenueCommandCenterReport): CockpitOpportunity[] {
  const source = getRevenueSourceOfTruth();
  const retainerItems = revenueReport.retainerOpportunities.map(toOpportunity);
  const auditItems = revenueReport.auditOpportunities.map(toOpportunity);
  const unifiedOpportunity: CockpitOpportunity = {
    company: source.topLead,
    opportunityType: source.recommendedOffer,
    readiness: `Revenue decision: ${source.revenueDecision}; priority: ${source.executionPriority}`,
    nextStep: source.nextAction,
    revenuePotential: source.recommendedOffer,
    command: 'npm run revenue:recommendation',
    score: 1000,
  };

  return [unifiedOpportunity, ...retainerItems, ...auditItems]
    .sort((a, b) => b.score - a.score || a.company.localeCompare(b.company))
    .filter(uniqueCompany)
    .slice(0, 10);
}

function toOpportunity(opportunity: RetainerOpportunity | RevenuePriorityOpportunity): CockpitOpportunity {
  if ('lead' in opportunity) {
    return {
      company: opportunity.lead.companyName,
      opportunityType: opportunity.recommendedOffer,
      readiness: opportunity.probability,
      nextStep: opportunity.nextAction,
      revenuePotential: `${formatRange(opportunity.estimatedAuditValueRange)} one-time; ${formatRange(opportunity.estimatedMonthlyRange)}/month`,
      command: opportunity.suggestedCommand,
      score: opportunity.revenuePriorityScore,
    };
  }

  return {
    company: opportunity.company,
    opportunityType: opportunity.retainerType,
    readiness: opportunity.priority,
    nextStep: opportunity.nextAction,
    revenuePotential: `${formatRange(opportunity.estimatedMonthlyRange)}/month`,
    command: opportunity.suggestedCommand,
    score: opportunity.revenuePriorityScore,
  };
}

function buildTopActions(revenueReport: RevenueCommandCenterReport, opportunities: CockpitOpportunity[]): CockpitAction[] {
  const source = getRevenueSourceOfTruth();
  const unifiedAction: CockpitAction = {
    title: `Review ${source.topLead} package`,
    reason: `Revenue Intelligence source of truth: ${source.revenueDecision}; ${source.executionPriorityDetail}`,
    expectedOutcome: 'Move the unified top lead forward through manual review only.',
    command: 'npm run revenue:recommendation',
    approvalRequired: 'Daniel approval required before any external action. No outreach is sent.',
  };
  const revenueActions = revenueReport.topRevenueActions.map((action) => ({
    title: action.title,
    reason: action.reason,
    expectedOutcome: expectedOutcomeFor(action.title),
    command: action.suggestedCommand,
    approvalRequired: 'Daniel approval required before external action. No guarantee of conversion or revenue.',
  }));
  const opportunityActions = opportunities.map((opportunity) => ({
    title: `Advance ${opportunity.company}`,
    reason: `${opportunity.readiness}; ${opportunity.revenuePotential}; ${opportunity.nextStep}`,
    expectedOutcome: 'Prepare the next local asset or review step for a high-priority opportunity.',
    command: opportunity.command,
    approvalRequired: 'Daniel approval required before outreach, proposal, follow-up, SOW, or client-facing use.',
  }));

  return [unifiedAction, ...revenueActions, ...opportunityActions].filter(uniqueAction).slice(0, 6);
}

function buildApprovalQueue(
  revenueReport: RevenueCommandCenterReport,
  opportunities: CockpitOpportunity[],
  followUps: CockpitFollowUpItem[],
): CockpitApprovalItem[] {
  const followUpApprovals = followUps.map((item) => ({
    item: item.company,
    category: 'outreach review' as const,
    reason: item.reason,
    command: item.command,
    approvalRequired: 'Daniel must approve whether to follow up manually. Nothing is sent automatically.',
  }));
  const opportunityApprovals = opportunities.slice(0, 8).map((opportunity) => ({
    item: opportunity.company,
    category: approvalCategoryFor(opportunity.command, opportunity.nextStep),
    reason: `${opportunity.readiness}; ${opportunity.nextStep}`,
    command: opportunity.command,
    approvalRequired: 'Human approval only. Review scope, evidence, message, pricing, and next step before external action.',
  }));
  const revenueApprovals = revenueReport.bookedMrr === 0
    ? [{
        item: 'Booked revenue verification',
        category: 'revenue review' as const,
        reason: 'Revenue Command Center reports $0 booked MRR after demo/sample exclusions.',
        command: 'npm run revenue:daily',
        approvalRequired: 'Daniel must verify any real client before recording booked revenue.',
      }]
    : [];

  return [...followUpApprovals, ...opportunityApprovals, ...revenueApprovals].filter(uniqueApproval);
}

function buildFollowUpWatchlist(revenueReport: RevenueCommandCenterReport): CockpitFollowUpItem[] {
  const fromRevenue = revenueReport.auditOpportunities
    .filter((opportunity) => /follow-up/i.test(opportunity.nextAction) || /contact:review/.test(opportunity.suggestedCommand))
    .map((opportunity) => ({
      company: opportunity.lead.companyName,
      reason: opportunity.nextAction,
      recommendedTiming: inferTiming(opportunity.nextAction),
      command: opportunity.suggestedCommand,
    }));
  const fromMobile = parseMobileFollowUps(readFile('output/mobile-command-center/followup-queue-mobile.md'));

  return [...fromRevenue, ...fromMobile].filter(uniqueFollowUp).slice(0, 5);
}

function buildSystemHealthGroups(): CockpitSystemHealthGroup[] {
  return healthGroups.map((group) => {
    const availableReports = group.reports.filter(exists);
    const missingReports = group.reports.filter((reportPath) => !exists(reportPath));
    const status: ActionCockpitHealthStatus = missingReports.length === 0 ? 'GREEN' : availableReports.length === 0 ? 'RED' : 'YELLOW';
    return { label: group.label, status, availableReports, missingReports };
  });
}

function overallHealth(groups: CockpitSystemHealthGroup[]): ActionCockpitHealthStatus {
  if (groups.every((group) => group.status === 'GREEN')) return 'GREEN';
  if (groups.every((group) => group.status === 'RED')) return 'RED';
  return 'YELLOW';
}

function recommendNextCommand(actions: CockpitAction[], opportunities: CockpitOpportunity[], groups: CockpitSystemHealthGroup[]): string {
  const missingProposal = groups.find((group) => group.label === 'Proposal Center' && group.status !== 'GREEN');
  if (missingProposal && opportunities.some((opportunity) => /sow|proposal/i.test(opportunity.nextStep))) return 'npm run proposal:center';

  const missingClientReadiness = groups.find((group) => group.label === 'Client Readiness' && group.status !== 'GREEN');
  if (missingClientReadiness) return 'npm run client-readiness:pack';

  const missingFirstAudit = groups.find((group) => group.label === 'First Audit Workflow' && group.status !== 'GREEN');
  if (missingFirstAudit && opportunities.some((opportunity) => /audit/i.test(opportunity.nextStep))) return 'npm run first-audit:workflow';

  return actions[0]?.command ?? opportunities[0]?.command ?? 'npm run revenue:daily';
}

function parseMobileFollowUps(content: string): CockpitFollowUpItem[] {
  if (!content) return [];
  const lines = content.split('\n');
  const items: CockpitFollowUpItem[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].trim().match(/^\d+\.\s+(.+)$/);
    if (!match) continue;
    const nearby = lines.slice(index + 1, index + 6).map((line) => line.trim());
    const action = nearby.find((line) => line.startsWith('- Manual Action:'))?.replace('- Manual Action:', '').trim() ?? 'Review manual follow-up context.';
    const due = nearby.find((line) => line.startsWith('- Due:'))?.replace('- Due:', '').trim() ?? 'Manual date not set';
    items.push({
      company: match[1],
      reason: action,
      recommendedTiming: due,
      command: `npm run contact:review -- --id ${slugify(match[1])}`,
    });
  }

  return items;
}

function renderActionList(actions: CockpitAction[]): string {
  if (actions.length === 0) return '- No cockpit actions found.';
  return actions
    .map((action, index) => `${index + 1}. ${action.title}\n   - Reason: ${action.reason}\n   - Expected Outcome: ${action.expectedOutcome}\n   - Command: ${action.command}\n   - Approval: ${action.approvalRequired}`)
    .join('\n');
}

function renderOpportunityList(opportunities: CockpitOpportunity[]): string {
  if (opportunities.length === 0) return '- No top opportunities found.';
  return opportunities
    .map((opportunity, index) => `${index + 1}. ${opportunity.company}\n   - Type: ${opportunity.opportunityType}\n   - Readiness: ${opportunity.readiness}\n   - Next Step: ${opportunity.nextStep}\n   - Revenue Potential: ${opportunity.revenuePotential}`)
    .join('\n');
}

function renderRevenueSnapshot(snapshot: CockpitRevenueSnapshot): string {
  return [
    `- Booked MRR: ${formatCurrency(snapshot.bookedMrr)}`,
    `- Projected MRR: ${formatRange(snapshot.projectedMrr)}/month`,
    `- Audit Opportunities: ${snapshot.auditOpportunities}`,
    `- Retainer Opportunities: ${snapshot.retainerOpportunities}`,
    '- Source: Revenue Command Center',
  ].join('\n');
}

function renderClientWatchlistBody(report: ActionCockpitReport): string {
  return [
    '### Active',
    renderClientList(report.activeClients, 'No active commercial clients found.'),
    '',
    '### At Risk',
    renderClientList(report.atRiskClients, 'No at-risk commercial clients found.'),
    '',
    '### Paused',
    renderClientList(report.pausedClients, 'No paused commercial clients found.'),
    '',
    '### Renewal Watch',
    renderClientList(report.renewalWatch, 'No renewal watch clients found.'),
  ].join('\n');
}

function renderClientList(clients: Client[], emptyText: string): string {
  if (clients.length === 0) return `- ${emptyText}`;
  return clients.map((client) => `- ${client.companyName}: ${client.status}, ${client.serviceType}, ${formatCurrency(client.monthlyFee)}/month`).join('\n');
}

function renderFollowUpList(items: CockpitFollowUpItem[]): string {
  if (items.length === 0) return '- No manual follow-ups found.';
  return items
    .map((item, index) => `${index + 1}. ${item.company}\n   - Reason: ${item.reason}\n   - Recommended Timing: ${item.recommendedTiming}\n   - Command: ${item.command}`)
    .join('\n');
}

function renderApprovalList(items: CockpitApprovalItem[]): string {
  if (items.length === 0) return '- No approval queue items found.';
  return items
    .map((item, index) => `${index + 1}. ${item.item}\n   - Category: ${item.category}\n   - Reason: ${item.reason}\n   - Command: ${item.command}\n   - Approval Required: ${item.approvalRequired}`)
    .join('\n');
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function readContextSource(label: string, reportPath: string): ActionCockpitContextSource {
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

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function expectedOutcomeFor(title: string): string {
  if (/follow-up/i.test(title)) return 'Resolve the highest-priority manual follow-up decision.';
  if (/retainer/i.test(title)) return 'Move a high-fit retainer path into the next local review asset.';
  if (/audit/i.test(title)) return 'Prepare or review a first-audit path without external action.';
  return 'Move one verified local revenue action forward.';
}

function approvalCategoryFor(command: string, nextStep: string): CockpitApprovalItem['category'] {
  const text = `${command} ${nextStep}`.toLowerCase();
  if (text.includes('sow')) return 'SOW review';
  if (text.includes('proposal')) return 'proposal review';
  if (text.includes('audit')) return 'audit review';
  if (text.includes('onboard') || text.includes('client')) return 'client onboarding review';
  if (text.includes('contact') || text.includes('follow')) return 'outreach review';
  return 'revenue review';
}

function inferTiming(text: string): string {
  const dateMatch = text.match(/\d{4}-\d{2}-\d{2}/);
  if (dateMatch) return dateMatch[0];
  if (/follow-up/i.test(text)) return 'Review today; send manually only if Daniel approves.';
  return 'Manual timing not set.';
}

function isCommercialClient(client: Client): boolean {
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

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function uniqueCompany(opportunity: CockpitOpportunity, index: number, opportunities: CockpitOpportunity[]): boolean {
  return opportunities.findIndex((item) => item.company.toLowerCase() === opportunity.company.toLowerCase()) === index;
}

function uniqueAction(action: CockpitAction, index: number, actions: CockpitAction[]): boolean {
  return actions.findIndex((item) => item.title.toLowerCase() === action.title.toLowerCase()) === index;
}

function uniqueApproval(item: CockpitApprovalItem, index: number, items: CockpitApprovalItem[]): boolean {
  return items.findIndex((candidate) => `${candidate.item}-${candidate.category}`.toLowerCase() === `${item.item}-${item.category}`.toLowerCase()) === index;
}

function uniqueFollowUp(item: CockpitFollowUpItem, index: number, items: CockpitFollowUpItem[]): boolean {
  return items.findIndex((candidate) => candidate.company.toLowerCase() === item.company.toLowerCase()) === index;
}
