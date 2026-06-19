import fs = require('fs');
import path = require('path');
import { buildDeliveryAssetsDashboard } from '../deliveryAssets/assetRules';
import { buildEvidenceProDashboard } from '../evidencePro/evidenceProRules';
import { buildFinanceReport, loadFinanceInput } from '../financeTracking/financeRules';
import { buildFollowUpOperatingReport } from '../followUpEngine/followUpRules';
import { buildOutcomeSummary, loadOutcomes } from '../outcomeTracking/outcomeRules';
import { getRevenueSourceOfTruth } from '../revenueIntelligence/sourceOfTruth';
import { buildStudioHealthDashboard } from '../studioHealth/healthRules';
import { buildLeadQualificationReport } from '../webLeadQualification/normalizationRules';
import { buildWebLeadDiscoveryReport } from '../webLeadDiscovery/webDiscoveryRules';
import {
  RevenueModeAction,
  RevenueModeDashboard,
  RevenueModeFollowUp,
  RevenueModeFollowUpCategory,
  RevenueModeInput,
  RevenueModeReport,
} from './types';

export const revenueModeOutputDir = path.join(process.cwd(), 'output', 'revenue-mode');

export const revenueModeSafetyRules = [
  'Revenue Mode is local-only and read-only except for its own generated reports.',
  'No message, email, proposal, meeting, invoice, payment request, or external action is sent or created.',
  'Booked MRR comes only from counted local finance records.',
  'Planning estimates are target-gap math, not booked or forecast revenue.',
  'No replies, client interest, approvals, delivery progress, wins, losses, or revenue are invented.',
  'Human approval is required before every external commercial action.',
];

export function loadRevenueModeInput(): RevenueModeInput {
  const truth = getRevenueSourceOfTruth();
  const finance = buildFinanceReport(loadFinanceInput());
  const followUps = buildFollowUpOperatingReport();
  const outcomes = buildOutcomeSummary(loadOutcomes());
  const health = buildStudioHealthDashboard();
  const evidence = buildEvidenceProDashboard();
  const delivery = buildDeliveryAssetsDashboard();
  const discovery = buildWebLeadDiscoveryReport();
  const qualification = buildLeadQualificationReport();

  return {
    generatedAt: new Date().toISOString(),
    studioHealth: health.studioHealth,
    doctorStatus: health.doctorStatus,
    actionableLead: truth.actionableLead,
    commercialReadiness: truth.commercialReadiness,
    evidenceStatus: evidence.evidencePackageStatus,
    evidencePackageStatus: evidence.evidencePackageStatus,
    deliveryAssetsStatus: delivery.deliveryAssetsStatus,
    recommendedOffer: truth.recommendedOffer,
    currentMrr: finance.currentMrr,
    outcomeCount: outcomes.totalRecords,
    discoveredLeadCount: discovery.leads.length,
    qualifiedLeadCount: qualification.topQualifiedLeads.length,
    followUps: followUps.queue
      .filter((item) => !['Closed Won', 'Closed Lost', 'Paused'].includes(item.category))
      .map((item) => ({
        company: item.companyName,
        category: mapFollowUpCategory(item.category),
        status: item.category,
        nextManualAction: item.expectedNextStep,
      }))
      .sort((left, right) => Number(right.company === truth.actionableLead) - Number(left.company === truth.actionableLead)),
  };
}

