import fs = require('fs');
import path = require('path');
import { buildClientReadinessReport, loadClientReadinessInput } from '../clientReadiness/clientReadinessRules';
import { ClientReadinessCandidate } from '../clientReadiness/types';
import { Lead } from '../leads/types';
import { buildReleaseCandidateReport } from '../releaseCandidate/releaseCandidateRules';
import { buildRevenueCommandCenterReport, loadRevenueCommandCenterInput } from '../revenueCommandCenter/revenueRules';
import { RevenuePriorityOpportunity } from '../revenueCommandCenter/types';
import {
  FirstClientPathItem,
  FirstRevenueReadiness,
  FirstRevenueValidationReport,
  ReleaseCleanupItem,
} from './types';

const outputRoot = path.join(process.cwd(), 'output', 'first-revenue-validation');
const targetCompanies = ['PushPress', 'TeamUp', 'Wodify', 'ABC Glofox', 'Bookee'];

const manualApprovalReminder = [
  'Human approval is required before outreach, follow-up, proposal, SOW, discovery call, audit delivery, retainer discussion, invoice, payment, or external action.',
  'This pack is local-only and uses existing Studio data and generated reports.',
  'No APIs, scraping, browsing, CRM, outreach automation, sending, payments, credentials, or external databases were used.',
  'Do not invent contacts, audit findings, private company facts, revenue, client outcomes, or unsupported claims.',
  'Opportunities are not booked revenue until a real commercial local client record exists.',
];

export function buildFirstRevenueValidationReport(): FirstRevenueValidationReport {
  const release = buildReleaseCandidateReport();
  const revenue = buildRevenueCommandCenterReport(loadRevenueCommandCenterInput());
  const clientReadiness = buildClientReadinessReport(loadClientReadinessInput());
  const firstClientPath = buildFirstClientPath(clientReadiness.candidates, revenue.auditOpportunities);
  const bestFirstClientTarget = firstClientPath.slice().sort(sortFirstClientPath)[0];

  return {
    generatedAt: release.generatedAt,
    release,
    revenue,
    firstClientPath,
    bestFirstClientTarget,
    releaseCleanupItems: buildReleaseCleanupItems(release.knownWarnings),
  };
}

export function writeFirstRevenueValidationOutputs(report: FirstRevenueValidationReport): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });

  const outputs = [
    { fileName: 'revenue-validation-pack.md', body: renderRevenueValidationPack(report) },
    { fileName: 'first-client-path.md', body: renderFirstClientPath(report) },
    { fileName: 'pushpress-action-plan.md', body: renderPushPressActionPlan(report) },
    { fileName: 'top-5-commercial-action-plan.md', body: renderTopFiveCommercialActionPlan(report) },
    { fileName: 'release-cleanup-plan.md', body: renderReleaseCleanupPlan(report) },
    { fileName: 'v1-score-improvement-plan.md', body: renderV1ScoreImprovementPlan(report) },
    { fileName: 'approval-checklist.md', body: renderApprovalChecklist(report) },
  ];

  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }

  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

