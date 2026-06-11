import fs = require('fs');
import path = require('path');
import { ContactReviewRecord } from '../contactReview/types';
import { Lead, RecommendedOffer } from '../leads/types';
import {
  LocalArtifactStatus,
  OfferTierWeight,
  OpportunityItem,
  OpportunityTier,
  OpportunityTracker,
  PipelineBreakdown,
  PipelineStage,
  TierSummary,
} from './types';

const pipelineStages: PipelineStage[] = [
  'NEW_LEAD',
  'RESEARCH_READY',
  'AUDIT_READY',
  'OUTREACH_READY',
  'CONTACT_REVIEW',
  'FOLLOW_UP',
  'DISCOVERY_CALL',
  'SOW_READY',
  'CLIENT_READY',
  'CLIENT',
  'PAUSED',
  'LOST',
];

const offerTierWeight: OfferTierWeight = {
  'qa-audit': 7,
  'playwright-starter-pack': 10,
  'qa-automation-retainer': 15,
  'agency-partner-retainer': 15,
  'not-fit': 0,
};

export function buildOpportunityTracker(leads: Lead[], contactReviews: ContactReviewRecord[]): OpportunityTracker {
  const contactReviewByLeadId = new Map(contactReviews.map((review) => [review.leadId, review]));
  const opportunities = leads
    .map((lead) => buildOpportunityItem(lead, contactReviewByLeadId.get(lead.id)))
    .sort(sortOpportunities);
  const actionable = opportunities.filter((item) => isActionableOpportunity(item.lead));

  return {
    generatedAt: new Date().toISOString(),
    totalLeads: leads.length,
    totalOpportunities: actionable.length,
    tierSummary: buildTierSummary(actionable),
    pipelineBreakdown: buildPipelineBreakdown(opportunities),
    opportunities,
    topOpportunities: actionable.slice(0, 20),
    followUpsNeeded: opportunities.filter(isFollowUpNeeded).sort(sortOpportunities),
    immediateActions: buildImmediateActions(actionable),
  };
}

function buildOpportunityItem(lead: Lead, contactReview: ContactReviewRecord | undefined): OpportunityItem {
  const artifacts = detectArtifacts(lead.id);
  const pipelineStage = inferPipelineStage(lead, contactReview, artifacts);
  const opportunityScore = scoreOpportunity(lead, contactReview, artifacts);
  const tier = tierForScore(opportunityScore);

  return {
    lead,
    contactReview,
    artifacts,
    pipelineStage,
    opportunityScore,
    tier,
    reason: buildReason(lead, contactReview, artifacts, pipelineStage),
    nextAction: recommendNextAction(lead, contactReview, artifacts, pipelineStage),
  };
}

function detectArtifacts(leadId: string): LocalArtifactStatus {
  return {
    researchPack: exists(path.join('output', 'research', `${leadId}-research-pack.md`)),
    auditPack: exists(path.join('output', 'audit-packs', leadId)),
    outreachPack: exists(path.join('output', 'outreach-packs', leadId)),
    contactReview: exists(path.join('output', 'contact-reviews', leadId, 'contact-review.md')),
    clientPrep: exists(path.join('output', 'client-workflows', leadId, 'discovery-call-prep.md'))
      || exists(path.join('output', 'client-workflows', leadId, 'audit-sale-plan.md')),
    clientOnboarding: exists(path.join('output', 'client-workflows', leadId, 'onboarding-checklist.md'))
      || exists(path.join('output', 'client-workflows', leadId, 'delivery-plan.md'))
      || exists(path.join('output', 'client-workflows', leadId, 'retainer-conversion-plan.md')),
    sow: exists(path.join('output', 'sows', `${leadId}-sow.md`)),
  };
}

