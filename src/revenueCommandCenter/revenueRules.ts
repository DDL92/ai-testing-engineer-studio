import fs = require('fs');
import path = require('path');
import { Client } from '../clientReports/types';
import { buildCommercialModeSummary, getDemoLeadReasons } from '../commercialMode/commercialModeRules';
import { ContactReviewRecord } from '../contactReview/types';
import { Lead, RecommendedOffer } from '../leads/types';
import {
  CurrencyRange,
  ExpansionOpportunity,
  ForecastScenario,
  ForecastScenarioName,
  ForecastWindowLabel,
  ProbabilityBand,
  PropertyProgressScenario,
  RetainerOpportunity,
  RevenueAction,
  RevenueArtifacts,
  RevenueCommandCenterInput,
  RevenueCommandCenterReport,
  RevenueContextSource,
  RevenuePriorityOpportunity,
  RenewalOpportunity,
} from './types';

const outputRoot = path.join(process.cwd(), 'output', 'revenue-command-center');
const auditRange: CurrencyRange = { min: 199, max: 500, cadence: 'one-time' };
const zeroMonthlyRange: CurrencyRange = { min: 0, max: 0, cadence: 'monthly' };

const offerRanges: Record<RecommendedOffer, CurrencyRange> = {
  'qa-audit': auditRange,
  'playwright-starter-pack': { min: 900, max: 1500, cadence: 'one-time' },
  'qa-automation-retainer': { min: 1500, max: 3000, cadence: 'monthly' },
  'agency-partner-retainer': { min: 1500, max: 3000, cadence: 'monthly' },
  'not-fit': { min: 0, max: 0, cadence: 'one-time' },
};

const forecastWindows: ForecastWindowLabel[] = ['30 days', '60 days', '90 days', '180 days', '12 months'];
const forecastScenarios: ForecastScenarioName[] = ['conservative', 'expected', 'aggressive'];

const manualApprovalReminder = [
  'Human approval is required before outreach, follow-up, proposal, discovery call, client delivery, renewal, expansion, invoice, or payment action.',
  'This report uses local Studio data only.',
  'Opportunities, pipeline potential, and speculative forecast rows are not booked revenue.',
  'No APIs, scraping, browsing, CRM, outreach automation, email sending, LinkedIn automation, payment systems, credentials, or external databases were used.',
];

export function loadRevenueCommandCenterInput(): RevenueCommandCenterInput {
  const generatedAt = new Date().toISOString();
  const leads = readJson<Lead[]>(path.join('data', 'leads.json'), []);
  const clients = readJson<Client[]>(path.join('data', 'clients.json'), []);
  const contactReviews = readJson<ContactReviewRecord[]>(path.join('data', 'contact-reviews.json'), []);

  return {
    generatedAt,
    today: generatedAt.slice(0, 10),
    leads,
    clients,
    contactReviews,
    contextSources: [
      readContextSource('Leads', path.join('data', 'leads.json')),
      readContextSource('Clients', path.join('data', 'clients.json')),
      readContextSource('Contact reviews', path.join('data', 'contact-reviews.json')),
      readContextSource('Commercial dashboard', path.join('output', 'dashboard', 'commercial-dashboard.md')),
      readContextSource('Commercial revenue visibility', path.join('output', 'dashboard', 'commercial-revenue-visibility.md')),
      readContextSource('Commercial prioritized pipeline', path.join('output', 'pipeline-prioritization', 'commercial-prioritized-pipeline.md')),
      readContextSource('Top 5 real outreach', path.join('output', 'outreach-operating', 'top-5-real-outreach.md')),
      readContextSource('Client operations center', path.join('output', 'client-ops', 'client-operations-center.md')),
      readContextSource('Renewal pipeline', path.join('output', 'renewals', 'renewal-pipeline.md')),
      readContextSource('Expansion opportunities', path.join('output', 'renewals', 'expansion-opportunities.md')),
      readContextSource('Mac daily summary', path.join('output', 'mac-daily', 'mac-daily-summary.md')),
      readContextSource('Commercial mode summary', path.join('output', 'commercial-mode', 'commercial-mode-summary.md')),
    ],
  };
}

export function buildRevenueCommandCenterReport(input: RevenueCommandCenterInput): RevenueCommandCenterReport {
  const commercialSummary = buildCommercialModeSummary(input.leads);
  const commercialLeadIds = new Set(commercialSummary.commercialLeads.map((lead) => lead.id));
  const commercialContactReviews = input.contactReviews.filter((review) => commercialLeadIds.has(review.leadId));
  const topOutreachLeadIds = parseTopOutreachLeadIds(input.contextSources);
  const contactReviewByLeadId = new Map(commercialContactReviews.map((review) => [review.leadId, review]));
  const opportunities = commercialSummary.commercialLeads
    .map((lead) => buildRevenueOpportunity(lead, contactReviewByLeadId.get(lead.id), topOutreachLeadIds))
    .filter((opportunity) => opportunity.revenuePriorityScore > 0)
    .sort(sortRevenueOpportunities);
  const commercialClients = input.clients.filter(isCommercialClient);
  const excludedClientRecords = input.clients.filter((client) => !isCommercialClient(client));
  const activeRetainerClients = commercialClients.filter((client) => client.status === 'active' && isMonthlyService(client.serviceType));
  const activeOneTimeClients = commercialClients.filter((client) => client.status === 'active' && !isMonthlyService(client.serviceType));
  const bookedMrr = activeRetainerClients.reduce((sum, client) => sum + client.monthlyFee, 0);
  const retainerOpportunities = buildRetainerOpportunities(opportunities);
  const renewalOpportunities = buildRenewalOpportunities(commercialClients);
  const expansionOpportunities = buildExpansionOpportunities(commercialClients);
  const forecast = buildForecast(bookedMrr, retainerOpportunities);

  return {
    generatedAt: input.generatedAt,
    bookedMrr,
    projectedExpectedMrr: findExpectedProjectedMrr(forecast),
    activeRetainerClients,
    activeOneTimeClients,
    excludedClientRecords,
    auditOpportunities: opportunities,
    retainerOpportunities,
    renewalOpportunities,
    expansionOpportunities,
    topRevenueActions: buildTopRevenueActions(activeRetainerClients, opportunities, renewalOpportunities, expansionOpportunities),
    revenueRisks: buildRevenueRisks(input, opportunities, activeRetainerClients),
    forecast,
    contextSources: input.contextSources,
  };
}

