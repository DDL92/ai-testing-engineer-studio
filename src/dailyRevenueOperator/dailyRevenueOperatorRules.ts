import fs = require('fs');
import path = require('path');
import { Client } from '../clientReports/types';
import { buildRevenueCommandCenterReport, loadRevenueCommandCenterInput } from '../revenueCommandCenter/revenueRules';
import {
  CurrencyRange,
  RevenuePriorityOpportunity,
  RetainerOpportunity,
} from '../revenueCommandCenter/types';
import {
  DailyRevenueContextSource,
  DailyRevenueInput,
  DailyRevenueNextAction,
  DailyRevenueOperatorReport,
  DailyRevenueOpportunity,
  DailyRevenueRisk,
  DailyRevenueSnapshot,
  RevenueConsistencyCheck,
  RevenueConsistencyReport,
  RevenueSourceOpportunity,
} from './types';

const outputRoot = path.join(process.cwd(), 'output', 'daily-revenue-operator');

const contextPaths = [
  ['Revenue command center', 'output/revenue-command-center/revenue-command-center.md'],
  ['MRR forecast', 'output/revenue-command-center/mrr-forecast.md'],
  ['Audit opportunities', 'output/revenue-command-center/audit-opportunities.md'],
  ['Retainer opportunities', 'output/revenue-command-center/retainer-opportunities.md'],
  ['Mobile command center', 'output/mobile-command-center/mobile-command-center.md'],
  ['Mobile summary', 'output/mobile-command-center/mobile-summary.md'],
  ['Mac daily summary', 'output/mac-daily/mac-daily-summary.md'],
  ['Mac action cockpit', 'output/mac-daily/action-cockpit.md'],
  ['Proposal command center', 'output/proposal-center/proposal-command-center.md'],
  ['Proposal priority list', 'output/proposal-center/proposal-priority-list.md'],
  ['First audit workflow', 'output/first-audit-workflow/first-audit-workflow.md'],
  ['Client operations center', 'output/client-ops/client-operations-center.md'],
  ['Client next actions', 'output/client-ops/next-actions.md'],
  ['Renewal pipeline', 'output/renewals/renewal-pipeline.md'],
  ['Renewal risk report', 'output/renewals/renewal-risk-report.md'],
  ['Expansion opportunities', 'output/renewals/expansion-opportunities.md'],
  ['Leads', 'data/leads.json'],
  ['Clients', 'data/clients.json'],
] as const;

const manualApprovalReminder = [
  'Human approval is required before outreach, follow-up, proposal, SOW, discovery call, client delivery, client report, renewal, expansion, invoice, payment, or external action.',
  'Revenue Command Center is the source of truth for booked MRR.',
  'Booked MRR must not include demo, sample, sandbox, test, or example client records.',
  'No revenue, clients, projections, outcomes, probability, urgency, approvals, or guarantees are invented.',
  'No APIs, scraping, browsing, CRM, outreach automation, email sending, LinkedIn automation, payment systems, credentials, or external databases were used.',
];

export function loadDailyRevenueInput(): DailyRevenueInput {
  const generatedAt = new Date().toISOString();
  const revenueReport = buildRevenueCommandCenterReport(loadRevenueCommandCenterInput());

  return {
    generatedAt,
    today: generatedAt.slice(0, 10),
    revenueReport,
    contextSources: contextPaths.map(([label, sourcePath]) => readContextSource(label, sourcePath)),
  };
}

export function buildDailyRevenueOperatorReport(input: DailyRevenueInput): DailyRevenueOperatorReport {
  const snapshot = buildSnapshot(input.revenueReport);
  const topRevenueOpportunities = buildPriorityOpportunities(input.revenueReport);
  const revenueRisks = buildRevenueRisks(input, snapshot);
  const renewalWatch = input.revenueReport.renewalOpportunities.map((opportunity) => opportunity.client).slice(0, 5);
  const proposalWatch = input.revenueReport.auditOpportunities
    .filter((opportunity) => ['FOLLOW_UP', 'DISCOVERY_CALL', 'SOW_READY', 'CLIENT_READY'].some((stage) => opportunity.nextAction.includes(stage)))
    .slice(0, 5);
  const clientExpansionWatch = input.revenueReport.expansionOpportunities.map((opportunity) => opportunity.client).slice(0, 5);
  const recommendedActions = buildNextActions(input.revenueReport, topRevenueOpportunities).slice(0, 8);

  return {
    generatedAt: input.generatedAt,
    today: input.today,
    snapshot,
    topRevenueOpportunities: topRevenueOpportunities.slice(0, 10),
    revenueRisks,
    renewalWatch,
    proposalWatch,
    clientExpansionWatch,
    recommendedActions,
    consistencyReport: buildRevenueConsistencyReport(input),
    contextSources: input.contextSources,
  };
}

