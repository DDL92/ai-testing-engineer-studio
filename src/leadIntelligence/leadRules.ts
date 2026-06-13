import fs = require('fs');
import path = require('path');
import { buildFirstRevenueExecutionPack } from '../executionPack/generateFirstRevenueChecklist';
import { ApprovedFirstOffer } from '../opportunityEngine/types';
import { buildProposalPortfolio } from '../proposalEngine/proposalRules';
import { ProposalPackage } from '../proposalEngine/types';
import { buildRevenueActivationReport } from '../revenueActivation/revenueRules';
import { RevenueActivationScore } from '../revenueActivation/types';
import {
  LeadActionType,
  LeadIntelligenceItem,
  LeadIntelligenceReport,
  LeadIntelligenceState,
  LeadOpportunitySummary,
  LeadScoreBreakdown,
} from './types';

const statePath = path.join(process.cwd(), 'data', 'leads', 'lead-intelligence-state.json');
const outputRoot = path.join(process.cwd(), 'output', 'leads');

const safetyRules = [
  'No outreach generated.',
  'No emails generated.',
  'No LinkedIn messages generated.',
  'No meetings created.',
  'No revenue claimed.',
  'No client interest assumed.',
  'Human approval required before any external action.',
];

const scoringFormula = [
  'Overall Score = Opportunity 25% + Evidence 15% + Proposal 15% + Executive 10% + Commercial 15% + Audit Fit 10% + Starter-Pack Fit 5% + Retainer Fit 5%.',
  'Opportunity, evidence, proposal, contact, audit, and commercial scores come from local Revenue Activation data.',
  'Executive readiness is 100 only when the local executive summary exists; otherwise 0.',
  'Offer fit scores are derived from local recommended offers, proposal readiness, audit readiness, and retainer path artifacts.',
];

export function loadLeadIntelligenceState(): LeadIntelligenceState {
  const fallback: LeadIntelligenceState = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    scoringNotes: [
      'Use local Studio outputs only.',
      'Treat rankings as planning signals, not proof of buyer interest.',
      'Do not count estimates, proposals, candidates, or plans as revenue.',
    ],
    safetyRules,
  };

  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  if (!fs.existsSync(statePath)) {
    fs.writeFileSync(statePath, `${JSON.stringify(fallback, null, 2)}\n`, 'utf8');
    return fallback;
  }

  const raw = fs.readFileSync(statePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as LeadIntelligenceState;
}

export function buildLeadIntelligenceReport(): LeadIntelligenceReport {
  const state = loadLeadIntelligenceState();
  const revenueActivation = buildRevenueActivationReport();
  const proposalPortfolio = buildProposalPortfolio();
  const executionPack = buildFirstRevenueExecutionPack();
  const leads = revenueActivation.pipeline.map((target) => {
    const proposal = proposalPortfolio.proposals.find((item) => normalize(item.companyId) === normalize(target.companyId));
    return buildLeadItem(target, proposal, executionPack.topTarget.companyId);
  }).sort((left, right) => right.overallScore - left.overallScore || left.companyName.localeCompare(right.companyName));

  return {
    generatedAt: new Date().toISOString(),
    state,
    leads,
    opportunities: buildOpportunitySummary(leads),
    scoringFormula,
    safetyRules,
  };
}

export function writeLeadIntelligenceOutputs(report: LeadIntelligenceReport): string[] {
  return writeOutputs([
    { fileName: 'lead-intelligence.md', body: renderLeadIntelligence(report) },
    { fileName: 'best-offers.md', body: renderBestOffers(report) },
    { fileName: 'revenue-priorities.md', body: renderRevenuePriorities(report) },
  ]);
}

export function writeLeadRankingOutputs(report: LeadIntelligenceReport): string[] {
  return writeOutputs([
    { fileName: 'lead-ranking.md', body: renderLeadRanking(report) },
  ]);
}

export function writeLeadOpportunityOutputs(report: LeadIntelligenceReport): string[] {
  return writeOutputs([
    { fileName: 'high-probability-opportunities.md', body: renderHighProbabilityOpportunities(report) },
  ]);
}

