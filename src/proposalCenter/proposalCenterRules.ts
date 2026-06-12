import fs = require('fs');
import path = require('path');
import { buildCommercialModeSummary } from '../commercialMode/commercialModeRules';
import { ContactReviewRecord } from '../contactReview/types';
import { Lead, RecommendedOffer } from '../leads/types';
import {
  OfferPricingRanges,
  ProposalArtifacts,
  ProposalCenterInput,
  ProposalCenterReport,
  ProposalContextSource,
  ProposalOfferType,
  ProposalOpportunity,
  ProposalReadinessStatus,
  RecommendedOfferMap,
} from './types';

const outputRoot = path.join(process.cwd(), 'output', 'proposal-center');

const pricingRanges: OfferPricingRanges = {
  'QA Audit': 'QA Audit: $199-$500',
  'Playwright Starter Pack': 'Playwright Starter Pack: $900-$1,500',
  'QA Automation Retainer': 'QA Automation Retainer: $1,500-$3,000/month',
};

const offerMap: RecommendedOfferMap = {
  'qa-audit': 'QA Audit',
  'playwright-starter-pack': 'Playwright Starter Pack',
  'qa-automation-retainer': 'QA Automation Retainer',
  'agency-partner-retainer': 'QA Automation Retainer',
  'not-fit': 'QA Audit',
};

const manualApprovalReminder = [
  'Human approval is required before sending proposals, SOWs, outreach, follow-ups, invoices, or payment requests.',
  'This command center uses local Studio data only.',
  'Opportunities are not booked revenue.',
  'Do not invent clients, contacts, findings, metrics, ROI, scope, approvals, or outcomes.',
  'No APIs, scraping, browsing, CRM, outreach automation, email sending, payments, credentials, or external databases were used.',
];

export function loadProposalCenterInput(): ProposalCenterInput {
  const generatedAt = new Date().toISOString();

  return {
    generatedAt,
    leads: readJson<Lead[]>(path.join('data', 'leads.json'), []),
    contactReviews: readJson<ContactReviewRecord[]>(path.join('data', 'contact-reviews.json'), []),
    contextSources: [
      readContextSource('Leads', path.join('data', 'leads.json')),
      readContextSource('Contact reviews', path.join('data', 'contact-reviews.json')),
      readContextSource('Real client readiness pack', path.join('output', 'real-client-readiness', 'real-client-readiness-pack.md')),
      readContextSource('First audit sales pack', path.join('output', 'real-client-readiness', 'first-audit-sales-pack.md')),
      readContextSource('Sprint 40 SOW readiness', path.join('output', 'real-client-readiness', 'sow-readiness.md')),
      readContextSource('Revenue command center', path.join('output', 'revenue-command-center', 'revenue-command-center.md')),
      readContextSource('Top 5 real outreach', path.join('output', 'outreach-operating', 'top-5-real-outreach.md')),
      readContextSource('Commercial prioritized pipeline', path.join('output', 'pipeline-prioritization', 'commercial-prioritized-pipeline.md')),
    ],
  };
}

export function buildProposalCenterReport(input: ProposalCenterInput): ProposalCenterReport {
  const commercialSummary = buildCommercialModeSummary(input.leads);
  const commercialLeadIds = new Set(commercialSummary.commercialLeads.map((lead) => lead.id));
  const contactReviews = input.contactReviews.filter((review) => commercialLeadIds.has(review.leadId));
  const contactReviewByLeadId = new Map(contactReviews.map((review) => [review.leadId, review]));
  const topOutreachLeadIds = parseTopOutreachLeadIds(input.contextSources);
  const topOutreachLeadIdSet = new Set(topOutreachLeadIds);
  const opportunities = commercialSummary.commercialLeads
    .map((lead) => buildOpportunity(lead, contactReviewByLeadId.get(lead.id), topOutreachLeadIdSet.has(lead.id)))
    .filter((opportunity) => opportunity.proposalPriorityScore > 0)
    .sort(sortOpportunities);

  const topFive = selectTopFiveCommercialLeads(opportunities, topOutreachLeadIds);

  return {
    generatedAt: input.generatedAt,
    totalLeads: input.leads.length,
    commercialLeads: commercialSummary.commercialLeads.length,
    excludedLeads: commercialSummary.demoLeads.length,
    opportunities,
    topFive,
    proposalReady: opportunities.filter((opportunity) => opportunity.readinessStatus === 'READY'),
    auditOfferCandidates: opportunities.filter((opportunity) => opportunity.offerType === 'QA Audit' || opportunity.auditEvidenceStatus !== 'No audit evidence yet').slice(0, 10),
    starterPackCandidates: opportunities.filter((opportunity) => opportunity.offerType === 'Playwright Starter Pack').slice(0, 10),
    retainerCandidates: opportunities.filter((opportunity) => opportunity.retainerFit !== 'NOT READY').slice(0, 10),
    contextSources: input.contextSources,
  };
}

