import { Client } from '../clientReports/types';
import {
  ClientHealth,
  RenewalClientRecord,
  RenewalClientSources,
  RenewalDocument,
  RenewalSource,
} from './types';

const insufficientData = 'Insufficient data available.';
const noEvidence = 'No evidence currently recorded.';

export function buildRenewalClientRecord(client: Client, sources: RenewalClientSources): RenewalClientRecord {
  const evidenceCount = countEvidenceItems(sources.evidenceLog.content ?? '');
  const completedDeliverables = client.completedWork.length;
  const reportCount = countReports(sources);
  const nextActionCount = client.recommendedNextSteps.length;
  const followUpCount = countFollowUpItems(sources.evidenceLog.content ?? '', client);
  const missingEvidence = evidenceCount > 0 ? [] : ['No reviewed evidence items are recorded locally.'];
  const missingReports = missingReportItems(sources);
  const missingActivity = missingActivityItems(client, nextActionCount, followUpCount);
  const healthScore = calculateHealthScore(client, {
    completedDeliverables,
    evidenceCount,
    reportCount,
    nextActionCount,
    followUpCount,
  });
  const health = classifyHealth(client, healthScore, evidenceCount);
  const expansionOpportunities = buildExpansionOpportunities(client, sources, evidenceCount);

  return {
    client,
    sources,
    health,
    healthScore,
    evidenceCount,
    completedDeliverables,
    reportCount,
    nextActionCount,
    followUpCount,
    renewalRecommendation: renewalRecommendation(client, health, evidenceCount, reportCount),
    nextAction: nextAction(client, health, evidenceCount, reportCount, expansionOpportunities),
    missingEvidence,
    missingReports,
    missingActivity,
    manualReviewReminders: manualReviewReminders(client),
    expansionOpportunities,
  };
}

export function buildRenewalTrackerDocuments(records: RenewalClientRecord[]): RenewalDocument[] {
  return [
    renewalPipeline(records),
    clientHealth(records, 'all'),
    renewalRiskReport(records, 'all'),
    expansionOpportunities(records, 'all'),
    renewalActions(records, 'all'),
  ];
}

export function buildClientHealthDocuments(record: RenewalClientRecord): RenewalDocument[] {
  const records = [record];

  return [
    clientHealth(records, record.client.id),
    renewalRiskReport(records, record.client.id),
    expansionOpportunities(records, record.client.id),
    renewalActions(records, record.client.id),
  ];
}

function renewalPipeline(records: RenewalClientRecord[]): RenewalDocument {
  const totalMonthlyValue = records.reduce((sum, record) => sum + record.client.monthlyFee, 0);

  return doc('renewal-pipeline.md', 'Retainer Renewal Pipeline', [
    '# Retainer Renewal Pipeline',
    '',
    '## Summary',
    '',
    bullets([
      `Clients reviewed: ${records.length}`,
      `Recorded monthly value: $${totalMonthlyValue.toLocaleString('en-US')}`,
      `GREEN: ${records.filter((record) => record.health === 'GREEN').length}`,
      `YELLOW: ${records.filter((record) => record.health === 'YELLOW').length}`,
      `RED: ${records.filter((record) => record.health === 'RED').length}`,
      'Monthly value is read from local client data only.',
      'Commercial Mode: ON for revenue-facing reporting. Demo/sample lead filtering is handled before lead-based opportunity reports.',
    ]),
    '',
    '## Renewal Tracker',
    '',
    table(
      ['Client', 'Status', 'Monthly Value', 'Health', 'Renewal Recommendation', 'Next Action'],
      records.map((record) => [
        record.client.companyName,
        record.client.status,
        `$${record.client.monthlyFee.toLocaleString('en-US')}`,
        record.health,
        record.renewalRecommendation,
        record.nextAction,
      ]),
    ),
    '',
    '## Manual Approval Rules',
    '',
    bullets(manualApprovalRules()),
  ]);
}

