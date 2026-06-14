import fs = require('fs');
import path = require('path');
import { buildAdaptiveRevenueReport } from '../adaptiveRevenue/adaptiveRules';
import { buildRunnerDashboard } from '../autonomousRunner/runnerRules';
import { getRevenueSourceOfTruth } from '../revenueIntelligence/sourceOfTruth';
import { buildStudioConsolidationReport } from '../studioConsolidation/studioRules';
import { buildTopLeadAuditDashboard } from '../topLeadAudit/topLeadAuditRules';
import { buildWebDiscoveryDashboard } from '../webLeadDiscovery/webDiscoveryRules';
import { buildLeadQualificationDashboard } from '../webLeadQualification/normalizationRules';
import { buildPainMiningReport } from '../webPainMining/painMiningRules';
import { CommercialUxDashboard, CommercialUxView } from './types';

const outputRoot = path.join(process.cwd(), 'output', 'commercial-ux');

const safetyRules = [
  'Commercial UX is read-only.',
  'No outreach, emails, LinkedIn messages, CRM records, meetings, invoices, payments, outcomes, revenue, or client activity are created.',
  'Potential value comes from existing offer range text and is not booked revenue.',
  'Human approval remains required before external action.',
];

export function buildCommercialUxView(): CommercialUxView {
  const source = getRevenueSourceOfTruth();
  const audit = buildTopLeadAuditDashboard();
  const adaptive = buildAdaptiveRevenueReport();
  const runner = buildRunnerDashboard();
  const studio = buildStudioConsolidationReport();
  const webDiscovery = buildWebDiscoveryDashboard();
  const qualification = buildLeadQualificationDashboard();
  const pain = buildPainMiningReport();
  const today = new Date().toISOString().slice(0, 10);
  const studioHealth = studio.modules.some((module) => module.status === 'Not Ready')
    ? 'Needs Review'
    : studio.modules.some((module) => module.status === 'Warning') ? 'Warning' : 'Healthy';

  return {
    generatedAt: new Date().toISOString(),
    today: {
      topLead: source.topLead,
      recommendedOffer: source.recommendedOffer,
      offerLabel: offerLabel(source.recommendedOffer),
      executionPriority: source.executionPriority,
      revenueDecision: audit.executionReadiness === 'GO' ? source.revenueDecision : 'REVIEW',
      nextAction: singleAction(source.topLead, source.nextAction),
      potentialValue: potentialValue(source.recommendedOffer),
    },
    discovery: {
      newLeadsToday: webDiscovery.newLeadsToday,
      newPainSignals: pain.signals.filter((signal) => signal.date === today).length,
      qualifiedLeads: qualification.qualifiedLeadsCount,
    },
    health: {
      runnerStatus: runner.runnerHealth,
      lastRefresh: runner.lastSuccessfulRun,
      studioHealth,
    },
    adaptiveLearning: {
      status: adaptive.weights.readiness,
      influence: `${adaptive.weights.learningWeight}%`,
      recommendation: adaptive.adaptiveRecommendation,
    },
    safetyRules,
  };
}

export function buildCommercialUxDashboard(): CommercialUxDashboard {
  const view = buildCommercialUxView();
  return {
    todayFocus: `${view.today.topLead} - ${view.today.offerLabel} - ${view.today.executionPriority}`,
    revenueHero: `${view.today.topLead}: ${view.today.revenueDecision}`,
    potentialValue: view.today.potentialValue,
    nextAction: view.today.nextAction,
    target: view.today.topLead,
    offer: view.today.offerLabel,
    priority: view.today.executionPriority,
    decision: view.today.revenueDecision,
  };
}

export function writeTodayFocusOutput(view = buildCommercialUxView()): string[] {
  return writeOutputs([
    { fileName: 'today-focus.md', body: renderTodayFocus(view) },
    { fileName: 'commercial-summary.md', body: renderCommercialSummary(view) },
  ]);
}

export function writeRevenueHeroOutput(view = buildCommercialUxView()): string[] {
  return writeOutputs([
    { fileName: 'revenue-hero.md', body: renderRevenueHero(view) },
    { fileName: 'commercial-summary.md', body: renderCommercialSummary(view) },
  ]);
}

export function writePriorityCardsOutput(view = buildCommercialUxView()): string[] {
  return writeOutputs([
    { fileName: 'priority-cards.md', body: renderPriorityCards(view) },
    { fileName: 'commercial-summary.md', body: renderCommercialSummary(view) },
  ]);
}

export function writeOperatorViewOutput(view = buildCommercialUxView()): string[] {
  return writeOutputs([
    { fileName: 'operator-view.md', body: renderOperatorView(view) },
    { fileName: 'commercial-summary.md', body: renderCommercialSummary(view) },
  ]);
}