export function buildRevenueModeReport(input = loadRevenueModeInput()): RevenueModeReport {
  const targetMrrLow = 3_000;
  const targetMrrHigh = 5_000;
  const gapLow = Math.max(targetMrrLow - input.currentMrr, 0);
  const gapHigh = Math.max(targetMrrHigh - input.currentMrr, 0);
  const hasActionableLead = input.actionableLead !== 'No actionable lead';
  const evidenceReady = /READY|PASS/i.test(input.evidencePackageStatus);
  const deliveryReady = /READY/i.test(input.deliveryAssetsStatus);
  const actions = buildActions(input, hasActionableLead, evidenceReady, deliveryReady);
  const biggestBottleneck = input.outcomeCount === 0
    ? 'No real commercial outcomes are recorded; external action and outcome recording remain manual.'
    : input.followUps.length > 0
      ? `${input.followUps.length} manual follow-up item(s) require review.`
      : evidenceReady ? 'No recorded follow-up is waiting; maintain evidence and qualification freshness.' : 'Evidence package requires review before commercial use.';

  return {
    generatedAt: input.generatedAt,
    date: input.generatedAt.slice(0, 10),
    status: hasActionableLead && evidenceReady ? 'ACTIVE' : 'NEEDS REVIEW',
    studioHealth: input.studioHealth,
    doctorStatus: input.doctorStatus,
    actionableLead: input.actionableLead,
    commercialReadiness: input.commercialReadiness,
    evidenceStatus: input.evidenceStatus,
    recommendedOffer: input.recommendedOffer,
    goals: {
      currentMrr: input.currentMrr,
      targetMrrLow,
      targetMrrHigh,
      gapLow,
      gapHigh,
      estimatedAuditsForLowTarget: Math.ceil(gapLow / 500),
      estimatedRetainersForLowTarget: Math.ceil(gapLow / 1_500),
      estimatedClientsForLowTarget: Math.ceil(gapLow / 1_500),
      planningBasis: 'Uses the upper approved QA Audit value ($500) and lower approved monthly retainer value ($1,500). These are planning equivalents only.',
    },
    topAction: actions[0]?.action ?? 'Refresh Revenue Intelligence and review why no actionable lead is available.',
    todayActions: actions.slice(0, 3),
    actionQueue: actions,
    followUpQueue: input.followUps,
    biggestBottleneck,
    tomorrowFocus: input.followUps.length > 0
      ? `Review the highest-priority follow-up for ${input.followUps[0].company}; do not send without human approval.`
      : `Keep ${input.actionableLead} evidence and delivery review current, then record only real outcomes.`,
    outcomeCount: input.outcomeCount,
    discoveredLeadCount: input.discoveredLeadCount,
    qualifiedLeadCount: input.qualifiedLeadCount,
    safetyRules: revenueModeSafetyRules,
  };
}

export function buildRevenueModeDashboard(report = buildRevenueModeReport()): RevenueModeDashboard {
  return {
    revenueModeStatus: report.status,
    morningBrief: `${report.actionableLead} | ${report.commercialReadiness} | ${report.evidenceStatus}`,
    todaysTopAction: report.topAction,
    revenueGoal: `${money(report.goals.currentMrr)} MRR toward ${money(report.goals.targetMrrLow)}-${money(report.goals.targetMrrHigh)}`,
    priorityQueue: `${report.actionQueue.filter((item) => item.priority === 'HIGH').length} high / ${report.actionQueue.length} total`,
    followUpsWaiting: report.followUpQueue.length,
    biggestBottleneck: report.biggestBottleneck,
    tomorrowFocus: report.tomorrowFocus,
  };
}

export function writeRevenueModeOutputs(report = buildRevenueModeReport()): string[] {
  fs.mkdirSync(revenueModeOutputDir, { recursive: true });
  const outputs = [
    ['morning-brief.md', renderMorningBrief(report)],
    ['today-actions.md', renderTodayActions(report)],
    ['revenue-goals.md', renderRevenueGoals(report)],
    ['action-queue.md', renderActionQueue(report)],
    ['follow-up-queue.md', renderFollowUpQueue(report)],
    ['priority-review.md', renderPriorityReview(report)],
    ['end-of-day-review.md', renderEndOfDayReview(report)],
    ['weekly-review.md', renderWeeklyReview(report)],
    ['revenue-mode-summary.md', renderRevenueModeSummary(report)],
  ] as const;
  return outputs.map(([fileName, body]) => {
    const outputPath = path.join(revenueModeOutputDir, fileName);
    fs.writeFileSync(outputPath, body, 'utf8');
    return outputPath;
  });
}

