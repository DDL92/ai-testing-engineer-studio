import fs = require('fs');
import path = require('path');
import { generatedDir } from '../config/paths';
import { messageQueueRecommendationForDraft } from '../messages/messageReviewService';
import { readSourceQualitySnapshot } from '../sources/sourceQualityService';
import { estimateSuggestedOfferValue } from '../revenue/offers';
import { buildLeadReviewContext } from '../review/leadReviewWriter';
import type { NextActionId } from '../review/nextActionEngine';
import { applyScoreToLead, opportunityToLead } from '../scoring/scorer';
import {
  readClosedLeads,
  readConversions,
  readLeads,
  readOpportunities,
  readOutreachHistory,
  writeActionCockpit,
} from '../storage/jsonStore';
import type { Lead } from '../types/lead';
import { stableId } from '../utils/ids';
import { writeActionCockpitMarkdown } from './actionCockpitWriter';
import { ActionCockpit, ActionPriority, ActionRecommendation, ActionType, supportedActionTypes } from './actionTypes';

export function generateActionCockpit(): ActionCockpit {
  const generatedAt = new Date().toISOString();
  const leads = mergeLeads(readLeads(), readOpportunities().map(opportunityToLead)).map(applyScoreToLead);
  const outreachHistory = readOutreachHistory();
  readConversions();
  readClosedLeads();

  const actions = leads
    .map((lead) => {
      const context = buildLeadReviewContext(lead, outreachHistory);
      const actionType = normalizeActionType(context.recommendation.action);
      const expectedRevenueImpact = estimateSuggestedOfferValue(lead.suggestedOffer);
      const priority = prioritizeAction(actionType, lead, expectedRevenueImpact, Boolean(context.recommendation.blockedReason));
      const relatedReviewPath = existingPath(path.join(generatedDir, `lead-${lead.id}-review.md`));
      const relatedDraftPath = context.proposalDrafts[0];
      const relatedAuditPath = context.auditReports.find((file) => file.endsWith('client-report.md')) ?? context.auditReports[0];
      const reviewMessageType = messageTypeForAction(actionType);
      const messageQueue = shouldShowMessageQueue(actionType) ? messageQueueRecommendationForDraft(relatedDraftPath, reviewMessageType) : undefined;

      return {
        id: stableId(lead.id, actionType, generatedAt.slice(0, 10)),
        leadId: lead.id,
        companyName: lead.companyName,
        actionType,
        priority,
        score: lead.score,
        category: lead.scoreBreakdown.category,
        expectedRevenueImpact,
        reason: context.recommendation.reason,
        suggestedCommand: suggestedCommand(actionType, context.recommendation.command, lead.id),
        optimizeCommand: optimizeCommand(actionType, lead.id),
        messageQueueStatus: messageQueue?.status,
        messageQueueCommand: messageQueue?.command,
        messageQueueReason: messageQueue?.reason,
        suggestedMessagePath: context.recommendation.suggestedMessage ? relatedDraftPath : undefined,
        relatedDraftPath,
        relatedReviewPath,
        relatedAuditPath,
        blockedReason: context.recommendation.blockedReason || undefined,
        createdAt: generatedAt,
      } satisfies ActionRecommendation;
    })
    .sort(compareActions);

  const actionsByType = supportedActionTypes.reduce<ActionCockpit['actionsByType']>((groups, actionType) => {
    groups[actionType] = actions.filter((action) => action.actionType === actionType);
    return groups;
  }, {} as ActionCockpit['actionsByType']);

  const topActions = actions
    .filter((action) => action.actionType !== 'no_action_needed' && action.actionType !== 'wait_for_reply')
    .slice(0, 10);
  const blockedLeads = actions.filter((action) => action.blockedReason);

  const cockpit: ActionCockpit = {
    generatedAt,
    summary: {
      totalLeadsReviewed: leads.length,
      totalActions: actions.length,
      actionableActions: actions.filter((action) => !['no_action_needed', 'wait_for_reply'].includes(action.actionType)).length,
      blockedActions: blockedLeads.length,
      totalExpectedRevenueImpact: topActions.reduce((total, action) => total + action.expectedRevenueImpact, 0),
      highestPriorityAction: topActions[0] ? `${topActions[0].companyName}: ${topActions[0].actionType}` : 'No immediate action.',
      mainBottleneck: mainBottleneck(actionsByType),
      bestRevenueOpportunity: bestRevenueOpportunity(topActions),
    },
    actions,
    actionsByType,
    topActions,
    blockedLeads,
    sourceRecommendations: buildSourceRecommendations(),
    dailyOperatingSequence: [
      { order: 1, title: 'Refresh leads and proposals', command: 'npm run lead:auto', reason: 'Pull public sources, score leads, and refresh local drafts.' },
      { order: 2, title: 'Open the cockpit', command: 'npm run actions:cockpit', reason: 'Rank the next human actions before doing manual work.' },
      { order: 3, title: 'Clear blockers first', command: 'npm run lead:enrich -- --id <leadId> --email "founder@example.com"', reason: 'Contact enrichment unlocks audits and outreach.' },
      { order: 4, title: 'Move revenue actions', command: 'npm run lead:audit -- --id <leadId>', reason: 'Audit and proposal actions create the strongest conversion path.' },
      { order: 5, title: 'Record manual outcomes', command: 'npm run lead:sent -- --id <leadId> --channel linkedin --note "Sent first DM"', reason: 'Outreach history drives follow-up timing and review accuracy.' },
    ],
    links: {
      markdownPath: 'sales-marketing-engine/operator/generated/action-cockpit.md',
      jsonPath: 'data/leads/action-cockpit.json',
      dailySummaryPath: 'sales-marketing-engine/operator/generated/daily-lead-summary.md',
      pipelinePath: 'sales-marketing-engine/operator/generated/pipeline-summary.md',
      revenuePath: 'sales-marketing-engine/operator/generated/revenue-summary.md',
      weeklyDashboardPath: 'sales-marketing-engine/operator/generated/weekly-executive-dashboard.md',
    },
  };

  writeActionCockpit(cockpit);
  writeActionCockpitMarkdown(cockpit);
  return cockpit;
}

