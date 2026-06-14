import fs = require('fs');
import path = require('path');
import { buildExecutiveCompanyReport } from '../executiveLayer/executiveRules';
import { buildRevenueActivationReport } from '../revenueActivation/revenueRules';
import { RevenueActivationScore } from '../revenueActivation/types';

export type GoNoGoRecommendation = 'GO' | 'NO GO';

export interface ExecutionReadinessCheck {
  label: string;
  status: 'Ready' | 'Needs Review' | 'Missing';
  evidence: string;
}

export interface FirstRevenueExecutionPack {
  generatedAt: string;
  topTarget: RevenueActivationScore;
  recommendation: GoNoGoRecommendation;
  exactReasons: string[];
  remainingBlockers: string[];
  manualNextAction: string;
  timeToExecute: string;
  estimatedRevenueValue: string;
  estimatedConfidenceScore: number;
  readinessChecks: ExecutionReadinessCheck[];
  safetyRules: string[];
}

const outputRoot = path.join(process.cwd(), 'output', 'execution');

const safetyRules = [
  'Never send outreach.',
  'Never send emails.',
  'Never create invoices.',
  'Never create payments.',
  'Never create meetings.',
  'Never claim revenue.',
  'Human approval is required before any external action.',
  'This pack supports manual execution decisions only.',
];

export function buildFirstRevenueExecutionPack(): FirstRevenueExecutionPack {
  const revenueActivation = buildRevenueActivationReport();
  const topTarget = revenueActivation.pipeline[0];
  if (!topTarget) {
    throw new Error('No top revenue target found. Run npm run revenue:pipeline first.');
  }

  const executive = safeExecutiveCompanyReport(topTarget.companyName);
  const companyId = executive?.companyId ?? topTarget.companyId;
  const executiveRecommendation = executive?.executiveRecommendation ?? topTarget.bestOffer;
  const readinessChecks = buildReadinessChecks(topTarget, companyId);
  const requiredReady = readinessChecks.every((check) => check.status === 'Ready');
  const estimatedConfidenceScore = calculateConfidence(topTarget, readinessChecks);
  const recommendation: GoNoGoRecommendation = requiredReady && estimatedConfidenceScore >= 80 ? 'GO' : 'NO GO';
  const remainingBlockers = buildBlockers(readinessChecks, recommendation);

  return {
    generatedAt: new Date().toISOString(),
    topTarget,
    recommendation,
    exactReasons: buildReasons(topTarget, readinessChecks, executiveRecommendation),
    remainingBlockers,
    manualNextAction: buildManualNextAction(topTarget, recommendation),
    timeToExecute: recommendation === 'GO' ? '30 minutes for manual review and decision prep' : '30-60 minutes to resolve readiness blockers',
    estimatedRevenueValue: '$199-$500 potential first QA Audit value',
    estimatedConfidenceScore,
    readinessChecks,
    safetyRules,
  };
}

function safeExecutiveCompanyReport(companyName: string): { companyId: string; executiveRecommendation: string } | null {
  try {
    const executive = buildExecutiveCompanyReport(companyName);
    return {
      companyId: executive.companyId,
      executiveRecommendation: executive.executiveRecommendation,
    };
  } catch {
    return null;
  }
}

export function writeFirstClientChecklist(pack: FirstRevenueExecutionPack): string[] {
  return writeOutputs([
    { fileName: 'first-client-checklist.md', body: renderFirstClientChecklist(pack) },
    { fileName: 'first-revenue-checklist.md', body: renderFirstRevenueChecklist(pack) },
    { fileName: 'manual-execution-plan.md', body: renderManualExecutionPlan(pack) },
  ]);
}