function clientHealth(records: RenewalClientRecord[], scope: string): RenewalDocument {
  return doc('client-health.md', 'Client Health', [
    '# Client Health',
    '',
    '## Scope',
    '',
    bullets([scope === 'all' ? 'All local clients' : `Focused client: ${scope}`]),
    '',
    '## Health Summary',
    '',
    table(
      ['Client', 'Health', 'Score', 'Deliverables', 'Evidence Count', 'Reports', 'Next Actions', 'Follow-Up Items'],
      records.map((record) => [
        record.client.companyName,
        record.health,
        `${record.healthScore}`,
        `${record.completedDeliverables}`,
        `${record.evidenceCount}`,
        `${record.reportCount}`,
        `${record.nextActionCount}`,
        `${record.followUpCount}`,
      ]),
    ),
    '',
    '## Classification Rules',
    '',
    bullets([
      'GREEN: active client with enough local delivery, reporting, and next-action signals to support a manual renewal review.',
      'YELLOW: partial local signals or missing evidence/reporting that should be cleaned up before a renewal conversation.',
      'RED: paused, at-risk, inactive, or insufficient local delivery activity.',
      'Health is not client satisfaction, retention probability, revenue forecast, or business outcome.',
    ]),
    '',
    '## Manual Approval Rules',
    '',
    bullets(manualApprovalRules()),
  ]);
}

function renewalRiskReport(records: RenewalClientRecord[], scope: string): RenewalDocument {
  return doc('renewal-risk-report.md', 'Renewal Risk Report', [
    '# Renewal Risk Report',
    '',
    '## Scope',
    '',
    bullets([scope === 'all' ? 'All local clients' : `Focused client: ${scope}`]),
    '',
    '## Missing Evidence',
    '',
    recordBullets(records, (record) => record.missingEvidence),
    '',
    '## Missing Reports',
    '',
    recordBullets(records, (record) => record.missingReports),
    '',
    '## Missing Activity',
    '',
    recordBullets(records, (record) => record.missingActivity),
    '',
    '## Manual Review Reminders',
    '',
    recordBullets(records, (record) => record.manualReviewReminders),
  ]);
}

function expansionOpportunities(records: RenewalClientRecord[], scope: string): RenewalDocument {
  return doc('expansion-opportunities.md', 'Expansion Opportunities', [
    '# Expansion Opportunities',
    '',
    '## Scope',
    '',
    bullets([scope === 'all' ? 'All local clients' : `Focused client: ${scope}`]),
    '',
    '## Upgrade Paths',
    '',
    recordBullets(records, (record) => record.expansionOpportunities),
    '',
    '## Manual Approval Rules',
    '',
    bullets([
      'Only discuss expansion after Daniel reviews scope, evidence, and client context.',
      'Do not claim business impact, ROI, satisfaction, or retention probability.',
      'No automated outreach, scheduling, CRM, invoices, payment systems, APIs, scraping, browser automation, or external databases are used.',
      'Commercial Mode is ON for revenue-facing reporting; renewal records use local client data only.',
    ]),
  ]);
}

function renewalActions(records: RenewalClientRecord[], scope: string): RenewalDocument {
  return doc('renewal-actions.md', 'Renewal Actions', [
    '# Renewal Actions',
    '',
    '## Scope',
    '',
    bullets([scope === 'all' ? 'All local clients' : `Focused client: ${scope}`]),
    '',
    '## Recommended Actions',
    '',
    recordBullets(records, (record) => recommendedActions(record)),
    '',
    '## Manual Approval Rules',
    '',
    bullets(manualApprovalRules()),
  ]);
}

function calculateHealthScore(
  client: Client,
  factors: {
    completedDeliverables: number;
    evidenceCount: number;
    reportCount: number;
    nextActionCount: number;
    followUpCount: number;
  },
): number {
  let score = 0;

  if (client.status === 'active') score += 2;
  if (client.status === 'at-risk' || client.status === 'paused') score -= 2;
  if (factors.completedDeliverables > 0) score += 1;
  if (factors.evidenceCount > 0) score += 1;
  if (factors.reportCount > 0 || client.lastReportDate) score += 1;
  if (factors.nextActionCount > 0) score += 1;
  if (factors.followUpCount > 0) score += 1;

  return score;
}

