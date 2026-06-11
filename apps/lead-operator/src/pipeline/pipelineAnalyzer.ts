import { buildLeadReviewContext } from '../review/leadReviewWriter';
import { estimateSuggestedOfferValue } from '../revenue/offers';
import { ClosedLeadRecord, CloseReason, ConversionRecord, Lead, LeadCategory, LeadStatus, OutreachRecord } from '../types/lead';

export const allLeadStatuses: LeadStatus[] = [
  'new',
  'scored',
  'approved',
  'contacted',
  'replied',
  'audit_offered',
  'audit_completed',
  'proposal_sent',
  'won',
  'lost',
  'ignored',
];

export const allLeadCategories: LeadCategory[] = ['hot', 'warm', 'low', 'ignore'];

export interface PipelineSummary {
  generatedAt: string;
  countByStatus: Record<LeadStatus, number>;
  countByCategory: Record<LeadCategory, number>;
  needsContactEnrichment: Lead[];
  readyForAudit: Lead[];
  auditCompletedNoProposalSent: Lead[];
  needingFollowUp: Lead[];
  staleLeads: Lead[];
  topLeadsToReview: LeadReviewSummary[];
  blockedLeads: LeadReviewSummary[];
  revenuePipeline: {
    projectedMonthlyRecurringRevenue: number;
    hotPipelineValue: number;
    warmPipelineValue: number;
    progressTo3000: number;
    progressTo5000: number;
  };
  highestProjectedValueLeads: Array<{
    leadId: string;
    companyName: string;
    status: LeadStatus;
    category: LeadCategory;
    suggestedOffer: string;
    estimatedValue: number;
    reviewCommand: string;
    convertCommand: string;
  }>;
  wonCount: number;
  lostCount: number;
  lostReasonBreakdown: Partial<Record<CloseReason, number>>;
  conversionReadyLeads: Lead[];
  topNextActions: string[];
}

export interface LeadReviewSummary {
  leadId: string;
  companyName: string;
  category: LeadCategory;
  status: LeadStatus;
  recommendedAction: string;
  reason: string;
  command: string;
  blockedReason: string;
}

export function analyzePipeline(leads: Lead[], now = new Date().toISOString(), outreachHistory: OutreachRecord[] = [], conversions: ConversionRecord[] = [], closedLeads: ClosedLeadRecord[] = []): PipelineSummary {
  const activeLeads = leads.filter((lead) => !['won', 'lost', 'ignored'].includes(lead.status));
  const needsContactEnrichment = activeLeads.filter((lead) => !lead.contactEmail && !lead.linkedinUrl);
  const readyForAudit = activeLeads.filter((lead) => Boolean(lead.website) && ['scored', 'approved', 'audit_offered'].includes(lead.status) && (lead.scoreBreakdown.category === 'hot' || lead.scoreBreakdown.category === 'warm'));
  const auditCompletedNoProposalSent = activeLeads.filter((lead) => lead.status === 'audit_completed');
  const needingFollowUp = activeLeads.filter((lead) => Boolean(lead.nextFollowUpAt && lead.nextFollowUpAt <= now));
  const staleLeads = activeLeads.filter((lead) => isStale(lead.updatedAt, now));
  const leadReviews = buildLeadReviewSummaries(activeLeads, outreachHistory).filter((review) => review.recommendedAction !== 'no_action_needed');
  const topLeadsToReview = leadReviews.slice(0, 10);
  const blockedLeads = leadReviews.filter((review) => Boolean(review.blockedReason)).slice(0, 10);
  const projectedMonthlyRecurringRevenue = conversions.reduce((sum, conversion) => sum + conversion.projectedMonthlyRevenue, 0);
  const hotPipelineValue = pipelineValue(leads, 'hot');
  const warmPipelineValue = pipelineValue(leads, 'warm');
  const conversionReadyLeads = activeLeads.filter((lead) => lead.status === 'proposal_sent' || lead.status === 'replied');

  return {
    generatedAt: now,
    countByStatus: countByStatus(leads),
    countByCategory: countByCategory(leads),
    needsContactEnrichment,
    readyForAudit,
    auditCompletedNoProposalSent,
    needingFollowUp,
    staleLeads,
    topLeadsToReview,
    blockedLeads,
    revenuePipeline: {
      projectedMonthlyRecurringRevenue,
      hotPipelineValue,
      warmPipelineValue,
      progressTo3000: progress(projectedMonthlyRecurringRevenue, 3000),
      progressTo5000: progress(projectedMonthlyRecurringRevenue, 5000),
    },
    highestProjectedValueLeads: activeLeads
      .sort((a, b) => estimateSuggestedOfferValue(b.suggestedOffer) - estimateSuggestedOfferValue(a.suggestedOffer) || b.score - a.score)
      .slice(0, 10)
      .map((lead) => ({
        leadId: lead.id,
        companyName: lead.companyName,
        status: lead.status,
        category: lead.scoreBreakdown.category,
        suggestedOffer: lead.suggestedOffer,
        estimatedValue: estimateSuggestedOfferValue(lead.suggestedOffer),
        reviewCommand: `npm run lead:review -- --id ${lead.id}`,
        convertCommand: `npm run lead:convert -- --id ${lead.id} --offer monthly_qa_maintenance --amount 1000 --note "Closed after audit call"`,
      })),
    wonCount: leads.filter((lead) => lead.status === 'won').length,
    lostCount: leads.filter((lead) => lead.status === 'lost' || lead.status === 'ignored').length,
    lostReasonBreakdown: countClosedReasons(closedLeads),
    conversionReadyLeads,
    topNextActions: buildTopActions({
      needsContactEnrichment,
      readyForAudit,
      auditCompletedNoProposalSent,
      needingFollowUp,
      staleLeads,
    }),
  };
}

