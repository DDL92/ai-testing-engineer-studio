import fs = require('fs');
import path = require('path');
import { Client } from '../clientReports/types';
import { ContactReviewRecord } from '../contactReview/types';
import { Lead, RecommendedOffer } from '../leads/types';
import { getRevenueSourceOfTruth } from '../revenueIntelligence/sourceOfTruth';
import {
  LocalContextSource,
  OfferPricingRanges,
  PipelinePrioritizationReport,
  PipelinePriorityInput,
  PrioritizationArtifacts,
  PrioritizationStage,
  PrioritizationTier,
  PrioritizedOpportunity,
  PriorityAction,
} from './types';

const offerPricingRanges: OfferPricingRanges = {
  'qa-audit': 'QA Audit: $199-$500',
  'playwright-starter-pack': 'Playwright Starter Pack: $900-$1,500',
  'qa-automation-retainer': 'QA Automation Retainer: $1,500-$3,000/month',
  'agency-partner-retainer': 'Agency Partner Retainer: $1,500-$3,000/month',
  'not-fit': 'Not fit: no revenue path recommended',
};

const manualApprovalReminder = [
  'Human approval is required before outreach, follow-up, proposal, discovery call, client delivery, renewal, expansion, invoice, or payment action.',
  'This report uses local Studio data only and does not treat opportunity value as booked revenue.',
  'No APIs, scraping, browsing, CRM, outreach automation, email, LinkedIn automation, payment systems, credentials, or external databases were used.',
];

export function buildPipelinePrioritizationReport(input: PipelinePriorityInput): PipelinePrioritizationReport {
  const source = getRevenueSourceOfTruth();
  const contactReviewByLeadId = new Map(input.contactReviews.map((review) => [review.leadId, review]));
  const legacyOpportunities = input.leads
    .map((lead) => buildOpportunity(lead, contactReviewByLeadId.get(lead.id), findClientForLead(lead, input.clients), input.today))
    .sort(sortOpportunities);
  const sourceOpportunity = buildSourcePriorityOpportunity(source);
  const opportunities = [sourceOpportunity, ...legacyOpportunities.filter((opportunity) => opportunity.lead.companyName !== source.topLead)];

  const actionable = opportunities.filter((opportunity) => opportunity.lead.status !== 'lost');

  return {
    generatedAt: input.generatedAt,
    totalLeads: input.leads.length,
    totalPrioritized: actionable.length,
    tierA: actionable.filter((opportunity) => opportunity.tier === 'A'),
    tierB: actionable.filter((opportunity) => opportunity.tier === 'B'),
    tierC: actionable.filter((opportunity) => opportunity.tier === 'C'),
    readyNow: actionable.filter(isReadyNow),
    needsResearch: actionable.filter((opportunity) => !opportunity.artifacts.researchPack && shouldMove(opportunity)),
    needsAuditPack: actionable.filter((opportunity) => opportunity.artifacts.leadPack && !opportunity.artifacts.auditPack && shouldMove(opportunity)),
    needsOutreachPack: actionable.filter((opportunity) => opportunity.artifacts.auditPack && !opportunity.artifacts.outreachPack && shouldMove(opportunity)),
    needsContactReview: actionable.filter((opportunity) => opportunity.artifacts.outreachPack && !opportunity.artifacts.contactReview && shouldMove(opportunity)),
    needsSow: actionable.filter((opportunity) => shouldNeedSow(opportunity)),
    needsFollowUp: actionable.filter((opportunity) => opportunity.stage === 'FOLLOW_UP'),
    shouldPause: opportunities.filter((opportunity) => shouldPause(opportunity)),
    topRevenueOpportunities: actionable.filter((opportunity) => shouldMove(opportunity)).slice(0, 10),
    topActions: buildTopActions(actionable).slice(0, 5),
    stalledOpportunities: opportunities.filter((opportunity) => opportunity.stalledReasons.length > 0),
    contextSources: input.contextSources,
  };
}

