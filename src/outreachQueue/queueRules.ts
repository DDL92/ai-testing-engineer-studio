import { recommendManualNextAction, recommendOutreachStatus } from '../outbound/outboundRules';
import { Lead, OutreachStatus, RecommendedOffer } from '../leads/types';
import { buildFirst50ProgressFromLeads } from '../first50/first50Progress';
import { OfferRevenueTier, OutreachQueue, QueueLeadItem } from './types';

const excludedLeadStatuses = new Set<Lead['status']>(['lost', 'paused']);
const excludedOutreachStatuses = new Set<OutreachStatus>(['lost', 'paused', 'won']);

const offerRevenueTier: OfferRevenueTier = {
  'agency-partner-retainer': 5,
  'qa-automation-retainer': 5,
  'playwright-starter-pack': 3,
  'qa-audit': 2,
  'not-fit': 0,
};

export function buildOutreachQueue(leads: Lead[]): OutreachQueue {
  const queueItems = actionableLeadItems(leads);
  const topPriorityLeads = queueItems.slice(0, 10);
  const firstLead = topPriorityLeads[0]?.lead;

  return {
    date: new Date().toISOString().slice(0, 10),
    topPriorityLeads,
    followUpsNeeded: queueItems.filter(isFollowUpNeeded).slice(0, 10),
    auditOpportunities: queueItems.filter(isAuditOpportunity).slice(0, 10),
    proposalOpportunities: queueItems.filter(isProposalOpportunity).slice(0, 10),
    retainerOpportunities: queueItems.filter(isRetainerOpportunity).slice(0, 10),
    first50Progress: buildFirst50ProgressFromLeads(leads),
    recommendedManualActions: buildRecommendedManualActions(queueItems),
    suggestedCommands: buildSuggestedCommands(firstLead),
    safetyRules: [
      'Manual outreach only.',
      'Do not auto-send emails, LinkedIn messages, contact-form messages, or follow-ups.',
      'Use only manually researched public information.',
      'Do not scrape, enrich private data, connect APIs, use credentials, or create CRM integrations.',
      'Daniel must review and approve all outreach, proposals, reports, and client communication.',
    ],
  };
}

export function actionableLeadItems(leads: Lead[]): QueueLeadItem[] {
  return leads
    .filter((lead) => !excludedLeadStatuses.has(lead.status))
    .filter((lead) => lead.recommendedOffer !== 'not-fit')
    .map(toQueueLeadItem)
    .filter((item) => !excludedOutreachStatuses.has(item.outreachStatus))
    .sort((a, b) => {
      if (b.revenuePotential !== a.revenuePotential) return b.revenuePotential - a.revenuePotential;
      if (b.queueScore !== a.queueScore) return b.queueScore - a.queueScore;
      if (b.lead.score !== a.lead.score) return b.lead.score - a.lead.score;
      return a.lead.companyName.localeCompare(b.lead.companyName);
    });
}

function toQueueLeadItem(lead: Lead): QueueLeadItem {
  const outreachStatus = recommendOutreachStatus(lead);
  const revenuePotential = offerRevenueTier[lead.recommendedOffer];

  return {
    lead,
    outreachStatus,
    queueScore: calculateQueueScore(lead, outreachStatus),
    revenuePotential,
    nextAction: recommendManualNextAction(lead),
  };
}

function calculateQueueScore(lead: Lead, outreachStatus: OutreachStatus): number {
  let score = lead.score * 10;
  score += offerRevenueTier[lead.recommendedOffer] * 12;

  if (lead.status === 'proposal-sent') score += 35;
  if (lead.status === 'call-booked') score += 32;
  if (lead.status === 'audit-ready') score += 28;
  if (lead.status === 'contacted') score += 22;
  if (lead.status === 'new') score += 8;

  if (outreachStatus === 'proposal-ready' || outreachStatus === 'proposal-sent') score += 35;
  if (outreachStatus === 'retainer-opportunity') score += 30;
  if (outreachStatus === 'audit-offered' || outreachStatus === 'audit-sold') score += 26;
  if (outreachStatus === 'follow-up-needed') score += 24;
  if (outreachStatus === 'contacted') score += 18;
  if (outreachStatus === 'message-prepared') score += 14;
  if (lead.nextFollowUpDate) score += 10;
  if (lead.contactName || lead.contactUrl) score += 8;

  return score;
}

function isFollowUpNeeded(item: QueueLeadItem): boolean {
  return Boolean(item.lead.nextFollowUpDate)
    || item.outreachStatus === 'follow-up-needed'
    || item.outreachStatus === 'contacted'
    || item.outreachStatus === 'proposal-sent';
}

function isAuditOpportunity(item: QueueLeadItem): boolean {
  return item.lead.recommendedOffer === 'qa-audit'
    || item.lead.recommendedOffer === 'playwright-starter-pack'
    || item.outreachStatus === 'audit-offered'
    || item.lead.status === 'audit-ready';
}

function isProposalOpportunity(item: QueueLeadItem): boolean {
  return item.outreachStatus === 'proposal-ready'
    || item.outreachStatus === 'proposal-sent'
    || item.lead.status === 'proposal-sent'
    || item.lead.status === 'call-booked';
}

function isRetainerOpportunity(item: QueueLeadItem): boolean {
  return item.lead.recommendedOffer === 'qa-automation-retainer'
    || item.lead.recommendedOffer === 'agency-partner-retainer'
    || item.outreachStatus === 'retainer-opportunity';
}

function buildRecommendedManualActions(queueItems: QueueLeadItem[]): string[] {
  const actions: string[] = [];
  const topFollowUp = queueItems.find(isFollowUpNeeded);
  const topAudit = queueItems.find(isAuditOpportunity);
  const topRetainer = queueItems.find(isRetainerOpportunity);

  if (topFollowUp) {
    actions.push(`Review follow-up context for ${topFollowUp.lead.companyName}; send manually only after approval.`);
  }

  if (topAudit) {
    actions.push(`Prepare or review a QA Audit angle for ${topAudit.lead.companyName}.`);
  }

  if (topRetainer) {
    actions.push(`Review retainer fit for ${topRetainer.lead.companyName} and keep the first step focused on audit/discovery.`);
  }

  actions.push('Keep First-50 progress current by adding manually researched leads with npm run lead:add.');
  return actions.slice(0, 5);
}

function buildSuggestedCommands(lead?: Lead): string[] {
  const leadId = lead?.id ?? 'lead_id';
  const website = lead?.website || 'https://example.com';

  return [
    `npm run lead:pack -- --id ${leadId}`,
    `npm run audit:site -- --url ${website}`,
    `npm run sow:generate -- --id ${leadId}`,
    'npm run day:plan',
    'npm run cockpit',
  ];
}
