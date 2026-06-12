import fs = require('fs');
import path = require('path');
import { Client } from '../clientReports/types';
import { Lead } from '../leads/types';
import {
  MobileAction,
  MobileClientStatus,
  MobileCommandCenterInput,
  MobileCommandCenterReport,
  MobileContextSource,
  MobileFollowUpItem,
  MobileOpportunity,
  MobileReportGroupHealth,
  MobileRevenueSnapshot,
  MobileSystemHealthStatus,
} from './types';

const outputRoot = path.join(process.cwd(), 'output', 'mobile-command-center');

const sourceReportGroups = [
  {
    label: 'Mac Daily',
    reports: [
      'output/mac-daily/mac-daily-summary.md',
      'output/mac-daily/action-cockpit.md',
      'output/mac-daily/system-health.md',
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
    label: 'Proposal Center',
    reports: [
      'output/proposal-center/proposal-command-center.md',
      'output/proposal-center/proposal-priority-list.md',
      'output/proposal-center/sow-readiness-report.md',
      'output/proposal-center/approval-checklist.md',
    ],
  },
  {
    label: 'Outreach Execution',
    reports: [
      'output/outreach-execution/outreach-execution-pack.md',
      'output/outreach-execution/follow-up-plan.md',
      'output/outreach-execution/approval-checklist.md',
    ],
  },
  {
    label: 'Client Ops',
    reports: [
      'output/client-ops/client-operations-center.md',
      'output/client-ops/next-actions.md',
      'output/client-ops/client-readiness.md',
    ],
  },
];

const manualApprovalReminder = [
  'Human approval is required before outreach, follow-up, proposal, SOW, discovery call, client delivery, client report, renewal, expansion, invoice, payment, or external action.',
  'This mobile command center is local report generation only.',
  'No APIs, scraping, browsing, CRM, outreach automation, email sending, LinkedIn automation, external databases, credentials, payments, push notifications, PWA, mobile app, or web dashboard were used.',
  'Follow-up queue items are manual review items only. Nothing is scheduled or sent.',
  'Revenue opportunities and projected MRR are not booked revenue.',
];

export function loadMobileCommandCenterInput(): MobileCommandCenterInput {
  const generatedAt = new Date().toISOString();
  const contextPaths = [
    ...sourceReportGroups.flatMap((group) => group.reports.map((reportPath) => ({ label: `${group.label}: ${path.basename(reportPath)}`, path: reportPath }))),
    { label: 'Leads', path: 'data/leads.json' },
    { label: 'Clients', path: 'data/clients.json' },
  ];

  return {
    generatedAt,
    today: generatedAt.slice(0, 10),
    leads: readJson<Lead[]>('data/leads.json', []),
    clients: readJson<Client[]>('data/clients.json', []),
    contextSources: contextPaths.map((source) => readContextSource(source.label, source.path)),
  };
}

export function buildMobileCommandCenterReport(input: MobileCommandCenterInput): MobileCommandCenterReport {
  const reportGroups = buildReportGroupHealth();

  return {
    generatedAt: input.generatedAt,
    today: input.today,
    topActions: buildTopActions(input).slice(0, 5),
    topOpportunities: buildTopOpportunities(input).slice(0, 5),
    revenueSnapshot: buildRevenueSnapshot(input),
    clientStatus: buildClientStatus(input.clients),
    followUpQueue: buildFollowUpQueue(input).slice(0, 5),
    approvalsNeeded: manualApprovalReminder,
    systemHealth: overallHealth(reportGroups),
    reportGroups,
    contextSources: input.contextSources,
  };
}

export function writeMobileCommandCenterOutputs(report: MobileCommandCenterReport): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });

  const outputs = [
    { fileName: 'mobile-command-center.md', body: renderMobileCommandCenter(report) },
    { fileName: 'mobile-summary.md', body: renderMobileSummary(report) },
    { fileName: 'top-actions-mobile.md', body: renderTopActionsMobile(report) },
    { fileName: 'top-opportunities-mobile.md', body: renderTopOpportunitiesMobile(report) },
    { fileName: 'revenue-mobile.md', body: renderRevenueMobile(report) },
    { fileName: 'client-status-mobile.md', body: renderClientStatusMobile(report) },
    { fileName: 'followup-queue-mobile.md', body: renderFollowUpQueueMobile(report) },
  ];

  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }

  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