function classifyHealth(client: Client, score: number, evidenceCount: number): ClientHealth {
  if (client.status === 'at-risk' || client.status === 'paused') return 'RED';
  if (client.status !== 'active' && score < 4) return 'RED';
  if (evidenceCount === 0 && score >= 3) return 'YELLOW';
  if (score >= 5) return 'GREEN';
  if (score >= 3) return 'YELLOW';
  return 'RED';
}

function renewalRecommendation(client: Client, health: ClientHealth, evidenceCount: number, reportCount: number): string {
  if (client.status !== 'active') return 'Manual review required before any renewal conversation.';
  if (health === 'RED') return 'Stabilize delivery activity before renewal review.';
  if (evidenceCount === 0) return 'Prepare evidence-backed report before renewal conversation.';
  if (reportCount === 0) return 'Prepare client report before renewal conversation.';
  if (client.monthlyFee > 0) return 'Prepare renewal review and next-month scope for Daniel approval.';
  return 'Review upgrade path only after current delivery value is documented.';
}

function nextAction(
  client: Client,
  health: ClientHealth,
  evidenceCount: number,
  reportCount: number,
  expansionOpportunities: string[],
): string {
  if (client.status !== 'active') return 'Review client status manually and decide whether to pause renewal work.';
  if (evidenceCount === 0) return `Run npm run client:evidence -- --id ${client.id} and add reviewed evidence only if it exists.`;
  if (reportCount === 0) return `Run npm run client:delivery-report -- --id ${client.id}.`;
  if (health === 'YELLOW') return 'Review scope, missing activity, and next approved client action.';
  if (expansionOpportunities.length > 0) return 'Review expansion path and prepare a manual scope conversation.';
  return 'Schedule manual renewal review after Daniel approves the client report.';
}

function missingReportItems(sources: RenewalClientSources): string[] {
  const missing = [
    sources.executiveSummary.exists ? undefined : 'Executive summary is missing.',
    sources.weeklyReport.exists ? undefined : 'Weekly report is missing.',
    sources.monthlyReport.exists ? undefined : 'Monthly report is missing.',
    sources.valueDelivered.exists ? undefined : 'Value delivered report is missing.',
  ].filter((item): item is string => Boolean(item));

  return missing.length > 0 ? missing : [insufficientData];
}

function missingActivityItems(client: Client, nextActionCount: number, followUpCount: number): string[] {
  const missing = [
    client.completedWork.length > 0 ? undefined : 'No completed deliverables are recorded locally.',
    nextActionCount > 0 ? undefined : 'No next actions are recorded locally.',
    followUpCount > 0 ? undefined : 'No follow-up items are recorded locally.',
    client.lastReportDate ? undefined : 'No last report date is recorded locally.',
  ].filter((item): item is string => Boolean(item));

  return missing.length > 0 ? missing : [insufficientData];
}

function manualReviewReminders(client: Client): string[] {
  return [
    `Daniel must review renewal context for ${client.companyName} before any client-facing action.`,
    'Do not invent revenue, client satisfaction, defects, business outcomes, or retention probability.',
    'Do not automate outreach, scheduling, email, CRM updates, invoices, payments, APIs, scraping, browser automation, or external database writes.',
  ];
}

function buildExpansionOpportunities(client: Client, sources: RenewalClientSources, evidenceCount: number): string[] {
  if (client.status !== 'active') return [insufficientData];

  if (client.serviceType === 'qa-audit') {
    if (evidenceCount > 0 || sources.executiveSummary.exists || client.recommendedNextSteps.length > 0) {
      return ['QA Audit -> Playwright Starter Pack: review only if audit evidence and recommended next steps support starter automation scope.'];
    }
    return [insufficientData];
  }

  if (client.serviceType === 'playwright-starter-pack') {
    if (client.completedWork.length > 0 && (client.openRisks.length > 0 || client.recommendedNextSteps.length > 0)) {
      return ['Playwright Starter Pack -> QA Automation Retainer: review if recurring QA risks and approved next actions justify monthly support.'];
    }
    return [insufficientData];
  }

  if (client.serviceType === 'qa-automation-retainer' || client.serviceType === 'agency-partner-retainer') {
    if (client.openRisks.length > 0 || client.recommendedNextSteps.length > 0) {
      return ['QA Automation Retainer -> expanded retainer scope: review next-month scope only after current reporting and evidence are approved.'];
    }
    return [insufficientData];
  }

  return [insufficientData];
}

