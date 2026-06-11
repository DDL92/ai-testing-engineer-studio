import fs = require('fs');
import path = require('path');
import type { ActionCockpit } from '../actions/actionTypes';
import type { MessageReviewQueue } from '../messages/messageReviewTypes';
import type { SourceQualityReport } from '../sources/sourceTypes';
import { approvalQueueDir } from '../config/paths';
import { analyzePipeline } from '../pipeline/pipelineAnalyzer';
import { estimateSuggestedOfferValue } from '../revenue/offers';
import { generateRevenueSummary, RevenueSummary } from '../revenue/revenueService';
import { buildLeadReviewContext } from '../review/leadReviewWriter';
import { applyScoreToLead, opportunityToLead } from '../scoring/scorer';
import {
  readClients,
  readActionCockpit,
  readClosedLeads,
  readConversions,
  readLeads,
  readMessageReviewQueue,
  readOpportunities,
  readOutreachHistory,
  readSourceQualityReport,
  writeWeeklyExecutiveDashboard,
} from '../storage/jsonStore';
import { ClientRecord, ClosedLeadRecord, ConversionRecord, Lead, OutreachRecord } from '../types/lead';
import { writeWeeklyDashboardMarkdown } from './weeklyDashboardWriter';

export interface WeeklyExecutiveDashboard {
  generatedAt: string;
  reportingPeriod: {
    days: number;
    startDate: string;
    endDate: string;
  };
  executiveSummary: {
    overallBusinessStatus: string;
    mainBottleneck: string;
    biggestOpportunity: string;
    recommendedFocus: string;
  };
  leadActivity: {
    newLeadsThisPeriod: number;
    hotLeads: number;
    warmLeads: number;
    lowAndIgnoredLeads: number;
    leadsNeedingEnrichment: number;
    leadsReadyForAudit: number;
    leadsWithAuditCompleted: number;
    leadsWithProposalReady: number;
    leadsContacted: number;
    leadsNeedingFollowUp: number;
  };
  outreachActivity: {
    outreachSentThisPeriod: number;
    outreachByChannel: Record<string, number>;
    followUpsDue: number;
    staleLeads: number;
    leadsWaitingForReply: number;
  };
  qaAuditActivity: {
    auditsCompletedThisPeriod: number;
    auditBasedProposalsGenerated: number;
    leadsBlockedNoWebsite: number;
    auditRecommendedNext: number;
  };
  revenueProgress: {
    currentProjectedMrr: number;
    oneTimeRevenueThisMonth: number;
    progressTo3000: number;
    progressTo5000: number;
    clientsNeededAt500: number;
    clientsNeededAt1000: number;
    clientsNeededAt1500: number;
  };
  conversionMetrics: {
    wonLeads: number;
    lostLeads: number;
    ignoredLeads: number;
    contactedToWonRate: string;
    proposalSentToWonRate: string;
    auditCompletedToProposalSentRate: string;
    sampleSizeNote: string;
  };
  lostReasons: {
    breakdown: Record<string, number>;
    topAvoidableReason: string;
    recommendation: string;
  };
  pipelineValue: {
    estimatedHotPipelineValue: number;
    estimatedWarmPipelineValue: number;
    topHighestValueLeads: Array<{
      leadId: string;
      companyName: string;
      suggestedOffer: string;
      estimatedValue: number;
      command: string;
    }>;
  };
  nextHighestValueActions: Array<{
    priority: number;
    leadId: string;
    companyName: string;
    score: number;
    category: string;
    recommendedNextAction: string;
    expectedRevenueImpact: number;
    suggestedCommand: string;
    reason: string;
  }>;
  actionCockpit: {
    path: string;
    command: string;
    topActions: Array<{
      leadId: string;
      companyName: string;
      actionType: string;
      expectedRevenueImpact: number;
      suggestedCommand: string;
    }>;
  };
  messageQueue: {
    pendingReview: number;
    approvedNotSent: number;
    needsEdit: number;
    command: string;
    dashboardPath: string;
  };
  sourceQuality: {
    bestSource: string;
    worstSource: string;
    excellentSources: number;
    lowPrioritySources: number;
    command: string;
    dashboardPath: string;
  };
  weeklyOperatingChecklist: string[];
}

