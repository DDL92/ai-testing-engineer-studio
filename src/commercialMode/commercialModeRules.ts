import { ContactReviewRecord } from '../contactReview/types';
import { Lead } from '../leads/types';
import { buildOpportunityTracker } from '../pipeline/pipelineRules';
import { OpportunityItem } from '../pipeline/types';
import { CommercialLeadDecision, CommercialModeInput, CommercialModeReport, CommercialModeSummary } from './types';

export function getDemoLeadReasons(lead: Lead): string[] {
  const reasons: string[] = [];
  const companyName = lead.companyName.toLowerCase();
  const website = lead.website.toLowerCase();
  const source = lead.source.toLowerCase();

  if (lead.id.startsWith('sample-')) reasons.push('id starts with sample-');
  if (website.includes('.example')) reasons.push('website contains .example');
  if (source.includes('sample')) reasons.push('source contains sample');
  if (companyName.includes('demo')) reasons.push('company contains Demo');
  if (companyName.includes('sandbox')) reasons.push('company contains Sandbox');
  if (companyName.includes('test')) reasons.push('company contains Test');
  if (lead.status === 'paused') reasons.push('status is paused');
  if (lead.status === 'lost') reasons.push('status is lost');
  if (lead.recommendedOffer === 'not-fit') reasons.push('recommendedOffer is not-fit');

  return reasons;
}

export function isDemoLead(lead: Lead): boolean {
  return getDemoLeadReasons(lead).length > 0;
}

export function isCommercialLead(lead: Lead): boolean {
  return !isDemoLead(lead);
}

export function buildCommercialModeSummary(leads: Lead[]): CommercialModeSummary {
  const decisions = leads.map((lead): CommercialLeadDecision => {
    const reasons = getDemoLeadReasons(lead);
    return {
      lead,
      isCommercial: reasons.length === 0,
      reasons,
    };
  });
  const commercialLeads = decisions.filter((decision) => decision.isCommercial).map((decision) => decision.lead);
  const demoLeads = decisions.filter((decision) => !decision.isCommercial);

  return {
    totalLeads: leads.length,
    commercialLeads,
    demoLeads,
    commercialPercentage: leads.length === 0 ? 0 : Math.round((commercialLeads.length / leads.length) * 100),
  };
}

export function filterCommercialLeads(leads: Lead[]): Lead[] {
  return leads.filter(isCommercialLead);
}

export function filterCommercialContactReviews(contactReviews: ContactReviewRecord[], commercialLeads: Lead[]): ContactReviewRecord[] {
  const commercialLeadIds = new Set(commercialLeads.map((lead) => lead.id));
  return contactReviews.filter((review) => commercialLeadIds.has(review.leadId));
}

export function buildCommercialModeReport(input: CommercialModeInput): CommercialModeReport {
  const summary = buildCommercialModeSummary(input.leads);
  const commercialContactReviews = filterCommercialContactReviews(input.contactReviews, summary.commercialLeads);
  const tracker = buildOpportunityTracker(summary.commercialLeads, commercialContactReviews);

  return {
    generatedAt: input.generatedAt,
    summary,
    topCommercialOpportunities: tracker.topOpportunities.slice(0, 10),
    topCommercialActions: tracker.topOpportunities.slice(0, 5).map((item) => `${item.lead.companyName}: ${item.nextAction}`),
  };
}

export function renderDemoIsolationReport(report: CommercialModeReport): string {
  const summary = report.summary;

  return [
    '# Demo Isolation Report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Total Leads',
    `${summary.totalLeads}`,
    '',
    '## Commercial Leads',
    `${summary.commercialLeads.length}`,
    '',
    '## Excluded Demo Leads',
    `${summary.demoLeads.length}`,
    '',
    '## Excluded List',
    renderExcludedTable(summary.demoLeads),
    '',
    '## Reason Excluded',
    summary.demoLeads.length === 0
      ? '- No demo/sample leads excluded.'
      : summary.demoLeads.map((decision) => `- ${decision.lead.companyName}: ${decision.reasons.join('; ')}`).join('\n'),
    '',
    '## Commercial Percentage',
    `${summary.commercialPercentage}%`,
    '',
    '## Manual Review Reminder',
    renderList(manualReviewRules()),
    '',
  ].join('\n');
}

export function renderCommercialModeSummary(report: CommercialModeReport): string {
  const summary = report.summary;

  return [
    '# Commercial Mode Summary',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    `- Total leads: ${summary.totalLeads}`,
    `- Commercial leads: ${summary.commercialLeads.length}`,
    `- Demo leads: ${summary.demoLeads.length}`,
    `- Commercial percentage: ${summary.commercialPercentage}%`,
    '',
    '## Top 10 Commercial Opportunities',
    renderOpportunityTable(report.topCommercialOpportunities),
    '',
    '## Top 5 Commercial Actions',
    report.topCommercialActions.length === 0
      ? '- No commercial actions currently available.'
      : renderList(report.topCommercialActions),
    '',
    '## Manual Review Reminder',
    renderList(manualReviewRules()),
    '',
  ].join('\n');
}