function normalizeActionType(action: NextActionId): ActionType {
  if (action === 'mark_won') return 'convert';
  if (action === 'mark_lost' || action === 'ignore') return 'close_or_ignore';
  return action;
}

function buildSourceRecommendations(): string[] {
  const report = readSourceQualitySnapshot();
  const records = report.records ?? [];
  const excellent = records.filter((record) => record.sourceQualityCategory === 'excellent').slice(0, 2);
  const low = records.filter((record) => record.sourceQualityCategory === 'low priority' && record.enabled).slice(0, 2);
  const experimental = records.filter((record) => record.sourceQualityCategory === 'experimental').slice(0, 2);
  return [
    ...excellent.map((record) => `Add more sources similar to ${record.name}.`),
    ...low.map((record) => `Review or disable low-quality source ${record.name}.`),
    ...experimental.map((record) => `Improve include/exclude keywords for ${record.name}.`),
    records.length ? 'Open Source Quality dashboard: http://localhost:4173/sources' : 'Generate source quality report: npm run sources:report',
  ].slice(0, 6);
}

function prioritizeAction(actionType: ActionType, lead: Lead, expectedRevenueImpact: number, blocked: boolean): ActionPriority {
  if (actionType === 'no_action_needed' || actionType === 'wait_for_reply') return 'low';
  if (blocked) return 'blocked';
  if (actionType === 'convert' || actionType === 'follow_up_due') return 'critical';
  if (expectedRevenueImpact >= 1000 && ['run_audit', 'generate_proposal', 'send_first_message'].includes(actionType)) return 'high';
  if (lead.scoreBreakdown.category === 'hot') return 'high';
  if (lead.scoreBreakdown.category === 'warm') return 'medium';
  if (actionType === 'close_or_ignore') return 'medium';
  return 'low';
}

function suggestedCommand(actionType: ActionType, currentCommand: string, leadId: string): string {
  if (actionType === 'generate_proposal') return `npm run lead:proposal -- --id ${leadId}`;
  if (actionType === 'close_or_ignore') return `npm run lead:close -- --id ${leadId} --result lost --reason no_response --note "No response after follow-up sequence"`;
  return currentCommand;
}

function optimizeCommand(actionType: ActionType, leadId: string): string | undefined {
  const typeByAction: Partial<Record<ActionType, string>> = {
    send_first_message: 'linkedin_dm',
    follow_up_due: 'follow_up',
    generate_proposal: 'audit_based_proposal',
    convert: 'closing_message',
    close_or_ignore: 'closing_message',
  };
  const messageType = typeByAction[actionType];
  return messageType ? `npm run lead:optimize -- --id ${leadId} --type ${messageType}` : undefined;
}

function messageTypeForAction(actionType: ActionType): 'linkedin_dm' | 'follow_up' | 'audit_based_proposal' | 'closing_message' | 'unknown' {
  if (actionType === 'send_first_message') return 'linkedin_dm';
  if (actionType === 'follow_up_due') return 'follow_up';
  if (actionType === 'generate_proposal') return 'audit_based_proposal';
  if (actionType === 'convert' || actionType === 'close_or_ignore') return 'closing_message';
  return 'unknown';
}

function shouldShowMessageQueue(actionType: ActionType): boolean {
  return ['send_first_message', 'follow_up_due', 'generate_proposal', 'convert', 'close_or_ignore'].includes(actionType);
}

function compareActions(a: ActionRecommendation, b: ActionRecommendation): number {
  return priorityWeight(b.priority) - priorityWeight(a.priority)
    || b.expectedRevenueImpact - a.expectedRevenueImpact
    || b.score - a.score
    || a.companyName.localeCompare(b.companyName);
}

function priorityWeight(priority: ActionPriority): number {
  return { critical: 5, high: 4, blocked: 3, medium: 2, low: 1 }[priority];
}

function mainBottleneck(groups: ActionCockpit['actionsByType']): string {
  const ranked = Object.entries(groups)
    .filter(([type]) => !['no_action_needed', 'wait_for_reply'].includes(type))
    .sort((a, b) => b[1].length - a[1].length)[0];
  if (!ranked || ranked[1].length === 0) return 'No immediate bottleneck detected.';
  return `${ranked[1].length} lead(s) need ${ranked[0]}.`;
}

function bestRevenueOpportunity(actions: ActionRecommendation[]): string {
  const best = actions.sort((a, b) => b.expectedRevenueImpact - a.expectedRevenueImpact || b.score - a.score)[0];
  return best ? `${best.companyName}: ${best.actionType}, expected $${best.expectedRevenueImpact}.` : 'No active revenue opportunity detected.';
}

function existingPath(filePath: string): string | undefined {
  return fs.existsSync(filePath) ? path.relative(process.cwd(), filePath) : undefined;
}

function mergeLeads(existing: Lead[], incoming: Lead[]): Lead[] {
  const byId = new Map<string, Lead>();
  for (const lead of existing) byId.set(lead.id, lead);
  for (const lead of incoming) byId.set(lead.id, { ...lead, ...byId.get(lead.id), scoreBreakdown: lead.scoreBreakdown });
  return Array.from(byId.values()).sort((a, b) => b.score - a.score || a.companyName.localeCompare(b.companyName));
}