export function generateWeeklyDashboard(days = 7): WeeklyExecutiveDashboard {
  const safeDays = normalizeDays(days);
  const now = new Date();
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - safeDays);

  const leads = mergeLeads(readLeads(), readOpportunities().map(opportunityToLead)).map(applyScoreToLead);
  const outreachHistory = readOutreachHistory();
  const conversions = readConversions();
  const clients = readClients();
  const closedLeads = readClosedLeads();
  const revenueSummary = generateRevenueSummary();
  const pipeline = analyzePipeline(leads, now.toISOString(), outreachHistory, conversions, closedLeads);
  const periodOutreach = outreachHistory.filter((record) => inRange(record.sentAt, start, now));
  const periodConversions = conversions.filter((record) => inRange(record.convertedAt, start, now));
  const auditReportLeadIds = findAuditReportLeadIds();
  const auditBasedProposalLeadIds = findAuditBasedProposalLeadIds();
  const reviewContexts = leads.map((lead) => buildLeadReviewContext(lead, outreachHistory));

  const dashboard: WeeklyExecutiveDashboard = {
    generatedAt: now.toISOString(),
    reportingPeriod: {
      days: safeDays,
      startDate: start.toISOString().slice(0, 10),
      endDate: now.toISOString().slice(0, 10),
    },
    executiveSummary: buildExecutiveSummary(pipeline, revenueSummary),
    leadActivity: {
      newLeadsThisPeriod: leads.filter((lead) => inRange(lead.createdAt, start, now)).length,
      hotLeads: leads.filter((lead) => lead.scoreBreakdown.category === 'hot').length,
      warmLeads: leads.filter((lead) => lead.scoreBreakdown.category === 'warm').length,
      lowAndIgnoredLeads: leads.filter((lead) => lead.scoreBreakdown.category === 'low' || lead.scoreBreakdown.category === 'ignore' || lead.status === 'ignored').length,
      leadsNeedingEnrichment: pipeline.needsContactEnrichment.length,
      leadsReadyForAudit: pipeline.readyForAudit.length,
      leadsWithAuditCompleted: auditReportLeadIds.length,
      leadsWithProposalReady: findProposalLeadIds().length,
      leadsContacted: leads.filter((lead) => Boolean(lead.lastContactedAt)).length,
      leadsNeedingFollowUp: pipeline.needingFollowUp.length,
    },
    outreachActivity: {
      outreachSentThisPeriod: periodOutreach.length,
      outreachByChannel: countBy(periodOutreach.map((record) => record.channel)),
      followUpsDue: pipeline.needingFollowUp.length,
      staleLeads: pipeline.staleLeads.length,
      leadsWaitingForReply: leads.filter((lead) => lead.status === 'proposal_sent' || lead.status === 'contacted').length,
    },
    qaAuditActivity: {
      auditsCompletedThisPeriod: auditReportLeadIds.filter((leadId) => auditCompletedThisPeriod(leadId, start, now)).length,
      auditBasedProposalsGenerated: auditBasedProposalLeadIds.length,
      leadsBlockedNoWebsite: leads.filter((lead) => !lead.website && !['won', 'lost', 'ignored'].includes(lead.status)).length,
      auditRecommendedNext: reviewContexts.filter((context) => context.recommendation.action === 'run_audit').length,
    },
    revenueProgress: {
      currentProjectedMrr: revenueSummary.projectedMonthlyRecurringRevenue,
      oneTimeRevenueThisMonth: revenueSummary.projectedOneTimeRevenueThisMonth,
      progressTo3000: revenueSummary.progressTo3000,
      progressTo5000: revenueSummary.progressTo5000,
      clientsNeededAt500: revenueSummary.clientsNeededAt500,
      clientsNeededAt1000: revenueSummary.clientsNeededAt1000,
      clientsNeededAt1500: revenueSummary.clientsNeededAt1500,
    },
    conversionMetrics: buildConversionMetrics(leads, periodConversions),
    lostReasons: buildLostReasons(closedLeads),
    pipelineValue: {
      estimatedHotPipelineValue: pipeline.revenuePipeline.hotPipelineValue,
      estimatedWarmPipelineValue: pipeline.revenuePipeline.warmPipelineValue,
      topHighestValueLeads: revenueSummary.topRevenueOpportunities.slice(0, 10).map((lead) => ({
        leadId: lead.leadId,
        companyName: lead.companyName,
        suggestedOffer: lead.suggestedOffer,
        estimatedValue: lead.estimatedValue,
        command: lead.command,
      })),
    },
    nextHighestValueActions: buildNextHighestValueActions(reviewContexts),
    actionCockpit: buildActionCockpitSnapshot(),
    messageQueue: buildMessageQueueSnapshot(),
    sourceQuality: buildSourceQualitySnapshot(),
    weeklyOperatingChecklist: [
      'Review source quality report.',
      'Review message queue.',
      'Review action cockpit.',
      'Review daily summary.',
      'Review pipeline summary.',
      'Review revenue summary.',
      'Review approval queue.',
      'Enrich top leads.',
      'Audit top leads.',
      'Send approved messages manually.',
      'Mark sent messages.',
      'Run follow-ups.',
      'Close bad leads.',
    ],
  };

  writeWeeklyExecutiveDashboard(dashboard);
  writeWeeklyDashboardMarkdown(dashboard);
  return dashboard;
}

