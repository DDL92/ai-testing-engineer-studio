import fs = require('fs');
import path = require('path');
import { buildFirstRevenueExecutionPack } from '../executionPack/generateFirstRevenueChecklist';
import { buildFinanceReport, loadFinanceInput } from '../financeTracking/financeRules';
import { buildFollowUpOperatingReport } from '../followUpEngine/followUpRules';
import { buildLeadIntelligenceReport } from '../leadIntelligence/leadRules';
import { buildRevenueActivationReport } from '../revenueActivation/revenueRules';
import { getRevenueSourceOfTruth } from '../revenueIntelligence/sourceOfTruth';
import { buildStudioConsolidationReport } from '../studioConsolidation/studioRules';
import { readSnapshotState } from '../studioSnapshot/snapshotRules';
import { OperatorQuickAction, OperatorUxSummary } from './types';

const outputRoot = path.join(process.cwd(), 'output', 'operator');

const safetyRules = [
  'No outreach is sent.',
  'No emails are sent.',
  'No meetings are created.',
  'No invoices are created.',
  'No payments are created.',
  'No revenue is created or claimed.',
  'No outcomes are created.',
  'Human approval remains required before external action.',
];

export function buildOperatorUxSummary(): OperatorUxSummary {
  const leadReport = buildLeadIntelligenceReport();
  const topLead = leadReport.leads[0];
  const revenueTruth = getRevenueSourceOfTruth();
  const revenueActivation = buildRevenueActivationReport();
  const executionPack = buildFirstRevenueExecutionPack();
  const followUp = buildFollowUpOperatingReport();
  const studio = buildStudioConsolidationReport();
  const finance = buildFinanceReport(loadFinanceInput());
  const snapshot = readSnapshotState();
  const releaseReadiness = studio.releaseReadiness.criticalIssues.length > 0
    ? 'Not Ready'
    : studio.releaseReadiness.warnings.length > 0 ? 'Warning' : 'Ready';
  const studioStatus = studio.modules.some((item) => item.status === 'Not Ready')
    ? 'Needs Review'
    : studio.modules.some((item) => item.status === 'Warning') ? 'Operational with warnings' : 'Healthy';
  const topAction = revenueTruth.nextAction;

  return {
    generatedAt: new Date().toISOString(),
    studioStatus,
    revenueStatus: `MRR: $${finance.currentMrr.toLocaleString('en-US')} from local finance data.`,
    topLead: revenueTruth.topLead,
    topOffer: revenueTruth.recommendedOffer,
    topAction,
    followUpStatus: `${followUp.dashboard.todaysFollowUps} follow-up review item(s), ${followUp.dashboard.waitingResponses} waiting response(s).`,
    systemHealth: `Release readiness: ${releaseReadiness}. Critical issues: ${studio.releaseReadiness.criticalIssues.length}. Warnings: ${studio.releaseReadiness.warnings.length}.`,
    snapshotStatus: snapshot.snapshotStatus,
    recoveryStatus: snapshot.recoveryStatus,
    topRevenueOpportunity: revenueActivation.pipeline[0]
      ? `${revenueTruth.topLead} (${revenueActivation.pipeline[0].activationScore}/100)`
      : 'No revenue opportunity found',
    nextManualAction: revenueTruth.nextAction,
    currentBlockers: executionPack.remainingBlockers,
    importantWarnings: buildWarnings(studio.releaseReadiness.warnings, finance.currentMrr),
    todayAtAGlance: buildTodayAtAGlance(revenueTruth.topLead, revenueTruth.recommendedOffer, topAction, finance.currentMrr, studioStatus, releaseReadiness),
    quickActions: quickActions(revenueTruth.topLead),
    safetyRules,
  };
}

export function writeLaunchStatus(summary: OperatorUxSummary): string[] {
  return writeOutputs([
    { fileName: 'launch-status.md', body: renderLaunchStatus(summary) },
    { fileName: 'today-at-a-glance.md', body: renderTodayAtAGlance(summary) },
  ]);
}

export function writeOperatorCockpit(summary: OperatorUxSummary): string[] {
  return writeOutputs([
    { fileName: 'operator-cockpit.md', body: renderOperatorCockpit(summary) },
  ]);
}

export function writeQuickActions(summary: OperatorUxSummary): string[] {
  return writeOutputs([
    { fileName: 'quick-actions.md', body: renderQuickActions(summary) },
  ]);
}

export function writeSystemHighlights(summary: OperatorUxSummary): string[] {
  return writeOutputs([
    { fileName: 'system-highlights.md', body: renderSystemHighlights(summary) },
  ]);
}