export function writeRevenueCommandCenterOutputs(report: RevenueCommandCenterReport): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });

  const outputs = [
    { fileName: 'revenue-command-center.md', body: renderRevenueCommandCenter(report) },
    { fileName: 'mrr-forecast.md', body: renderMrrForecast(report) },
    { fileName: 'audit-opportunities.md', body: renderAuditOpportunities(report) },
    { fileName: 'retainer-opportunities.md', body: renderRetainerOpportunities(report) },
    { fileName: 'property-progress.md', body: renderPropertyProgress(report) },
  ];

  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }

  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

export function writeRevenueForecastOutput(report: RevenueCommandCenterReport): string {
  fs.mkdirSync(outputRoot, { recursive: true });
  const outputPath = path.join(outputRoot, 'mrr-forecast.md');
  fs.writeFileSync(outputPath, renderMrrForecast(report), 'utf8');
  return outputPath;
}

export function renderRevenueCommandCenter(report: RevenueCommandCenterReport): string {
  return [
    '# Revenue Command Center',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Executive Summary',
    renderList([
      `Current booked MRR: ${formatCurrency(report.bookedMrr)}`,
      `Expected speculative projected MRR, 90-day view: ${formatRange(report.projectedExpectedMrr)}/month`,
      `Audit opportunities reviewed: ${report.auditOpportunities.length}`,
      `Retainer opportunities reviewed: ${report.retainerOpportunities.length}`,
      `Renewal opportunities reviewed: ${report.renewalOpportunities.length}`,
      `Expansion opportunities reviewed: ${report.expansionOpportunities.length}`,
      `Excluded demo/sample client records: ${report.excludedClientRecords.length}`,
      'Booked revenue comes only from active commercial local retainer client records.',
    ]),
    '',
    '## Current Revenue',
    renderCurrentRevenue(report),
    '',
    '## Commercial Pipeline',
    renderPipelineTable(report.auditOpportunities.slice(0, 12)),
    '',
    '## Audit Opportunities',
    renderAuditTable(report.auditOpportunities.slice(0, 10)),
    '',
    '## Retainer Opportunities',
    renderRetainerTable(report.retainerOpportunities),
    '',
    '## Renewal Opportunities',
    renderRenewalTable(report.renewalOpportunities),
    '',
    '## Expansion Opportunities',
    renderExpansionTable(report.expansionOpportunities),
    '',
    '## Top Revenue Actions',
    renderActionList(report.topRevenueActions),
    '',
    '## Revenue Risks',
    renderList(report.revenueRisks),
    '',
    '## Suggested Commands',
    renderList(suggestedCommands(report)),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderMrrForecast(report: RevenueCommandCenterReport): string {
  return [
    '# MRR Forecast',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Forecast Rules',
    renderList([
      `Booked MRR uses active commercial retainer clients only: ${formatCurrency(report.bookedMrr)}`,
      'Estimated pipeline potential uses local opportunity ranges only.',
      'Speculative forecast rows are scenario math, not booked revenue.',
      'Opportunities are never counted as booked until they exist as active commercial local retainer client records.',
    ]),
    '',
    '## Pricing Assumptions',
    renderList([
      'QA Audit: $199-$500',
      'Playwright Starter Pack: $900-$1,500',
      'QA Automation Retainer: $1,500-$3,000/month',
      'Agency Partner Retainer: $1,500-$3,000/month',
    ]),
    '',
    '## Booked MRR',
    renderList([
      `Booked MRR: ${formatCurrency(report.bookedMrr)}`,
      `Active commercial retainer clients: ${report.activeRetainerClients.length}`,
      `Excluded demo/sample client records: ${report.excludedClientRecords.length}`,
    ]),
    '',
    '## Estimated Pipeline Potential',
    renderList([
      `Retainer pipeline potential: ${formatRange(sumMonthlyRanges(report.retainerOpportunities.map((item) => item.estimatedMonthlyRange)))}/month`,
      `Audit pipeline potential: ${formatRange(sumOneTimeRanges(report.auditOpportunities.map((item) => item.estimatedAuditValueRange)))}`,
      'Pipeline potential remains unbooked until manually closed and recorded locally.',
    ]),
    '',
    '## Speculative Forecast',
    renderForecastTable(report.forecast),
    '',
    '## Notes',
    renderList([
      '30/60/90/180-day and 12-month windows are deterministic scenario windows, not guarantees.',
      'Conservative, expected, and aggressive conversion counts are capped by available retainer opportunities.',
      'Do not use this as financial advice, tax advice, investment advice, or guaranteed business planning.',
    ]),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderAuditOpportunities(report: RevenueCommandCenterReport): string {
  return [
    '# Audit Opportunities',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## High Probability',
    renderAuditTable(report.auditOpportunities.filter((item) => item.probability === 'High probability')),
    '',
    '## Medium Probability',
    renderAuditTable(report.auditOpportunities.filter((item) => item.probability === 'Medium probability')),
    '',
    '## Low Probability',
    renderAuditTable(report.auditOpportunities.filter((item) => item.probability === 'Low probability')),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderRetainerOpportunities(report: RevenueCommandCenterReport): string {
  return [
    '# Retainer Opportunities',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderRetainerTable(report.retainerOpportunities),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderPropertyProgress(report: RevenueCommandCenterReport): string {
  const scenarios = buildPropertyProgressScenarios(report);

  return [
    '# Property Progress',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Goal',
    renderList([
      'Track progress from current booked MRR toward personal/property funding goals using local deterministic inputs.',
      'Surf Train Live fund target placeholder: $100,000.',
      'This report does not give financial advice and does not guarantee results.',
    ]),
    '',
    '## Current MRR',
    renderList([
      `Booked MRR: ${formatCurrency(report.bookedMrr)}`,
      `Active commercial retainer clients: ${report.activeRetainerClients.length}`,
      `Excluded demo/sample client records: ${report.excludedClientRecords.length}`,
    ]),
    '',
    '## Target MRR',
    renderList([
      'Personal monthly living cost default: $1,000-$1,500',
      'Initial monthly Studio target: $3,000-$5,000',
      'Next monthly Studio target: $7,000-$10,000',
      'Ambitious solo monthly target: $10,000-$15,000',
      'Exceptional monthly target: $15,000-$20,000',
    ]),
    '',
    '## Monthly Surplus Scenarios',
    renderPropertyScenarioTable(scenarios),
    '',
    '## Estimated Time To Fund',
    renderList(scenarios.map((scenario) => `${scenario.label}: ${scenario.estimatedTimeToFund}`)),
    '',
    '## Safety Notes',
    renderList([
      'Do not rely on speculative MRR as available cash.',
      'Do not treat this report as financial, tax, legal, investment, lending, or real estate advice.',
      'Review real cash flow, taxes, savings, debt, and risk manually before making property decisions.',
    ]),
    '',
    '## Next Revenue Milestones',
    renderList([
      `Reach initial Studio target gap: ${formatGap(report.bookedMrr, 3000, 5000)}`,
      `Reach next Studio target gap: ${formatGap(report.bookedMrr, 7000, 10000)}`,
      `Reach ambitious solo target gap: ${formatGap(report.bookedMrr, 10000, 15000)}`,
      `Reach exceptional target gap: ${formatGap(report.bookedMrr, 15000, 20000)}`,
    ]),
    '',
  ].join('\n');
}

function buildRevenueOpportunity(
  lead: Lead,
  contactReview: ContactReviewRecord | undefined,
  topOutreachLeadIds: Set<string>,
): RevenuePriorityOpportunity {
  const exclusionReasons = exclusionReasonsFor(lead);
  if (exclusionReasons.length > 0) {
    return inactiveOpportunity(lead, contactReview, exclusionReasons);
  }

  const artifacts = detectArtifacts(lead.id, Boolean(contactReview), topOutreachLeadIds.has(lead.id));
  const score = scoreRevenueOpportunity(lead, contactReview, artifacts);
  const monthlyRange = monthlyRangeFor(lead.recommendedOffer);

  return {
    lead,
    contactReview,
    artifacts,
    revenuePriorityScore: score.score,
    probability: probabilityFor(score.score),
    recommendedOffer: lead.recommendedOffer,
    estimatedAuditValueRange: auditRange,
    estimatedMonthlyRange: monthlyRange,
    reason: score.reasons.join('; '),
    scoreReasons: score.reasons,
    nextAction: nextActionFor(lead, artifacts, contactReview),
    suggestedCommand: suggestedCommandFor(lead, artifacts, contactReview),
  };
}

function inactiveOpportunity(
  lead: Lead,
  contactReview: ContactReviewRecord | undefined,
  reasons: string[],
): RevenuePriorityOpportunity {
  return {
    lead,
    contactReview,
    artifacts: detectArtifacts(lead.id, Boolean(contactReview), false),
    revenuePriorityScore: 0,
    probability: 'Low probability',
    recommendedOffer: lead.recommendedOffer,
    estimatedAuditValueRange: auditRange,
    estimatedMonthlyRange: zeroMonthlyRange,
    reason: reasons.join('; '),
    scoreReasons: reasons,
    nextAction: 'No revenue action. Lead is excluded from revenue-facing reporting.',
    suggestedCommand: 'No command recommended.',
  };
}

function scoreRevenueOpportunity(
  lead: Lead,
  contactReview: ContactReviewRecord | undefined,
  artifacts: RevenueArtifacts,
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score = Math.min(Math.max(lead.score, 0), 10) * 5;
  reasons.push(`lead score ${lead.score}/10`);

  const offerBoost = offerRevenueBoost(lead.recommendedOffer);
  score += offerBoost;
  reasons.push(`offer boost ${offerBoost}`);

  if (artifacts.topOutreach) {
    score += 10;
    reasons.push('top 5 outreach lead');
  }
  if (artifacts.researchPack) {
    score += 4;
    reasons.push('research pack exists');
  }
  if (artifacts.leadPack) {
    score += 5;
    reasons.push('lead pack exists');
  }
  if (artifacts.auditPack) {
    score += 8;
    reasons.push('audit pack exists');
  }
  if (artifacts.outreachPack) {
    score += 8;
    reasons.push('outreach pack exists');
  }
  if (artifacts.contactReview || contactReview) {
    score += 8;
    reasons.push('contact review exists');
  }
  if (artifacts.sow) {
    score += 8;
    reasons.push('SOW exists');
  }
  if (artifacts.clientWorkflow) {
    score += 8;
    reasons.push('client workflow exists');
  }
  if (contactReview?.messageStatus === 'follow-up-needed' || Boolean(contactReview?.nextFollowUpDate)) {
    score += 5;
    reasons.push('follow-up signal exists');
  }

  return { score: Math.min(100, Math.max(0, Math.round(score))), reasons };
}

function buildRetainerOpportunities(opportunities: RevenuePriorityOpportunity[]): RetainerOpportunity[] {
  return opportunities
    .filter((opportunity) => opportunity.estimatedMonthlyRange.max > 0)
    .map((opportunity): RetainerOpportunity => ({
      company: opportunity.lead.companyName,
      retainerType: opportunity.lead.recommendedOffer === 'agency-partner-retainer'
        ? 'Agency Partner Retainer'
        : 'QA Automation Retainer',
      estimatedMonthlyRange: opportunity.estimatedMonthlyRange,
      priority: opportunity.probability,
      whyItMayFit: opportunity.reason,
      nextAction: opportunity.nextAction,
      suggestedCommand: opportunity.suggestedCommand,
      revenuePriorityScore: opportunity.revenuePriorityScore,
    }));
}

function buildRenewalOpportunities(clients: Client[]): RenewalOpportunity[] {
  return clients
    .filter((client) => client.status === 'active' || client.status === 'at-risk')
    .filter((client) => isMonthlyService(client.serviceType))
    .map((client): RenewalOpportunity => ({
      client,
      monthlyFee: client.monthlyFee,
      priority: client.status === 'at-risk' ? 'High probability' : 'Medium probability',
      reason: client.status === 'at-risk'
        ? 'Active monthly value is at risk and should be reviewed with local evidence.'
        : 'Active retainer should be protected with reporting, evidence, and renewal readiness.',
      nextAction: `Review renewal health and latest client report for ${client.companyName}.`,
      suggestedCommand: `npm run renewal:review -- --id ${client.id}`,
    }))
    .sort((a, b) => b.monthlyFee - a.monthlyFee || a.client.companyName.localeCompare(b.client.companyName));
}

function buildExpansionOpportunities(clients: Client[]): ExpansionOpportunity[] {
  return clients
    .filter((client) => client.status === 'active')
    .map((client): ExpansionOpportunity => ({
      client,
      estimatedMonthlyRange: isMonthlyService(client.serviceType)
        ? { min: 500, max: 1500, cadence: 'monthly' }
        : { min: 1500, max: 3000, cadence: 'monthly' },
      priority: client.serviceType === 'playwright-starter-pack' ? 'High probability' : 'Medium probability',
      reason: client.serviceType === 'playwright-starter-pack'
        ? 'Starter pack client may fit a manually approved maintenance retainer after delivery evidence is reviewed.'
        : 'Active client may have a scoped expansion path if local evidence and open risks support it.',
      nextAction: `Review expansion opportunities and evidence for ${client.companyName}.`,
      suggestedCommand: `npm run client:delivery-report -- --id ${client.id}`,
    }))
    .sort((a, b) => prioritySort(a.priority, b.priority) || a.client.companyName.localeCompare(b.client.companyName));
}

function buildForecast(bookedMrr: number, retainerOpportunities: RetainerOpportunity[]): ForecastScenario[] {
  const monthlyPotential = sumMonthlyRanges(retainerOpportunities.map((item) => item.estimatedMonthlyRange));
  const sortedRetainers = [...retainerOpportunities].sort((a, b) => (
    b.revenuePriorityScore - a.revenuePriorityScore
    || prioritySort(a.priority, b.priority)
    || a.company.localeCompare(b.company)
  ));

  const rows: ForecastScenario[] = [];
  for (const window of forecastWindows) {
    for (const scenario of forecastScenarios) {
      const conversionCount = Math.min(sortedRetainers.length, conversionCountFor(window, scenario));
      const speculativeAdditionalMrr = sumMonthlyRanges(sortedRetainers.slice(0, conversionCount).map((item) => item.estimatedMonthlyRange));

      rows.push({
        scenario,
        window,
        bookedMrr,
        estimatedPipelinePotential: monthlyPotential,
        speculativeAdditionalMrr,
        speculativeProjectedMrr: {
          min: bookedMrr + speculativeAdditionalMrr.min,
          max: bookedMrr + speculativeAdditionalMrr.max,
          cadence: 'monthly',
        },
        conversionCount,
        notes: [
          `${conversionCount} hypothetical retainer conversion(s) from local opportunity list.`,
          'Not booked revenue.',
        ],
      });
    }
  }

  return rows;
}

function buildTopRevenueActions(
  activeRetainerClients: Client[],
  opportunities: RevenuePriorityOpportunity[],
  renewalOpportunities: RenewalOpportunity[],
  expansionOpportunities: ExpansionOpportunity[],
): RevenueAction[] {
  const actions: RevenueAction[] = [];
  const activeRetainer = activeRetainerClients[0];
  const followUp = opportunities.find((opportunity) => opportunity.contactReview?.nextFollowUpDate || opportunity.contactReview?.messageStatus === 'follow-up-needed');
  const topRetainer = opportunities.find((opportunity) => opportunity.estimatedMonthlyRange.max > 0 && opportunity.lead.id !== followUp?.lead.id);
  const topAudit = opportunities.find((opportunity) => (
    opportunity.revenuePriorityScore > 0
    && opportunity.lead.id !== followUp?.lead.id
    && opportunity.lead.id !== topRetainer?.lead.id
  ));
  const renewal = renewalOpportunities[0];
  const expansion = expansionOpportunities[0];

  if (activeRetainer) {
    actions.push({
      priority: actions.length + 1,
      title: `Protect booked MRR: ${activeRetainer.companyName}`,
      reason: `Active retainer client contributes ${formatCurrency(activeRetainer.monthlyFee)}/month in local client data.`,
      suggestedCommand: `npm run client:report -- --id ${activeRetainer.id}`,
    });
  }

  if (followUp) {
    actions.push({
      priority: actions.length + 1,
      title: `Review follow-up path: ${followUp.lead.companyName}`,
      reason: followUp.reason,
      suggestedCommand: followUp.suggestedCommand,
    });
  }

  if (topRetainer) {
    actions.push({
      priority: actions.length + 1,
      title: `Move retainer opportunity: ${topRetainer.lead.companyName}`,
      reason: `${topRetainer.lead.companyName} has revenue priority ${topRetainer.revenuePriorityScore}/100.`,
      suggestedCommand: topRetainer.suggestedCommand,
    });
  }

  if (topAudit) {
    actions.push({
      priority: actions.length + 1,
      title: `Advance audit path: ${topAudit.lead.companyName}`,
      reason: `Audit range is ${formatRange(topAudit.estimatedAuditValueRange)} and can support a manually approved next step.`,
      suggestedCommand: topAudit.suggestedCommand,
    });
  }

  if (renewal) {
    actions.push({
      priority: actions.length + 1,
      title: `Review renewal readiness: ${renewal.client.companyName}`,
      reason: renewal.reason,
      suggestedCommand: renewal.suggestedCommand,
    });
  }

  if (expansion) {
    actions.push({
      priority: actions.length + 1,
      title: `Review expansion fit: ${expansion.client.companyName}`,
      reason: expansion.reason,
      suggestedCommand: expansion.suggestedCommand,
    });
  }

  actions.push({
    priority: actions.length + 1,
    title: 'Refresh commercial pipeline',
    reason: 'Revenue action quality depends on the current local pipeline and dashboard files.',
    suggestedCommand: 'npm run pipeline:prioritize',
  });

  return actions.slice(0, 8).map((action, index) => ({ ...action, priority: index + 1 }));
}

function buildRevenueRisks(
  input: RevenueCommandCenterInput,
  opportunities: RevenuePriorityOpportunity[],
  activeRetainerClients: Client[],
): string[] {
  const missingSources = input.contextSources.filter((source) => !source.exists);
  const risks = [
    activeRetainerClients.length === 0
      ? 'No active commercial retainer clients are recorded locally, so booked MRR is currently $0.'
      : `Booked MRR depends on ${activeRetainerClients.length} active commercial retainer client record(s).`,
    opportunities.length === 0
      ? 'No commercial revenue opportunities were detected from local leads.'
      : `${opportunities.length} commercial opportunity record(s) still require manual approval before action.`,
    'Opportunity ranges can overstate revenue if treated as booked. Keep booked MRR separate.',
    'Client renewal and expansion signals require evidence review before any client-facing conversation.',
  ];

  if (missingSources.length > 0) {
    risks.push(`Missing optional local source(s): ${missingSources.map((source) => source.path).join(', ')}`);
  }
  if (input.clients.some((client) => !isCommercialClient(client))) {
    risks.push('Demo/sample client records are excluded from booked MRR to avoid invented revenue.');
  }

  return risks;
}

function buildPropertyProgressScenarios(report: RevenueCommandCenterReport): PropertyProgressScenario[] {
  const livingCost = { min: 1000, max: 1500, cadence: 'monthly' } satisfies CurrencyRange;
  const scenarios = [
    { label: 'Current booked MRR', monthlyRevenueRange: { min: report.bookedMrr, max: report.bookedMrr, cadence: 'monthly' } satisfies CurrencyRange },
    { label: 'Initial Studio target', monthlyRevenueRange: { min: 3000, max: 5000, cadence: 'monthly' } satisfies CurrencyRange },
    { label: 'Next Studio target', monthlyRevenueRange: { min: 7000, max: 10000, cadence: 'monthly' } satisfies CurrencyRange },
    { label: 'Ambitious solo target', monthlyRevenueRange: { min: 10000, max: 15000, cadence: 'monthly' } satisfies CurrencyRange },
    { label: 'Exceptional target', monthlyRevenueRange: { min: 15000, max: 20000, cadence: 'monthly' } satisfies CurrencyRange },
  ];

  return scenarios.map((scenario) => {
    const monthlySurplusRange = {
      min: scenario.monthlyRevenueRange.min - livingCost.max,
      max: scenario.monthlyRevenueRange.max - livingCost.min,
      cadence: 'monthly',
    } satisfies CurrencyRange;

    return {
      ...scenario,
      monthlySurplusRange,
      estimatedTimeToFund: estimatedTimeToFund(100000, monthlySurplusRange),
    };
  });
}

function renderCurrentRevenue(report: RevenueCommandCenterReport): string {
  const retainerRows = report.activeRetainerClients.length === 0
    ? ['- No active commercial retainer clients recorded.']
    : report.activeRetainerClients.map((client) => `- ${client.companyName}: ${client.serviceType}, ${formatCurrency(client.monthlyFee)}/month`);
  const oneTimeRows = report.activeOneTimeClients.length === 0
    ? ['- No active one-time delivery clients recorded.']
    : report.activeOneTimeClients.map((client) => `- ${client.companyName}: ${client.serviceType}, monthly fee ${formatCurrency(client.monthlyFee)}`);

  return [
    `- Booked MRR: ${formatCurrency(report.bookedMrr)}`,
    `- Active commercial retainer clients: ${report.activeRetainerClients.length}`,
    `- Active commercial one-time/starter clients: ${report.activeOneTimeClients.length}`,
    `- Excluded demo/sample client records: ${report.excludedClientRecords.length}`,
    '',
    'Active retainers:',
    ...retainerRows,
    '',
    'Other active client work:',
    ...oneTimeRows,
  ].join('\n');
}

function renderPipelineTable(opportunities: RevenuePriorityOpportunity[]): string {
  if (opportunities.length === 0) return 'No commercial pipeline opportunities detected.';

  return [
    '| Company | Revenue Score | Probability | Offer | Audit Range | Monthly Range | Next Action |',
    '| --- | ---: | --- | --- | --- | --- | --- |',
    ...opportunities.map((opportunity) => `| ${escapeTable(opportunity.lead.companyName)} | ${opportunity.revenuePriorityScore} | ${opportunity.probability} | ${opportunity.lead.recommendedOffer} | ${formatRange(opportunity.estimatedAuditValueRange)} | ${formatRange(opportunity.estimatedMonthlyRange)} | ${escapeTable(opportunity.nextAction)} |`),
  ].join('\n');
}

function renderAuditTable(opportunities: RevenuePriorityOpportunity[]): string {
  if (opportunities.length === 0) return 'No audit opportunities in this group.';

  return [
    '| Company | Lead Score | Industry | Reason | Estimated Audit Value Range | Next Action | Suggested Command |',
    '| --- | ---: | --- | --- | --- | --- | --- |',
    ...opportunities.map((opportunity) => `| ${escapeTable(opportunity.lead.companyName)} | ${opportunity.lead.score} | ${escapeTable(opportunity.lead.industry)} | ${escapeTable(opportunity.reason)} | ${formatRange(opportunity.estimatedAuditValueRange)} | ${escapeTable(opportunity.nextAction)} | \`${escapeTable(opportunity.suggestedCommand)}\` |`),
  ].join('\n');
}

function renderRetainerTable(opportunities: RetainerOpportunity[]): string {
  if (opportunities.length === 0) return 'No retainer opportunities detected from local commercial leads.';

  return [
    '| Company | Retainer Type | Estimated Monthly Range | Priority | Why It May Fit | Next Action | Suggested Command |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...opportunities.map((opportunity) => `| ${escapeTable(opportunity.company)} | ${opportunity.retainerType} | ${formatRange(opportunity.estimatedMonthlyRange)} | ${opportunity.priority} | ${escapeTable(opportunity.whyItMayFit)} | ${escapeTable(opportunity.nextAction)} | \`${escapeTable(opportunity.suggestedCommand)}\` |`),
  ].join('\n');
}

function renderRenewalTable(opportunities: RenewalOpportunity[]): string {
  if (opportunities.length === 0) return 'No renewal opportunities detected from active commercial local retainer clients.';

  return [
    '| Client | Monthly Fee | Priority | Reason | Next Action | Suggested Command |',
    '| --- | ---: | --- | --- | --- | --- |',
    ...opportunities.map((opportunity) => `| ${escapeTable(opportunity.client.companyName)} | ${formatCurrency(opportunity.monthlyFee)} | ${opportunity.priority} | ${escapeTable(opportunity.reason)} | ${escapeTable(opportunity.nextAction)} | \`${escapeTable(opportunity.suggestedCommand)}\` |`),
  ].join('\n');
}

function renderExpansionTable(opportunities: ExpansionOpportunity[]): string {
  if (opportunities.length === 0) return 'No expansion opportunities detected from active local clients.';

  return [
    '| Client | Estimated Monthly Range | Priority | Reason | Next Action | Suggested Command |',
    '| --- | --- | --- | --- | --- | --- |',
    ...opportunities.map((opportunity) => `| ${escapeTable(opportunity.client.companyName)} | ${formatRange(opportunity.estimatedMonthlyRange)} | ${opportunity.priority} | ${escapeTable(opportunity.reason)} | ${escapeTable(opportunity.nextAction)} | \`${escapeTable(opportunity.suggestedCommand)}\` |`),
  ].join('\n');
}

function renderForecastTable(rows: ForecastScenario[]): string {
  return [
    '| Window | Scenario | Booked MRR | Estimated Pipeline Potential | Speculative Additional MRR | Speculative Projected MRR | Notes |',
    '| --- | --- | ---: | --- | --- | --- | --- |',
    ...rows.map((row) => `| ${row.window} | ${row.scenario} | ${formatCurrency(row.bookedMrr)} | ${formatRange(row.estimatedPipelinePotential)}/month | ${formatRange(row.speculativeAdditionalMrr)}/month | ${formatRange(row.speculativeProjectedMrr)}/month | ${escapeTable(row.notes.join(' '))} |`),
  ].join('\n');
}

function renderPropertyScenarioTable(rows: PropertyProgressScenario[]): string {
  return [
    '| Scenario | Monthly Revenue Range | Monthly Surplus Range | Estimated Time To Fund $100,000 |',
    '| --- | --- | --- | --- |',
    ...rows.map((row) => `| ${row.label} | ${formatRange(row.monthlyRevenueRange)}/month | ${formatRange(row.monthlySurplusRange)}/month | ${row.estimatedTimeToFund} |`),
  ].join('\n');
}

function renderActionList(actions: RevenueAction[]): string {
  if (actions.length === 0) return '- No revenue actions detected.';

  return actions
    .map((action) => [
      `- ${action.priority}. ${action.title}`,
      `  - Reason: ${action.reason}`,
      `  - Suggested command: \`${action.suggestedCommand}\``,
    ].join('\n'))
    .join('\n');
}

function suggestedCommands(report: RevenueCommandCenterReport): string[] {
  const commands = [
    'npm run outreach:operating-pack',
    commandIfLeadExists(report.auditOpportunities, 'pushpress', 'npm run contact:review -- --id pushpress'),
    commandIfLeadExists(report.auditOpportunities, 'teamup', 'npm run audit:pack -- --id teamup'),
    commandIfLeadExists(report.auditOpportunities, 'wodify', 'npm run audit:pack -- --id wodify'),
    commandIfLeadExists(report.auditOpportunities, 'abc-glofox', 'npm run lead:research -- --id abc-glofox'),
    commandIfLeadExists(report.auditOpportunities, 'bookee', 'npm run lead:research -- --id bookee'),
    'npm run pipeline:prioritize',
    'npm run mac:daily',
    'npm run dashboard',
  ].filter((command): command is string => Boolean(command));

  return Array.from(new Set(commands));
}

function commandIfLeadExists(opportunities: RevenuePriorityOpportunity[], leadId: string, command: string): string | undefined {
  return opportunities.some((opportunity) => opportunity.lead.id === leadId) ? command : undefined;
}

function detectArtifacts(leadId: string, hasContactReviewRecord: boolean, topOutreach: boolean): RevenueArtifacts {
  return {
    researchPack: exists(path.join('output', 'research', `${leadId}-research-pack.md`)),
    leadPack: exists(path.join('output', 'lead-packs', `${leadId}.md`)),
    auditPack: exists(path.join('output', 'audit-packs', leadId)),
    outreachPack: exists(path.join('output', 'outreach-packs', leadId)),
    topOutreach,
    contactReview: hasContactReviewRecord || exists(path.join('output', 'contact-reviews', leadId, 'contact-review.md')),
    sow: exists(path.join('output', 'sows', `${leadId}-sow.md`)),
    clientWorkflow: exists(path.join('output', 'client-workflows', leadId, 'discovery-call-prep.md'))
      || exists(path.join('output', 'client-workflows', leadId, 'audit-sale-plan.md'))
      || exists(path.join('output', 'client-workflows', leadId, 'onboarding-checklist.md'))
      || exists(path.join('output', 'client-workflows', leadId, 'delivery-plan.md'))
      || exists(path.join('output', 'client-workflows', leadId, 'retainer-conversion-plan.md')),
  };
}

function nextActionFor(lead: Lead, artifacts: RevenueArtifacts, contactReview: ContactReviewRecord | undefined): string {
  if (contactReview?.messageStatus === 'follow-up-needed' || contactReview?.nextFollowUpDate) return `Review follow-up context for ${lead.companyName} before any manual action.`;
  if (artifacts.sow && !artifacts.clientWorkflow) return `Prepare client workflow for ${lead.companyName}.`;
  if (artifacts.contactReview && !artifacts.sow) return `Review contact status and decide whether ${lead.companyName} needs an SOW.`;
  if (artifacts.outreachPack && !artifacts.contactReview) return `Generate contact review for ${lead.companyName}.`;
  if (artifacts.auditPack && !artifacts.outreachPack) return `Generate outreach pack for ${lead.companyName}.`;
  if (artifacts.leadPack && !artifacts.auditPack) return `Generate audit pack for ${lead.companyName}.`;
  if (artifacts.researchPack && !artifacts.leadPack) return `Generate lead pack for ${lead.companyName}.`;
  if (!artifacts.researchPack) return `Generate research pack for ${lead.companyName}.`;
  return lead.nextAction || `Review ${lead.companyName} manually.`;
}

function suggestedCommandFor(lead: Lead, artifacts: RevenueArtifacts, contactReview: ContactReviewRecord | undefined): string {
  if (contactReview?.messageStatus === 'follow-up-needed' || contactReview?.nextFollowUpDate) return `npm run contact:review -- --id ${lead.id}`;
  if (artifacts.sow && !artifacts.clientWorkflow) return `npm run client:prep -- --id ${lead.id}`;
  if (artifacts.contactReview && !artifacts.sow) return `npm run sow:generate -- --id ${lead.id}`;
  if (artifacts.outreachPack && !artifacts.contactReview) return `npm run contact:review -- --id ${lead.id}`;
  if (artifacts.auditPack && !artifacts.outreachPack) return `npm run outreach:pack -- --id ${lead.id}`;
  if (artifacts.leadPack && !artifacts.auditPack) return `npm run audit:pack -- --id ${lead.id}`;
  if (artifacts.researchPack && !artifacts.leadPack) return `npm run lead:pack -- --id ${lead.id}`;
  if (!artifacts.researchPack) return `npm run lead:research -- --id ${lead.id}`;
  return `npm run lead:pack -- --id ${lead.id}`;
}

function exclusionReasonsFor(lead: Lead): string[] {
  const reasons = getDemoLeadReasons(lead);
  if (lead.status === 'lost') reasons.push('status is lost');
  if (lead.status === 'paused') reasons.push('status is paused');
  if (lead.recommendedOffer === 'not-fit') reasons.push('recommendedOffer is not-fit');
  return Array.from(new Set(reasons));
}

function parseTopOutreachLeadIds(contextSources: RevenueContextSource[]): Set<string> {
  const topOutreach = contextSources.find((source) => source.path === path.join('output', 'outreach-operating', 'top-5-real-outreach.md'));
  if (!topOutreach?.exists) return new Set();

  const content = fs.readFileSync(path.join(process.cwd(), topOutreach.path), 'utf8');
  const ids = [...content.matchAll(/--id\s+([a-z0-9-]+)/gi)].map((match) => match[1]);
  return new Set(ids);
}

function conversionCountFor(window: ForecastWindowLabel, scenario: ForecastScenarioName): number {
  const table: Record<ForecastWindowLabel, Record<ForecastScenarioName, number>> = {
    '30 days': { conservative: 0, expected: 0, aggressive: 1 },
    '60 days': { conservative: 0, expected: 1, aggressive: 2 },
    '90 days': { conservative: 1, expected: 1, aggressive: 3 },
    '180 days': { conservative: 1, expected: 2, aggressive: 4 },
    '12 months': { conservative: 2, expected: 3, aggressive: 5 },
  };

  return table[window][scenario];
}

function findExpectedProjectedMrr(forecast: ForecastScenario[]): CurrencyRange {
  const expected90 = forecast.find((row) => row.scenario === 'expected' && row.window === '90 days');
  return expected90?.speculativeProjectedMrr ?? zeroMonthlyRange;
}

function estimatedTimeToFund(fundTarget: number, surplusRange: CurrencyRange): string {
  if (surplusRange.max <= 0) return 'Not fundable from this surplus scenario.';

  const fastestMonths = Math.ceil(fundTarget / surplusRange.max);
  const slowestMonths = surplusRange.min > 0 ? Math.ceil(fundTarget / surplusRange.min) : undefined;

  if (!slowestMonths) return `At least ${fastestMonths} months if the high surplus is sustained.`;
  return `${fastestMonths}-${slowestMonths} months if the surplus range is sustained.`;
}

function formatGap(currentMrr: number, targetMin: number, targetMax: number): string {
  const minGap = Math.max(0, targetMin - currentMrr);
  const maxGap = Math.max(0, targetMax - currentMrr);
  return `${formatCurrency(minGap)}-${formatCurrency(maxGap)}/month`;
}

function monthlyRangeFor(offer: RecommendedOffer): CurrencyRange {
  const range = offerRanges[offer];
  return range.cadence === 'monthly' ? range : zeroMonthlyRange;
}

function offerRevenueBoost(offer: RecommendedOffer): number {
  if (offer === 'qa-automation-retainer' || offer === 'agency-partner-retainer') return 18;
  if (offer === 'playwright-starter-pack') return 10;
  if (offer === 'qa-audit') return 7;
  return -100;
}

function probabilityFor(score: number): ProbabilityBand {
  if (score >= 80) return 'High probability';
  if (score >= 55) return 'Medium probability';
  return 'Low probability';
}

function prioritySort(a: ProbabilityBand, b: ProbabilityBand): number {
  const order: Record<ProbabilityBand, number> = {
    'High probability': 0,
    'Medium probability': 1,
    'Low probability': 2,
  };
  return order[a] - order[b];
}

function sortRevenueOpportunities(a: RevenuePriorityOpportunity, b: RevenuePriorityOpportunity): number {
  if (b.revenuePriorityScore !== a.revenuePriorityScore) return b.revenuePriorityScore - a.revenuePriorityScore;
  if (b.lead.score !== a.lead.score) return b.lead.score - a.lead.score;
  return a.lead.companyName.localeCompare(b.lead.companyName);
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

function isMonthlyService(serviceType: string): boolean {
  return serviceType === 'qa-automation-retainer' || serviceType === 'agency-partner-retainer';
}

function sumMonthlyRanges(ranges: CurrencyRange[]): CurrencyRange {
  return ranges.reduce<CurrencyRange>(
    (total, range) => ({
      min: total.min + range.min,
      max: total.max + range.max,
      cadence: 'monthly',
    }),
    { min: 0, max: 0, cadence: 'monthly' },
  );
}

function sumOneTimeRanges(ranges: CurrencyRange[]): CurrencyRange {
  return ranges.reduce<CurrencyRange>(
    (total, range) => ({
      min: total.min + range.min,
      max: total.max + range.max,
      cadence: 'one-time',
    }),
    { min: 0, max: 0, cadence: 'one-time' },
  );
}

function readJson<T>(relativePath: string, fallback: T): T {
  const absolutePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) return fallback;
  const raw = fs.readFileSync(absolutePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function readContextSource(label: string, relativePath: string): RevenueContextSource {
  const absolutePath = path.join(process.cwd(), relativePath);
  const exists = fs.existsSync(absolutePath);
  const content = exists ? fs.readFileSync(absolutePath, 'utf8') : '';

  return {
    label,
    path: relativePath,
    exists,
    excerpt: summarizeMarkdown(content),
  };
}

function summarizeMarkdown(content: string): string {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('|') && !line.startsWith('---'))
    .slice(0, 4)
    .join(' ');
}

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function formatRange(range: CurrencyRange): string {
  return `${formatCurrency(range.min)}-${formatCurrency(range.max)}`;
}

function formatCurrency(value: number): string {
  const sign = value < 0 ? '-' : '';
  return `${sign}$${Math.abs(value).toLocaleString('en-US')}`;
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
