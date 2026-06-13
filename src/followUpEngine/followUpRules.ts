import fs = require('fs');
import path = require('path');
import { buildFirstRevenueExecutionPack } from '../executionPack/generateFirstRevenueChecklist';
import { buildExecutiveCompanyReport } from '../executiveLayer/executiveRules';
import { buildMessageReview } from '../messageReview/messageRules';
import { buildOutcomeSummary, loadOutcomes } from '../outcomeTracking/outcomeRules';
import { OutcomeRecord } from '../outcomeTracking/types';
import { buildRevenueActivationReport } from '../revenueActivation/revenueRules';
import { RevenueActivationScore } from '../revenueActivation/types';
import {
  DailyFollowUpItem,
  FollowUpCategory,
  FollowUpOperatingReport,
  FollowUpQueueItem,
  ManualFollowUpRecord,
} from './types';

const dataPath = path.join(process.cwd(), 'data', 'followups', 'followups.json');
const outputRoot = path.join(process.cwd(), 'output', 'followups');

const safetyRules = [
  'Local-only follow-up planning.',
  'Manual review and human approval are required before any external action.',
  'Never send messages, emails, proposals, meeting invites, invoices, payment links, or payments.',
  'Never claim revenue or invent outcomes, replies, meetings, proposals, client interest, wins, or losses.',
  'No CRM integrations, APIs, browser automation, scraping, or credentials are used.',
];

export function ensureFollowUpStore(): void {
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, '[]\n', 'utf8');
  }
}

export function loadManualFollowUps(): ManualFollowUpRecord[] {
  ensureFollowUpStore();
  const raw = fs.readFileSync(dataPath, 'utf8').trim();
  if (!raw) return [];
  return JSON.parse(raw) as ManualFollowUpRecord[];
}

export function buildFollowUpOperatingReport(): FollowUpOperatingReport {
  ensureFollowUpStore();

  const activation = buildRevenueActivationReport();
  const execution = buildFirstRevenueExecutionPack();
  const outcomes = loadOutcomes();
  const outcomeSummary = buildOutcomeSummary(outcomes);
  const topTargetMessageReview = buildMessageReview(execution.topTarget.companyName);
  const manualFollowUps = loadManualFollowUps();
  const queue = activation.pipeline.map((target) => {
    const companyOutcomes = outcomes.filter((outcome) => sameCompany(outcome.company, target.companyName));
    const manual = manualFollowUps.find((item) => sameCompany(item.company, target.companyName));
    const releaseConfidence = releaseConfidenceFor(target);
    return buildQueueItem(target, companyOutcomes, manual, execution.topTarget.companyName, topTargetMessageReview.goNoGo, releaseConfidence);
  }).sort(sortQueueItems);
  const dailyPlan = queue
    .filter((item) => item.category !== 'Paused' && item.category !== 'Closed Won' && item.category !== 'Closed Lost')
    .slice(0, 5)
    .map((item, index): DailyFollowUpItem => ({
      rank: index + 1,
      companyName: item.companyName,
      contact: item.contact,
      reason: item.reason,
      suggestedMessageType: item.suggestedMessageType,
      priorityScore: item.priorityScore,
      expectedNextStep: item.expectedNextStep,
    }));

  return {
    generatedAt: new Date().toISOString(),
    queue,
    dailyPlan,
    review: buildReview(queue, outcomeSummary.hasOutcomes, execution.recommendation),
    dashboard: {
      followUpQueue: queue.filter((item) => item.category === 'Needs Follow-Up' || item.category === 'Needs First Message').length,
      todaysFollowUps: dailyPlan.length,
      waitingResponses: queue.filter((item) => item.category === 'Waiting For Response').length,
      openOpportunities: queue.filter((item) => item.category !== 'Closed Won' && item.category !== 'Closed Lost' && item.category !== 'Paused').length,
      nextBestAction: dailyPlan[0]?.expectedNextStep ?? 'No follow-up action available from local data.',
    },
    safetyRules,
  };
}

export function writeFollowUpQueueOutput(report: FollowUpOperatingReport): string[] {
  return writeOutputs([
    { fileName: 'followup-queue.md', body: renderFollowUpQueue(report) },
    { fileName: 'followup-cadence.md', body: renderFollowUpCadence(report) },
  ]);
}

export function writeDailyFollowUpPlanOutput(report: FollowUpOperatingReport): string[] {
  return writeOutputs([
    { fileName: 'daily-followup-plan.md', body: renderDailyFollowUpPlan(report) },
  ]);
}