export function writeProposalCenterOutputs(report: ProposalCenterReport): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });

  const outputs = [
    { fileName: 'proposal-command-center.md', body: renderProposalCommandCenter(report) },
    { fileName: 'sow-readiness-report.md', body: renderSowReadinessReport(report) },
    { fileName: 'proposal-priority-list.md', body: renderProposalPriorityList(report) },
    { fileName: 'pricing-recommendations.md', body: renderPricingRecommendations(report) },
    { fileName: 'approval-checklist.md', body: renderApprovalChecklist(report) },
  ];

  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }

  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

export function writeSowCenterOutput(report: ProposalCenterReport): string {
  fs.mkdirSync(outputRoot, { recursive: true });
  const outputPath = path.join(outputRoot, 'sow-readiness-report.md');
  fs.writeFileSync(outputPath, renderSowReadinessReport(report), 'utf8');
  return outputPath;
}

export function renderProposalCommandCenter(report: ProposalCenterReport): string {
  return [
    '# Proposal Command Center',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Executive Summary',
    renderList([
      `Total leads reviewed: ${report.totalLeads}`,
      `Commercial leads eligible: ${report.commercialLeads}`,
      `Excluded demo/sample/not-fit/paused/lost leads: ${report.excludedLeads}`,
      `Proposal-ready leads: ${report.proposalReady.length}`,
      `Top proposal opportunities: ${report.topFive.length}`,
      'Proposal and SOW outputs are preparation only, not sent assets.',
    ]),
    '',
    '## Proposal-Ready Leads',
    renderOpportunityTable(report.proposalReady.slice(0, 10)),
    '',
    '## Audit Offer Candidates',
    renderOpportunityTable(report.auditOfferCandidates),
    '',
    '## Starter Pack Candidates',
    renderOpportunityTable(report.starterPackCandidates),
    '',
    '## Retainer Candidates',
    renderOpportunityTable(report.retainerCandidates),
    '',
    '## Missing Requirements',
    renderMissingRequirements(report.topFive),
    '',
    '## Suggested Commands',
    renderList(suggestedCommands(report.topFive).map((command) => `\`${command}\``)),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderSowReadinessReport(report: ProposalCenterReport): string {
  return [
    '# SOW Readiness Report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    report.topFive.length === 0 ? 'No Top 5 commercial leads available.' : renderSowReadinessTable(report.topFive),
    '',
    '## Readiness Rules',
    renderList([
      'READY: audit evidence, contact review, and enough local scope context exist to review or generate a SOW.',
      'PARTIAL: some assets exist but scope, contact, or audit evidence is incomplete.',
      'NOT READY: research/audit/contact context is too thin for SOW work.',
    ]),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderProposalPriorityList(report: ProposalCenterReport): string {
  return [
    '# Proposal Priority List',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'Ranking factors: commercial lead, readiness score, audit pack exists, contact review exists, SOW readiness, revenue potential, and retainer fit.',
    '',
    renderPriorityTable(report.opportunities.slice(0, 20)),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderPricingRecommendations(report: ProposalCenterReport): string {
  return [
    '# Pricing Recommendations',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Approved Pricing Ranges',
    renderList([
      pricingRanges['QA Audit'],
      pricingRanges['Playwright Starter Pack'],
      pricingRanges['QA Automation Retainer'],
    ]),
    '',
    '## Top 5 Recommended Pricing Paths',
    renderPricingTable(report.topFive),
    '',
    '## Pricing Rules',
    renderList([
      'Opportunities are not booked revenue.',
      'Pricing requires Daniel approval.',
      'No guaranteed outcomes, ROI, production readiness, compliance, accessibility certification, or complete coverage claims.',
      'Use the smallest credible paid step when scope or evidence is incomplete.',
    ]),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderApprovalChecklist(_report: ProposalCenterReport): string {
  return [
    '# Approval Checklist',
    '',
    renderChecklist([
      'company verified',
      'website verified',
      'scope reviewed',
      'no fake findings',
      'no fake metrics',
      'no unsupported ROI claims',
      'pricing reviewed',
      'Daniel approval required before sending',
    ]),
    '',
    '## Safety Checks',
    renderChecklist([
      'no APIs used',
      'no scraping used',
      'no browsing automation used',
      'no CRM action taken',
      'no outreach automation used',
      'no email sent',
      'no payment action taken',
      'no credentials used',
      'no invented clients, contacts, findings, metrics, or approvals',
    ]),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

function buildOpportunity(lead: Lead, contactReview: ContactReviewRecord | undefined, isTopOutreach: boolean): ProposalOpportunity {
  const artifacts = detectArtifacts(lead.id, Boolean(contactReview));
  const offerType = offerMap[lead.recommendedOffer];
  const sowReadiness = sowStatusFor(artifacts, lead);
  const scopeClarity = scopeClarityFor(lead, artifacts);
  const retainerFit = retainerFitFor(lead.recommendedOffer);
  const priority = scoreProposalOpportunity(lead, artifacts, contactReview, isTopOutreach, sowReadiness, retainerFit);
  const missingRequirements = missingRequirementsFor(artifacts, lead, contactReview);

  return {
    lead,
    contactReview,
    artifacts,
    proposalPriorityScore: priority.score,
    readinessStatus: readinessStatusFor(priority.score, artifacts, contactReview),
    offerType,
    scopeClarity,
    auditEvidenceStatus: auditEvidenceStatusFor(artifacts),
    contactStatus: contactStatusFor(contactReview, artifacts),
    sowReadiness,
    revenuePotential: pricingRanges[offerType],
    retainerFit,
    missingRequirements,
    nextRequiredStep: nextRequiredStepFor(lead, artifacts, contactReview),
    suggestedCommand: suggestedCommandFor(lead, artifacts, contactReview),
    scoreReasons: priority.reasons,
  };
}

function scoreProposalOpportunity(
  lead: Lead,
  artifacts: ProposalArtifacts,
  contactReview: ContactReviewRecord | undefined,
  isTopOutreach: boolean,
  sowReadiness: ProposalReadinessStatus,
  retainerFit: ProposalReadinessStatus,
): { score: number; reasons: string[] } {
  const reasons: string[] = ['commercial lead'];
  let score = 20;

  score += Math.min(Math.max(lead.score, 0), 10) * 4;
  reasons.push(`lead score ${lead.score}/10`);

  if (lead.status !== 'paused' && lead.status !== 'lost') {
    score += 10;
    reasons.push('not paused or lost');
  }
  if (lead.recommendedOffer !== 'not-fit') {
    score += 10;
    reasons.push('revenue fit');
  }
  if (artifacts.auditPack) {
    score += 12;
    reasons.push('audit pack exists');
  }
  if (artifacts.contactReview || contactReview) {
    score += 12;
    reasons.push('contact review exists');
  }
  if (artifacts.sow) {
    score += 8;
    reasons.push('SOW exists');
  }
  if (artifacts.clientWorkflow) {
    score += 6;
    reasons.push('client workflow exists');
  }
  if (sowReadiness === 'READY') score += 10;
  if (sowReadiness === 'PARTIAL') score += 5;
  if (retainerFit === 'READY') score += 8;
  if (retainerFit === 'PARTIAL') score += 4;
  if (isTopOutreach) {
    score += 5;
    reasons.push('top 5 outreach signal');
  }

  return { score: Math.min(100, Math.round(score)), reasons };
}

function detectArtifacts(leadId: string, hasContactReview: boolean): ProposalArtifacts {
  return {
    researchPack: exists(path.join('output', 'research', `${leadId}-research-pack.md`)),
    leadPack: exists(path.join('output', 'lead-packs', `${leadId}.md`)),
    auditPack: exists(path.join('output', 'audit-packs', leadId)),
    outreachPack: exists(path.join('output', 'outreach-packs', leadId)),
    contactReview: hasContactReview || exists(path.join('output', 'contact-reviews', leadId, 'contact-review.md')),
    clientWorkflow: exists(path.join('output', 'client-workflows', leadId, 'discovery-call-prep.md'))
      || exists(path.join('output', 'client-workflows', leadId, 'audit-sale-plan.md'))
      || exists(path.join('output', 'client-workflows', leadId, 'retainer-conversion-plan.md')),
    sow: exists(path.join('output', 'sows', `${leadId}-sow.md`)),
  };
}

function sowStatusFor(artifacts: ProposalArtifacts, lead: Lead): ProposalReadinessStatus {
  if (artifacts.sow || (artifacts.auditPack && artifacts.contactReview && scopeClarityFor(lead, artifacts) !== 'NOT READY')) return 'READY';
  if (artifacts.leadPack || artifacts.auditPack || artifacts.contactReview || artifacts.clientWorkflow) return 'PARTIAL';
  return 'NOT READY';
}

function readinessStatusFor(
  score: number,
  artifacts: ProposalArtifacts,
  contactReview: ContactReviewRecord | undefined,
): ProposalReadinessStatus {
  if (score >= 80 && artifacts.auditPack && (artifacts.contactReview || contactReview)) return 'READY';
  if (score >= 50) return 'PARTIAL';
  return 'NOT READY';
}

function scopeClarityFor(lead: Lead, artifacts: ProposalArtifacts): ProposalReadinessStatus {
  if (artifacts.sow || artifacts.clientWorkflow || artifacts.auditPack) return 'READY';
  if (lead.painPoints.length > 0 && (artifacts.researchPack || artifacts.leadPack)) return 'PARTIAL';
  return 'NOT READY';
}

function retainerFitFor(offer: RecommendedOffer): ProposalReadinessStatus {
  if (offer === 'qa-automation-retainer' || offer === 'agency-partner-retainer') return 'READY';
  if (offer === 'playwright-starter-pack') return 'PARTIAL';
  return 'NOT READY';
}

function auditEvidenceStatusFor(artifacts: ProposalArtifacts): string {
  if (artifacts.auditPack) return 'Audit pack exists';
  if (artifacts.leadPack) return 'Lead pack exists; audit evidence needed';
  if (artifacts.researchPack) return 'Research exists; audit evidence needed';
  return 'No audit evidence yet';
}

function contactStatusFor(contactReview: ContactReviewRecord | undefined, artifacts: ProposalArtifacts): string {
  if (contactReview) return `Contact review ${contactReview.messageStatus}`;
  if (artifacts.contactReview) return 'Contact review exists';
  if (artifacts.outreachPack) return 'Outreach pack exists; contact review needed';
  return 'Contact review needed';
}

function missingRequirementsFor(
  artifacts: ProposalArtifacts,
  lead: Lead,
  contactReview: ContactReviewRecord | undefined,
): string[] {
  const missing: string[] = [];
  if (!artifacts.researchPack) missing.push('Research pack');
  if (!artifacts.leadPack) missing.push('Lead pack');
  if (!artifacts.auditPack) missing.push('Audit pack');
  if (!artifacts.contactReview && !contactReview) missing.push('Contact review');
  if (scopeClarityFor(lead, artifacts) === 'NOT READY') missing.push('Scope clarity');
  if (!artifacts.sow) missing.push('SOW draft');
  return missing;
}

function nextRequiredStepFor(lead: Lead, artifacts: ProposalArtifacts, contactReview: ContactReviewRecord | undefined): string {
  if (!artifacts.researchPack) return `Generate research pack for ${lead.companyName}.`;
  if (!artifacts.leadPack) return `Generate lead pack for ${lead.companyName}.`;
  if (!artifacts.auditPack) return `Generate audit pack for ${lead.companyName}.`;
  if (!artifacts.contactReview || !contactReview) return `Generate contact review for ${lead.companyName}.`;
  if (!artifacts.clientWorkflow) return `Prepare client prep for ${lead.companyName}.`;
  if (!artifacts.sow) return `Generate SOW draft for ${lead.companyName}.`;
  return `Review proposal and SOW approval checklist for ${lead.companyName}.`;
}

function suggestedCommandFor(lead: Lead, artifacts: ProposalArtifacts, contactReview: ContactReviewRecord | undefined): string {
  if (!artifacts.researchPack) return `npm run lead:research -- --id ${lead.id}`;
  if (!artifacts.leadPack) return `npm run lead:pack -- --id ${lead.id}`;
  if (!artifacts.auditPack) return `npm run audit:pack -- --id ${lead.id}`;
  if (!artifacts.contactReview || !contactReview) return `npm run contact:review -- --id ${lead.id}`;
  if (!artifacts.clientWorkflow) return `npm run client:prep -- --id ${lead.id}`;
  if (!artifacts.sow) return `npm run sow:generate -- --id ${lead.id}`;
  return `npm run sow:generate -- --id ${lead.id}`;
}

function renderOpportunityTable(opportunities: ProposalOpportunity[]): string {
  if (opportunities.length === 0) return 'No opportunities in this group.';

  return [
    '| Company | Score | Status | Offer Type | SOW Readiness | Revenue Potential | Next Required Step | Suggested Command |',
    '| --- | ---: | --- | --- | --- | --- | --- | --- |',
    ...opportunities.map((opportunity) => `| ${escapeTable(opportunity.lead.companyName)} | ${opportunity.proposalPriorityScore} | ${opportunity.readinessStatus} | ${opportunity.offerType} | ${opportunity.sowReadiness} | ${opportunity.revenuePotential} | ${escapeTable(opportunity.nextRequiredStep)} | \`${escapeTable(opportunity.suggestedCommand)}\` |`),
  ].join('\n');
}

function renderSowReadinessTable(opportunities: ProposalOpportunity[]): string {
  return [
    '| Company | Readiness Status | Offer Type | Scope Clarity | Audit Evidence Status | Contact Status | Next Required Step | Suggested Command |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...opportunities.map((opportunity) => `| ${escapeTable(opportunity.lead.companyName)} | ${opportunity.sowReadiness} | ${opportunity.offerType} | ${opportunity.scopeClarity} | ${escapeTable(opportunity.auditEvidenceStatus)} | ${escapeTable(opportunity.contactStatus)} | ${escapeTable(opportunity.nextRequiredStep)} | \`${escapeTable(opportunity.suggestedCommand)}\` |`),
  ].join('\n');
}

function renderPriorityTable(opportunities: ProposalOpportunity[]): string {
  if (opportunities.length === 0) return 'No proposal opportunities detected.';

  return [
    '| Rank | Company | Score | Readiness | Audit Pack | Contact Review | SOW Readiness | Revenue Potential | Retainer Fit | Suggested Command |',
    '| ---: | --- | ---: | --- | --- | --- | --- | --- | --- | --- |',
    ...opportunities.map((opportunity, index) => `| ${index + 1} | ${escapeTable(opportunity.lead.companyName)} | ${opportunity.proposalPriorityScore} | ${opportunity.readinessStatus} | ${yesNo(opportunity.artifacts.auditPack)} | ${yesNo(opportunity.artifacts.contactReview)} | ${opportunity.sowReadiness} | ${opportunity.revenuePotential} | ${opportunity.retainerFit} | \`${escapeTable(opportunity.suggestedCommand)}\` |`),
  ].join('\n');
}

function renderPricingTable(opportunities: ProposalOpportunity[]): string {
  if (opportunities.length === 0) return 'No Top 5 commercial opportunities available.';

  return [
    '| Company | Recommended Pricing Path | Range | Approval Note |',
    '| --- | --- | --- | --- |',
    ...opportunities.map((opportunity) => {
      const pricingPath = pricingPathFor(opportunity);
      return `| ${escapeTable(opportunity.lead.companyName)} | ${pricingPath} | ${pricingRanges[pricingPath]} | Daniel must approve pricing before sending. |`;
    }),
  ].join('\n');
}

function renderMissingRequirements(opportunities: ProposalOpportunity[]): string {
  if (opportunities.length === 0) return '- No proposal opportunities detected.';

  return opportunities.map((opportunity) => {
    const missing = opportunity.missingRequirements.length ? opportunity.missingRequirements.join(', ') : 'None';
    return `- ${opportunity.lead.companyName}: ${missing}`;
  }).join('\n');
}

function suggestedCommands(opportunities: ProposalOpportunity[]): string[] {
  const preferred = [
    commandForLead(opportunities, 'pushpress', 'npm run sow:generate -- --id pushpress'),
    commandForLead(opportunities, 'pushpress', 'npm run client:prep -- --id pushpress'),
    commandForLead(opportunities, 'pushpress', 'npm run contact:review -- --id pushpress'),
    commandForLead(opportunities, 'teamup', 'npm run audit:pack -- --id teamup'),
    commandForLead(opportunities, 'wodify', 'npm run audit:pack -- --id wodify'),
    commandForLead(opportunities, 'abc-glofox', 'npm run lead:research -- --id abc-glofox'),
    commandForLead(opportunities, 'bookee', 'npm run lead:research -- --id bookee'),
    'npm run revenue:command-center',
    'npm run mac:daily',
  ].filter((command): command is string => Boolean(command));

  return [...new Set(preferred.length > 2 ? preferred : [...opportunities.map((opportunity) => opportunity.suggestedCommand), ...preferred])];
}

function commandForLead(opportunities: ProposalOpportunity[], leadId: string, command: string): string | undefined {
  return opportunities.some((opportunity) => opportunity.lead.id === leadId) ? command : undefined;
}

function pricingPathFor(opportunity: ProposalOpportunity): ProposalOfferType {
  if (opportunity.readinessStatus === 'READY' && opportunity.sowReadiness === 'READY') return opportunity.offerType;
  if (opportunity.artifacts.auditPack && opportunity.scopeClarity !== 'NOT READY') return 'Playwright Starter Pack';
  return 'QA Audit';
}

function selectTopFiveCommercialLeads(
  opportunities: ProposalOpportunity[],
  topOutreachLeadIds: string[],
): ProposalOpportunity[] {
  if (topOutreachLeadIds.length === 0) return opportunities.slice(0, 5);

  const byLeadId = new Map(opportunities.map((opportunity) => [opportunity.lead.id, opportunity]));
  const selected = topOutreachLeadIds
    .map((leadId) => byLeadId.get(leadId))
    .filter((opportunity): opportunity is ProposalOpportunity => Boolean(opportunity));

  if (selected.length >= 5) return selected.slice(0, 5);

  const selectedIds = new Set(selected.map((opportunity) => opportunity.lead.id));
  const fallback = opportunities.filter((opportunity) => !selectedIds.has(opportunity.lead.id));
  return [...selected, ...fallback].slice(0, 5);
}

function parseTopOutreachLeadIds(contextSources: ProposalContextSource[]): string[] {
  const source = contextSources.find((candidate) => candidate.path === path.join('output', 'outreach-operating', 'top-5-real-outreach.md'));
  if (!source?.exists) return [];

  const content = fs.readFileSync(path.join(process.cwd(), source.path), 'utf8');
  return [...content.matchAll(/--id\s+([a-z0-9-]+)/gi)].map((match) => match[1]);
}

function sortOpportunities(a: ProposalOpportunity, b: ProposalOpportunity): number {
  if (b.proposalPriorityScore !== a.proposalPriorityScore) return b.proposalPriorityScore - a.proposalPriorityScore;
  if (b.lead.score !== a.lead.score) return b.lead.score - a.lead.score;
  return a.lead.companyName.localeCompare(b.lead.companyName);
}

function readJson<T>(relativePath: string, fallback: T): T {
  const absolutePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) return fallback;
  const raw = fs.readFileSync(absolutePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function readContextSource(label: string, relativePath: string): ProposalContextSource {
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

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function renderChecklist(items: string[]): string {
  return items.map((item) => `- [ ] ${item}`).join('\n');
}

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

function yesNo(value: boolean): string {
  return value ? 'Yes' : 'No';
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