function normalizeDays(days: number): number {
  if (!Number.isFinite(days) || days <= 0) return 7;
  return Math.round(days);
}

function buildExecutiveSummary(pipeline: ReturnType<typeof analyzePipeline>, revenue: RevenueSummary): WeeklyExecutiveDashboard['executiveSummary'] {
  const mainBottleneck = pipeline.needsContactEnrichment.length > 0
    ? `${pipeline.needsContactEnrichment.length} active leads need safe manual contact enrichment.`
    : pipeline.readyForAudit.length > 0
      ? `${pipeline.readyForAudit.length} leads are ready for QA audit.`
      : 'No major bottleneck detected.';

  const biggestOpportunity = pipeline.highestProjectedValueLeads[0]
    ? `${pipeline.highestProjectedValueLeads[0].companyName} at estimated $${pipeline.highestProjectedValueLeads[0].estimatedValue}.`
    : 'No active high-value opportunity detected.';

  return {
    overallBusinessStatus: revenue.projectedMonthlyRecurringRevenue >= 3000 ? 'At or above the $3,000/month target.' : `Building pipeline. Current projected MRR is $${revenue.projectedMonthlyRecurringRevenue}.`,
    mainBottleneck,
    biggestOpportunity,
    recommendedFocus: pipeline.needsContactEnrichment.length > 0 ? 'Enrich and review the highest-value hot leads first.' : 'Move audit-ready leads into audited, proposal-ready state.',
  };
}

function buildConversionMetrics(leads: Lead[], periodConversions: ConversionRecord[]): WeeklyExecutiveDashboard['conversionMetrics'] {
  const wonLeads = leads.filter((lead) => lead.status === 'won').length;
  const lostLeads = leads.filter((lead) => lead.status === 'lost').length;
  const ignoredLeads = leads.filter((lead) => lead.status === 'ignored').length;
  const contactedPopulation = leads.filter((lead) => Boolean(lead.lastContactedAt) || lead.status === 'won');
  const proposalPopulation = leads.filter((lead) => lead.status === 'proposal_sent' || lead.status === 'won');
  const auditPopulation = leads.filter((lead) => lead.status === 'audit_completed' || lead.status === 'proposal_sent' || lead.status === 'won');
  const smallSampleNotes = [
    contactedPopulation.length < 3 ? 'contacted-to-won sample is small' : '',
    proposalPopulation.length < 3 ? 'proposal-to-won sample is small' : '',
    auditPopulation.length < 3 ? 'audit-to-proposal sample is small' : '',
  ].filter(Boolean);

  return {
    wonLeads,
    lostLeads,
    ignoredLeads,
    contactedToWonRate: rate(wonLeads, contactedPopulation.length),
    proposalSentToWonRate: rate(wonLeads, proposalPopulation.length),
    auditCompletedToProposalSentRate: rate(proposalPopulation.length, auditPopulation.length),
    sampleSizeNote: smallSampleNotes.length ? smallSampleNotes.join('; ') : `Enough sample for basic directional reading. Conversions this period: ${periodConversions.length}.`,
  };
}