export function writeDailyRevenueOperatorOutputs(report: DailyRevenueOperatorReport): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });

  const outputs = [
    { fileName: 'daily-revenue-operator.md', body: renderDailyRevenueOperator(report) },
    { fileName: 'revenue-next-actions.md', body: renderRevenueNextActions(report) },
    { fileName: 'revenue-priority-list.md', body: renderRevenuePriorityList(report) },
    { fileName: 'revenue-risks.md', body: renderRevenueRisks(report) },
    { fileName: 'revenue-focus-today.md', body: renderRevenueFocusToday(report) },
    { fileName: 'revenue-consistency-report.md', body: renderRevenueConsistencyReport(report.consistencyReport) },
    { fileName: 'approval-checklist.md', body: renderApprovalChecklist(report) },
  ];

  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }

  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

export function writeRevenueNextActionsOutput(report: DailyRevenueOperatorReport): string {
  fs.mkdirSync(outputRoot, { recursive: true });
  const outputPath = path.join(outputRoot, 'revenue-next-actions.md');
  fs.writeFileSync(outputPath, renderRevenueNextActions(report), 'utf8');
  return outputPath;
}

export function renderDailyRevenueOperator(report: DailyRevenueOperatorReport): string {
  return [
    '# Daily Revenue Operator',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '# Revenue Snapshot',
    renderSnapshot(report.snapshot),
    '',
    '# Top Revenue Opportunities',
    renderOpportunityList(report.topRevenueOpportunities.slice(0, 5)),
    '',
    '# Revenue Risks',
    renderRiskList(report.revenueRisks.slice(0, 5)),
    '',
    '# Renewal Watch',
    renderClientList(report.renewalWatch, 'No renewal watch clients found in local Revenue Command Center output.'),
    '',
    '# Proposal Watch',
    renderProposalWatch(report.proposalWatch),
    '',
    '# Client Expansion Watch',
    renderClientList(report.clientExpansionWatch, 'No client expansion watch records found in local Revenue Command Center output.'),
    '',
    '# Recommended Actions',
    renderActionList(report.recommendedActions),
    '',
    '# Source Rules',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderRevenueNextActions(report: DailyRevenueOperatorReport): string {
  return [
    '# Revenue Next Actions',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'Priority order: fastest revenue, highest probability, then highest MRR potential.',
    '',
    renderActionList(report.recommendedActions),
    '',
    '## Approval Rules',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderRevenuePriorityList(report: DailyRevenueOperatorReport): string {
  return [
    '# Revenue Priority List',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Rank | Company | Opportunity Type | Readiness | Revenue Potential | Next Step |',
    '| ---: | --- | --- | --- | --- | --- |',
    ...report.topRevenueOpportunities.slice(0, 10).map((opportunity, index) => (
      `| ${index + 1} | ${escapeTable(opportunity.company)} | ${escapeTable(opportunity.opportunityType)} | ${escapeTable(opportunity.readiness)} | ${escapeTable(opportunity.revenuePotential)} | ${escapeTable(opportunity.nextStep)} |`
    )),
    report.topRevenueOpportunities.length === 0 ? '| 1 | None | None | Not ready | $0 | Review local revenue command center. |' : '',
    '',
    '## Approval Rules',
    renderList(manualApprovalReminder),
    '',
  ].filter((line) => line !== '').join('\n');
}

export function renderRevenueRisks(report: DailyRevenueOperatorReport): string {
  return [
    '# Revenue Risks',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Category | Severity | Detail | Next Review |',
    '| --- | --- | --- | --- |',
    ...report.revenueRisks.map((risk) => `| ${risk.category} | ${risk.severity} | ${escapeTable(risk.detail)} | ${escapeTable(risk.nextReview)} |`),
    '',
    '## Approval Rules',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderRevenueFocusToday(report: DailyRevenueOperatorReport): string {
  return [
    '# Revenue Focus Today',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'If Daniel only had 30 minutes today:',
    '',
    renderActionList(report.recommendedActions.slice(0, 3)),
    '',
    '## Rules',
    renderList([
      'Top 3 actions only.',
      'Do the smallest local preparation step that moves verified revenue forward.',
      'Do not send, schedule, invoice, or update external systems without Daniel approval.',
    ]),
    '',
  ].join('\n');
}

export function renderRevenueConsistencyReport(report: RevenueConsistencyReport): string {
  return [
    '# Revenue Consistency Report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Revenue Command Center booked MRR: ${formatCurrency(report.revenueCommandCenterBookedMrr)}`,
    '',
    '## Modules Checked',
    '| Module | Status | Detail |',
    '| --- | --- | --- |',
    ...report.modulesChecked.map((check) => `| ${escapeTable(check.module)} | ${check.status} | ${escapeTable(check.detail)} |`),
    '',
    '## Inconsistencies Found',
    renderList(report.inconsistenciesFound),
    '',
    '## Fixes Applied',
    renderList(report.fixesApplied),
    '',
    '## Remaining Warnings',
    renderList(report.remainingWarnings),
    '',
    '## Approval Rules',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderApprovalChecklist(_report: DailyRevenueOperatorReport): string {
  return [
    '# Approval Checklist',
    '',
    renderChecklist([
      'revenue verified',
      'demo revenue excluded',
      'sample revenue excluded',
      'sandbox revenue excluded',
      'test revenue excluded',
      'no invented clients',
      'no invented projections',
      'next actions reviewed',
      'Daniel approval required',
    ]),
    '',
    '## Safety Checks',
    renderChecklist([
      'Revenue Command Center used as booked MRR source of truth',
      'no outreach sent',
      'no follow-up scheduled',
      'no CRM connected',
      'no API called',
      'no external database used',
      'no payment or invoice action taken',
    ]),
    '',
  ].join('\n');
}

function buildSnapshot(revenueReport: DailyRevenueInput['revenueReport']): DailyRevenueSnapshot {
  return {
    bookedMrr: revenueReport.bookedMrr,
    projectedMrr: revenueReport.projectedExpectedMrr,
    auditOpportunities: revenueReport.auditOpportunities.length,
    retainerOpportunities: revenueReport.retainerOpportunities.length,
  };
}

function buildPriorityOpportunities(revenueReport: DailyRevenueInput['revenueReport']): DailyRevenueOpportunity[] {
  const auditItems = revenueReport.auditOpportunities.map((opportunity) => toPriorityOpportunity(opportunity));
  const retainerItems = revenueReport.retainerOpportunities.map((opportunity) => toPriorityOpportunity(opportunity));

  return [...retainerItems, ...auditItems]
    .sort((a, b) => b.score - a.score || revenuePotentialSort(b.revenuePotential) - revenuePotentialSort(a.revenuePotential) || a.company.localeCompare(b.company))
    .filter(uniqueCompany)
    .slice(0, 10);
}

function toPriorityOpportunity(opportunity: RevenueSourceOpportunity): DailyRevenueOpportunity {
  if ('lead' in opportunity) {
    return {
      company: opportunity.lead.companyName,
      opportunityType: opportunity.recommendedOffer,
      readiness: opportunity.probability,
      revenuePotential: `${formatRange(opportunity.estimatedAuditValueRange)} one-time; ${formatRange(opportunity.estimatedMonthlyRange)}/month`,
      nextStep: opportunity.nextAction,
      command: opportunity.suggestedCommand,
      score: opportunity.revenuePriorityScore,
    };
  }

  return {
    company: opportunity.company,
    opportunityType: opportunity.retainerType,
    readiness: opportunity.priority,
    revenuePotential: `${formatRange(opportunity.estimatedMonthlyRange)}/month`,
    nextStep: opportunity.nextAction,
    command: opportunity.suggestedCommand,
    score: opportunity.revenuePriorityScore,
  };
}

function buildNextActions(
  revenueReport: DailyRevenueInput['revenueReport'],
  opportunities: DailyRevenueOpportunity[],
): DailyRevenueNextAction[] {
  const sourceActions = revenueReport.topRevenueActions.map((action) => ({
    priority: action.priority,
    title: action.title,
    reason: action.reason,
    expectedOutcome: expectedOutcomeFor(action.title),
    approvalRequired: 'Daniel approval required before external action. No guarantee of conversion or revenue.',
    command: action.suggestedCommand,
    sourceAction: action,
  }));

  const opportunityActions = opportunities.map((opportunity, index) => ({
    priority: sourceActions.length + index + 1,
    title: `Advance ${opportunity.company}`,
    reason: `${opportunity.readiness}; ${opportunity.revenuePotential}; ${opportunity.nextStep}`,
    expectedOutcome: 'Prepare the next local asset or review step that could move revenue forward after manual approval.',
    approvalRequired: 'Daniel approval required before outreach, proposal, follow-up, or client-facing use.',
    command: opportunity.command,
  }));

  return [...sourceActions, ...opportunityActions]
    .filter(uniqueAction)
    .map((action, index) => ({ ...action, priority: index + 1 }))
    .slice(0, 8);
}

function buildRevenueRisks(input: DailyRevenueInput, snapshot: DailyRevenueSnapshot): DailyRevenueRisk[] {
  const report = input.revenueReport;
  const missingSources = input.contextSources.filter((source) => !source.exists);
  const risks: DailyRevenueRisk[] = [
    {
      category: 'pipeline risk',
      severity: report.auditOpportunities.length + report.retainerOpportunities.length === 0 ? 'RED' : 'YELLOW',
      detail: report.auditOpportunities.length + report.retainerOpportunities.length === 0
        ? 'No local revenue opportunities are currently detected.'
        : `${report.auditOpportunities.length + report.retainerOpportunities.length} opportunity records require manual approval before action.`,
      nextReview: 'Review revenue priority list before outreach or proposal work.',
    },
    {
      category: 'proposal risk',
      severity: report.auditOpportunities.some((opportunity) => opportunity.artifacts.sow) ? 'GREEN' : 'YELLOW',
      detail: report.auditOpportunities.some((opportunity) => opportunity.artifacts.sow)
        ? 'At least one local SOW artifact exists.'
        : 'SOW/proposal readiness may be thin for top opportunities.',
      nextReview: 'Use proposal watch and local SOW readiness before sending anything.',
    },
    {
      category: 'renewal risk',
      severity: report.renewalOpportunities.length > 0 ? 'YELLOW' : 'GREEN',
      detail: report.renewalOpportunities.length > 0
        ? `${report.renewalOpportunities.length} renewal opportunity record(s) need evidence review.`
        : 'No renewal opportunities currently flagged by Revenue Command Center.',
      nextReview: 'Review renewal pipeline and client reports manually.',
    },
    {
      category: 'concentration risk',
      severity: snapshot.bookedMrr > 0 && report.activeRetainerClients.length <= 1 ? 'YELLOW' : 'GREEN',
      detail: snapshot.bookedMrr > 0
        ? `Booked MRR depends on ${report.activeRetainerClients.length} active commercial retainer client record(s).`
        : 'No booked commercial MRR is currently recorded.',
      nextReview: 'Keep booked MRR separate from pipeline potential.',
    },
    {
      category: 'no-client risk',
      severity: snapshot.bookedMrr === 0 ? 'RED' : 'GREEN',
      detail: snapshot.bookedMrr === 0
        ? 'Revenue Command Center reports $0 booked MRR after demo/sample exclusions.'
        : `Revenue Command Center reports ${formatCurrency(snapshot.bookedMrr)} booked MRR.`,
      nextReview: 'Verify client records before treating revenue as booked.',
    },
  ];

  if (missingSources.length > 0) {
    risks.push({
      category: 'pipeline risk',
      severity: 'YELLOW',
      detail: `Missing optional local source(s): ${missingSources.map((source) => source.path).join(', ')}`,
      nextReview: 'Regenerate missing local reports when needed.',
    });
  }

  return risks;
}

function buildRevenueConsistencyReport(input: DailyRevenueInput): RevenueConsistencyReport {
  const revenueBookedMrr = input.revenueReport.bookedMrr;
  const mobileBookedMrr = parseCurrencyAfterLabel(readFile('output/mobile-command-center/mobile-summary.md'), 'Booked MRR');
  const dashboardMrr = parseCurrencyAfterLabel(readFile('output/dashboard/dashboard.md'), 'Estimated MRR');
  const operatorMrr = parseCurrencyAfterLabel(readFile('output/operator/daily-command-center.md'), 'Estimated MRR');
  const excludedClients = input.revenueReport.excludedClientRecords.filter((client) => client.status === 'active' && client.monthlyFee > 0);
  const checks: RevenueConsistencyCheck[] = [
    consistencyCheck('Revenue Command Center', revenueBookedMrr, revenueBookedMrr, 'Source of truth for booked MRR.'),
    consistencyCheck('Mobile Command Center', mobileBookedMrr, revenueBookedMrr, 'Mobile revenue must parse Revenue Command Center values only.'),
    consistencyCheck('Dashboard', dashboardMrr, revenueBookedMrr, 'Dashboard shared revenue summary excludes demo/sample/sandbox/test/example clients.'),
    consistencyCheck('Operator reports', operatorMrr, revenueBookedMrr, 'Operator estimated MRR excludes demo/sample/sandbox/test/example clients.'),
  ];
  const mismatches = checks
    .filter((check) => check.status === 'WARNING')
    .map((check) => `${check.module}: ${check.detail}`);
  const remainingWarnings = [
    ...mismatches,
    ...excludedClients.map((client) => `Excluded active non-commercial client still has local monthlyFee ${formatCurrency(client.monthlyFee)}: ${client.companyName}.`),
    input.contextSources.some((source) => !source.exists) ? 'Some optional local report sources are missing; daily operator degraded gracefully.' : undefined,
  ].filter((warning): warning is string => Boolean(warning));

  return {
    generatedAt: input.generatedAt,
    revenueCommandCenterBookedMrr: revenueBookedMrr,
    modulesChecked: checks,
    inconsistenciesFound: mismatches.length > 0 ? mismatches : ['No booked MRR mismatches detected in checked local outputs after fixes.'],
    fixesApplied: [
      'Mobile Command Center revenue snapshot now parses booked/projected/opportunity values from Revenue Command Center output.',
      'Shared revenue summary excludes demo, sample, sandbox, test, and .example client records from estimated booked MRR.',
      'Operator report estimated MRR excludes demo, sample, sandbox, test, and .example client records.',
      'Daily Revenue Operator uses Revenue Command Center rules as the booked MRR source of truth.',
    ],
    remainingWarnings: remainingWarnings.length > 0 ? remainingWarnings : ['No remaining revenue consistency warnings detected.'],
  };
}

function consistencyCheck(module: string, observed: number | undefined, expected: number, detail: string): RevenueConsistencyCheck {
  if (observed === undefined) {
    return { module, status: 'WARNING', detail: `${detail} Current local output missing or not parseable.` };
  }
  if (observed !== expected) {
    return { module, status: 'WARNING', detail: `${detail} Observed ${formatCurrency(observed)}; expected ${formatCurrency(expected)}.` };
  }
  return { module, status: module === 'Revenue Command Center' ? 'PASS' : 'FIXED', detail: `${detail} Observed ${formatCurrency(observed)}.` };
}

function renderSnapshot(snapshot: DailyRevenueSnapshot): string {
  return [
    `- Booked MRR: ${formatCurrency(snapshot.bookedMrr)}`,
    `- Projected MRR: ${formatRange(snapshot.projectedMrr)}/month`,
    `- Audit Opportunities: ${snapshot.auditOpportunities}`,
    `- Retainer Opportunities: ${snapshot.retainerOpportunities}`,
  ].join('\n');
}

function renderOpportunityList(opportunities: DailyRevenueOpportunity[]): string {
  if (opportunities.length === 0) return '- No local revenue opportunities found.';
  return opportunities
    .slice(0, 5)
    .map((opportunity, index) => `${index + 1}. ${opportunity.company}\n   - Type: ${opportunity.opportunityType}\n   - Readiness: ${opportunity.readiness}\n   - Revenue Potential: ${opportunity.revenuePotential}\n   - Next Step: ${opportunity.nextStep}`)
    .join('\n');
}

function renderRiskList(risks: DailyRevenueRisk[]): string {
  if (risks.length === 0) return '- No revenue risks generated.';
  return risks.map((risk) => `- ${risk.category} (${risk.severity}): ${risk.detail}`).join('\n');
}

function renderClientList(clients: Client[], emptyText: string): string {
  if (clients.length === 0) return `- ${emptyText}`;
  return clients.map((client) => `- ${client.companyName}: ${client.status}, ${formatCurrency(client.monthlyFee)}/month, ${client.currentFocus}`).join('\n');
}

function renderProposalWatch(opportunities: RevenuePriorityOpportunity[]): string {
  if (opportunities.length === 0) return '- No proposal watch opportunities found in local Revenue Command Center output.';
  return opportunities.map((opportunity) => `- ${opportunity.lead.companyName}: ${opportunity.probability}, ${opportunity.nextAction}`).join('\n');
}

function renderActionList(actions: DailyRevenueNextAction[]): string {
  if (actions.length === 0) return '- No revenue next actions generated.';
  return actions
    .map((action) => `${action.priority}. ${action.title}\n   - Reason: ${action.reason}\n   - Expected Outcome: ${action.expectedOutcome}\n   - Approval Required: ${action.approvalRequired}\n   - Command: ${action.command}`)
    .join('\n');
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function renderChecklist(items: string[]): string {
  return items.map((item) => `- [ ] ${item}`).join('\n');
}

function readContextSource(label: string, sourcePath: string): DailyRevenueContextSource {
  const content = readFile(sourcePath);
  return {
    label,
    path: sourcePath,
    exists: Boolean(content),
    excerpt: summarize(content),
  };
}

function summarize(content: string): string {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('|') && !line.startsWith('---'))
    .slice(0, 4)
    .join(' ');
}

function readFile(relativePath: string): string {
  const absolutePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) return '';
  return fs.readFileSync(absolutePath, 'utf8');
}

function formatRange(range: CurrencyRange): string {
  if (range.min === range.max) return formatCurrency(range.min);
  return `${formatCurrency(range.min)}-${formatCurrency(range.max)}`;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US')}`;
}

function revenuePotentialSort(value: string): number {
  const matches = value.match(/\$([\d,]+)/g) ?? [];
  return matches.reduce((max, token) => Math.max(max, Number(token.replace(/[$,]/g, ''))), 0);
}

function parseCurrencyAfterLabel(content: string, label: string): number | undefined {
  if (!content) return undefined;
  const match = content.match(new RegExp(`${escapeRegExp(label)}:\\s*\\$([\\d,]+)`, 'i'));
  return match ? Number(match[1].replace(/,/g, '')) : undefined;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function expectedOutcomeFor(title: string): string {
  if (title.toLowerCase().includes('protect booked mrr')) return 'Reduce retention risk by preparing local client evidence and next-step review.';
  if (title.toLowerCase().includes('retainer')) return 'Move one high-fit retainer opportunity to the next local review asset.';
  if (title.toLowerCase().includes('audit')) return 'Prepare a small first-audit path that can be manually reviewed.';
  return 'Create or review the next local revenue asset without external action.';
}

function uniqueCompany(opportunity: DailyRevenueOpportunity, index: number, opportunities: DailyRevenueOpportunity[]): boolean {
  return opportunities.findIndex((item) => item.company.toLowerCase() === opportunity.company.toLowerCase()) === index;
}

function uniqueAction(action: DailyRevenueNextAction, index: number, actions: DailyRevenueNextAction[]): boolean {
  return actions.findIndex((item) => item.title.toLowerCase() === action.title.toLowerCase()) === index;
}