export function renderFirstClientChecklist(pack: FirstRevenueExecutionPack): string {
  return [
    '# First Client Checklist',
    '',
    `Generated: ${pack.generatedAt}`,
    '',
    renderDecisionSnapshot(pack),
    '',
    '## Readiness Checks',
    renderReadinessTable(pack.readinessChecks),
    '',
    '## Manual Checklist',
    renderChecklist([
      `Review ${pack.topTarget.companyName} executive summary.`,
      `Review ${pack.topTarget.companyName} audit package and client audit report.`,
      `Review ${pack.topTarget.companyName} proposal package without sending it.`,
      'Confirm the offer is QA Audit ($199-$500).',
      'Confirm Daniel approves any external outreach or client-facing action.',
    ]),
    '',
    '## Safety Rules',
    renderList(pack.safetyRules),
    '',
  ].join('\n');
}

export function renderFirstRevenueChecklist(pack: FirstRevenueExecutionPack): string {
  return [
    '# First Revenue Checklist',
    '',
    `Generated: ${pack.generatedAt}`,
    '',
    renderDecisionSnapshot(pack),
    '',
    '## Exact Reasons',
    renderList(pack.exactReasons),
    '',
    '## Remaining Blockers',
    renderList(pack.remainingBlockers),
    '',
    '## Revenue Boundary',
    renderList([
      `Estimated revenue value: ${pack.estimatedRevenueValue}`,
      'This is an approved offer range, not booked revenue.',
      'Current revenue remains $0 unless recorded in local finance data as booked or received.',
    ]),
    '',
    '## Safety Rules',
    renderList(pack.safetyRules),
    '',
  ].join('\n');
}

export function renderManualExecutionPlan(pack: FirstRevenueExecutionPack): string {
  return [
    '# Manual Execution Plan',
    '',
    `Generated: ${pack.generatedAt}`,
    '',
    '## 30-Minute Plan',
    renderList([
      'Minute 0-5: Open the executive summary and confirm the business case is clear.',
      'Minute 5-15: Review audit, evidence, and proposal readiness for consistency.',
      'Minute 15-25: Decide whether Daniel wants to manually move the QA Audit offer forward.',
      'Minute 25-30: If approved, prepare the next manual action outside this system. Do not send from Studio.',
    ]),
    '',
    '## Manual Next Action',
    pack.manualNextAction,
    '',
    '## Time To Execute',
    pack.timeToExecute,
    '',
    '## Safety Rules',
    renderList(pack.safetyRules),
    '',
  ].join('\n');
}

function buildReadinessChecks(topTarget: RevenueActivationScore, companyId: string): ExecutionReadinessCheck[] {
  return [
    {
      label: 'Current top target',
      status: topTarget.companyName ? 'Ready' : 'Missing',
      evidence: `${topTarget.companyName} is ranked #1 with activation score ${topTarget.activationScore}/100.`,
    },
    {
      label: 'Audit package readiness',
      status: statusFromPaths([
        `output/audit-packs/${companyId}-audit-pack.md`,
        `output/unified-audits/${companyId}-unified-audit.md`,
        `output/client-audit-reports/${companyId}-qa-audit-report.md`,
        `output/client-audit-reports/${companyId}-qa-audit-report.pdf`,
      ]),
      evidence: `Audit readiness score from Revenue Activation: ${topTarget.auditReadiness}/100.`,
    },
    {
      label: 'Proposal readiness',
      status: topTarget.proposalReadiness >= 100 ? 'Ready' : topTarget.proposalReadiness > 0 ? 'Needs Review' : 'Missing',
      evidence: `Proposal readiness score from Revenue Activation: ${topTarget.proposalReadiness}/100.`,
    },
    {
      label: 'Executive summary readiness',
      status: pathExists(`output/executive/${companyId}-executive-summary.md`) ? 'Ready' : 'Missing',
      evidence: `Expected executive summary: output/executive/${companyId}-executive-summary.md.`,
    },
    {
      label: 'Evidence readiness',
      status: topTarget.evidenceReadiness >= 90 ? 'Ready' : topTarget.evidenceReadiness > 0 ? 'Needs Review' : 'Missing',
      evidence: `Evidence readiness score from Revenue Activation: ${topTarget.evidenceReadiness}/100.`,
    },
  ];
}