function buildLostReasons(closedLeads: ClosedLeadRecord[]): WeeklyExecutiveDashboard['lostReasons'] {
  const breakdown = countBy(closedLeads.map((record) => record.reason));
  const topAvoidableReason = Object.entries(breakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'none';
  return {
    breakdown,
    topAvoidableReason,
    recommendation: topAvoidableReason === 'none'
      ? 'Keep tracking close reasons as volume grows.'
      : `Review leads closed for ${topAvoidableReason} and adjust source selection, qualification, or messaging.`,
  };
}

function buildNextHighestValueActions(contexts: ReturnType<typeof buildLeadReviewContext>[]): WeeklyExecutiveDashboard['nextHighestValueActions'] {
  return contexts
    .filter((context) => !['won', 'lost', 'ignored'].includes(context.lead.status))
    .sort((a, b) => estimateSuggestedOfferValue(b.lead.suggestedOffer) - estimateSuggestedOfferValue(a.lead.suggestedOffer) || b.lead.score - a.lead.score)
    .slice(0, 10)
    .map((context, index) => ({
      priority: index + 1,
      leadId: context.lead.id,
      companyName: context.lead.companyName,
      score: context.lead.score,
      category: context.lead.scoreBreakdown.category,
      recommendedNextAction: context.recommendation.action,
      expectedRevenueImpact: estimateSuggestedOfferValue(context.lead.suggestedOffer),
      suggestedCommand: context.recommendation.command,
      reason: context.recommendation.reason,
    }));
}

function buildActionCockpitSnapshot(): WeeklyExecutiveDashboard['actionCockpit'] {
  const cockpit = readActionCockpit<Partial<ActionCockpit>>({});
  return {
    path: 'sales-marketing-engine/operator/generated/action-cockpit.md',
    command: 'npm run actions:cockpit',
    topActions: cockpit.topActions?.slice(0, 3).map((action) => ({
      leadId: action.leadId,
      companyName: action.companyName,
      actionType: action.actionType,
      expectedRevenueImpact: action.expectedRevenueImpact,
      suggestedCommand: action.suggestedCommand,
    })) ?? [],
  };
}

function buildMessageQueueSnapshot(): WeeklyExecutiveDashboard['messageQueue'] {
  const queue = readMessageReviewQueue<Partial<MessageReviewQueue>>({});
  return {
    pendingReview: queue.summary?.pending_review ?? 0,
    approvedNotSent: queue.summary?.approved ?? 0,
    needsEdit: queue.summary?.needs_edit ?? 0,
    command: 'npm run message:queue',
    dashboardPath: 'http://localhost:4173/message-queue',
  };
}

function buildSourceQualitySnapshot(): WeeklyExecutiveDashboard['sourceQuality'] {
  const report = readSourceQualityReport<Partial<SourceQualityReport>>({});
  return {
    bestSource: report.summary?.bestSource ?? 'Not generated.',
    worstSource: report.summary?.worstSource ?? 'Not generated.',
    excellentSources: report.summary?.excellentSources ?? 0,
    lowPrioritySources: report.summary?.lowPrioritySources ?? 0,
    command: 'npm run sources:report',
    dashboardPath: 'http://localhost:4173/sources',
  };
}

function findProposalLeadIds(): string[] {
  if (!fs.existsSync(approvalQueueDir)) return [];
  const leadIds = fs.readdirSync(approvalQueueDir)
    .map((file) => file.match(/lead-([^-]+(?:-[^-]+)*)-/)?.[1] ?? '')
    .filter(Boolean);
  return Array.from(new Set(leadIds));
}

function findAuditBasedProposalLeadIds(): string[] {
  if (!fs.existsSync(approvalQueueDir)) return [];
  const leadIds = fs.readdirSync(approvalQueueDir)
    .filter((file) => file.includes('audit-based-proposal'))
    .map((file) => file.match(/lead-(.*)-audit-based-proposal\.md/)?.[1] ?? '')
    .filter(Boolean);
  return Array.from(new Set(leadIds));
}

function findAuditReportLeadIds(): string[] {
  const reportsDir = path.join(process.cwd(), 'reports', 'leads');
  if (!fs.existsSync(reportsDir)) return [];
  return fs.readdirSync(reportsDir).filter((leadId) => fs.existsSync(path.join(reportsDir, leadId, 'audit-result.json')));
}

function auditCompletedThisPeriod(leadId: string, start: Date, end: Date): boolean {
  const auditPath = path.join(process.cwd(), 'reports', 'leads', leadId, 'audit-result.json');
  if (!fs.existsSync(auditPath)) return false;
  const modifiedAt = fs.statSync(auditPath).mtime.toISOString();
  return inRange(modifiedAt, start, end);
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function rate(numerator: number, denominator: number): string {
  if (denominator < 3) return 'sample too small';
  return `${Math.round((numerator / denominator) * 100)}%`;
}

function inRange(timestamp: string, start: Date, end: Date): boolean {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  return Number.isFinite(date.getTime()) && date >= start && date <= end;
}

function mergeLeads(existing: Lead[], incoming: Lead[]): Lead[] {
  const byId = new Map<string, Lead>();
  for (const lead of existing) byId.set(lead.id, lead);
  for (const lead of incoming) byId.set(lead.id, { ...lead, ...byId.get(lead.id), scoreBreakdown: lead.scoreBreakdown });
  return Array.from(byId.values()).sort((a, b) => b.score - a.score || a.companyName.localeCompare(b.companyName));
}