export function writeFollowUpPrioritiesOutput(report: FollowUpOperatingReport): string[] {
  return writeOutputs([
    { fileName: 'followup-priorities.md', body: renderFollowUpPriorities(report) },
  ]);
}

export function writeFollowUpReviewOutput(report: FollowUpOperatingReport): string[] {
  return writeOutputs([
    { fileName: 'followup-review.md', body: renderFollowUpReview(report) },
  ]);
}

export function renderFollowUpQueue(report: FollowUpOperatingReport): string {
  const categories: FollowUpCategory[] = [
    'Needs First Message',
    'Needs Follow-Up',
    'Waiting For Response',
    'Proposal Review',
    'Paused',
    'Closed Won',
    'Closed Lost',
  ];

  return [
    '# Follow-Up Queue',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    ...categories.flatMap((category) => [
      `## ${category}`,
      renderQueueTable(report.queue.filter((item) => item.category === category)),
      '',
    ]),
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderDailyFollowUpPlan(report: FollowUpOperatingReport): string {
  return [
    '# Daily Follow-Up Plan',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Top 5 Follow-Ups',
    renderDailyPlanTable(report.dailyPlan),
    '',
    '## Next Best Action',
    report.dashboard.nextBestAction,
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderFollowUpPriorities(report: FollowUpOperatingReport): string {
  return [
    '# Follow-Up Priorities',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'Priority model: replied leads first, then warm leads, high-score targets, open proposals, and no-response follow-ups. All signals come from local outcomes and Studio readiness data only.',
    '',
    renderQueueTable(report.queue.slice(0, 10)),
    '',
    '## Dashboard Summary',
    renderList([
      `Follow-Up Queue: ${report.dashboard.followUpQueue}`,
      `Today\'s Follow-Ups: ${report.dashboard.todaysFollowUps}`,
      `Waiting Responses: ${report.dashboard.waitingResponses}`,
      `Open Opportunities: ${report.dashboard.openOpportunities}`,
      `Next Best Action: ${report.dashboard.nextBestAction}`,
    ]),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderFollowUpReview(report: FollowUpOperatingReport): string {
  return [
    '# Follow-Up Review',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## What Is Stuck',
    renderList(report.review.whatIsStuck),
    '',
    '## What Is Moving',
    renderList(report.review.whatIsMoving),
    '',
    '## What Needs Daniel Attention',
    renderList(report.review.needsDanielAttention),
    '',
    '## Biggest Opportunity',
    report.review.biggestOpportunity,
    '',
    '## Biggest Risk',
    report.review.biggestRisk,
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderFollowUpCadence(report: FollowUpOperatingReport): string {
  return [
    '# Follow-Up Cadence',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderList([
      'Needs First Message: Review the message pack, confirm human approval, then Daniel may manually send outside Studio.',
      'Needs Follow-Up: Follow up only after a real reply, no-reply, or next action is manually recorded.',
      'Waiting For Response: Do not send again until Daniel decides the waiting period has passed and records the outcome.',
      'Proposal Review: Review proposal status manually; do not send proposals from Studio.',
      'Paused: No action until Daniel manually reopens the opportunity.',
      'Closed Won: Track delivery separately; do not claim revenue unless local finance data records it.',
      'Closed Lost: No follow-up unless Daniel manually reopens the opportunity.',
    ]),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

function buildQueueItem(
  target: RevenueActivationScore,
  outcomes: OutcomeRecord[],
  manual: ManualFollowUpRecord | undefined,
  topTargetCompany: string,
  topTargetGoNoGo: string,
  releaseConfidence: number,
): FollowUpQueueItem {
  const latest = latestOutcome(outcomes);
  const category = manual?.status ?? categoryForOutcome(latest);
  const isTopTarget = sameCompany(target.companyName, topTargetCompany);
  const priorityScore = calculatePriorityScore(target, category, latest, isTopTarget);
  const suggestedMessageType = suggestedMessageTypeFor(category, latest, isTopTarget);
  const expectedNextStep = expectedNextStepFor(target, category, suggestedMessageType);

  return {
    companyName: target.companyName,
    contact: latest?.contact || manual?.contact || target.bestContact,
    category,
    reason: reasonFor(target, category, latest, isTopTarget, topTargetGoNoGo),
    suggestedMessageType,
    priorityScore,
    expectedNextStep,
    sourceEvidence: [
      `Revenue Activation score: ${target.activationScore}/100.`,
      `Evidence readiness: ${target.evidenceReadiness}/100.`,
      `Proposal readiness: ${target.proposalReadiness}/100.`,
      `Audit readiness: ${target.auditReadiness}/100.`,
      `Executive release confidence: ${releaseConfidence}/100.`,
      latest ? `Latest manual outcome status: response=${latest.response_status}, proposal=${latest.proposal_status}, deal=${latest.deal_status}.` : 'No manual outcome recorded for this company.',
    ],
  };
}

function releaseConfidenceFor(target: RevenueActivationScore): number {
  try {
    return buildExecutiveCompanyReport(target.companyName).releaseConfidence;
  } catch {
    return Math.round((target.evidenceReadiness + target.auditReadiness) / 2);
  }
}

function categoryForOutcome(outcome: OutcomeRecord | undefined): FollowUpCategory {
  if (!outcome) return 'Needs First Message';
  if (outcome.deal_status === 'won' || outcome.revenue_status === 'won') return 'Closed Won';
  if (outcome.deal_status === 'lost') return 'Closed Lost';
  if (outcome.deal_status === 'paused' || outcome.response_status === 'paused') return 'Paused';
  if (outcome.proposal_status === 'proposal_sent') return 'Proposal Review';
  if (outcome.response_status === 'replied' || outcome.meeting_status === 'meeting_booked' || outcome.response_status === 'no_reply') return 'Needs Follow-Up';
  if (outcome.message_sent || outcome.response_status === 'sent') return 'Waiting For Response';
  return 'Needs First Message';
}

function calculatePriorityScore(target: RevenueActivationScore, category: FollowUpCategory, outcome: OutcomeRecord | undefined, isTopTarget: boolean): number {
  const categoryBoost: Record<FollowUpCategory, number> = {
    'Needs Follow-Up': outcome?.response_status === 'replied' ? 35 : 18,
    'Needs First Message': 22,
    'Waiting For Response': 12,
    'Proposal Review': 16,
    'Paused': 0,
    'Closed Won': 0,
    'Closed Lost': 0,
  };
  const topTargetBoost = isTopTarget ? 8 : 0;
  const activationComponent = Math.round(target.activationScore * 0.55);
  return Math.min(100, activationComponent + categoryBoost[category] + topTargetBoost);
}

function sortQueueItems(left: FollowUpQueueItem, right: FollowUpQueueItem): number {
  const byPriorityBand = priorityBand(left) - priorityBand(right);
  if (byPriorityBand !== 0) return byPriorityBand;
  return right.priorityScore - left.priorityScore || left.companyName.localeCompare(right.companyName);
}

function priorityBand(item: FollowUpQueueItem): number {
  if (item.category === 'Needs Follow-Up' && item.reason.includes('replied')) return 1;
  if (item.category === 'Needs Follow-Up') return 2;
  if (item.category === 'Needs First Message' && item.priorityScore >= 75) return 3;
  if (item.category === 'Proposal Review') return 4;
  if (item.category === 'Waiting For Response') return 5;
  if (item.category === 'Needs First Message') return 6;
  if (item.category === 'Paused') return 7;
  return 8;
}

function suggestedMessageTypeFor(category: FollowUpCategory, outcome: OutcomeRecord | undefined, isTopTarget: boolean): string {
  if (category === 'Needs First Message') return isTopTarget ? 'LinkedIn short message from message pack' : 'Executive angle';
  if (category === 'Needs Follow-Up' && outcome?.response_status === 'replied') return 'Interested reply';
  if (category === 'Needs Follow-Up') return 'Short follow-up';
  if (category === 'Proposal Review') return 'Proposal status review';
  if (category === 'Waiting For Response') return 'No message yet; wait or record outcome';
  return 'No message';
}

function expectedNextStepFor(target: RevenueActivationScore, category: FollowUpCategory, messageType: string): string {
  if (category === 'Needs First Message' && messageType === 'LinkedIn short message from message pack') return `Review ${target.companyName} message pack and manually decide whether to send the ${messageType}.`;
  if (category === 'Needs First Message') return `Review ${target.companyName} local revenue and executive context, then manually decide whether to draft an ${messageType}.`;
  if (category === 'Needs Follow-Up') return `Review recorded outcome for ${target.companyName}, then Daniel manually decides whether to use ${messageType}.`;
  if (category === 'Waiting For Response') return `Wait for a real response or manually record no_reply for ${target.companyName} when appropriate.`;
  if (category === 'Proposal Review') return `Review local proposal status for ${target.companyName}; do not send proposal from Studio.`;
  if (category === 'Paused') return `Keep ${target.companyName} paused unless Daniel manually reopens it.`;
  return `No active follow-up for ${target.companyName}.`;
}

function reasonFor(target: RevenueActivationScore, category: FollowUpCategory, outcome: OutcomeRecord | undefined, isTopTarget: boolean, topTargetGoNoGo: string): string {
  if (outcome?.response_status === 'replied') return `${target.companyName} has a manually recorded reply and should be reviewed first.`;
  if (outcome?.proposal_status === 'proposal_sent') return `${target.companyName} has a manually recorded proposal_sent status that needs review.`;
  if (outcome?.response_status === 'no_reply') return `${target.companyName} has a manually recorded no_reply status.`;
  if (category === 'Waiting For Response') return `${target.companyName} has a manual sent/waiting outcome. Do not infer interest.`;
  if (category === 'Needs First Message' && isTopTarget) return `${target.companyName} is the current top target and Execution Pack is ${topTargetGoNoGo}.`;
  if (category === 'Needs First Message' && target.activationScore >= 75) return `${target.companyName} is a high-score local target with no manual outcome recorded.`;
  if (category === 'Needs First Message') return `${target.companyName} is a ranked local target with no manual outcome recorded.`;
  return `${target.companyName} is categorized as ${category} from local outcome data.`;
}

function buildReview(queue: FollowUpQueueItem[], hasOutcomes: boolean, executionRecommendation: string) {
  const actionable = queue.filter((item) => item.category === 'Needs First Message' || item.category === 'Needs Follow-Up');
  const waiting = queue.filter((item) => item.category === 'Waiting For Response');
  const proposals = queue.filter((item) => item.category === 'Proposal Review');
  const top = actionable[0] ?? queue[0];

  return {
    whatIsStuck: hasOutcomes
      ? waiting.map((item) => `${item.companyName}: waiting for real response.`)
      : ['No manual outcomes recorded yet, so response learning has not started.'],
    whatIsMoving: [
      `Execution Pack recommendation is ${executionRecommendation}.`,
      ...actionable.slice(0, 3).map((item) => `${item.companyName}: ${item.category}, priority ${item.priorityScore}/100.`),
      ...proposals.slice(0, 2).map((item) => `${item.companyName}: proposal status needs manual review.`),
    ],
    needsDanielAttention: top
      ? [`${top.companyName}: ${top.expectedNextStep}`]
      : ['No follow-up items available from local data.'],
    biggestOpportunity: top
      ? `${top.companyName}: ${top.reason}`
      : 'No opportunity found in local follow-up data.',
    biggestRisk: hasOutcomes
      ? 'Outcome records must stay current or follow-up priority will become stale.'
      : 'No outcomes are recorded yet, so Studio cannot learn from replies, no-replies, meetings, proposals, wins, or losses.',
  };
}

function latestOutcome(outcomes: OutcomeRecord[]): OutcomeRecord | undefined {
  return [...outcomes].sort((left, right) => right.date.localeCompare(left.date))[0];
}

function sameCompany(left: string, right: string): boolean {
  return normalize(left) === normalize(right);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function writeOutputs(outputs: { fileName: string; body: string }[]): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });
  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }
  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

function renderQueueTable(items: FollowUpQueueItem[]): string {
  if (items.length === 0) return '- None from local data.';
  return [
    '| Company | Contact | Reason | Suggested Message Type | Priority Score | Expected Next Step |',
    '| --- | --- | --- | --- | ---: | --- |',
    ...items.map((item) => `| ${escapeTable(item.companyName)} | ${escapeTable(item.contact)} | ${escapeTable(item.reason)} | ${escapeTable(item.suggestedMessageType)} | ${item.priorityScore} | ${escapeTable(item.expectedNextStep)} |`),
  ].join('\n');
}

function renderDailyPlanTable(items: DailyFollowUpItem[]): string {
  if (items.length === 0) return '- No follow-ups available from local data.';
  return [
    '| Rank | Company | Contact | Reason | Suggested Message Type | Priority Score | Expected Next Step |',
    '| ---: | --- | --- | --- | --- | ---: | --- |',
    ...items.map((item) => `| ${item.rank} | ${escapeTable(item.companyName)} | ${escapeTable(item.contact)} | ${escapeTable(item.reason)} | ${escapeTable(item.suggestedMessageType)} | ${item.priorityScore} | ${escapeTable(item.expectedNextStep)} |`),
  ].join('\n');
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