function inferPipelineStage(
  lead: Lead,
  contactReview: ContactReviewRecord | undefined,
  artifacts: LocalArtifactStatus,
): PipelineStage {
  if (lead.status === 'lost') return 'LOST';
  if (lead.status === 'paused') return 'PAUSED';
  if (lead.status === 'won') return 'CLIENT';
  if (contactReview?.messageStatus === 'follow-up-needed' || Boolean(contactReview?.nextFollowUpDate)) return 'FOLLOW_UP';
  if (artifacts.clientOnboarding) return 'CLIENT_READY';
  if (artifacts.clientPrep) return 'DISCOVERY_CALL';
  if (artifacts.sow || lead.status === 'proposal-sent') return 'SOW_READY';
  if (artifacts.contactReview || contactReview) return 'CONTACT_REVIEW';
  if (artifacts.outreachPack) return 'OUTREACH_READY';
  if (artifacts.auditPack) return 'AUDIT_READY';
  if (artifacts.researchPack) return 'RESEARCH_READY';
  return 'NEW_LEAD';
}

function scoreOpportunity(
  lead: Lead,
  contactReview: ContactReviewRecord | undefined,
  artifacts: LocalArtifactStatus,
): number {
  if (lead.status === 'lost' || lead.status === 'paused' || lead.recommendedOffer === 'not-fit') return 0;

  let score = Math.min(Math.max(lead.score, 0), 10) * 5;
  score += offerTierWeight[lead.recommendedOffer];
  score += artifacts.researchPack ? 5 : 0;
  score += artifacts.auditPack ? 10 : 0;
  score += artifacts.outreachPack ? 8 : 0;
  score += artifacts.contactReview || Boolean(contactReview) ? 8 : 0;
  score += artifacts.clientPrep || artifacts.clientOnboarding ? 10 : 0;

  if (contactReview?.messageStatus === 'approved') score += 4;
  if (contactReview?.messageStatus === 'sent-manually') score += 6;
  if (contactReview?.messageStatus === 'follow-up-needed' || contactReview?.nextFollowUpDate) score += 5;
  if (artifacts.sow) score += 5;

  return Math.min(score, 100);
}

function tierForScore(score: number): OpportunityTier {
  if (score >= 80) return 'A';
  if (score >= 60) return 'B';
  return 'C';
}

function buildReason(
  lead: Lead,
  contactReview: ContactReviewRecord | undefined,
  artifacts: LocalArtifactStatus,
  pipelineStage: PipelineStage,
): string {
  const reasons = [
    `Lead score ${lead.score}/10`,
    `offer ${lead.recommendedOffer}`,
    `stage ${pipelineStage}`,
  ];

  if (artifacts.researchPack) reasons.push('research pack exists');
  if (artifacts.auditPack) reasons.push('audit pack exists');
  if (artifacts.outreachPack) reasons.push('outreach pack exists');
  if (contactReview || artifacts.contactReview) reasons.push('contact review exists');
  if (artifacts.clientPrep || artifacts.clientOnboarding) reasons.push('client workflow exists');

  return reasons.join('; ');
}

function recommendNextAction(
  lead: Lead,
  contactReview: ContactReviewRecord | undefined,
  artifacts: LocalArtifactStatus,
  pipelineStage: PipelineStage,
): string {
  if (pipelineStage === 'LOST') return 'No action. Lead is lost.';
  if (pipelineStage === 'PAUSED') return 'No action unless Daniel manually reopens the lead.';
  if (pipelineStage === 'CLIENT') return 'Manage through client delivery and reporting workflows.';
  if (pipelineStage === 'FOLLOW_UP') return followUpAction(contactReview);
  if (pipelineStage === 'CLIENT_READY') return `Review onboarding and delivery plan for ${lead.companyName}.`;
  if (pipelineStage === 'DISCOVERY_CALL') return `Use client prep to schedule or run a manually approved discovery call for ${lead.companyName}.`;
  if (pipelineStage === 'SOW_READY') return `Review SOW and pricing manually for ${lead.companyName}.`;
  if (pipelineStage === 'CONTACT_REVIEW') return `Review contact record and approve or reject manual outreach for ${lead.companyName}.`;
  if (pipelineStage === 'OUTREACH_READY') return `Generate or review contact review before any manual outreach to ${lead.companyName}.`;
  if (pipelineStage === 'AUDIT_READY') return `Generate outreach pack or SOW draft from the audit pack for ${lead.companyName}.`;
  if (pipelineStage === 'RESEARCH_READY') return artifacts.auditPack
    ? `Review audit pack for ${lead.companyName}.`
    : `Run or review audit workflow for ${lead.companyName}.`;
  return `Generate research pack for ${lead.companyName}.`;
}