function calculateConfidence(topTarget: RevenueActivationScore, checks: ExecutionReadinessCheck[]): number {
  const readyCount = checks.filter((check) => check.status === 'Ready').length;
  const readinessScore = Math.round((readyCount / checks.length) * 100);
  return Math.round(topTarget.activationScore * 0.7 + readinessScore * 0.3);
}

function buildReasons(topTarget: RevenueActivationScore, checks: ExecutionReadinessCheck[], recommendation: string): string[] {
  return [
    `${topTarget.companyName} is the current top target from Revenue Activation.`,
    `Activation score is ${topTarget.activationScore}/100.`,
    `Recommended engagement is ${recommendation}.`,
    ...checks.map((check) => `${check.label}: ${check.status}. ${check.evidence}`),
  ];
}

function buildBlockers(checks: ExecutionReadinessCheck[], recommendation: GoNoGoRecommendation): string[] {
  const blockers = checks
    .filter((check) => check.status !== 'Ready')
    .map((check) => `${check.label}: ${check.status}. ${check.evidence}`);

  if (recommendation === 'GO') {
    return [
      'Daniel approval is still required before any external action.',
      'No revenue should be claimed until a booked or received finance record exists locally.',
      'No outreach, email, invoice, payment, or meeting is created by this pack.',
    ];
  }

  return blockers.length ? blockers : ['Manual review required before action.'];
}

function buildManualNextAction(topTarget: RevenueActivationScore, recommendation: GoNoGoRecommendation): string {
  if (recommendation === 'GO') {
    return `Review ${topTarget.companyName} executive summary, audit package, and proposal package; then Daniel decides manually whether to move the first QA Audit offer forward.`;
  }

  return `Resolve the readiness blockers for ${topTarget.companyName}, then rerun npm run execute:first-client.`;
}

function renderDecisionSnapshot(pack: FirstRevenueExecutionPack): string {
  return [
    '## Decision Snapshot',
    renderList([
      `Top target: ${pack.topTarget.companyName}`,
      `GO / NO GO: ${pack.recommendation}`,
      `Manual next action: ${pack.manualNextAction}`,
      `Time to execute: ${pack.timeToExecute}`,
      `Estimated revenue value: ${pack.estimatedRevenueValue}`,
      `Estimated confidence score: ${pack.estimatedConfidenceScore}/100`,
    ]),
  ].join('\n');
}

function renderReadinessTable(checks: ExecutionReadinessCheck[]): string {
  return [
    '| Check | Status | Evidence |',
    '| --- | --- | --- |',
    ...checks.map((check) => `| ${escapeTable(check.label)} | ${check.status} | ${escapeTable(check.evidence)} |`),
  ].join('\n');
}

function statusFromPaths(paths: string[]): ExecutionReadinessCheck['status'] {
  const available = paths.filter(pathExists).length;
  if (available === paths.length) return 'Ready';
  if (available === 0) return 'Missing';
  return 'Needs Review';
}

function pathExists(relativePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

function writeOutputs(outputs: { fileName: string; body: string }[]): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });
  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }
  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

function renderChecklist(items: string[]): string {
  return items.map((item) => `- [ ] ${item}`).join('\n');
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function main(): void {
  const pack = buildFirstRevenueExecutionPack();
  const outputPaths = writeFirstClientChecklist(pack);

  console.log('First revenue execution checklist generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Top target: ${pack.topTarget.companyName}`);
  console.log(`GO / NO GO: ${pack.recommendation}`);
  console.log(`Next manual action: ${pack.manualNextAction}`);
  console.log('Execution support only. No outreach, emails, invoices, payments, meetings, or revenue were created.');
}

if (require.main === module) {
  main();
}
