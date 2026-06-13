import fs = require('fs');
import path = require('path');
import { buildFinanceReport, loadFinanceInput } from '../financeTracking/financeRules';
import { FinanceOfferType } from '../financeTracking/types';
import { ApprovedFirstOffer, OpportunityReport } from '../opportunityEngine/types';
import { buildOpportunitySummary } from '../opportunityEngine/opportunityEngineRules';
import { buildProposalPortfolio } from '../proposalEngine/proposalRules';
import { ProposalPackage } from '../proposalEngine/types';
import {
  FirstClientPlan,
  FirstRetainerPlan,
  RevenueActivationReport,
  RevenueActivationScore,
  RevenueFocusAction,
  RevenueTarget,
  RevenueTargetStatus,
} from './types';

const outputRoot = path.join(process.cwd(), 'output', 'revenue');
const targetCompanyIds = ['pushpress', 'teamup', 'glofox', 'wodify'];

const safetyRules = [
  'Revenue planning only.',
  'Human approval is required before outreach, emails, proposals, invoices, payments, client communication, or external action.',
  'Use local Studio data only.',
  'Do not invent meetings, replies, revenue, client interest, client commitments, or results.',
  'Do not send outreach, send emails, send proposals, create invoices, or create payments.',
];

export function buildRevenueActivationReport(): RevenueActivationReport {
  const generatedAt = new Date().toISOString();
  const opportunitySummary = buildOpportunitySummary();
  const proposalPortfolio = buildProposalPortfolio();
  const financeReport = buildFinanceReport(loadFinanceInput());
  const pipeline = buildPipeline(opportunitySummary.reports, proposalPortfolio.proposals);
  const targets = buildTargets(financeReport.countedRevenueActivity, financeReport.currentMrr, pipeline);
  const focusActions = buildFocusActions(pipeline, targets);
  const firstClientPlan = buildFirstClientPlan(pipeline, targets);
  const firstRetainerPlan = buildFirstRetainerPlan(pipeline);

  return {
    generatedAt,
    targets,
    pipeline,
    focusActions,
    firstClientPlan,
    firstRetainerPlan,
    currentMrr: financeReport.currentMrr,
    safetyRules,
  };
}

export function writeRevenueTargetsOutputs(report: RevenueActivationReport): string[] {
  return writeOutputs([
    { fileName: 'revenue-targets.md', body: renderRevenueTargets(report) },
    { fileName: 'first-client-plan.md', body: renderFirstClientPlan(report) },
  ]);
}

export function writeRevenuePipelineOutputs(report: RevenueActivationReport): string[] {
  return writeOutputs([
    { fileName: 'revenue-pipeline.md', body: renderRevenuePipeline(report) },
    { fileName: 'first-retainer-plan.md', body: renderFirstRetainerPlan(report) },
  ]);
}

export function writeRevenueFocusOutputs(report: RevenueActivationReport): string[] {
  return writeOutputs([
    { fileName: 'revenue-focus.md', body: renderRevenueFocus(report) },
    { fileName: 'first-client-plan.md', body: renderFirstClientPlan(report) },
    { fileName: 'first-retainer-plan.md', body: renderFirstRetainerPlan(report) },
  ]);
}

export function writeRevenueScoreOutputs(report: RevenueActivationReport): string[] {
  return writeOutputs([
    { fileName: 'revenue-score.md', body: renderRevenueScore(report) },
    { fileName: 'revenue-pipeline.md', body: renderRevenuePipeline(report) },
  ]);
}