function followUpAction(contactReview: ContactReviewRecord | undefined): string {
  if (!contactReview) return 'Review follow-up context manually.';
  if (contactReview.messageStatus === 'follow-up-needed') return 'Review follow-up draft and send manually only after approval.';
  if (contactReview.nextFollowUpDate) return `Monitor manually for follow-up on ${contactReview.nextFollowUpDate}.`;
  return 'Review contact status manually.';
}

function buildTierSummary(items: OpportunityItem[]): TierSummary {
  return {
    A: items.filter((item) => item.tier === 'A').length,
    B: items.filter((item) => item.tier === 'B').length,
    C: items.filter((item) => item.tier === 'C').length,
  };
}

function buildPipelineBreakdown(items: OpportunityItem[]): PipelineBreakdown {
  const breakdown: PipelineBreakdown = {
    NEW_LEAD: 0,
    RESEARCH_READY: 0,
    AUDIT_READY: 0,
    OUTREACH_READY: 0,
    CONTACT_REVIEW: 0,
    FOLLOW_UP: 0,
    DISCOVERY_CALL: 0,
    SOW_READY: 0,
    CLIENT_READY: 0,
    CLIENT: 0,
    PAUSED: 0,
    LOST: 0,
  };

  for (const item of items) {
    breakdown[item.pipelineStage] += 1;
  }

  return breakdown;
}

function buildImmediateActions(items: OpportunityItem[]): string[] {
  const actions: string[] = [];
  const followUp = items.find((item) => item.pipelineStage === 'FOLLOW_UP');
  const clientReady = items.find((item) => item.pipelineStage === 'CLIENT_READY');
  const discovery = items.find((item) => item.pipelineStage === 'DISCOVERY_CALL');
  const contact = items.find((item) => item.pipelineStage === 'CONTACT_REVIEW' || item.pipelineStage === 'OUTREACH_READY');
  const audit = items.find((item) => item.pipelineStage === 'AUDIT_READY' || item.pipelineStage === 'RESEARCH_READY');

  if (followUp) actions.push(`${followUp.lead.companyName}: ${followUp.nextAction}`);
  if (clientReady) actions.push(`${clientReady.lead.companyName}: ${clientReady.nextAction}`);
  if (discovery) actions.push(`${discovery.lead.companyName}: ${discovery.nextAction}`);
  if (contact) actions.push(`${contact.lead.companyName}: ${contact.nextAction}`);
  if (audit) actions.push(`${audit.lead.companyName}: ${audit.nextAction}`);

  return actions.length > 0 ? actions.slice(0, 5) : ['No immediate commercial actions found in local data.'];
}

function isFollowUpNeeded(item: OpportunityItem): boolean {
  return item.contactReview?.messageStatus === 'follow-up-needed'
    || Boolean(item.contactReview?.nextFollowUpDate);
}

function isActionableOpportunity(lead: Lead): boolean {
  return lead.status !== 'lost'
    && lead.status !== 'paused'
    && lead.recommendedOffer !== 'not-fit';
}

function sortOpportunities(a: OpportunityItem, b: OpportunityItem): number {
  if (b.opportunityScore !== a.opportunityScore) return b.opportunityScore - a.opportunityScore;
  if (b.lead.score !== a.lead.score) return b.lead.score - a.lead.score;
  return a.lead.companyName.localeCompare(b.lead.companyName);
}

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

export function allPipelineStages(): PipelineStage[] {
  return pipelineStages;
}