export function renderMorningBrief(report: RevenueModeReport): string {
  return document('Revenue Mode Morning Brief', report, [
    `- Date: ${report.date}`,
    `- Studio Health: ${report.studioHealth} (${report.doctorStatus})`,
    `- Actionable Lead: ${report.actionableLead}`,
    `- Commercial Readiness: ${report.commercialReadiness}`,
    `- Evidence Status: ${report.evidenceStatus}`,
    `- Offer: ${report.recommendedOffer}`,
    `- Revenue Goal: ${money(report.goals.currentMrr)} MRR toward ${money(report.goals.targetMrrLow)}-${money(report.goals.targetMrrHigh)}`,
    `- Follow-Ups Waiting: ${report.followUpQueue.length}`,
    `- One Top Action: ${report.topAction}`,
  ]);
}

export function renderTodayActions(report: RevenueModeReport): string {
  return document('Today Actions', report, [
    'Maximum three actions, ordered by expected revenue proximity.',
    '',
    ...report.todayActions.map((item, index) => `${index + 1}. [${item.priority}] ${item.action}\n   Reason: ${item.reason}`),
  ]);
}

export function renderRevenueGoals(report: RevenueModeReport): string {
  return document('Revenue Goals', report, [
    `- Current booked MRR: ${money(report.goals.currentMrr)}`,
    `- Target range: ${money(report.goals.targetMrrLow)}-${money(report.goals.targetMrrHigh)} per month`,
    `- Gap to lower target: ${money(report.goals.gapLow)}`,
    `- Gap to upper target: ${money(report.goals.gapHigh)}`,
    `- Audit planning equivalent to lower target: ${report.goals.estimatedAuditsForLowTarget}`,
    `- Retainer planning equivalent to lower target: ${report.goals.estimatedRetainersForLowTarget}`,
    `- Client planning equivalent to lower target: ${report.goals.estimatedClientsForLowTarget}`,
    `- Basis: ${report.goals.planningBasis}`,
  ]);
}

export function renderActionQueue(report: RevenueModeReport): string {
  return document('Revenue Action Queue', report, [
    '| Priority | Action | Reason |',
    '| --- | --- | --- |',
    ...report.actionQueue.map((item) => `| ${item.priority} | ${item.action} | ${item.reason} |`),
    '',
    'Architecture, dashboard, and refactor work is intentionally excluded unless it blocks revenue operation.',
  ]);
}

export function renderFollowUpQueue(report: RevenueModeReport): string {
  return document('Revenue Follow-Up Queue', report, report.followUpQueue.length === 0
    ? ['No follow-up records are currently available from local data.']
    : [
      '| Company | Category | Status | Next Manual Action |',
      '| --- | --- | --- | --- |',
      ...report.followUpQueue.map((item) => `| ${item.company} | ${item.category} | ${item.status} | ${item.nextManualAction} |`),
    ]);
}

export function renderPriorityReview(report: RevenueModeReport): string {
  return document('Revenue Priority Review', report, [
    `- Highest priority: ${report.topAction}`,
    `- Biggest bottleneck: ${report.biggestBottleneck}`,
    `- High-priority queue items: ${report.actionQueue.filter((item) => item.priority === 'HIGH').length}`,
    `- Low-priority internal work: defer unless it blocks evidence, delivery, follow-up review, or revenue reporting.`,
  ]);
}

export function renderEndOfDayReview(report: RevenueModeReport): string {
  return document('Revenue End Of Day Review', report, [
    `- Recorded commercial outcomes: ${report.outcomeCount}`,
    `- Actions completed: not inferred; mark manually from real work.`,
    `- Revenue created today: not inferred; booked revenue remains ${money(report.goals.currentMrr)} MRR from finance records.`,
    `- Follow-ups waiting: ${report.followUpQueue.length}`,
    `- Tomorrow focus: ${report.tomorrowFocus}`,
  ]);
}

