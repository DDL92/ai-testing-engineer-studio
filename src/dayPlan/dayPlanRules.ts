import { Lead } from '../leads/types';
import { DailyPlanAction, DailyPlanActionType } from './types';

const inactiveStatuses = new Set<Lead['status']>(['lost', 'paused']);

export function buildTopDailyActions(leads: Lead[], limit = 5): DailyPlanAction[] {
  return leads
    .filter(isActionableLead)
    .map(toRankedAction)
    .sort((a, b) => {
      if (b.rank !== a.rank) return b.rank - a.rank;
      if (b.action.score !== a.action.score) return b.action.score - a.action.score;
      return a.action.companyName.localeCompare(b.action.companyName);
    })
    .slice(0, limit)
    .map(({ action }, index) => ({
      ...action,
      priority: index + 1,
    }));
}

export function isActionableLead(lead: Lead): boolean {
  if (inactiveStatuses.has(lead.status)) return false;
  if (lead.recommendedOffer === 'not-fit') return false;
  return lead.score > 0;
}

function toRankedAction(lead: Lead): { action: DailyPlanAction; rank: number } {
  const actionType = getActionType(lead);
  const reasonParts = getReasonParts(lead);
  const rank = getRank(lead);

  return {
    rank,
    action: {
      priority: 0,
      leadId: lead.id,
      companyName: lead.companyName,
      score: lead.score,
      recommendedOffer: lead.recommendedOffer,
      actionType,
      reason: reasonParts.join('; '),
      suggestedManualAction: getSuggestedManualAction(lead, actionType),
    },
  };
}

function getRank(lead: Lead): number {
  let rank = lead.score * 10;

  if (lead.status === 'audit-ready') rank += 40;
  if (lead.status === 'call-booked') rank += 35;
  if (lead.status === 'proposal-sent') rank += 32;
  if (lead.status === 'contacted') rank += 28;
  if (lead.status === 'new' && lead.score >= 7) rank += 25;
  if (lead.recommendedOffer === 'agency-partner-retainer') rank += 20;
  if (lead.recommendedOffer === 'qa-automation-retainer') rank += 18;
  if (lead.recommendedOffer === 'playwright-starter-pack') rank += 12;
  if (lead.recommendedOffer === 'qa-audit') rank += 8;

  return rank;
}

function getActionType(lead: Lead): DailyPlanActionType {
  if (lead.status === 'call-booked') return 'prepare-call';
  if (lead.status === 'proposal-sent') return 'follow-up';
  if (lead.status === 'contacted') return 'follow-up';
  if (lead.status === 'audit-ready') return 'prepare-audit';
  if (lead.recommendedOffer === 'agency-partner-retainer') return 'prepare-message';
  if (lead.recommendedOffer === 'qa-automation-retainer' && lead.score >= 7) return 'prepare-audit';
  if (lead.recommendedOffer === 'playwright-starter-pack' && lead.score >= 7) return 'prepare-audit';
  if (lead.score < 4) return 'pause-lead';
  return 'review-lead';
}

function getReasonParts(lead: Lead): string[] {
  const reasons = [`score ${lead.score}/10`];

  if (lead.status === 'audit-ready') reasons.push('already marked audit-ready');
  if (lead.status === 'new' && lead.score >= 7) reasons.push('new high-fit lead');
  if (lead.status === 'contacted') reasons.push('contacted lead needs manual follow-up review');
  if (lead.status === 'call-booked') reasons.push('call booked lead needs prep');
  if (lead.status === 'proposal-sent') reasons.push('proposal sent lead needs next-step review');
  if (lead.recommendedOffer === 'agency-partner-retainer') reasons.push('agency partner retainer potential');
  if (lead.recommendedOffer === 'qa-automation-retainer') reasons.push('QA automation retainer potential');
  if (lead.recommendedOffer === 'playwright-starter-pack') reasons.push('starter automation package fit');
  if (lead.website) reasons.push('website available for manual review');

  return reasons;
}

function getSuggestedManualAction(lead: Lead, actionType: DailyPlanActionType): string {
  if (actionType === 'prepare-call') {
    return `Prepare discovery questions for ${lead.companyName} and review notes before the call.`;
  }

  if (actionType === 'follow-up') {
    return `Review prior context for ${lead.companyName}, then decide whether to send a manual follow-up.`;
  }

  if (actionType === 'prepare-proposal') {
    return `Draft proposal notes for ${lead.companyName}; Daniel must approve before sending.`;
  }

  if (actionType === 'prepare-audit') {
    return `Review ${lead.website || lead.companyName} and prepare a scoped QA audit plan.`;
  }

  if (actionType === 'prepare-message') {
    return `Draft a short partner-fit message for ${lead.companyName}; do not send without approval.`;
  }

  if (actionType === 'pause-lead') {
    return `Pause ${lead.companyName} unless stronger QA pain evidence appears.`;
  }

  return `Review ${lead.companyName}, confirm fit, and choose the next approved manual action.`;
}