function buildSourcePriorityOpportunity(source: ReturnType<typeof getRevenueSourceOfTruth>): PrioritizedOpportunity {
  const lead: Lead = {
    id: slug(source.topLead),
    companyName: source.topLead,
    website: '',
    industry: 'Revenue Intelligence',
    source: 'Revenue Intelligence source of truth',
    status: 'reviewing',
    fitNotes: source.executionPriorityDetail,
    painPoints: [],
    recommendedOffer: offerKey(source.recommendedOffer),
    score: 10,
    createdAt: source.lastUpdated,
    updatedAt: source.lastUpdated,
    nextAction: source.nextAction,
  };

  return {
    lead,
    artifacts: {
      researchPack: false,
      leadPack: false,
      auditPack: false,
      outreachPack: false,
      contactReview: false,
      sow: false,
      clientWorkflow: false,
    },
    stage: 'NEW_LEAD',
    tier: 'A',
    priorityScore: 1000,
    revenuePath: source.recommendedOffer,
    pricingRange: source.recommendedOffer,
    whyItMatters: `Revenue Intelligence source of truth. ${source.executionPriorityDetail}`,
    nextAction: source.nextAction,
    suggestedCommand: 'npm run revenue:recommendation',
    stalledReasons: [],
    scoreReasons: ['Revenue Intelligence source of truth', `Decision: ${source.revenueDecision}`],
  };
}