export function renderRevenueTargets(report: RevenueActivationReport): string {
  return [
    '# Revenue Targets',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderTargets(report.targets),
    '',
    '## Current MRR',
    renderList([
      `Current MRR from local finance data: ${formatCurrency(report.currentMrr)}`,
      'Do not count pipeline value, candidates, forecasts, proposals, or interest as revenue.',
    ]),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderRevenuePipeline(report: RevenueActivationReport): string {
  return [
    '# Revenue Pipeline',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'Ranked targets: PushPress, TeamUp, Glofox, Wodify.',
    '',
    renderPipelineTable(report.pipeline),
    '',
    '## Scoring Model',
    renderList([
      'Activation Score = Opportunity 30% + Evidence 20% + Proposal 20% + Contact 15% + Audit 15%.',
      'Proposal readiness counts generated local proposal artifacts only.',
      'Contact readiness uses local contact and outreach status only.',
      'Audit readiness uses local audit, unified audit, client audit, and evidence artifacts only.',
    ]),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderRevenueFocus(report: RevenueActivationReport): string {
  return [
    '# Revenue Focus',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    'If Daniel only had 30 minutes today:',
    '',
    renderFocusActions(report.focusActions),
    '',
    '## Highest Probability Answer',
    renderList([
      report.focusActions[0]
        ? `${report.focusActions[0].title} for ${report.focusActions[0].companyName}.`
        : 'No revenue focus action found.',
      report.focusActions[0]?.reason ?? 'Review local pipeline readiness before taking action.',
    ]),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderRevenueScore(report: RevenueActivationReport): string {
  return [
    '# Revenue Score',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderPipelineTable(report.pipeline),
    '',
    '## Top Revenue Target',
    report.pipeline[0] ? scoreBullets(report.pipeline[0]) : '- No target found.',
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderFirstClientPlan(report: RevenueActivationReport): string {
  const plan = report.firstClientPlan;

  return [
    '# First Client Plan',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderList([
      `Best company: ${plan.bestCompany}`,
      `Best contact: ${plan.bestContact}`,
      `Best offer: ${plan.bestOffer}`,
      `Best next action: ${plan.bestNextAction}`,
      `Why: ${plan.why}`,
    ]),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderFirstRetainerPlan(report: RevenueActivationReport): string {
  const plan = report.firstRetainerPlan;

  return [
    '# First Retainer Plan',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderList([
      `Most likely retainer candidate: ${plan.mostLikelyRetainerCandidate}`,
      `Recommended path: ${plan.recommendedPath.join(' -> ')}`,
      `Next action: ${plan.nextAction}`,
    ]),
    '',
    '## Expected Blockers',
    renderList(plan.expectedBlockers),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

function buildPipeline(opportunities: OpportunityReport[], proposals: ProposalPackage[]): RevenueActivationScore[] {
  return targetCompanyIds
    .map((companyId) => {
      const opportunity = opportunities.find((item) => normalizedId(item.companyId) === companyId);
      if (!opportunity) return undefined;

      const proposal = proposals.find((item) => normalizedId(item.companyId) === companyId);
      const opportunityScore = opportunity.confidenceScore;
      const evidenceReadiness = proposal?.evidenceReadiness ?? evidenceReadinessFromOpportunity(opportunity);
      const proposalReadiness = proposal ? readinessFromFiles([proposal.artifacts.markdownPath, proposal.artifacts.pdfPath]) : 0;
      const contactReadiness = contactReadinessFromOpportunity(opportunity);
      const auditReadiness = auditReadinessFor(companyId);
      const activationScore = Math.round(
        opportunityScore * 0.3
        + evidenceReadiness * 0.2
        + proposalReadiness * 0.2
        + contactReadiness * 0.15
        + auditReadiness * 0.15,
      );
      const blockers = buildBlockers(proposalReadiness, contactReadiness, auditReadiness, proposal);

      return {
        companyId,
        companyName: opportunity.companyName,
        opportunityScore,
        evidenceReadiness,
        proposalReadiness,
        contactReadiness,
        auditReadiness,
        activationScore,
        bestContact: formatBestContact(opportunity),
        bestOffer: nextOfferForCurrentTarget(opportunity.bestFirstOffer),
        nextAction: buildNextAction(opportunity, proposal, blockers),
        why: buildWhy(opportunity, proposal, contactReadiness),
        blockers,
      };
    })
    .filter((item): item is RevenueActivationScore => Boolean(item))
    .sort((left, right) => right.activationScore - left.activationScore || left.companyName.localeCompare(right.companyName));
}

function buildTargets(activity: { offerType: FinanceOfferType; status: string }[], currentMrr: number, pipeline: RevenueActivationScore[]): RevenueTarget[] {
  const auditSold = activity.some((item) => item.offerType === 'qa-audit');
  const starterSold = activity.some((item) => item.offerType === 'playwright-starter-pack');
  const retainerSold = activity.some((item) => item.offerType === 'qa-automation-retainer');
  const topCompany = pipeline[0]?.companyName ?? 'No ranked company';

  return [
    target(1, 'First Audit Sold', auditSold, `Best current candidate: ${topCompany}`),
    target(2, 'First Starter Pack Sold', starterSold, auditSold ? `Convert audit delivery into starter pack scope for ${topCompany}.` : 'Sell and deliver the first audit before starter pack positioning.'),
    target(3, 'First Retainer Sold', retainerSold, starterSold ? `Convert starter pack into retainer path for ${topCompany}.` : 'Validate audit and starter pack value before retainer positioning.'),
    {
      order: 4,
      title: '$3,000 MRR',
      status: currentMrr >= 3000 ? 'Complete' : retainerSold ? 'Current Focus' : 'Next',
      currentValue: `${formatCurrency(currentMrr)} / $3,000`,
      nextAction: currentMrr >= 3000 ? 'Maintain retention and delivery quality.' : 'Close one or two QA Automation Retainers at approved pricing.',
    },
  ];
}

function target(order: 1 | 2 | 3, title: RevenueTarget['title'], complete: boolean, nextAction: string): RevenueTarget {
  const status: RevenueTargetStatus = complete ? 'Complete' : order === 1 ? 'Current Focus' : 'Next';

  return {
    order,
    title,
    status,
    currentValue: complete ? 'Recorded in local finance data' : 'Not recorded yet',
    nextAction: complete ? 'Move to the next revenue target.' : nextAction,
  };
}

function buildFocusActions(pipeline: RevenueActivationScore[], targets: RevenueTarget[]): RevenueFocusAction[] {
  const currentTarget = targets.find((item) => item.status === 'Current Focus') ?? targets.find((item) => item.status === 'Next');
  const top = pipeline[0];
  const second = pipeline[1];
  const third = pipeline[2];

  return [
    {
      priority: 1,
      title: `Move ${currentTarget?.title ?? 'First Audit Sold'} forward`,
      companyName: top?.companyName ?? 'No target found',
      reason: top ? `${top.companyName} has the highest activation score (${top.activationScore}/100) and the strongest current path to revenue.` : 'No ranked revenue target exists.',
      command: top ? `npm run sow:generate -- --company ${top.companyName}` : 'npm run revenue:pipeline',
      approvalBoundary: 'Review and decide manually. Do not send the proposal or outreach automatically.',
    },
    {
      priority: 2,
      title: 'Review first-client plan',
      companyName: top?.companyName ?? 'No target found',
      reason: top ? `Confirm best contact, offer, and next action for ${top.companyName}.` : 'Build first-client plan from local data first.',
      command: 'npm run revenue:targets',
      approvalBoundary: 'Planning only. Human approval required before external communication.',
    },
    {
      priority: 3,
      title: 'Keep backup revenue path warm',
      companyName: second?.companyName ?? third?.companyName ?? 'No backup found',
      reason: second ? `${second.companyName} is the next strongest ranked candidate if the top path stalls.` : 'No secondary candidate is currently ranked.',
      command: 'npm run revenue:pipeline',
      approvalBoundary: 'Review only. Do not infer client interest or send follow-up.',
    },
  ];
}

function buildFirstClientPlan(pipeline: RevenueActivationScore[], targets: RevenueTarget[]): FirstClientPlan {
  const top = pipeline[0];
  const currentTarget = targets.find((item) => item.status === 'Current Focus') ?? targets[0];

  if (!top) {
    return {
      bestCompany: 'No local candidate found',
      bestContact: 'No local contact found',
      bestOffer: 'QA Audit ($199-$500)',
      bestNextAction: 'Run npm run revenue:pipeline and review missing local data.',
      why: 'No local opportunity score exists for the target companies.',
    };
  }

  return {
    bestCompany: top.companyName,
    bestContact: top.bestContact,
    bestOffer: currentTarget?.title === 'First Starter Pack Sold'
      ? 'Playwright Starter Pack ($900-$1500)'
      : currentTarget?.title === 'First Retainer Sold'
        ? 'QA Automation Retainer ($1500-$3000/month)'
        : 'QA Audit ($199-$500)',
    bestNextAction: top.nextAction,
    why: top.why,
  };
}

function buildFirstRetainerPlan(pipeline: RevenueActivationScore[]): FirstRetainerPlan {
  const candidate = [...pipeline].sort((left, right) => {
    const leftScore = left.activationScore + left.evidenceReadiness + left.proposalReadiness;
    const rightScore = right.activationScore + right.evidenceReadiness + right.proposalReadiness;
    return rightScore - leftScore || left.companyName.localeCompare(right.companyName);
  })[0];

  return {
    mostLikelyRetainerCandidate: candidate?.companyName ?? 'No local retainer candidate found',
    recommendedPath: ['QA Audit', 'Playwright Starter Pack', 'QA Automation Retainer'],
    expectedBlockers: [
      'First paid audit is not recorded in local finance data yet.',
      'Starter pack value is not validated with a paying client yet.',
      'Retainer interest must not be inferred until Daniel has an approved client conversation or local booked revenue record.',
      ...(candidate?.blockers.filter((blocker) => !blocker.startsWith('No local readiness blocker')) ?? []),
    ],
    nextAction: candidate
      ? `Use the first audit to identify a bounded starter pack path for ${candidate.companyName}; do not pitch retainer before value is validated.`
      : 'Run revenue:pipeline after local evidence and proposal assets exist.',
  };
}

function evidenceReadinessFromOpportunity(opportunity: OpportunityReport): number {
  const available = Object.values(opportunity.availability).filter(Boolean).length;
  return Math.round((available / Object.keys(opportunity.availability).length) * 100);
}

function contactReadinessFromOpportunity(opportunity: OpportunityReport): number {
  const status = opportunity.bestContact.status.toLowerCase();
  if (status.includes('replied')) return 100;
  if (status.includes('connected')) return 95;
  if (status.includes('message-sent')) return 85;
  if (status.includes('invitation-sent')) return 60;
  if (status.includes('not-contacted')) return 45;
  if (status.includes('research-required')) return 0;
  return opportunity.bestContact.researchRequired ? 40 : 70;
}

function auditReadinessFor(companyId: string): number {
  const paths = [
    `output/audit-packs/${companyId}-audit-pack.md`,
    `output/unified-audits/${companyId}-unified-audit.md`,
    `output/client-audit-reports/${companyId}-qa-audit-report.md`,
    `output/client-audit-reports/${companyId}-qa-audit-report.pdf`,
    `output/evidence/${companyId}-evidence.md`,
  ];

  return readinessFromRelativeFiles(paths);
}

function readinessFromFiles(paths: string[]): number {
  if (paths.length === 0) return 0;
  const available = paths.filter((filePath) => fs.existsSync(filePath)).length;
  return Math.round((available / paths.length) * 100);
}

function readinessFromRelativeFiles(paths: string[]): number {
  return readinessFromFiles(paths.map((item) => path.join(process.cwd(), item)));
}

function buildBlockers(proposalReadiness: number, contactReadiness: number, auditReadiness: number, proposal?: ProposalPackage): string[] {
  const blockers = [
    proposalReadiness < 100 ? 'Proposal package is not fully generated locally.' : '',
    contactReadiness < 80 ? 'Contact path needs manual review before outreach.' : '',
    auditReadiness < 100 ? 'Audit/evidence package needs review before commercial use.' : '',
    !proposal ? 'No active proposal target exists for this company.' : '',
  ].filter(Boolean);

  return blockers.length ? blockers : ['No local readiness blocker detected; Daniel approval is still required before external action.'];
}

function formatBestContact(opportunity: OpportunityReport): string {
  return `${opportunity.bestContact.name} (${opportunity.bestContact.role}; ${opportunity.bestContact.status})`;
}

function nextOfferForCurrentTarget(defaultOffer: ApprovedFirstOffer): ApprovedFirstOffer {
  return defaultOffer;
}

function buildNextAction(opportunity: OpportunityReport, proposal: ProposalPackage | undefined, blockers: string[]): string {
  if (!proposal) {
    return `Prepare proposal target and review missing proposal readiness for ${opportunity.companyName}.`;
  }

  if (blockers.some((blocker) => blocker.includes('Contact'))) {
    return `Review contact path for ${opportunity.companyName} before any outreach.`;
  }

  return `Review ${opportunity.companyName} audit/proposal package and decide manually whether to move the first paid QA Audit offer forward.`;
}

function buildWhy(opportunity: OpportunityReport, proposal: ProposalPackage | undefined, contactReadiness: number): string {
  return [
    `${opportunity.confidenceScore}/100 opportunity confidence`,
    proposal ? `${proposal.evidenceReadiness}/100 evidence readiness` : 'no local proposal package',
    `${contactReadiness}/100 contact readiness`,
    opportunity.commercialReason,
  ].join('; ');
}

function renderTargets(targets: RevenueTarget[]): string {
  return targets.map((targetItem) => [
    `## Target ${targetItem.order}`,
    targetItem.title,
    '',
    renderList([
      `Status: ${targetItem.status}`,
      `Current value: ${targetItem.currentValue}`,
      `Next action: ${targetItem.nextAction}`,
    ]),
  ].join('\n')).join('\n\n');
}

function renderPipelineTable(items: RevenueActivationScore[]): string {
  return [
    '| Rank | Company | Activation | Opportunity | Evidence | Proposal | Contact | Audit | Best Contact | Best Offer | Next Action |',
    '| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |',
    ...items.map((item, index) => `| ${index + 1} | ${escapeTable(item.companyName)} | ${item.activationScore}/100 | ${item.opportunityScore}/100 | ${item.evidenceReadiness}/100 | ${item.proposalReadiness}/100 | ${item.contactReadiness}/100 | ${item.auditReadiness}/100 | ${escapeTable(item.bestContact)} | ${escapeTable(item.bestOffer)} | ${escapeTable(item.nextAction)} |`),
  ].join('\n');
}

function renderFocusActions(actions: RevenueFocusAction[]): string {
  return actions.map((action) => [
    `## Priority ${action.priority}`,
    renderList([
      `Action: ${action.title}`,
      `Company: ${action.companyName}`,
      `Reason: ${action.reason}`,
      `Suggested command: ${action.command}`,
      `Boundary: ${action.approvalBoundary}`,
    ]),
  ].join('\n')).join('\n\n');
}

function scoreBullets(score: RevenueActivationScore): string {
  return renderList([
    `Company: ${score.companyName}`,
    `Activation score: ${score.activationScore}/100`,
    `Best contact: ${score.bestContact}`,
    `Best offer: ${score.bestOffer}`,
    `Next action: ${score.nextAction}`,
    `Why: ${score.why}`,
    `Blockers: ${score.blockers.join('; ')}`,
  ]);
}

function writeOutputs(outputs: { fileName: string; body: string }[]): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });

  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }

  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

function normalizedId(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US')}`;
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