export function renderTodayFocus(view: CommercialUxView): string {
  return [
    '# Today Focus',
    '',
    `Generated: ${view.generatedAt}`,
    '',
    '## TODAY',
    renderList([
      `Top Lead: ${view.today.topLead}`,
      `Offer: ${view.today.offerLabel}`,
      `Priority: ${view.today.executionPriority}`,
      `Decision: ${view.today.revenueDecision}`,
    ]),
    '',
    '## NEXT ACTION',
    view.today.nextAction,
    '',
    '## POTENTIAL VALUE',
    view.today.potentialValue,
    '',
    '## Safety Rules',
    renderList(view.safetyRules),
    '',
  ].join('\n');
}

export function renderRevenueHero(view: CommercialUxView): string {
  return [
    '# Revenue Hero',
    '',
    `Generated: ${view.generatedAt}`,
    '',
    renderList([
      `Target: ${view.today.topLead}`,
      `Offer: ${view.today.offerLabel}`,
      `Potential Value: ${view.today.potentialValue}`,
      `Priority: ${view.today.executionPriority}`,
      `Decision: ${view.today.revenueDecision}`,
      `Action: ${view.today.nextAction}`,
    ]),
    '',
    '## Safety Rules',
    renderList(view.safetyRules),
    '',
  ].join('\n');
}

export function renderPriorityCards(view: CommercialUxView): string {
  return [
    '# Priority Cards',
    '',
    `Generated: ${view.generatedAt}`,
    '',
    '## Discovery Snapshot',
    renderList([
      `New Leads Today: ${view.discovery.newLeadsToday}`,
      `New Pain Signals: ${view.discovery.newPainSignals}`,
      `Qualified Leads: ${view.discovery.qualifiedLeads}`,
    ]),
    '',
    '## System Health',
    renderList([
      `Runner Status: ${view.health.runnerStatus}`,
      `Last Refresh: ${view.health.lastRefresh}`,
      `Studio Health: ${view.health.studioHealth}`,
    ]),
    '',
    '## Safety Rules',
    renderList(view.safetyRules),
    '',
  ].join('\n');
}

export function renderOperatorView(view: CommercialUxView): string {
  return [
    '# Operator View',
    '',
    `Generated: ${view.generatedAt}`,
    '',
    '## First Screen',
    renderList([
      `Target: ${view.today.topLead}`,
      `Offer: ${view.today.offerLabel}`,
      `Potential Value: ${view.today.potentialValue}`,
      `Priority: ${view.today.executionPriority}`,
      `Action: ${view.today.nextAction}`,
    ]),
    '',
    '## Below The Fold',
    renderList([
      `Discovery: ${view.discovery.newLeadsToday} new lead(s), ${view.discovery.newPainSignals} new pain signal(s), ${view.discovery.qualifiedLeads} qualified lead(s).`,
      `System: runner ${view.health.runnerStatus}, last refresh ${view.health.lastRefresh}, studio ${view.health.studioHealth}.`,
      `Adaptive learning: ${view.adaptiveLearning.status}, influence ${view.adaptiveLearning.influence}.`,
    ]),
    '',
    '## Safety Rules',
    renderList(view.safetyRules),
    '',
  ].join('\n');
}

export function renderCommercialSummary(view: CommercialUxView): string {
  return [
    '# Commercial Summary',
    '',
    `Generated: ${view.generatedAt}`,
    '',
    renderList([
      `Top Lead: ${view.today.topLead}`,
      `Offer: ${view.today.offerLabel}`,
      `Potential Value: ${view.today.potentialValue}`,
      `Priority: ${view.today.executionPriority}`,
      `Decision: ${view.today.revenueDecision}`,
      `Next Action: ${view.today.nextAction}`,
      `Runner Status: ${view.health.runnerStatus}`,
      `Studio Health: ${view.health.studioHealth}`,
    ]),
    '',
    '## Safety Rules',
    renderList(view.safetyRules),
    '',
  ].join('\n');
}

function singleAction(topLead: string, action: string): string {
  if (!action || action.toLowerCase().includes('review')) return `Review ${topLead} package and decide: SEND / WAIT / REWRITE.`;
  return action;
}

function potentialValue(offer: string): string {
  const match = offer.match(/\$[\d,]+(?:-\$[\d,]+)?(?:\/month)?/);
  if (match) return formatOfferRange(match[0]);
  if (offer.includes('Retainer')) return '$1,500-$3,000/month';
  if (offer.includes('Starter')) return '$900-$1,500';
  if (offer.includes('Audit')) return '$199-$500';
  return 'No offer range available';
}

function formatOfferRange(range: string): string {
  return range.replace(/\$([\d,]+)/g, (_match, amount: string) => `$${Number(amount.replace(/,/g, '')).toLocaleString('en-US')}`);
}

function offerLabel(offer: string): string {
  return offer.replace(/\s*\([^)]*\)/g, '').trim() || offer;
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