export function renderPrioritizedPipeline(report: PipelinePrioritizationReport): string {
  return [
    '# Prioritized Pipeline',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Summary',
    `- Total leads reviewed: ${report.totalLeads}`,
    `- Total prioritized records: ${report.totalPrioritized}`,
    `- Tier A opportunities: ${report.tierA.length}`,
    `- Tier B opportunities: ${report.tierB.length}`,
    `- Tier C / low priority: ${report.tierC.length}`,
    `- Ready now: ${report.readyNow.length}`,
    `- Stalled opportunities: ${report.stalledOpportunities.length}`,
    '',
    'Local context read:',
    renderContextSources(report.contextSources),
    '',
    '## Scoring Rules',
    renderList([
      'Priority Score is 0-100 and deterministic.',
      'Lead score contributes up to 50 points.',
      'Tier fit, recommended offer, generated assets, follow-up status, SOW/client workflow readiness, and matched client renewal/expansion signals add priority.',
      'Paused, lost, and not-fit leads are suppressed.',
      'Opportunity value is a pricing path only, not booked revenue.',
    ]),
    '',
    '## Tier A Opportunities',
    renderOpportunityTable(report.tierA),
    '',
    '## Tier B Opportunities',
    renderOpportunityTable(report.tierB),
    '',
    '## Tier C / Low Priority',
    renderOpportunityTable(report.tierC),
    '',
    '## Ready Now',
    renderOpportunityTable(report.readyNow),
    '',
    '## Needs Research',
    renderOpportunityTable(report.needsResearch),
    '',
    '## Needs Audit Pack',
    renderOpportunityTable(report.needsAuditPack),
    '',
    '## Needs Outreach Pack',
    renderOpportunityTable(report.needsOutreachPack),
    '',
    '## Needs Contact Review',
    renderOpportunityTable(report.needsContactReview),
    '',
    '## Needs SOW',
    renderOpportunityTable(report.needsSow),
    '',
    '## Needs Follow-Up',
    renderOpportunityTable(report.needsFollowUp),
    '',
    '## Should Pause',
    renderOpportunityTable(report.shouldPause),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderTopRevenueOpportunities(report: PipelinePrioritizationReport): string {
  return [
    '# Top 10 Revenue Opportunities',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'Pricing ranges used:',
    renderList([
      'QA Audit: $199-$500',
      'Playwright Starter Pack: $900-$1,500',
      'QA Automation Retainer: $1,500-$3,000/month',
      'Agency Partner Retainer: $1,500-$3,000/month',
    ]),
    '',
    report.topRevenueOpportunities.length === 0
      ? 'No revenue opportunities detected from local data.'
      : report.topRevenueOpportunities.map(renderRevenueOpportunity).join('\n\n'),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderTopFiveActions(report: PipelinePrioritizationReport): string {
  return [
    '# Top 5 Actions',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    report.topActions.length === 0
      ? 'No top actions detected from local data.'
      : report.topActions.map(renderAction).join('\n\n'),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderStalledOpportunities(report: PipelinePrioritizationReport): string {
  return [
    '# Stalled Opportunities',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    report.stalledOpportunities.length === 0
      ? 'No stalled opportunities detected from local data.'
      : renderStalledTable(report.stalledOpportunities),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderConsoleSummary(report: PipelinePrioritizationReport): string[] {
  return [
    `Total leads reviewed: ${report.totalLeads}`,
    `Tier A/B/C: ${report.tierA.length}/${report.tierB.length}/${report.tierC.length}`,
    `Ready now: ${report.readyNow.length}`,
    `Top revenue opportunities: ${report.topRevenueOpportunities.length}`,
    `Top actions: ${report.topActions.length}`,
    `Stalled opportunities: ${report.stalledOpportunities.length}`,
  ];
}

function buildOpportunity(
  lead: Lead,
  contactReview: ContactReviewRecord | undefined,
  client: Client | undefined,
  today: string,
): PrioritizedOpportunity {
  const artifacts = detectArtifacts(lead.id, Boolean(contactReview));
  const stage = inferStage(lead, contactReview, artifacts);
  const priority = scoreOpportunity(lead, contactReview, client, artifacts, stage, today);
  const stalledReasons = detectStalledReasons(lead, contactReview, artifacts, stage, today);
  const suggestedCommand = suggestedCommandFor(lead, artifacts, stage);

  return {
    lead,
    contactReview,
    client,
    artifacts,
    stage,
    tier: tierForPriority(priority),
    priorityScore: priority.score,
    revenuePath: revenuePathFor(lead.recommendedOffer),
    pricingRange: offerPricingRanges[lead.recommendedOffer],
    whyItMatters: whyItMatters(lead, artifacts, stage),
    nextAction: nextActionFor(lead, artifacts, stage),
    suggestedCommand,
    stalledReasons,
    scoreReasons: priority.reasons,
  };
}

function detectArtifacts(leadId: string, hasContactReviewRecord: boolean): PrioritizationArtifacts {
  return {
    researchPack: exists(path.join('output', 'research', `${leadId}-research-pack.md`)),
    leadPack: exists(path.join('output', 'lead-packs', `${leadId}.md`)),
    auditPack: exists(path.join('output', 'audit-packs', leadId)),
    outreachPack: exists(path.join('output', 'outreach-packs', leadId)),
    contactReview: hasContactReviewRecord || exists(path.join('output', 'contact-reviews', leadId, 'contact-review.md')),
    sow: exists(path.join('output', 'sows', `${leadId}-sow.md`)),
    clientWorkflow: exists(path.join('output', 'client-workflows', leadId, 'discovery-call-prep.md'))
      || exists(path.join('output', 'client-workflows', leadId, 'audit-sale-plan.md'))
      || exists(path.join('output', 'client-workflows', leadId, 'onboarding-checklist.md'))
      || exists(path.join('output', 'client-workflows', leadId, 'delivery-plan.md')),
  };
}

function inferStage(lead: Lead, contactReview: ContactReviewRecord | undefined, artifacts: PrioritizationArtifacts): PrioritizationStage {
  if (lead.status === 'lost') return 'LOST';
  if (lead.status === 'paused' || lead.recommendedOffer === 'not-fit') return 'PAUSED';
  if (lead.status === 'won') return 'CLIENT';
  if (contactReview?.messageStatus === 'follow-up-needed' || Boolean(contactReview?.nextFollowUpDate)) return 'FOLLOW_UP';
  if (artifacts.clientWorkflow) return 'CLIENT_READY';
  if (artifacts.sow || lead.status === 'proposal-sent') return 'SOW_READY';
  if (artifacts.contactReview) return 'CONTACT_REVIEW';
  if (artifacts.outreachPack) return 'OUTREACH_READY';
  if (artifacts.auditPack) return 'AUDIT_READY';
  if (artifacts.leadPack) return 'LEAD_PACK_READY';
  if (artifacts.researchPack) return 'RESEARCH_READY';
  return 'NEW_LEAD';
}

function scoreOpportunity(
  lead: Lead,
  contactReview: ContactReviewRecord | undefined,
  client: Client | undefined,
  artifacts: PrioritizationArtifacts,
  stage: PrioritizationStage,
  today: string,
): { score: number; reasons: string[] } {
  const reasons: string[] = [];

  if (stage === 'LOST') return { score: 0, reasons: ['lost lead suppressed'] };
  if (stage === 'PAUSED') return { score: 0, reasons: ['paused or not-fit lead suppressed'] };

  let score = Math.min(Math.max(lead.score, 0), 10) * 5;
  reasons.push(`lead score contributes ${score}`);

  score += offerWeight(lead.recommendedOffer);
  reasons.push(`offer weight ${offerWeight(lead.recommendedOffer)}`);

  const tierBoost = lead.score >= 8 ? 10 : lead.score >= 6 ? 6 : 1;
  score += tierBoost;
  reasons.push(`lead tier boost ${tierBoost}`);

  const stageBoost = stageWeight(stage);
  score += stageBoost;
  reasons.push(`stage boost ${stageBoost}`);

  score += artifacts.researchPack ? 4 : 0;
  score += artifacts.leadPack ? 5 : 0;
  score += artifacts.auditPack ? 8 : 0;
  score += artifacts.outreachPack ? 8 : 0;
  score += artifacts.contactReview ? 8 : 0;
  score += artifacts.sow ? 10 : 0;
  score += artifacts.clientWorkflow ? 10 : 0;

  if (contactReview?.messageStatus === 'follow-up-needed') {
    score += 8;
    reasons.push('follow-up-needed status');
  }

  if (contactReview?.nextFollowUpDate) {
    const followUpBoost = contactReview.nextFollowUpDate <= today ? 10 : 6;
    score += followUpBoost;
    reasons.push(`follow-up date boost ${followUpBoost}`);
  }

  if (contactReview?.messageStatus === 'prepared' || contactReview?.messageStatus === 'approved') {
    score += 3;
    reasons.push(`message status ${contactReview.messageStatus}`);
  }

  if (client) {
    const clientBoost = client.status === 'at-risk' ? 10 : client.status === 'active' ? 5 : 2;
    score += clientBoost;
    reasons.push(`matched client signal ${clientBoost}`);
  }

  return { score: Math.min(100, Math.max(0, Math.round(score))), reasons };
}

function offerWeight(offer: RecommendedOffer): number {
  if (offer === 'qa-automation-retainer' || offer === 'agency-partner-retainer') return 16;
  if (offer === 'playwright-starter-pack') return 10;
  if (offer === 'qa-audit') return 6;
  return -40;
}

function stageWeight(stage: PrioritizationStage): number {
  const weights: Record<PrioritizationStage, number> = {
    NEW_LEAD: 0,
    RESEARCH_READY: 4,
    LEAD_PACK_READY: 8,
    AUDIT_READY: 12,
    OUTREACH_READY: 16,
    CONTACT_REVIEW: 18,
    FOLLOW_UP: 22,
    SOW_READY: 24,
    CLIENT_READY: 25,
    CLIENT: 10,
    PAUSED: -100,
    LOST: -100,
  };

  return weights[stage];
}

function tierForPriority(priority: { score: number }): PrioritizationTier {
  if (priority.score >= 80) return 'A';
  if (priority.score >= 55) return 'B';
  return 'C';
}

function revenuePathFor(offer: RecommendedOffer): string {
  if (offer === 'agency-partner-retainer') return 'QA Audit -> Agency Partner Retainer';
  if (offer === 'qa-automation-retainer') return 'QA Audit -> Playwright Starter Pack -> QA Automation Retainer';
  if (offer === 'playwright-starter-pack') return 'QA Audit -> Playwright Starter Pack -> QA Automation Retainer';
  if (offer === 'qa-audit') return 'QA Audit -> Playwright Starter Pack';
  return 'No recommended revenue path';
}

function whyItMatters(lead: Lead, artifacts: PrioritizationArtifacts, stage: PrioritizationStage): string {
  const reasons = [
    `Lead score ${lead.score}/10`,
    `offer ${lead.recommendedOffer}`,
    `stage ${stage}`,
  ];

  if (artifacts.auditPack) reasons.push('audit pack exists');
  if (artifacts.outreachPack) reasons.push('outreach pack exists');
  if (artifacts.contactReview) reasons.push('contact review exists');
  if (artifacts.sow) reasons.push('SOW exists');
  if (artifacts.clientWorkflow) reasons.push('client workflow exists');

  return reasons.join('; ');
}

function nextActionFor(lead: Lead, artifacts: PrioritizationArtifacts, stage: PrioritizationStage): string {
  if (stage === 'LOST') return 'No action. Lead is lost.';
  if (stage === 'PAUSED') return 'Keep paused unless Daniel requalifies the lead.';
  if (stage === 'FOLLOW_UP') return `Review follow-up context for ${lead.companyName} before any manual action.`;
  if (artifacts.sow && !artifacts.clientWorkflow) return `Prepare discovery call/client prep for ${lead.companyName}.`;
  if (artifacts.contactReview && !artifacts.sow) return `Review contact status and decide whether ${lead.companyName} needs an SOW.`;
  if (artifacts.outreachPack && !artifacts.contactReview) return `Generate contact review for ${lead.companyName}.`;
  if (artifacts.auditPack && !artifacts.outreachPack) return `Generate outreach pack for ${lead.companyName}.`;
  if (artifacts.leadPack && !artifacts.auditPack) return `Generate audit pack for ${lead.companyName}.`;
  if (artifacts.researchPack && !artifacts.leadPack) return `Generate lead pack for ${lead.companyName}.`;
  if (!artifacts.researchPack) return `Generate research pack for ${lead.companyName}.`;
  return lead.nextAction || `Review ${lead.companyName} manually.`;
}

function suggestedCommandFor(lead: Lead, artifacts: PrioritizationArtifacts, stage: PrioritizationStage): string {
  if (stage === 'LOST' || stage === 'PAUSED') return 'No command recommended.';
  if (stage === 'FOLLOW_UP') return `npm run contact:review -- --id ${lead.id}`;
  if (artifacts.sow && !artifacts.clientWorkflow) return `npm run client:prep -- --id ${lead.id}`;
  if (artifacts.contactReview && !artifacts.sow) return `npm run sow:generate -- --id ${lead.id}`;
  if (artifacts.outreachPack && !artifacts.contactReview) return `npm run contact:review -- --id ${lead.id}`;
  if (artifacts.auditPack && !artifacts.outreachPack) return `npm run outreach:pack -- --id ${lead.id}`;
  if (artifacts.leadPack && !artifacts.auditPack) return `npm run audit:pack -- --id ${lead.id}`;
  if (artifacts.researchPack && !artifacts.leadPack) return `npm run lead:pack -- --id ${lead.id}`;
  if (!artifacts.researchPack) return `npm run lead:research -- --id ${lead.id}`;
  return 'npm run pipeline:opportunities';
}

function detectStalledReasons(
  lead: Lead,
  contactReview: ContactReviewRecord | undefined,
  artifacts: PrioritizationArtifacts,
  stage: PrioritizationStage,
  today: string,
): string[] {
  if (stage === 'LOST' || stage === 'PAUSED') return [];

  const reasons: string[] = [];
  if (!artifacts.researchPack) reasons.push('New lead without research pack');
  if (artifacts.researchPack && !artifacts.leadPack) reasons.push('Research exists but no lead pack');
  if (artifacts.leadPack && !artifacts.auditPack) reasons.push('Lead pack exists but no audit pack');
  if (artifacts.auditPack && !artifacts.outreachPack) reasons.push('Audit pack exists but no outreach pack');
  if (artifacts.outreachPack && !artifacts.contactReview) reasons.push('Outreach pack exists but no contact review');
  if (artifacts.contactReview && !lead.nextAction && !contactReview?.notes) reasons.push('Contact review exists but no next action');
  if (contactReview?.nextFollowUpDate && contactReview.nextFollowUpDate <= today && contactReview.messageStatus !== 'follow-up-needed' && contactReview.messageStatus !== 'replied') {
    reasons.push(`Follow-up date ${contactReview.nextFollowUpDate} exists but status is ${contactReview.messageStatus}`);
  }
  if (artifacts.sow && !artifacts.clientWorkflow) reasons.push('SOW exists but no client workflow');

  return reasons;
}

function buildTopActions(opportunities: PrioritizedOpportunity[]): PriorityAction[] {
  return opportunities
    .filter((opportunity) => shouldMove(opportunity))
    .slice(0, 20)
    .map((opportunity) => ({
      title: actionTitleFor(opportunity),
      company: opportunity.lead.companyName,
      reason: opportunity.whyItMatters,
      command: opportunity.suggestedCommand,
      expectedOutput: expectedOutputFor(opportunity.suggestedCommand, opportunity.lead.id),
      manualApprovalNote: 'Daniel must review local context before executing this command or taking external action.',
      priorityScore: opportunity.priorityScore,
    }))
    .filter((action) => action.command !== 'No command recommended.');
}

function actionTitleFor(opportunity: PrioritizedOpportunity): string {
  if (opportunity.stage === 'FOLLOW_UP') return `Review ${opportunity.lead.companyName} follow-up`;
  if (opportunity.artifacts.sow && !opportunity.artifacts.clientWorkflow) return `Prepare client workflow for ${opportunity.lead.companyName}`;
  if (opportunity.artifacts.contactReview && !opportunity.artifacts.sow) return `Review SOW path for ${opportunity.lead.companyName}`;
  if (!opportunity.artifacts.researchPack) return `Generate research pack for ${opportunity.lead.companyName}`;
  if (opportunity.artifacts.researchPack && !opportunity.artifacts.leadPack) return `Generate lead pack for ${opportunity.lead.companyName}`;
  if (opportunity.artifacts.leadPack && !opportunity.artifacts.auditPack) return `Generate audit pack for ${opportunity.lead.companyName}`;
  if (opportunity.artifacts.auditPack && !opportunity.artifacts.outreachPack) return `Generate outreach pack for ${opportunity.lead.companyName}`;
  if (opportunity.artifacts.outreachPack && !opportunity.artifacts.contactReview) return `Generate contact review for ${opportunity.lead.companyName}`;
  return `Review next action for ${opportunity.lead.companyName}`;
}

function expectedOutputFor(command: string, leadId: string): string {
  if (command.includes('lead:research')) return `output/research/${leadId}-research-pack.md`;
  if (command.includes('lead:pack')) return `output/lead-packs/${leadId}.md`;
  if (command.includes('audit:pack')) return `output/audit-packs/${leadId}/`;
  if (command.includes('outreach:pack')) return `output/outreach-packs/${leadId}/`;
  if (command.includes('contact:review')) return `output/contact-reviews/${leadId}/contact-review.md`;
  if (command.includes('sow:generate')) return `output/sows/${leadId}-sow.md`;
  if (command.includes('client:prep')) return `output/client-workflows/${leadId}/`;
  return 'Local pipeline output';
}

function isReadyNow(opportunity: PrioritizedOpportunity): boolean {
  return shouldMove(opportunity)
    && ['FOLLOW_UP', 'SOW_READY', 'CLIENT_READY', 'CONTACT_REVIEW', 'OUTREACH_READY'].includes(opportunity.stage);
}

function shouldNeedSow(opportunity: PrioritizedOpportunity): boolean {
  return shouldMove(opportunity)
    && opportunity.artifacts.contactReview
    && !opportunity.artifacts.sow
    && opportunity.lead.recommendedOffer !== 'not-fit';
}

function shouldPause(opportunity: PrioritizedOpportunity): boolean {
  return opportunity.lead.status === 'paused'
    || opportunity.lead.recommendedOffer === 'not-fit'
    || opportunity.priorityScore === 0;
}

function shouldMove(opportunity: PrioritizedOpportunity): boolean {
  return opportunity.lead.status !== 'lost'
    && opportunity.lead.status !== 'paused'
    && opportunity.lead.recommendedOffer !== 'not-fit'
    && opportunity.priorityScore > 0;
}

function findClientForLead(lead: Lead, clients: Client[]): Client | undefined {
  return clients.find((client) => (
    client.companyName.trim().toLowerCase() === lead.companyName.trim().toLowerCase()
    || client.website.trim().toLowerCase() === lead.website.trim().toLowerCase()
  ));
}

function sortOpportunities(a: PrioritizedOpportunity, b: PrioritizedOpportunity): number {
  if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
  if (b.lead.score !== a.lead.score) return b.lead.score - a.lead.score;
  return a.lead.companyName.localeCompare(b.lead.companyName);
}

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

function renderOpportunityTable(opportunities: PrioritizedOpportunity[]): string {
  if (opportunities.length === 0) return 'No opportunities in this group.';

  return [
    '| Company | Lead Score | Priority Score | Tier | Stage | Offer | Next Action | Suggested Command |',
    '| --- | ---: | ---: | --- | --- | --- | --- | --- |',
    ...opportunities.map((opportunity) => [
      escapeTable(opportunity.lead.companyName),
      String(opportunity.lead.score),
      String(opportunity.priorityScore),
      opportunity.tier,
      opportunity.stage,
      opportunity.lead.recommendedOffer,
      escapeTable(opportunity.nextAction),
      `\`${escapeTable(opportunity.suggestedCommand)}\``,
    ].join(' | ')).map((row) => `| ${row} |`),
  ].join('\n');
}

function renderRevenueOpportunity(opportunity: PrioritizedOpportunity, index: number): string {
  return [
    `## ${index + 1}. ${opportunity.lead.companyName}`,
    '',
    `- Rank: ${index + 1}`,
    `- Company: ${opportunity.lead.companyName}`,
    `- Lead Score: ${opportunity.lead.score}`,
    `- Priority Score: ${opportunity.priorityScore}`,
    `- Tier: ${opportunity.tier}`,
    `- Recommended Offer: ${opportunity.lead.recommendedOffer}`,
    `- Current Stage: ${opportunity.stage}`,
    `- Revenue Path: ${opportunity.revenuePath}`,
    `- Pricing Range: ${opportunity.pricingRange}`,
    `- Why It Matters: ${opportunity.whyItMatters}`,
    `- Next Action: ${opportunity.nextAction}`,
    `- Suggested Command: \`${opportunity.suggestedCommand}\``,
  ].join('\n');
}

function renderAction(action: PriorityAction, index: number): string {
  return [
    `## ${index + 1}. ${action.title}`,
    '',
    `- Action title: ${action.title}`,
    `- Company: ${action.company}`,
    `- Reason: ${action.reason}`,
    `- Command: \`${action.command}\``,
    `- Expected output: ${action.expectedOutput}`,
    `- Manual approval note: ${action.manualApprovalNote}`,
  ].join('\n');
}

function renderStalledTable(opportunities: PrioritizedOpportunity[]): string {
  return [
    '| Company | Stage | Priority Score | Stalled Reason | Suggested Command |',
    '| --- | --- | ---: | --- | --- |',
    ...opportunities.map((opportunity) => `| ${escapeTable(opportunity.lead.companyName)} | ${opportunity.stage} | ${opportunity.priorityScore} | ${escapeTable(opportunity.stalledReasons.join('; '))} | \`${escapeTable(opportunity.suggestedCommand)}\` |`),
  ].join('\n');
}

function renderContextSources(sources: LocalContextSource[]): string {
  return sources.map((source) => {
    const status = source.exists ? 'available' : 'missing';
    const excerpt = source.exists && source.excerpt ? ` Summary: ${source.excerpt}` : '';
    return `- ${source.label}: ${status} (${source.path}).${excerpt}`;
  }).join('\n');
}

function renderList(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function offerKey(offer: string): RecommendedOffer {
  if (offer.includes('Retainer')) return 'qa-automation-retainer';
  if (offer.includes('Starter')) return 'playwright-starter-pack';
  if (offer.includes('Audit')) return 'qa-audit';
  return 'qa-audit';
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'lead';
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|');
}