export function renderWeeklyReview(report: RevenueModeReport): string {
  return document('Revenue Weekly Review', report, [
    `- Discovered leads available: ${report.discoveredLeadCount}`,
    `- Qualified leads available: ${report.qualifiedLeadCount}`,
    `- Recorded outcomes: ${report.outcomeCount}`,
    `- Current booked MRR: ${money(report.goals.currentMrr)}`,
    `- Current bottleneck: ${report.biggestBottleneck}`,
    `- Next-week operating focus: ${report.tomorrowFocus}`,
  ]);
}

export function renderRevenueModeSummary(report: RevenueModeReport): string {
  return document('Revenue Mode Summary', report, [
    `- Revenue Mode Status: ${report.status}`,
    `- Actionable Lead: ${report.actionableLead}`,
    `- Commercial Readiness: ${report.commercialReadiness}`,
    `- Evidence Status: ${report.evidenceStatus}`,
    `- Today\'s Top Action: ${report.topAction}`,
    `- Revenue Goal: ${money(report.goals.currentMrr)} MRR toward ${money(report.goals.targetMrrLow)}-${money(report.goals.targetMrrHigh)}`,
    `- Follow-Ups Waiting: ${report.followUpQueue.length}`,
    `- Biggest Bottleneck: ${report.biggestBottleneck}`,
    `- Tomorrow Focus: ${report.tomorrowFocus}`,
  ]);
}

function buildActions(input: RevenueModeInput, hasLead: boolean, evidenceReady: boolean, deliveryReady: boolean): RevenueModeAction[] {
  const actions: RevenueModeAction[] = [];
  if (hasLead) {
    actions.push({
      priority: 'HIGH',
      action: `Review the ${input.recommendedOffer} evidence package and message decision for ${input.actionableLead}; Daniel decides any external next step.`,
      reason: 'The actionable lead is the closest current path to a real commercial outcome.',
      approvalRequired: true,
    });
  }
  if (!evidenceReady || !deliveryReady) {
    actions.push({
      priority: 'HIGH',
      action: `Resolve review blockers in the ${input.actionableLead} evidence or delivery package.`,
      reason: `Evidence is ${input.evidencePackageStatus}; delivery assets are ${input.deliveryAssetsStatus}.`,
      approvalRequired: true,
    });
  }
  if (input.followUps.length > 0) {
    actions.push({
      priority: 'HIGH',
      action: `Review the manual ${input.followUps[0].category.toLowerCase()} item for ${input.followUps[0].company}.`,
      reason: 'Existing conversations and approvals have higher revenue proximity than new internal work.',
      approvalRequired: true,
    });
  }
  actions.push({
    priority: 'MEDIUM',
    action: 'Record only real commercial outcomes after Daniel completes a manual action.',
    reason: 'Accurate outcome history is required for revenue learning and follow-up priority.',
    approvalRequired: true,
  });
  actions.push({
    priority: 'LOW',
    action: 'Refresh lead discovery only after delivery and follow-up reviews are clear.',
    reason: 'New discovery is lower priority than progressing an evidence-ready actionable lead.',
    approvalRequired: false,
  });
  return actions;
}

function mapFollowUpCategory(category: string): RevenueModeFollowUpCategory {
  if (category === 'Waiting For Response') return 'Waiting Reply';
  if (category === 'Proposal Review') return 'Proposal Review';
  if (category === 'Needs Follow-Up') return 'Access';
  if (category === 'Needs First Message') return 'Evidence Review';
  return 'Delivery Approval';
}

function document(title: string, report: RevenueModeReport, lines: string[]): string {
  return [
    `# ${title}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    ...lines,
    '',
    '## Safety Rules',
    ...report.safetyRules.map((rule) => `- ${rule}`),
    '',
  ].join('\n');
}

function money(value: number): string {
  return `$${value.toLocaleString('en-US')}`;
}