export function writeLeadNextActionOutputs(report: LeadIntelligenceReport): string[] {
  return writeOutputs([
    { fileName: 'next-actions.md', body: renderNextActions(report) },
  ]);
}

export function renderLeadIntelligence(report: LeadIntelligenceReport): string {
  return [
    '# Lead Intelligence',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Highest Probability Lead',
    report.leads[0] ? renderLeadSnapshot(report.leads[0]) : '- No leads found.',
    '',
    '## Scoring Formula',
    renderList(report.scoringFormula),
    '',
    '## Lead Scores',
    renderLeadScoreTable(report.leads),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderLeadRanking(report: LeadIntelligenceReport): string {
  return [
    '# Lead Ranking',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Rank | Lead | Score | Recommended Offer | Reason |',
    '| ---: | --- | ---: | --- | --- |',
    ...report.leads.map((lead, index) => `| ${index + 1} | ${escapeTable(lead.companyName)} | ${lead.overallScore} | ${escapeTable(lead.recommendedOffer)} | ${escapeTable(lead.reason)} |`),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderHighProbabilityOpportunities(report: LeadIntelligenceReport): string {
  const summary = report.opportunities;

  return [
    '# High-Probability Opportunities',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderList([
      `Strongest candidate: ${candidateLine(summary.strongestCandidate)}`,
      `Fastest path to revenue: ${candidateLine(summary.fastestPathToRevenue)}`,
      `Best QA Audit candidate: ${candidateLine(summary.bestQaAuditCandidate)}`,
      `Best Starter Pack candidate: ${candidateLine(summary.bestStarterPackCandidate)}`,
      `Future Retainer candidate: ${candidateLine(summary.futureRetainerCandidate)}`,
    ]),
    '',
    '## Caution',
    renderList([
      'These are local planning signals only.',
      'Do not assume conversion, reply, meeting, client interest, or revenue.',
    ]),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderNextActions(report: LeadIntelligenceReport): string {
  return [
    '# Lead Next Actions',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    ...report.leads.flatMap((lead) => [
      `## ${lead.companyName}`,
      '',
      `Lead: ${lead.companyName}`,
      `Recommended Offer: ${lead.recommendedOffer}`,
      `Why: ${lead.reason}`,
      `Recommended Next Action: ${lead.recommendedActionType} - ${lead.recommendedNextAction}`,
      `Estimated Manual Effort: ${lead.estimatedManualEffort}`,
      '',
    ]),
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderBestOffers(report: LeadIntelligenceReport): string {
  return [
    '# Best Offers',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Lead | Best Offer | Audit Fit | Starter-Pack Fit | Retainer Fit |',
    '| --- | --- | ---: | ---: | ---: |',
    ...report.leads.map((lead) => `| ${escapeTable(lead.companyName)} | ${escapeTable(lead.recommendedOffer)} | ${lead.scoreBreakdown.auditFit} | ${lead.scoreBreakdown.starterPackFit} | ${lead.scoreBreakdown.retainerFit} |`),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderRevenuePriorities(report: LeadIntelligenceReport): string {
  return [
    '# Revenue Priorities',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderList(report.leads.map((lead, index) => `${index + 1}. ${lead.companyName}: ${lead.fastestRevenuePath}`)),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

function buildLeadItem(target: RevenueActivationScore, proposal: ProposalPackage | undefined, topTargetId: string): LeadIntelligenceItem {
  const executiveReadiness = fileExists(`output/executive/${target.companyId}-executive-summary.md`) ? 100 : 0;
  const recommendedOffer = target.bestOffer;
  const auditFit = fitForAudit(target, recommendedOffer);
  const starterPackFit = fitForStarterPack(target, proposal, recommendedOffer);
  const retainerFit = fitForRetainer(target, proposal, recommendedOffer);
  const breakdown: LeadScoreBreakdown = {
    opportunityScore: target.opportunityScore,
    evidenceReadiness: target.evidenceReadiness,
    proposalReadiness: target.proposalReadiness,
    executiveReadiness,
    commercialPotential: target.activationScore,
    auditFit,
    starterPackFit,
    retainerFit,
  };
  const overallScore = calculateOverallScore(breakdown);
  const isTopTarget = normalize(target.companyId) === normalize(topTargetId);
  const actionType = actionTypeFor(target, executiveReadiness, isTopTarget);

  return {
    companyId: target.companyId,
    companyName: target.companyName,
    overallScore,
    recommendedOffer,
    strongestSignals: strongestSignals(target, breakdown),
    reason: buildReason(target, breakdown, recommendedOffer),
    fastestRevenuePath: fastestRevenuePath(target, recommendedOffer, isTopTarget),
    recommendedActionType: actionType,
    recommendedNextAction: nextActionFor(target, recommendedOffer, actionType, isTopTarget),
    estimatedManualEffort: estimatedManualEffort(actionType),
    scoreBreakdown: breakdown,
  };
}

function calculateOverallScore(score: LeadScoreBreakdown): number {
  return Math.round(
    score.opportunityScore * 0.25
    + score.evidenceReadiness * 0.15
    + score.proposalReadiness * 0.15
    + score.executiveReadiness * 0.10
    + score.commercialPotential * 0.15
    + score.auditFit * 0.10
    + score.starterPackFit * 0.05
    + score.retainerFit * 0.05,
  );
}

function fitForAudit(target: RevenueActivationScore, offer: ApprovedFirstOffer): number {
  if (offer === 'QA Audit ($199-$500)') return Math.max(target.auditReadiness, 90);
  return target.auditReadiness;
}

function fitForStarterPack(target: RevenueActivationScore, proposal: ProposalPackage | undefined, offer: ApprovedFirstOffer): number {
  if (offer === 'Playwright Starter Pack ($900-$1500)') return Math.max(target.evidenceReadiness, target.proposalReadiness);
  if (proposal?.retainerPath.some((item) => item.toLowerCase().includes('starter'))) return Math.round((target.evidenceReadiness + target.proposalReadiness) / 2);
  return Math.round(target.evidenceReadiness * 0.6);
}

function fitForRetainer(target: RevenueActivationScore, proposal: ProposalPackage | undefined, offer: ApprovedFirstOffer): number {
  if (offer === 'QA Automation Retainer ($1500-$3000/month)') return Math.max(target.activationScore, target.proposalReadiness);
  if (proposal?.retainerPath.length) return Math.round((target.activationScore + target.proposalReadiness) / 2);
  return Math.round(target.activationScore * 0.5);
}

function strongestSignals(target: RevenueActivationScore, score: LeadScoreBreakdown): string[] {
  return [
    `Opportunity score ${score.opportunityScore}/100`,
    `Evidence readiness ${score.evidenceReadiness}/100`,
    `Proposal readiness ${score.proposalReadiness}/100`,
    `Audit readiness ${target.auditReadiness}/100`,
    `Commercial activation ${score.commercialPotential}/100`,
  ].filter((item) => !item.includes(' 0/100'));
}

function buildReason(target: RevenueActivationScore, score: LeadScoreBreakdown, offer: ApprovedFirstOffer): string {
  return `${target.companyName} has activation ${score.commercialPotential}/100, opportunity ${score.opportunityScore}/100, evidence ${score.evidenceReadiness}/100, and best local offer ${offer}.`;
}

function fastestRevenuePath(target: RevenueActivationScore, offer: ApprovedFirstOffer, isTopTarget: boolean): string {
  if (isTopTarget && offer === 'QA Audit ($199-$500)') return 'Review first-client package and manually decide SEND / WAIT / REWRITE for the QA Audit offer.';
  if (offer === 'QA Audit ($199-$500)') return 'Review audit and executive readiness before any manual QA Audit offer decision.';
  if (offer === 'Playwright Starter Pack ($900-$1500)') return 'Use audit evidence to refine a starter-pack scope after manual review.';
  return 'Treat as future retainer path after audit or starter-pack value is validated.';
}

function actionTypeFor(target: RevenueActivationScore, executiveReadiness: number, isTopTarget: boolean): LeadActionType {
  if (isTopTarget && target.proposalReadiness >= 100 && executiveReadiness === 100) return 'REVIEW';
  if (target.proposalReadiness < 100 || executiveReadiness < 100) return 'REFINE';
  if (target.contactReadiness > 0) return 'FOLLOW-UP';
  return 'WAIT';
}

function nextActionFor(target: RevenueActivationScore, offer: ApprovedFirstOffer, actionType: LeadActionType, isTopTarget: boolean): string {
  if (actionType === 'REVIEW' && isTopTarget) return `Review ${target.companyName} message pack, executive summary, audit PDF, and proposal PDF; Daniel manually decides SEND / WAIT / REWRITE.`;
  if (actionType === 'REFINE') return `Refresh missing executive/proposal readiness for ${target.companyName} before any external action.`;
  if (actionType === 'FOLLOW-UP') return `Review local context for ${target.companyName}; do not send unless Daniel manually approves.`;
  if (offer === 'QA Audit ($199-$500)') return `Wait until ${target.companyName} has enough local readiness for manual QA Audit review.`;
  return `Prepare internal review notes for ${target.companyName}; no outreach generated.`;
}

function estimatedManualEffort(actionType: LeadActionType): string {
  if (actionType === 'REVIEW') return '20-30 minutes';
  if (actionType === 'REFINE') return '30-45 minutes';
  if (actionType === 'FOLLOW-UP') return '15-20 minutes';
  if (actionType === 'PREPARE PROPOSAL') return '45-60 minutes';
  return '10-15 minutes';
}

function buildOpportunitySummary(leads: LeadIntelligenceItem[]): LeadOpportunitySummary {
  return {
    strongestCandidate: leads[0],
    fastestPathToRevenue: leads.find((lead) => lead.recommendedActionType === 'REVIEW') ?? leads[0],
    bestQaAuditCandidate: bestByOffer(leads, 'QA Audit ($199-$500)'),
    bestStarterPackCandidate: bestByOffer(leads, 'Playwright Starter Pack ($900-$1500)') ?? leads[0],
    futureRetainerCandidate: bestByOffer(leads, 'QA Automation Retainer ($1500-$3000/month)') ?? [...leads].sort((left, right) => right.scoreBreakdown.retainerFit - left.scoreBreakdown.retainerFit)[0],
  };
}

function bestByOffer(leads: LeadIntelligenceItem[], offer: ApprovedFirstOffer): LeadIntelligenceItem | undefined {
  return leads.filter((lead) => lead.recommendedOffer === offer).sort((left, right) => right.overallScore - left.overallScore)[0];
}

function renderLeadSnapshot(lead: LeadIntelligenceItem): string {
  return renderList([
    `Lead: ${lead.companyName}`,
    `Score: ${lead.overallScore}/100`,
    `Recommended Offer: ${lead.recommendedOffer}`,
    `Fastest Revenue Path: ${lead.fastestRevenuePath}`,
    `Recommended Next Action: ${lead.recommendedActionType} - ${lead.recommendedNextAction}`,
  ]);
}

function renderLeadScoreTable(leads: LeadIntelligenceItem[]): string {
  if (leads.length === 0) return '- No leads found.';
  return [
    '| Lead | Overall | Opportunity | Evidence | Proposal | Executive | Commercial | Audit Fit | Starter Fit | Retainer Fit |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...leads.map((lead) => `| ${escapeTable(lead.companyName)} | ${lead.overallScore} | ${lead.scoreBreakdown.opportunityScore} | ${lead.scoreBreakdown.evidenceReadiness} | ${lead.scoreBreakdown.proposalReadiness} | ${lead.scoreBreakdown.executiveReadiness} | ${lead.scoreBreakdown.commercialPotential} | ${lead.scoreBreakdown.auditFit} | ${lead.scoreBreakdown.starterPackFit} | ${lead.scoreBreakdown.retainerFit} |`),
  ].join('\n');
}

function candidateLine(lead: LeadIntelligenceItem | undefined): string {
  if (!lead) return 'No local candidate found.';
  return `${lead.companyName} (${lead.overallScore}/100) - ${lead.recommendedOffer}. ${lead.fastestRevenuePath}`;
}

function writeOutputs(outputs: { fileName: string; body: string }[]): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });
  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }
  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