export function renderRevenueValidationPack(report: FirstRevenueValidationReport): string {
  return [
    '# First Revenue Validation Pack',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Current Reality',
    renderList([
      `AI Studio OS v1.0 Candidate score: ${report.release.releaseScore.overall}/100.`,
      `Release recommendation: ${report.release.releaseScore.recommendation}.`,
      `System health critical issues: ${report.release.stabilization.criticalIssues.length}.`,
      `Best first-client target: ${report.bestFirstClientTarget?.company ?? 'No target selected'}.`,
      'The business priority is now first audit sale validation, not more infrastructure.',
    ]),
    '',
    '## Booked Revenue',
    renderList([
      `Booked MRR: ${formatCurrency(report.revenue.bookedMrr)}.`,
      `Active commercial retainer clients: ${report.revenue.activeRetainerClients.length}.`,
      `Excluded demo/sample client records: ${report.revenue.excludedClientRecords.length}.`,
      'Booked revenue remains $0 until a real commercial local client record exists.',
    ]),
    '',
    '## Pipeline Revenue',
    renderList([
      `Audit opportunities: ${report.revenue.auditOpportunities.length}.`,
      `Retainer opportunities: ${report.revenue.retainerOpportunities.length}.`,
      `Expected projected MRR range: ${formatRange(report.revenue.projectedExpectedMrr)}/month, speculative only.`,
      `Top pipeline opportunities: ${report.firstClientPath.map((item) => item.company).join(', ')}.`,
      'Pipeline ranges are opportunity math only and are not booked revenue.',
    ]),
    '',
    '## Fastest Path To First Audit',
    renderList([
      `${report.bestFirstClientTarget?.company ?? 'No target'} is the fastest path because it has the strongest local readiness signal.`,
      `Next command: \`${report.bestFirstClientTarget?.nextCommand ?? 'none'}\`.`,
      'Complete manual contact verification, manually review the message, and offer a narrow QA Audit only after Daniel approves.',
    ]),
    '',
    '## Fastest Path To First Retainer',
    renderList([
      'Use the first paid audit to validate a concrete Playwright Starter Pack or QA Automation Retainer need.',
      'Do not pitch retainer scope before audit/discovery evidence supports it.',
      'Record retainer revenue only after a real commercial client record exists locally.',
    ]),
    '',
    '## Revenue Risks',
    renderList(report.revenue.revenueRisks),
    '',
    '## 7-Day Action Plan',
    renderNumberedList([
      'Refresh PushPress contact review and confirm the public contact path manually.',
      'Review the PushPress first message and remove unsupported claims.',
      'Approve or revise the first audit offer and pricing range.',
      'Prepare follow-up timing in local records without sending automatically.',
      'Generate missing audit packs for TeamUp and Wodify only if PushPress stalls.',
      'Generate research packs for ABC Glofox and Bookee only after manual fit confirmation.',
      'Review release cleanup labels; do not delete commands yet.',
    ]),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderFirstClientPath(report: FirstRevenueValidationReport): string {
  return [
    '# First Client Path',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Best First-Client Target',
    report.bestFirstClientTarget
      ? renderList([
        `${report.bestFirstClientTarget.company}: ${report.bestFirstClientTarget.readiness}.`,
        `Missing step: ${report.bestFirstClientTarget.missingStep}`,
        `Next command: \`${report.bestFirstClientTarget.nextCommand}\`.`,
        `Revenue path: ${report.bestFirstClientTarget.revenuePath}`,
      ])
      : '- No first-client target found.',
    '',
    '## Target Path',
    renderFirstClientPathTable(report.firstClientPath),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderPushPressActionPlan(report: FirstRevenueValidationReport): string {
  const pushPress = report.firstClientPath.find((item) => item.company === 'PushPress');
  const candidate = pushPress?.candidate;
  const lead = candidate?.lead;

  return [
    '# PushPress Action Plan',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Why PushPress',
    renderList([
      'Highest local first-client readiness score in the current pack.',
      'Local lead, research pack, lead pack, audit pack, outreach pack, contact review, client workflow, and SOW evidence exist.',
      'Recommended offer is QA Automation Retainer, but retainer remains an opportunity until a real commercial client record exists.',
    ]),
    '',
    '## Current Readiness',
    renderList([
      `Readiness: ${pushPress?.readiness ?? 'NOT READY'}.`,
      `Outreach readiness: ${pushPress?.outreachReadiness ?? 'not available'}.`,
      `Audit readiness: ${pushPress?.auditReadiness ?? 'not available'}.`,
      `Proposal readiness: ${pushPress?.proposalReadiness ?? 'not available'}`,
      `Revenue path: ${pushPress?.revenuePath ?? 'not available'}`,
    ]),
    '',
    '## Missing Manual Research',
    renderList([
      'Verify the company website and product context manually.',
      'Identify a public, relevant role without inventing a contact name.',
      'Confirm whether the safest first message should use LinkedIn, email, website form, referral, or another manual channel.',
      'Review local audit pack language before referencing any finding externally.',
    ]),
    '',
    '## Contact Research Steps',
    renderNumberedList([
      'Open only approved public company/contact surfaces manually.',
      'Record a role or verified contact only if Daniel confirms it.',
      'Update local contact review notes after manual verification.',
      'Do not scrape, enrich, automate, or use private contact databases.',
    ]),
    '',
    '## First Message',
    renderList([
      'Draft only; Daniel must review before any send.',
      buildPushPressMessage(lead),
    ]),
    '',
    '## Follow-Up Plan',
    renderList([
      'Follow up 3-5 business days after a manually sent first message if no response.',
      'Send a second follow-up 5-7 business days after the first follow-up only if still relevant.',
      'Stop if the lead is not relevant, not interested, or Daniel decides not to proceed.',
      'Track follow-up state manually in local contact review records.',
    ]),
    '',
    '## First Audit Offer',
    renderList([
      'Offer a narrow QA Audit focused on one or two high-risk public workflows.',
      'Use the local pricing range only after Daniel approves: $199-$500.',
      'Do not claim full coverage, ROI, compliance, or completed client outcomes.',
    ]),
    '',
    '## Discovery Call Path',
    renderList([
      'Confirm the highest-risk public workflow.',
      'Ask about current release/regression pain and manual QA bottlenecks.',
      'Confirm whether Playwright coverage already exists.',
      'Decide whether an audit, starter pack, or retainer discussion is justified by evidence.',
    ]),
    '',
    '## SOW Path',
    renderList([
      'Use the existing local PushPress SOW draft only after manual review.',
      'Keep scope narrow until PushPress confirms pain, workflow, timeline, and approval path.',
      'Do not send a SOW automatically.',
    ]),
    '',
    '## Retainer Path',
    renderList([
      'Use audit evidence to identify recurring regression coverage needs.',
      'Position retainer only after the audit validates ongoing value.',
      'Do not count retainer MRR until a real commercial client record exists locally.',
    ]),
    '',
    '## Exact Next Commands',
    renderList([
      '`npm run contact:review -- --id pushpress`',
      '`npm run outreach:execute-pack`',
      '`npm run first-audit:workflow`',
      '`npm run proposal:center`',
      '`npm run sow:generate -- --id pushpress`',
    ]),
    '',
    '## Approval Checklist',
    renderApprovalChecklistItems().map((item) => `- [ ] ${item}`).join('\n'),
    '',
  ].join('\n');
}

export function renderTopFiveCommercialActionPlan(report: FirstRevenueValidationReport): string {
  return [
    '# Top 5 Commercial Action Plan',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Priority | Company | Next Step | Command | Expected Output | Revenue Purpose |',
    '| ---: | --- | --- | --- | --- | --- |',
    ...report.firstClientPath.map((item, index) => `| ${index + 1} | ${escapeTable(item.company)} | ${escapeTable(item.missingStep)} | \`${escapeTable(item.nextCommand)}\` | ${escapeTable(item.expectedOutput)} | ${escapeTable(item.revenuePurpose)} |`),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderReleaseCleanupPlan(report: FirstRevenueValidationReport): string {
  return [
    '# Release Cleanup Plan',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Cleanup Boundary',
    renderList([
      'Do not delete commands yet.',
      'Add deprecation labels and source-of-truth rules first.',
      'Keep current workflows working until v1.0 stable criteria are approved.',
    ]),
    '',
    '## Warning Cleanup',
    '| Warning | Cleanup Rule | Source Of Truth | Recommended Action |',
    '| --- | --- | --- | --- |',
    ...report.releaseCleanupItems.map((item) => `| ${escapeTable(item.warning)} | ${escapeTable(item.cleanupRule)} | ${escapeTable(item.sourceOfTruth)} | ${escapeTable(item.recommendedAction)} |`),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderV1ScoreImprovementPlan(report: FirstRevenueValidationReport): string {
  return [
    '# v1 Score Improvement Plan',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Current Score',
    `94/100 reported by Sprint 49 and current release package.`,
    '',
    '## Target Score',
    '100/100 for v1.0 stable readiness.',
    '',
    '## What Improves Score Technically',
    renderList([
      'Label legacy dashboard and cockpit commands as deprecated while keeping working replacements documented.',
      'Group large command families under source-of-truth command categories.',
      'Document Revenue Command Center as the booked MRR source for every revenue-like report.',
      'Keep generated v1 and first-revenue reports from creating self-referential release warnings.',
    ]),
    '',
    '## What Improves Score Commercially',
    renderList([
      'Validate one real first-audit path with PushPress before building more infrastructure.',
      'Record first audit sale only when Daniel manually confirms a real commercial engagement.',
      'Convert audit evidence into retainer discussion only after discovery/audit evidence supports it.',
    ]),
    '',
    '## Remaining Blockers',
    renderList([
      ...report.release.knownWarnings,
      report.revenue.bookedMrr === 0 ? 'Booked MRR is still $0.' : undefined,
      'First outreach path still requires Daniel approval before any send.',
    ].filter((item): item is string => Boolean(item))),
    '',
    '## Recommended v1.0 Stable Criteria',
    renderList([
      'Release score reaches 100/100 after warnings are labeled, grouped, or resolved.',
      'No critical issues.',
      'Revenue reports consistently defer booked MRR to Revenue Command Center.',
      'PushPress first-client path has manual contact decision, approved message, and tracked follow-up plan.',
      'No invented revenue, contacts, findings, claims, or external actions.',
    ]),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

export function renderApprovalChecklist(report: FirstRevenueValidationReport): string {
  return [
    '# Approval Checklist',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderApprovalChecklistItems().map((item) => `- [ ] ${item}`).join('\n'),
    '',
    '## Tracking Rule',
    renderList([
      'Track every send, reply, follow-up, call, proposal, audit sale, and retainer step manually in local records.',
      'Do not use automation to send, approve, enrich, invoice, or update external systems.',
    ]),
    '',
    '## Manual Approval Reminder',
    renderList(manualApprovalReminder),
    '',
  ].join('\n');
}

function buildFirstClientPath(
  candidates: ClientReadinessCandidate[],
  opportunities: RevenuePriorityOpportunity[],
): FirstClientPathItem[] {
  return targetCompanies
    .map((company) => buildFirstClientPathItem(company, candidates, opportunities))
    .sort(sortFirstClientPath);
}

function buildFirstClientPathItem(
  company: string,
  candidates: ClientReadinessCandidate[],
  opportunities: RevenuePriorityOpportunity[],
): FirstClientPathItem {
  const candidate = findCandidate(company, candidates);
  const opportunity = findOpportunity(company, opportunities);

  if (!candidate) {
    return {
      company,
      readiness: 'NOT READY',
      missingStep: 'Create and manually verify local lead record.',
      nextCommand: 'npm run lead:add',
      outreachReadiness: 'No local outreach evidence.',
      auditReadiness: 'No local audit evidence.',
      proposalReadiness: 'No local proposal evidence.',
      revenuePath: 'Not available until local lead exists.',
      priority: 0,
      expectedOutput: 'Local lead record.',
      revenuePurpose: 'Create a safe local source before any revenue action.',
    };
  }

  const missingStep = firstMissingStep(candidate);
  const nextCommand = nextCommandFor(candidate, missingStep);

  return {
    company: candidate.lead.companyName,
    leadId: candidate.lead.id,
    readiness: candidate.readinessStatus as FirstRevenueReadiness,
    missingStep,
    nextCommand,
    outreachReadiness: candidate.outreachStatus,
    auditReadiness: candidate.auditStatus,
    proposalReadiness: candidate.artifacts.sow ? 'SOW draft exists locally.' : 'SOW draft needed after audit/contact readiness.',
    revenuePath: revenuePathFor(candidate.lead),
    priority: candidate.readinessScore,
    expectedOutput: expectedOutputFor(nextCommand),
    revenuePurpose: revenuePurposeFor(candidate.lead),
    candidate,
    opportunity,
  };
}

function firstMissingStep(candidate: ClientReadinessCandidate): string {
  if (candidate.missingAssets.length === 0) return 'Manual contact verification and message approval.';
  if (!candidate.artifacts.researchPack) return 'Generate research pack.';
  if (!candidate.artifacts.leadPack) return 'Generate lead pack.';
  if (!candidate.artifacts.auditPack) return 'Generate audit pack.';
  if (!candidate.artifacts.outreachPack) return 'Generate outreach pack.';
  if (!candidate.artifacts.contactReview) return 'Generate contact review.';
  if (!candidate.artifacts.clientWorkflow) return 'Generate first-client workflow.';
  if (!candidate.artifacts.sow) return 'Generate SOW draft after manual review.';
  return candidate.nextAction;
}

function nextCommandFor(candidate: ClientReadinessCandidate, missingStep: string): string {
  if (missingStep.includes('research')) return `npm run lead:research -- --id ${candidate.lead.id}`;
  if (missingStep.includes('lead pack')) return `npm run lead:pack -- --id ${candidate.lead.id}`;
  if (missingStep.includes('audit pack')) return `npm run audit:pack -- --id ${candidate.lead.id}`;
  if (missingStep.includes('outreach pack')) return `npm run outreach:pack -- --id ${candidate.lead.id}`;
  if (missingStep.includes('contact review') || missingStep.includes('Manual contact')) return `npm run contact:review -- --id ${candidate.lead.id}`;
  if (missingStep.includes('workflow')) return `npm run client:prep -- --id ${candidate.lead.id}`;
  if (missingStep.includes('SOW')) return `npm run sow:generate -- --id ${candidate.lead.id}`;
  return candidate.suggestedCommand;
}

function expectedOutputFor(command: string): string {
  if (command.includes('contact:review')) return 'Updated local contact review and approval state.';
  if (command.includes('lead:research')) return 'Local research pack.';
  if (command.includes('lead:pack')) return 'Lead pack and outbound plan.';
  if (command.includes('audit:pack')) return 'Local QA audit pack.';
  if (command.includes('outreach:pack')) return 'Manual outreach drafts.';
  if (command.includes('client:prep')) return 'First-client workflow prep.';
  if (command.includes('sow:generate')) return 'Local SOW draft.';
  return 'Local report output.';
}

function revenuePathFor(lead: Lead): string {
  if (lead.recommendedOffer === 'qa-automation-retainer') return 'QA Audit -> Discovery -> Playwright Starter or QA Automation Retainer.';
  if (lead.recommendedOffer === 'agency-partner-retainer') return 'Research -> QA Audit angle -> Agency partner retainer discovery.';
  if (lead.recommendedOffer === 'playwright-starter-pack') return 'QA Audit -> Playwright Starter Pack -> Retainer maintenance.';
  if (lead.recommendedOffer === 'qa-audit') return 'QA Audit -> evidence review -> starter/retainer decision.';
  return 'No revenue path until fit changes.';
}

function revenuePurposeFor(lead: Lead): string {
  if (lead.recommendedOffer === 'agency-partner-retainer') return 'Validate agency partner retainer fit after research.';
  if (lead.recommendedOffer === 'qa-automation-retainer') return 'Validate first audit and retainer opportunity.';
  if (lead.recommendedOffer === 'playwright-starter-pack') return 'Validate starter pack path.';
  return 'Validate paid QA audit fit.';
}

function buildReleaseCleanupItems(warnings: string[]): ReleaseCleanupItem[] {
  const cleanupItems = [
    cleanupItem(
      'Legacy dashboard overlap',
      'Label `npm run dashboard` as legacy and `npm run os:dashboard` as primary.',
      'Operator OS Dashboard',
      'Update docs and command inventory; do not delete the legacy dashboard yet.',
    ),
    cleanupItem(
      'Legacy cockpit overlap',
      'Label `npm run cockpit` as legacy and `npm run cockpit:daily` as current.',
      'Action Cockpit v1',
      'Add deprecation language only; keep compatibility until stable release.',
    ),
    cleanupItem(
      'Lead command family overlap',
      'Group `lead:*` commands by lifecycle stage instead of removing commands.',
      'Lead -> Research -> Audit -> Outreach lifecycle',
      'Document owner command for each stage and defer cleanup until after first revenue validation.',
    ),
    cleanupItem(
      'Client command family overlap',
      'Group `client:*` commands by prep, delivery, reporting, and next actions.',
      'Client Operations and Client Reporting',
      'Add source-of-truth notes before any command consolidation.',
    ),
    cleanupItem(
      'Operator command family overlap',
      'Separate older sales-marketing operator commands from current OS dashboard commands.',
      'Operator OS Dashboard',
      'Deprecation labels only; do not remove scripts yet.',
    ),
    cleanupItem(
      'Demo/sample revenue records',
      'Keep demo/sample client fee records excluded from booked MRR.',
      'Revenue Command Center',
      'Document exclusion rule and keep booked revenue at $0 until real commercial client record exists.',
    ),
  ];

  const warningText = warnings.join('\n').toLowerCase();
  return cleanupItems.filter((item) => warningText.includes(item.warning.toLowerCase().split(' ')[0]) || item.warning.includes('Demo/sample'));
}

function cleanupItem(
  warning: string,
  cleanupRule: string,
  sourceOfTruth: string,
  recommendedAction: string,
): ReleaseCleanupItem {
  return {
    warning,
    cleanupRule,
    sourceOfTruth,
    recommendedAction,
  };
}

function buildPushPressMessage(lead: Lead | undefined): string {
  if (!lead) return 'No PushPress local lead record found. Do not send a message.';

  const painPoints = lead.painPoints.slice(0, 3).join(', ');
  return [
    `Hi - I am reviewing QA automation opportunities for ${lead.companyName}.`,
    `Based on my local lead notes, the safest angle to validate is around ${painPoints}.`,
    'Would it be useful if I prepared a small QA Audit scope for one high-risk public workflow?',
    'I would keep it narrow and evidence-focused before discussing any larger automation work.',
  ].join(' ');
}

function renderFirstClientPathTable(items: FirstClientPathItem[]): string {
  return [
    '| Company | Readiness | Missing Step | Next Command | Outreach Readiness | Audit Readiness | Proposal Readiness | Revenue Path |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...items.map((item) => `| ${escapeTable(item.company)} | ${item.readiness} | ${escapeTable(item.missingStep)} | \`${escapeTable(item.nextCommand)}\` | ${escapeTable(item.outreachReadiness)} | ${escapeTable(item.auditReadiness)} | ${escapeTable(item.proposalReadiness)} | ${escapeTable(item.revenuePath)} |`),
  ].join('\n');
}

function renderApprovalChecklistItems(): string[] {
  return [
    'company verified',
    'contact verified',
    'message reviewed',
    'no fake findings',
    'no unsupported claims',
    'pricing reviewed',
    'Daniel approved before sending',
    'follow-up tracked manually',
  ];
}

function sortFirstClientPath(a: FirstClientPathItem, b: FirstClientPathItem): number {
  return readinessRank(b.readiness) - readinessRank(a.readiness)
    || b.priority - a.priority
    || a.company.localeCompare(b.company);
}

function readinessRank(readiness: FirstRevenueReadiness): number {
  if (readiness === 'READY') return 3;
  if (readiness === 'PARTIAL') return 2;
  return 1;
}

function findCandidate(company: string, candidates: ClientReadinessCandidate[]): ClientReadinessCandidate | undefined {
  const normalized = normalize(company);
  return candidates.find((candidate) => normalize(candidate.lead.companyName) === normalized || normalize(candidate.lead.id) === normalized);
}

function findOpportunity(company: string, opportunities: RevenuePriorityOpportunity[]): RevenuePriorityOpportunity | undefined {
  const normalized = normalize(company);
  return opportunities.find((opportunity) => normalize(opportunity.lead.companyName) === normalized || normalize(opportunity.lead.id) === normalized);
}

function renderNumberedList(items: string[]): string {
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function formatRange(range: { min: number; max: number; cadence: 'one-time' | 'monthly' }): string {
  if (range.min === range.max) return formatCurrency(range.min);
  return `${formatCurrency(range.min)}-${formatCurrency(range.max)}`;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US')}`;
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}
