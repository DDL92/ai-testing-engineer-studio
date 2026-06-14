import fs = require('fs');
import path = require('path');
import { buildLeadQualificationReport } from '../webLeadQualification/normalizationRules';
import { NormalizedWebLead, RecommendedQualifiedOffer } from '../webLeadQualification/types';
import { buildPainMiningReport } from '../webPainMining/painMiningRules';
import {
  RevenueDecision,
  RevenueIntelligenceDashboard,
  RevenueIntelligenceReport,
  UnifiedTopLead,
} from './types';

const outputRoot = path.join(process.cwd(), 'output', 'revenue-intelligence');
const revenueFocusPath = path.join(process.cwd(), 'output', 'revenue', 'revenue-focus.md');
const unificationReportPath = path.join(outputRoot, 'revenue-unification-report.md');

const safetyRules = [
  'Revenue intelligence uses local Studio data only.',
  'Qualified Ranking is the source of truth for Current Top Lead.',
  'No outreach, emails, LinkedIn messages, CRM records, meetings, invoices, payments, revenue, outcomes, replies, or client interest are created.',
  'Recommendations are planning signals only.',
  'Human approval is required before any external action.',
];

export function buildRevenueIntelligenceReport(): RevenueIntelligenceReport {
  const qualification = buildLeadQualificationReport();
  const pain = buildPainMiningReport();
  const topQualifiedLead = qualification.topQualifiedLeads[0];
  const topLead = topQualifiedLead ? buildUnifiedTopLead(topQualifiedLead, 1, pain.signals) : null;
  const decision = buildDecision(topLead);

  return {
    generatedAt: new Date().toISOString(),
    previousTopLead: readPreviousRevenueFocusLead(),
    topLead,
    decision,
    unifiedRecommendation: topLead
      ? `${topLead.companyName} is the unified top lead. Recommended offer: ${topLead.recommendedOffer}.`
      : 'No unified top lead is available. Refresh qualified ranking first.',
    executionPriority: topLead?.executionPriority ?? 'Refresh Lead Qualification and Qualified Ranking.',
    safetyRules,
  };
}

export function buildRevenueIntelligenceDashboard(): RevenueIntelligenceDashboard {
  const report = buildRevenueIntelligenceReport();
  return {
    revenueIntelligenceStatus: report.topLead ? 'Unified' : 'Needs Review',
    currentTopLead: report.topLead?.companyName ?? 'No unified top lead',
    revenueTarget: report.topLead ? 'First paid client' : 'Refresh qualified ranking',
    recommendedOffer: report.topLead?.recommendedOffer ?? 'No offer selected',
    executionPriority: report.executionPriority,
  };
}

export function buildUnifiedTopLeads(): UnifiedTopLead[] {
  const qualification = buildLeadQualificationReport();
  const painSignals = buildPainMiningReport().signals;
  return qualification.topQualifiedLeads.map((lead, index) => buildUnifiedTopLead(lead, index + 1, painSignals));
}

export function writeTopLeadOutput(report: RevenueIntelligenceReport): string[] {
  return writeOutputs([
    { fileName: 'top-lead.md', body: renderTopLead(report) },
  ]);
}

export function writeRevenueDecisionOutput(report: RevenueIntelligenceReport): string[] {
  return writeOutputs([
    { fileName: 'revenue-decision.md', body: renderRevenueDecision(report) },
  ]);
}

export function writeUnifiedRecommendationOutput(report: RevenueIntelligenceReport): string[] {
  return writeOutputs([
    { fileName: 'unified-recommendation.md', body: renderUnifiedRecommendation(report) },
    { fileName: 'revenue-unification-report.md', body: renderRevenueUnificationReport(report) },
  ]);
}

export function writeLeadExecutionPriorityOutput(report: RevenueIntelligenceReport): string[] {
  return writeOutputs([
    { fileName: 'execution-priority.md', body: renderExecutionPriority(report) },
  ]);
}