export function renderCommercialDashboardMarkdown(input: {
  generatedAt: string;
  totalLeads: number;
  commercialLeads: Lead[];
  demoLeads: CommercialLeadDecision[];
  opportunities: OpportunityItem[];
  activeClients: number;
}): string {
  const topFive = input.opportunities.slice(0, 5);
  const pipelineHealth = buildPipelineHealth(input.opportunities);

  return [
    '# Commercial Dashboard',
    '',
    `Generated: ${input.generatedAt}`,
    '',
    '## Commercial Summary',
    `- Total leads: ${input.totalLeads}`,
    `- Commercial leads: ${input.commercialLeads.length}`,
    `- Excluded demo leads: ${input.demoLeads.length}`,
    `- Active clients: ${input.activeClients}`,
    `- Top commercial opportunities: ${topFive.length}`,
    '',
    '## Eligible Commercial Leads',
    input.commercialLeads.length === 0
      ? '- No eligible commercial leads found.'
      : input.commercialLeads.slice(0, 20).map((lead) => `- ${lead.companyName}: ${lead.score}/10, ${lead.recommendedOffer}, ${lead.status}`).join('\n'),
    '',
    '## Excluded Demo Leads',
    input.demoLeads.length === 0
      ? '- No demo/sample leads excluded.'
      : input.demoLeads.map((decision) => `- ${decision.lead.companyName}: ${decision.reasons.join('; ')}`).join('\n'),
    '',
    '## Real Revenue Opportunities',
    renderOpportunityTable(input.opportunities.slice(0, 10)),
    '',
    '## Top 5 Commercial Opportunities',
    renderOpportunityTable(topFive),
    '',
    '## Commercial Pipeline Health',
    renderList(pipelineHealth),
    '',
    '## Renewal Watchlist',
    '- Review active client renewal reports only after evidence and report readiness are confirmed.',
    '',
    '## Expansion Watchlist',
    '- Review expansion paths only after Daniel confirms scope, evidence, and current client context.',
    '',
    '## Manual Review Reminder',
    renderList(manualReviewRules()),
    '',
  ].join('\n');
}

export function renderCommercialRevenueVisibility(input: {
  generatedAt: string;
  activeClients: number;
  opportunities: OpportunityItem[];
  tierAEstimate: { min: number; max: number };
  tierBEstimate: { min: number; max: number };
}): string {
  return [
    '# Commercial Revenue Visibility',
    '',
    `Generated: ${input.generatedAt}`,
    '',
    '## Active Clients',
    `- Active clients: ${input.activeClients}`,
    '',
    '## Commercial Opportunities',
    renderOpportunityTable(input.opportunities.slice(0, 10)),
    '',
    '## Opportunity Estimates',
    `- Tier A commercial estimate: ${formatRange(input.tierAEstimate)}`,
    `- Tier B commercial estimate: ${formatRange(input.tierBEstimate)}`,
    '- These are opportunity ranges, not booked revenue.',
    '',
    '## Renewal Opportunities',
    '- Use local renewal reports only. Do not infer renewal probability from this report.',
    '',
    '## Expansion Opportunities',
    '- Use local expansion reports only. Do not claim ROI, client satisfaction, or business impact without evidence.',
    '',
    '## Manual Review Reminder',
    renderList(manualReviewRules()),
    '',
  ].join('\n');
}

function buildPipelineHealth(opportunities: OpportunityItem[]): string[] {
  return [
    `Commercial opportunities: ${opportunities.length}`,
    `Follow-ups: ${opportunities.filter((item) => item.pipelineStage === 'FOLLOW_UP').length}`,
    `Client-ready: ${opportunities.filter((item) => item.pipelineStage === 'CLIENT_READY').length}`,
    `New leads needing research: ${opportunities.filter((item) => item.pipelineStage === 'NEW_LEAD').length}`,
  ];
}

function renderExcludedTable(decisions: CommercialLeadDecision[]): string {
  if (decisions.length === 0) return 'No demo/sample leads excluded.';

  return [
    '| Lead | Score | Offer | Reason Excluded |',
    '| --- | ---: | --- | --- |',
    ...decisions.map((decision) => `| ${escapeTable(decision.lead.companyName)} | ${decision.lead.score} | ${decision.lead.recommendedOffer} | ${escapeTable(decision.reasons.join('; '))} |`),
  ].join('\n');
}

function renderOpportunityTable(items: OpportunityItem[]): string {
  if (items.length === 0) return 'No commercial opportunities found.';

  return [
    '| Company | Score | Stage | Offer | Next Action |',
    '| --- | ---: | --- | --- | --- |',
    ...items.map((item) => `| ${escapeTable(item.lead.companyName)} | ${item.opportunityScore} | ${item.pipelineStage} | ${item.lead.recommendedOffer} | ${escapeTable(item.nextAction)} |`),
  ].join('\n');
}

function manualReviewRules(): string[] {
  return [
    'Commercial Mode uses local deterministic filtering only.',
    'Demo/sample data remains available for testing but is excluded from revenue-facing reporting.',
    'Do not send outreach, proposals, reports, invoices, or client communication without Daniel approval.',
    'No APIs, scraping, browsing, CRM integrations, outreach automation, payments, credentials, or external databases are used.',
  ];
}

function renderList(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function formatRange(range: { min: number; max: number }): string {
  return `$${range.min.toLocaleString('en-US')}-$${range.max.toLocaleString('en-US')}`;
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|');
}