export function writeMobileSummaryOutput(report: MobileCommandCenterReport): string {
  fs.mkdirSync(outputRoot, { recursive: true });
  const outputPath = path.join(outputRoot, 'mobile-summary.md');
  fs.writeFileSync(outputPath, renderMobileSummary(report), 'utf8');
  return outputPath;
}

export function renderMobileCommandCenter(report: MobileCommandCenterReport): string {
  return [
    '# Today',
    '',
    `Generated: ${report.generatedAt}`,
    `System Health: ${report.systemHealth}`,
    '',
    '## Top 5 Actions',
    renderActionList(report.topActions),
    '',
    '## Top 5 Opportunities',
    renderOpportunityList(report.topOpportunities),
    '',
    '## Revenue Snapshot',
    renderRevenueSnapshot(report.revenueSnapshot),
    '',
    '## Client Status',
    renderClientStatus(report.clientStatus),
    '',
    '## Follow-Up Queue',
    renderFollowUpQueue(report.followUpQueue),
    '',
    '## Approvals Needed',
    renderList(report.approvalsNeeded),
    '',
    '## System Health',
    renderSystemHealth(report),
    '',
  ].join('\n');
}

export function renderMobileSummary(report: MobileCommandCenterReport): string {
  const firstAction = report.topActions[0]?.title ?? 'No top action found in local data.';
  const firstOpportunity = report.topOpportunities[0]?.company ?? 'No opportunity found in local data.';

  return [
    '# Mobile Summary',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `- System Health: ${report.systemHealth}`,
    `- First Action: ${firstAction}`,
    `- First Opportunity: ${firstOpportunity}`,
    `- Booked MRR: ${formatCurrency(report.revenueSnapshot.bookedMrr)}`,
    `- Projected MRR: ${report.revenueSnapshot.projectedMrr}`,
    `- Manual Follow-Ups: ${report.followUpQueue.length}`,
    `- Active Clients: ${report.clientStatus.active}`,
    '',
    '## Approval Gate',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderTopActionsMobile(report: MobileCommandCenterReport): string {
  return [
    '# Top Actions Mobile',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderActionList(report.topActions),
    '',
    '## Approval Gate',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderTopOpportunitiesMobile(report: MobileCommandCenterReport): string {
  return [
    '# Top Opportunities Mobile',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderOpportunityList(report.topOpportunities),
    '',
    '## Approval Gate',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderRevenueMobile(report: MobileCommandCenterReport): string {
  return [
    '# Revenue Mobile',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderRevenueSnapshot(report.revenueSnapshot),
    '',
    '## Revenue Rules',
    renderList([
      'Booked MRR comes only from the local Revenue Command Center report.',
      'Projected MRR is displayed only when the local Revenue Command Center report contains it; otherwise it is marked unavailable.',
      'Audit and retainer opportunity counts are sourced from the local Revenue Command Center report and are not booked revenue.',
      'Do not invent revenue.',
    ]),
    '',
    '## Approval Gate',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderClientStatusMobile(report: MobileCommandCenterReport): string {
  return [
    '# Client Status Mobile',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderClientStatus(report.clientStatus),
    '',
    '## Approval Gate',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderFollowUpQueueMobile(report: MobileCommandCenterReport): string {
  return [
    '# Follow-Up Queue Mobile',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderFollowUpQueue(report.followUpQueue),
    '',
    '## Manual Queue Rules',
    renderList([
      'Manual queue only.',
      'No follow-up is scheduled automatically.',
      'No outreach is sent.',
      'No CRM is updated.',
      'Daniel must approve, send, and record any follow-up manually.',
    ]),
    '',
    '## Approval Gate',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

function buildTopActions(input: MobileCommandCenterInput): MobileAction[] {
  const reportActions = [
    ...extractNumberedSectionActions('output/mac-daily/action-cockpit.md', 'Top 5 Actions', 'Mac Daily Action Cockpit'),
    ...extractNumberedSectionActions('output/client-ops/client-operations-center.md', "Today's Operating Priorities", 'Client Operations Center'),
  ];
  const leadActions = activeLeads(input.leads)
    .sort(sortLeadsByScore)
    .map((lead) => ({
      title: `${lead.companyName}: ${lead.nextAction || 'Review local opportunity and decide the next manual step.'}`,
      source: 'data/leads.json',
      command: commandForLead(lead),
      approvalRequired: 'Human approval required before external action.',
    }));

  return uniqueActions([...reportActions, ...leadActions]).slice(0, 5);
}

function buildTopOpportunities(input: MobileCommandCenterInput): MobileOpportunity[] {
  const reportOpportunities = extractNumberedSectionOpportunities('output/mac-daily/action-cockpit.md', 'Top 5 Opportunities');
  const leadOpportunities = activeLeads(input.leads)
    .sort(sortLeadsByScore)
    .map((lead) => ({
      company: lead.companyName,
      score: lead.score,
      status: lead.status,
      recommendedOffer: lead.recommendedOffer,
      nextAction: lead.nextAction || 'Review local opportunity and approve the next manual step.',
      source: 'data/leads.json',
    }));

  return uniqueOpportunities([...reportOpportunities, ...leadOpportunities]).slice(0, 5);
}

function buildRevenueSnapshot(input: MobileCommandCenterInput): MobileRevenueSnapshot {
  const activeMonthlyClients = input.clients.filter((client) => client.status === 'active' && isMonthlyService(client.serviceType));
  const localClientMrr = activeMonthlyClients.reduce((sum, client) => sum + safeNumber(client.monthlyFee), 0);
  const revenueReport = readFile('output/revenue-command-center/revenue-command-center.md');
  const bookedMrr = parseBookedMrr(revenueReport) ?? 0;
  const projectedMrr = parseProjectedMrr(revenueReport) ?? 'Unavailable from local revenue reports';
  const auditOpportunityCount = parseReportCount(revenueReport, 'Audit opportunities reviewed') ?? 0;
  const retainerOpportunityCount = parseReportCount(revenueReport, 'Retainer opportunities reviewed') ?? 0;
  const consistencyWarnings = [
    revenueReport ? undefined : 'Revenue Command Center report is missing; mobile revenue values are unavailable until npm run revenue:command-center is generated.',
    revenueReport && localClientMrr !== bookedMrr
      ? `Local active monthly client total is ${formatCurrency(localClientMrr)}, but mobile displays Revenue Command Center booked MRR ${formatCurrency(bookedMrr)}. Demo/sample/sandbox/test clients must stay excluded from booked revenue.`
      : undefined,
  ].filter((warning): warning is string => Boolean(warning));

  return {
    bookedMrr,
    projectedMrr,
    auditOpportunities: auditOpportunityCount,
    retainerOpportunities: retainerOpportunityCount,
    revenueSource: revenueReport ? 'output/revenue-command-center/revenue-command-center.md' : 'Revenue Command Center report missing',
    consistencyWarnings,
  };
}

function buildClientStatus(clients: Client[]): MobileClientStatus {
  const active = clients.filter((client) => client.status === 'active').length;
  const paused = clients.filter((client) => client.status === 'paused').length;
  const completed = clients.filter((client) => client.status === 'completed').length;
  const pending = clients.filter((client) => !['active', 'paused', 'completed'].includes(client.status)).length;
  const notes = [
    'Pending means a local client record is not active, paused, or completed.',
    'Client actions remain local planning items until Daniel approves external use.',
  ];

  return { active, pending, paused, completed, notes };
}

function buildFollowUpQueue(input: MobileCommandCenterInput): MobileFollowUpItem[] {
  const reportItems = [
    ...extractFollowUpReportItems('output/mac-daily/action-cockpit.md'),
    ...extractFollowUpReportItems('output/outreach-execution/follow-up-plan.md'),
  ];
  const leadItems = activeLeads(input.leads)
    .filter((lead) => lead.outreachStatus === 'follow-up-needed' || Boolean(lead.nextFollowUpDate))
    .sort((a, b) => (a.nextFollowUpDate ?? '9999-12-31').localeCompare(b.nextFollowUpDate ?? '9999-12-31') || sortLeadsByScore(a, b))
    .map((lead) => ({
      company: lead.companyName,
      dueDate: lead.nextFollowUpDate ?? 'Manual date not set',
      channel: lead.outreachChannel ?? 'manual-review',
      action: lead.nextAction || 'Review follow-up context manually.',
      source: 'data/leads.json',
    }));

  return uniqueFollowUps([...leadItems, ...reportItems]).slice(0, 5);
}

function buildReportGroupHealth(): MobileReportGroupHealth[] {
  return sourceReportGroups.map((group) => {
    const availableReports = group.reports.filter(exists);
    const missingReports = group.reports.filter((reportPath) => !exists(reportPath));
    const status: MobileSystemHealthStatus = missingReports.length === 0 ? 'GREEN' : availableReports.length === 0 ? 'RED' : 'YELLOW';
    return { label: group.label, status, availableReports, missingReports };
  });
}

function overallHealth(groups: MobileReportGroupHealth[]): MobileSystemHealthStatus {
  if (groups.every((group) => group.status === 'GREEN')) return 'GREEN';
  if (groups.every((group) => group.status === 'RED')) return 'RED';
  return 'YELLOW';
}

function extractNumberedSectionActions(relativePath: string, heading: string, source: string): MobileAction[] {
  return extractNumberedSection(relativePath, heading).map((line) => ({
    title: cleanNumberedLine(line),
    source,
    command: extractCommandNear(relativePath, line) ?? 'Review local command center output manually.',
    approvalRequired: 'Human approval required before external action.',
  }));
}

function extractNumberedSectionOpportunities(relativePath: string, heading: string): MobileOpportunity[] {
  return extractNumberedSection(relativePath, heading).map((line) => {
    const clean = cleanNumberedLine(line);
    const company = clean.split(' - ')[0]?.trim() || clean;
    const scoreMatch = clean.match(/score\s+(\d+)/i);

    return {
      company,
      score: scoreMatch ? Number(scoreMatch[1]) : 0,
      status: 'from-local-report',
      recommendedOffer: 'See source report',
      nextAction: clean,
      source: relativePath,
    };
  });
}

function extractFollowUpReportItems(relativePath: string): MobileFollowUpItem[] {
  return extractNumberedSection(relativePath, 'Top 5 Follow-Ups').map((line) => {
    const clean = cleanNumberedLine(line);
    const company = clean.split(' - ')[0]?.trim() || clean;

    return {
      company,
      dueDate: 'Manual date not set',
      channel: 'manual-review',
      action: clean,
      source: relativePath,
    };
  });
}

function extractNumberedSection(relativePath: string, heading: string): string[] {
  const content = readFile(relativePath);
  if (!content) return [];

  const lines = content.split('\n');
  const start = lines.findIndex((line) => line.trim() === `## ${heading}` || line.trim() === `${heading}:`);
  if (start === -1) return [];

  const items: string[] = [];
  for (const line of lines.slice(start + 1)) {
    const trimmed = line.trim();
    if (trimmed.startsWith('## ')) break;
    if (/^\d+\.\s+/.test(trimmed)) items.push(trimmed);
  }

  return items;
}

function extractCommandNear(relativePath: string, itemLine: string): string | undefined {
  const content = readFile(relativePath);
  if (!content) return undefined;

  const lines = content.split('\n');
  const itemIndex = lines.findIndex((line) => line.trim() === itemLine);
  if (itemIndex === -1) return undefined;

  const nearby = lines.slice(itemIndex, itemIndex + 5).join('\n');
  const match = nearby.match(/Command:\s*`?([^`\n]+)`?/i);
  return match?.[1]?.trim();
}

function parseProjectedMrr(content: string): string | undefined {
  const match = content.match(/Expected speculative projected MRR, 90-day view:\s*([^`\n]+)/i);
  return match?.[1]?.replace(/^- /, '').trim();
}

function parseBookedMrr(content: string): number | undefined {
  const match = content.match(/Current booked MRR:\s*\$([\d,]+)/i) ?? content.match(/Booked MRR:\s*\$([\d,]+)/i);
  return match ? Number(match[1].replace(/,/g, '')) : undefined;
}

function parseReportCount(content: string, label: string): number | undefined {
  const match = content.match(new RegExp(`${escapeRegExp(label)}:\\s*(\\d+)`, 'i'));
  return match ? Number(match[1]) : undefined;
}

function activeLeads(leads: Lead[]): Lead[] {
  return leads.filter((lead) => lead.status !== 'lost' && lead.status !== 'paused' && lead.recommendedOffer !== 'not-fit');
}

function sortLeadsByScore(a: Lead, b: Lead): number {
  return b.score - a.score || a.companyName.localeCompare(b.companyName);
}

function commandForLead(lead: Lead): string {
  if (lead.status === 'proposal-sent' || lead.outreachStatus === 'proposal-ready') return `npm run sow:generate -- --id ${lead.id}`;
  if (lead.outreachStatus === 'follow-up-needed' || lead.nextFollowUpDate) return `npm run contact:review -- --id ${lead.id}`;
  if (lead.status === 'audit-ready') return `npm run audit:pack -- --id ${lead.id}`;
  if (lead.recommendedOffer === 'qa-audit') return `npm run audit:pack -- --id ${lead.id}`;
  return `npm run lead:pack -- --id ${lead.id}`;
}

function isMonthlyService(serviceType: string): boolean {
  return serviceType === 'qa-automation-retainer' || serviceType === 'agency-partner-retainer';
}

function uniqueActions(actions: MobileAction[]): MobileAction[] {
  const seen = new Set<string>();
  return actions.filter((action) => {
    const key = action.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueOpportunities(opportunities: MobileOpportunity[]): MobileOpportunity[] {
  const seen = new Set<string>();
  return opportunities.filter((opportunity) => {
    const key = opportunity.company.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function uniqueFollowUps(items: MobileFollowUpItem[]): MobileFollowUpItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.company.toLowerCase()}-${item.dueDate}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function renderActionList(actions: MobileAction[]): string {
  if (actions.length === 0) return '- No top actions found in local data.';

  return actions
    .map((action, index) => `${index + 1}. ${action.title}\n   - Source: ${action.source}\n   - Command: ${action.command}\n   - Approval: ${action.approvalRequired}`)
    .join('\n');
}

function renderOpportunityList(opportunities: MobileOpportunity[]): string {
  if (opportunities.length === 0) return '- No top opportunities found in local data.';

  return opportunities
    .map((opportunity, index) => `${index + 1}. ${opportunity.company}\n   - Score: ${opportunity.score}\n   - Status: ${opportunity.status}\n   - Offer: ${opportunity.recommendedOffer}\n   - Next: ${opportunity.nextAction}\n   - Source: ${opportunity.source}`)
    .join('\n');
}

function renderRevenueSnapshot(snapshot: MobileRevenueSnapshot): string {
  return [
    `- Booked MRR: ${formatCurrency(snapshot.bookedMrr)}`,
    `- Projected MRR: ${snapshot.projectedMrr}`,
    `- Audit Opportunities: ${snapshot.auditOpportunities}`,
    `- Retainer Opportunities: ${snapshot.retainerOpportunities}`,
    `- Source: ${snapshot.revenueSource}`,
    ...(snapshot.consistencyWarnings.length > 0 ? snapshot.consistencyWarnings.map((warning) => `- Warning: ${warning}`) : ['- Warning: none']),
  ].join('\n');
}

function renderClientStatus(status: MobileClientStatus): string {
  return [
    `- Active: ${status.active}`,
    `- Pending: ${status.pending}`,
    `- Paused: ${status.paused}`,
    `- Completed: ${status.completed}`,
    ...status.notes.map((note) => `- ${note}`),
  ].join('\n');
}

function renderFollowUpQueue(items: MobileFollowUpItem[]): string {
  if (items.length === 0) return '- No manual follow-ups found in local data.';

  return items
    .map((item, index) => `${index + 1}. ${item.company}\n   - Due: ${item.dueDate}\n   - Channel: ${item.channel}\n   - Manual Action: ${item.action}\n   - Source: ${item.source}`)
    .join('\n');
}

function renderSystemHealth(report: MobileCommandCenterReport): string {
  return [
    `Overall: ${report.systemHealth}`,
    '',
    '| Local Report Group | Status | Available | Missing |',
    '| --- | --- | --- | --- |',
    ...report.reportGroups.map((group) => `| ${group.label} | ${group.status} | ${group.availableReports.length} | ${group.missingReports.length} |`),
    '',
    'Health is based only on local generated report availability.',
  ].join('\n');
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function readContextSource(label: string, relativePath: string): MobileContextSource {
  const content = readFile(relativePath);

  return {
    label,
    path: relativePath,
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

function cleanNumberedLine(line: string): string {
  return line.replace(/^\d+\.\s+/, '').trim();
}

function safeNumber(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US')}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