export function renderTopLead(report: RevenueIntelligenceReport): string {
  return [
    '# Revenue Intelligence Top Lead',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    report.topLead ? renderTopLeadBullets(report.topLead) : '- No top lead found.',
    '',
    '## Source Of Truth',
    renderList([
      'Qualified Ranking rank #1',
      'Qualification Score',
      'QA Opportunity Score',
      'Pain Signal Relevance',
      'Offer Fit',
    ]),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderRevenueDecision(report: RevenueIntelligenceReport): string {
  return [
    '# Revenue Decision',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderList([
      `Decision: ${report.decision.status}`,
      `Reason: ${report.decision.reason}`,
      `Manual action: ${report.decision.manualAction}`,
    ]),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderUnifiedRecommendation(report: RevenueIntelligenceReport): string {
  return [
    '# Unified Recommendation',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    report.unifiedRecommendation,
    '',
    report.topLead ? renderList([
      `Current Top Lead: ${report.topLead.companyName}`,
      `Recommended Offer: ${report.topLead.recommendedOffer}`,
      `Next Revenue Action: ${report.topLead.nextRevenueAction}`,
      `Execution Priority: ${report.topLead.executionPriority}`,
    ]) : '- No recommendation available.',
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderExecutionPriority(report: RevenueIntelligenceReport): string {
  return [
    '# Lead Execution Priority',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    report.topLead ? renderList([
      `Lead: ${report.topLead.companyName}`,
      `Priority: ${report.topLead.executionPriority}`,
      `Recommended offer: ${report.topLead.recommendedOffer}`,
      `Next revenue action: ${report.topLead.nextRevenueAction}`,
    ]) : '- Refresh qualified ranking before choosing a lead.',
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderRevenueUnificationReport(report: RevenueIntelligenceReport): string {
  return [
    '# Revenue Unification Report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderList([
      `Previous top lead: ${report.previousTopLead}`,
      `New top lead: ${report.topLead?.companyName ?? 'No top lead found'}`,
      `Why selected: ${report.topLead?.whySelected.join('; ') ?? 'No qualified ranking available.'}`,
      `Qualification score: ${report.topLead?.qualificationScore ?? 0}/100`,
      `QA opportunity score: ${report.topLead?.qaOpportunityScore ?? 0}/100`,
      `Offer recommendation: ${report.topLead?.recommendedOffer ?? 'No offer selected'}`,
      `Revenue action recommendation: ${report.topLead?.nextRevenueAction ?? 'Refresh qualified ranking.'}`,
    ]),
    '',
    '## Alignment Requirement',
    renderList([
      'Top Qualified Lead, Revenue Focus, Message Recommendation, Dashboard, and Mobile Command Center must display the same lead.',
      'Revenue Focus must not hardcode PushPress or any other company.',
    ]),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

function buildUnifiedTopLead(lead: NormalizedWebLead, rank: number, painSignals: { companyName: string; category: string }[]): UnifiedTopLead {
  const painSignalRelevance = painSignals.some((signal) => normalizeKey(signal.companyName) === normalizeKey(lead.normalizedName)) ? 100 : 35;
  const offerFitScore = offerFit(lead.recommendedOffer);
  const executionPriority = executionPriorityFor(lead);
  const nextRevenueAction = `Review ${lead.normalizedName} message pack and public evidence; decide manually whether to prepare a QA Audit offer.`;

  return {
    rank,
    companyId: slug(lead.normalizedName),
    companyName: lead.normalizedName,
    category: lead.category,
    website: lead.website,
    qualificationScore: lead.qualificationScore,
    qaOpportunityScore: lead.qaOpportunityScore,
    painSignalRelevance,
    offerFitScore,
    recommendedOffer: lead.recommendedOffer,
    executionPriority,
    nextRevenueAction,
    whySelected: [
      `Rank #${rank} in Qualified Ranking`,
      `Qualification score ${lead.qualificationScore}/100`,
      `QA opportunity score ${lead.qaOpportunityScore}/100`,
      `Pain signal relevance ${painSignalRelevance}/100`,
      `Offer fit ${offerFitScore}/100`,
    ],
    sourceLead: lead,
  };
}

function buildDecision(topLead: UnifiedTopLead | null): RevenueDecision {
  if (!topLead) {
    return {
      status: 'WAIT',
      reason: 'No qualified lead is available.',
      manualAction: 'Run npm run web:qualified-ranking and review local lead qualification outputs.',
    };
  }

  if (topLead.qualificationScore >= 75 && topLead.qaOpportunityScore >= 70) {
    return {
      status: 'GO',
      reason: `${topLead.companyName} is rank #1 with strong qualification and QA opportunity scores.`,
      manualAction: topLead.nextRevenueAction,
    };
  }

  return {
    status: 'REVIEW',
    reason: `${topLead.companyName} is rank #1 but needs manual review before external use.`,
    manualAction: topLead.nextRevenueAction,
  };
}

function executionPriorityFor(lead: NormalizedWebLead): string {
  if (lead.recommendedOffer === 'QA Automation Retainer ($1500-$3000/month)') {
    return 'Review evidence and position a scoped QA Audit as the first paid step toward a retainer path.';
  }
  if (lead.recommendedOffer === 'Playwright Starter Pack ($900-$1500)') {
    return 'Review workflow evidence and prepare a starter-pack path after a paid audit decision.';
  }
  return 'Review public evidence and prepare a manual QA Audit decision.';
}

function offerFit(offer: RecommendedQualifiedOffer): number {
  if (offer === 'QA Automation Retainer ($1500-$3000/month)') return 100;
  if (offer === 'Playwright Starter Pack ($900-$1500)') return 85;
  return 70;
}

function readPreviousRevenueFocusLead(): string {
  if (fs.existsSync(unificationReportPath)) {
    const existing = fs.readFileSync(unificationReportPath, 'utf8');
    const existingMatch = existing.match(/Previous top lead:\s*([^\n]+)/);
    const existingPrevious = existingMatch?.[1]?.trim();
    if (existingPrevious && !existingPrevious.startsWith('No previous')) return existingPrevious;
  }

  if (!fs.existsSync(revenueFocusPath)) return 'No previous revenue focus found';
  const raw = fs.readFileSync(revenueFocusPath, 'utf8');
  const match = raw.match(/Company:\s*([^\n]+)/);
  return match?.[1]?.trim() || 'No previous revenue focus found';
}

function renderTopLeadBullets(lead: UnifiedTopLead): string {
  return renderList([
    `Current Top Lead: ${lead.companyName}`,
    `Category: ${lead.category}`,
    `Website: ${lead.website}`,
    `Qualification score: ${lead.qualificationScore}/100`,
    `QA opportunity score: ${lead.qaOpportunityScore}/100`,
    `Pain signal relevance: ${lead.painSignalRelevance}/100`,
    `Offer fit: ${lead.offerFitScore}/100`,
    `Recommended offer: ${lead.recommendedOffer}`,
    `Next revenue action: ${lead.nextRevenueAction}`,
  ]);
}

function writeOutputs(outputs: { fileName: string; body: string }[]): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });
  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }
  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'lead';
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}