export function renderLaunchStatus(summary: OperatorUxSummary): string {
  return [
    '# Launch Status',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    renderList([
      `Studio Status: ${summary.studioStatus}`,
      `Revenue Status: ${summary.revenueStatus}`,
      `Top Lead: ${summary.topLead}`,
      `Top Offer: ${summary.topOffer}`,
      `Top Action: ${summary.topAction}`,
      `Follow-Up Status: ${summary.followUpStatus}`,
      `System Health: ${summary.systemHealth}`,
      `Snapshot Status: ${summary.snapshotStatus}`,
      `Recovery Status: ${summary.recoveryStatus}`,
    ]),
    '',
    '## Safety Rules',
    renderList(summary.safetyRules),
    '',
  ].join('\n');
}

export function renderOperatorCockpit(summary: OperatorUxSummary): string {
  return [
    '# Operator Cockpit',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    '## Focus Now',
    renderList([
      `Top Lead: ${summary.topLead}`,
      `Top Offer: ${summary.topOffer}`,
      `Top Revenue Opportunity: ${summary.topRevenueOpportunity}`,
      `Next Manual Action: ${summary.nextManualAction}`,
    ]),
    '',
    '## Current Blockers',
    renderList(summary.currentBlockers),
    '',
    '## Important Warnings',
    renderList(summary.importantWarnings),
    '',
    '## What To Ignore',
    renderList([
      `Do not chase lower-ranked leads before ${summary.topLead} review is complete.`,
      'Do not interpret missing outcomes as negative signal.',
      'Do not treat opportunity scores as revenue.',
    ]),
    '',
    '## Safety Rules',
    renderList(summary.safetyRules),
    '',
  ].join('\n');
}

export function renderQuickActions(summary: OperatorUxSummary): string {
  return [
    '# Quick Actions',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    '| Area | Command | Purpose |',
    '| --- | --- | --- |',
    ...summary.quickActions.map((item) => `| ${escapeTable(item.label)} | ${escapeTable(item.command)} | ${escapeTable(item.purpose)} |`),
    '',
    '## Safety Rules',
    renderList(summary.safetyRules),
    '',
  ].join('\n');
}

export function renderSystemHighlights(summary: OperatorUxSummary): string {
  return [
    '# System Highlights',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    renderList([
      `Studio: ${summary.studioStatus}`,
      `Revenue: ${summary.revenueStatus}`,
      `Best lead: ${summary.topLead}`,
      `Best offer: ${summary.topOffer}`,
      `Follow-ups: ${summary.followUpStatus}`,
      `Snapshot: ${summary.snapshotStatus}`,
      `Recovery: ${summary.recoveryStatus}`,
    ]),
    '',
    '## Important Warnings',
    renderList(summary.importantWarnings),
    '',
    '## Safety Rules',
    renderList(summary.safetyRules),
    '',
  ].join('\n');
}

export function renderTodayAtAGlance(summary: OperatorUxSummary): string {
  return [
    '# Today At A Glance',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    renderList(summary.todayAtAGlance),
    '',
    '## Safety Rules',
    renderList(summary.safetyRules),
    '',
  ].join('\n');
}

function buildWarnings(studioWarnings: string[], currentMrr: number): string[] {
  return [
    ...(currentMrr === 0 ? ['MRR is $0 from local finance data; do not claim revenue.'] : []),
    ...studioWarnings,
  ];
}

function buildTodayAtAGlance(
  topLead: string | undefined,
  topOffer: string | undefined,
  topAction: string,
  currentMrr: number,
  studioStatus: string,
  releaseReadiness: string,
): string[] {
  return [
    `Top Lead: ${topLead ?? 'No lead found'}`,
    `Offer: ${topOffer ?? 'No offer found'}`,
    `Action: ${topAction}`,
    `MRR: $${currentMrr.toLocaleString('en-US')}`,
    `Studio Health: ${studioStatus}`,
    `Release Readiness: ${releaseReadiness}`,
  ];
}

function quickActions(topLead: string): OperatorQuickAction[] {
  return [
    { label: 'Dashboard', command: 'npm run dashboard:mobile', purpose: 'Open the mobile command center on the local network.' },
    { label: 'Revenue', command: 'npm run revenue:focus', purpose: 'Refresh the 30-minute revenue focus.' },
    { label: 'Daily Plan', command: 'npm run day:plan', purpose: 'Generate today’s local operating plan.' },
    { label: `${topLead} Review`, command: 'npm run message:pack', purpose: `Review manual-only ${topLead} message drafts.` },
    { label: 'Lead Intelligence', command: 'npm run lead:intelligence', purpose: 'Refresh best lead, offer, and next action.' },
    { label: 'Follow-Up Queue', command: 'npm run followup:daily', purpose: 'Review follow-up priorities without sending anything.' },
    { label: 'Outcome Tracking', command: 'npm run outcome:dashboard', purpose: 'Review manually recorded outcomes.' },
  ];
}

function writeOutputs(outputs: { fileName: string; body: string }[]): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });
  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }
  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