function recommendedActions(record: RenewalClientRecord): string[] {
  const actions: string[] = [];

  if (record.evidenceCount === 0) actions.push(`Prepare or refresh evidence log: npm run client:evidence -- --id ${record.client.id}`);
  if (record.reportCount === 0 || record.missingReports.some((item) => item !== insufficientData)) {
    actions.push(`Prepare delivery report: npm run client:delivery-report -- --id ${record.client.id}`);
  }
  if (record.health !== 'GREEN') actions.push('Review scope, missing activity, and risk status before renewal discussion.');
  if (record.expansionOpportunities.some((item) => item !== insufficientData)) actions.push('Identify expansion path for Daniel review.');
  if (record.client.monthlyFee > 0) actions.push('Schedule manual renewal/value review after reports are approved.');
  if (actions.length === 0) actions.push(insufficientData);

  return actions;
}

function countReports(sources: RenewalClientSources): number {
  return [
    sources.executiveSummary,
    sources.weeklyReport,
    sources.monthlyReport,
    sources.valueDelivered,
    sources.renewalSignal,
    sources.legacyClientReport,
  ].filter((source) => source.exists).length;
}

function countFollowUpItems(evidenceLog: string, client: Client): number {
  const followUpItems = sectionItems(evidenceLog, 'Follow-Up Items');
  return followUpItems.length > 0 ? followUpItems.length : client.recommendedNextSteps.length;
}

function countEvidenceItems(evidenceLog: string): number {
  return (
    sectionItems(evidenceLog, 'Audit Evidence').length +
    sectionItems(evidenceLog, 'Screenshots').length +
    sectionItems(evidenceLog, 'Test Results').length +
    sectionItems(evidenceLog, 'Defects').length
  );
}

function sectionItems(markdown: string, heading: string): string[] {
  if (!markdown) return [];

  const lines = markdown.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (headingIndex === -1) return [];

  const items: string[] = [];
  for (let index = headingIndex + 1; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (line.startsWith('## ')) break;
    if (!line.startsWith('- ')) continue;

    const item = line.replace(/^-\s+/, '').trim();
    if (item && item !== noEvidence) items.push(item);
  }

  return items;
}

function recordBullets(records: RenewalClientRecord[], select: (record: RenewalClientRecord) => string[]): string {
  if (records.length === 0) return bullets([insufficientData]);

  return records
    .map((record) => {
      const items = select(record);
      return [`### ${record.client.companyName}`, '', bullets(items.length > 0 ? items : [insufficientData])].join('\n');
    })
    .join('\n\n');
}

function manualApprovalRules(): string[] {
  return [
    'Human approval is required before renewal, expansion, follow-up, scheduling, or client communication.',
    'Use local evidence and reports only after Daniel reviews them.',
    'No automated outreach, scheduling, email, CRM, payment, invoice, API, scraping, browser automation, credential, client-system, or external database action is performed.',
  ];
}

function doc(fileName: RenewalDocument['fileName'], title: string, lines: string[]): RenewalDocument {
  return {
    fileName,
    title,
    body: `${lines.join('\n').trim()}\n`,
  };
}

function bullets(lines: string[]): string {
  return lines.map((line) => `- ${line}`).join('\n');
}

function table(headers: string[], rows: string[][]): string {
  return [
    `| ${headers.map(escapeCell).join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.map(escapeCell).join(' | ')} |`),
  ].join('\n');
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

export function source(label: string, path: string, exists: boolean, content?: string): RenewalSource {
  return { label, path, exists, content };
}