function countByStatus(leads: Lead[]): Record<LeadStatus, number> {
  return allLeadStatuses.reduce<Record<LeadStatus, number>>((counts, status) => {
    counts[status] = leads.filter((lead) => lead.status === status).length;
    return counts;
  }, {} as Record<LeadStatus, number>);
}

function countByCategory(leads: Lead[]): Record<LeadCategory, number> {
  return allLeadCategories.reduce<Record<LeadCategory, number>>((counts, category) => {
    counts[category] = leads.filter((lead) => lead.scoreBreakdown.category === category).length;
    return counts;
  }, {} as Record<LeadCategory, number>);
}

function isStale(updatedAt: string, now: string): boolean {
  if (!updatedAt) return true;
  return new Date(now).getTime() - new Date(updatedAt).getTime() >= 7 * 86400000;
}

function buildTopActions(input: Pick<PipelineSummary, 'needsContactEnrichment' | 'readyForAudit' | 'auditCompletedNoProposalSent' | 'needingFollowUp' | 'staleLeads'>): string[] {
  return [
    ...input.needingFollowUp.slice(0, 3).map((lead) => `Review follow-up draft for ${lead.companyName}: npm run lead:followups:due`),
    ...input.auditCompletedNoProposalSent.slice(0, 3).map((lead) => `Review audit-based proposal and mark sent: npm run lead:sent -- --id ${lead.id} --channel linkedin --note "Sent first message"`),
    ...input.readyForAudit.slice(0, 3).map((lead) => `Run audit for ${lead.companyName}: npm run lead:audit -- --id ${lead.id}`),
    ...input.needsContactEnrichment.slice(0, 3).map((lead) => `Enrich ${lead.companyName}: npm run lead:enrich -- --id ${lead.id} --email "founder@example.com"`),
    ...input.staleLeads.slice(0, 3).map((lead) => `Review stale lead ${lead.companyName}: npm run lead:update -- --id ${lead.id} --status ignored --note "No longer active"`),
  ].slice(0, 10);
}

function buildLeadReviewSummaries(leads: Lead[], outreachHistory: OutreachRecord[]): LeadReviewSummary[] {
  return leads
    .map((lead) => {
      const context = buildLeadReviewContext(lead, outreachHistory);
      return {
        leadId: lead.id,
        companyName: lead.companyName,
        category: lead.scoreBreakdown.category,
        status: lead.status,
        recommendedAction: context.recommendation.action,
        reason: context.recommendation.reason,
        command: `npm run lead:review -- --id ${lead.id}`,
        blockedReason: context.recommendation.blockedReason,
      };
    })
    .sort((a, b) => reviewPriority(a.recommendedAction) - reviewPriority(b.recommendedAction));
}

function reviewPriority(action: string): number {
  const order = ['follow_up_due', 'generate_proposal', 'send_first_message', 'run_audit', 'enrich_contact', 'ignore', 'wait_for_reply', 'mark_won', 'mark_lost', 'no_action_needed'];
  const index = order.indexOf(action);
  return index >= 0 ? index : order.length;
}

function pipelineValue(leads: Lead[], category: 'hot' | 'warm'): number {
  return leads
    .filter((lead) => lead.scoreBreakdown.category === category && !['won', 'lost', 'ignored'].includes(lead.status))
    .reduce((sum, lead) => sum + estimateSuggestedOfferValue(lead.suggestedOffer), 0);
}

function progress(value: number, target: number): number {
  return Math.min(100, Math.round((value / target) * 100));
}

function countClosedReasons(closedLeads: ClosedLeadRecord[]): Partial<Record<CloseReason, number>> {
  return closedLeads.reduce<Partial<Record<CloseReason, number>>>((counts, record) => {
    counts[record.reason] = (counts[record.reason] ?? 0) + 1;
    return counts;
  }, {});
}
