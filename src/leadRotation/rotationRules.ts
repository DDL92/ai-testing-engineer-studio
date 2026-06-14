import fs = require('fs');
import path = require('path');
import { buildWebIntelligenceReport } from '../webIntelligence/intelligenceRules';
import { collectLeadRotationCandidates } from './candidateCollector';
import { evaluateLeadReadiness } from './evaluateLeadReadiness';
import { LeadRotationCandidate, LeadRotationDecision } from './types';

export const leadRotationOutputDir = path.join(process.cwd(), 'output', 'lead-rotation');

const safetyRules = [
  'Lead Rotation uses local Studio data only.',
  'Actionable Lead means ready for Daniel manual review, not approved outreach.',
  'No outreach, emails, LinkedIn messages, CRM records, meetings, invoices, payments, outcomes, replies, client interest, or revenue are created.',
  'Do not claim bugs, outages, vulnerabilities, customer impact, or revenue impact from evidence signals.',
  'Human approval is required before any external action.',
];

export function buildLeadRotationDecision(): LeadRotationDecision {
  const webIntelligence = buildWebIntelligenceReport();
  const candidates = collectLeadRotationCandidates(10).map((lead, index) => evaluateLeadReadiness(lead, index + 1, webIntelligence));
  const ranked = [...candidates].sort(sortCommercialRanking);
  const actionableLead = ranked.find((candidate) => candidate.readiness === 'READY') ?? ranked.find((candidate) => candidate.readiness === 'PARTIAL') ?? null;
  const topRankedLead = candidates[0] ?? null;
  const demotedLeads = candidates.filter((candidate) => candidate.recommendation === 'DEMOTE');

  return {
    generatedAt: new Date().toISOString(),
    topRankedLead,
    actionableLead,
    candidates: ranked,
    demotedLeads,
    rotationStatus: actionableLead ? 'ACTIONABLE_LEAD_FOUND' : 'NO_ACTIONABLE_LEAD',
    evidenceBlockers: unique(candidates.flatMap((candidate) => candidate.blockers.map((blocker) => `${candidate.companyName}: ${blocker}`))),
    safetyRules,
  };
}

export function writeLeadRotationReports(decision = buildLeadRotationDecision()): string[] {
  fs.mkdirSync(leadRotationOutputDir, { recursive: true });
  const outputs = [
    ['candidate-review.md', renderCandidateReview(decision)],
    ['commercial-ranking.md', renderCommercialRanking(decision)],
    ['rotation-decision.md', renderRotationDecision(decision)],
    ['rotation-summary.md', renderRotationSummary(decision)],
    ['rotation-readiness.md', renderRotationReadiness(decision)],
  ] as const;

  return outputs.map(([fileName, body]) => {
    const outputPath = path.join(leadRotationOutputDir, fileName);
    fs.writeFileSync(outputPath, body, 'utf8');
    return outputPath;
  });
}

export function renderCandidateReview(decision: LeadRotationDecision): string {
  return [
    '# Lead Rotation Candidate Review',
    '',
    `Generated: ${decision.generatedAt}`,
    '',
    '| Rank | Company | Qualification | QA Opportunity | Evidence | Company Confidence | Evidence Confidence | Pain Confidence | Penalty | Readiness | Recommendation |',
    '| ---: | --- | ---: | ---: | --- | ---: | ---: | ---: | ---: | --- | --- |',
    ...[...decision.candidates]
      .sort((left, right) => left.rank - right.rank)
      .map((candidate) => `| ${candidate.rank} | ${escapeTable(candidate.companyName)} | ${candidate.qualificationScore} | ${candidate.qaOpportunityScore} | ${candidate.evidenceStatus} | ${candidate.companyConfidence} | ${candidate.evidenceConfidence} | ${candidate.painConfidence} | ${candidate.falsePositivePenalty} | ${candidate.readiness} | ${candidate.recommendation} |`),
    '',
    '## Safety Rules',
    renderList(decision.safetyRules),
    '',
  ].join('\n');
}

export function renderCommercialRanking(decision: LeadRotationDecision): string {
  return [
    '# Commercial Readiness Ranking',
    '',
    `Generated: ${decision.generatedAt}`,
    '',
    '| Commercial Rank | Company | Commercial Readiness | Evidence Status | Recommendation | Blockers |',
    '| ---: | --- | ---: | --- | --- | --- |',
    ...decision.candidates.map((candidate, index) => `| ${index + 1} | ${escapeTable(candidate.companyName)} | ${candidate.commercialReadinessScore}/100 | ${candidate.evidenceStatus} | ${candidate.recommendation} | ${escapeTable(candidate.blockers.join('; ') || 'None')} |`),
    '',
    '## Safety Rules',
    renderList(decision.safetyRules),
    '',
  ].join('\n');
}

export function renderRotationDecision(decision: LeadRotationDecision): string {
  return [
    '# Rotation Decision',
    '',
    `Generated: ${decision.generatedAt}`,
    '',
    renderList([
      `Rotation Status: ${decision.rotationStatus}`,
      `Top Ranked Lead: ${decision.topRankedLead?.companyName ?? 'None'}`,
      `Actionable Lead: ${decision.actionableLead?.companyName ?? 'None'}`,
      `Commercial Readiness: ${decision.actionableLead ? `${decision.actionableLead.commercialReadinessScore}/100` : 'Not Available'}`,
      `Actionable Recommendation: ${decision.actionableLead?.recommendation ?? 'None'}`,
    ]),
    '',
    '## Rotation Logic',
    decision.topRankedLead && decision.actionableLead && decision.topRankedLead.companyName !== decision.actionableLead.companyName
      ? `${decision.topRankedLead.companyName} is demoted because readiness is ${decision.topRankedLead.readiness}. ${decision.actionableLead.companyName} is promoted as the highest commercially usable lead.`
      : decision.actionableLead
        ? `${decision.actionableLead.companyName} remains the actionable lead.`
        : 'No actionable lead is available from the current top 10.',
    '',
    '## Evidence Blockers',
    renderList(decision.evidenceBlockers),
    '',
    '## Safety Rules',
    renderList(decision.safetyRules),
    '',
  ].join('\n');
}

export function renderRotationSummary(decision: LeadRotationDecision): string {
  return [
    '# Lead Rotation Summary',
    '',
    `Generated: ${decision.generatedAt}`,
    '',
    renderList([
      `Top Ranked Lead: ${decision.topRankedLead?.companyName ?? 'None'}`,
      `Actionable Lead: ${decision.actionableLead?.companyName ?? 'None'}`,
      `Demoted Leads: ${decision.demotedLeads.map((candidate) => candidate.companyName).join(', ') || 'None'}`,
      `Ready Candidates: ${decision.candidates.filter((candidate) => candidate.readiness === 'READY').length}`,
      `Partial Candidates: ${decision.candidates.filter((candidate) => candidate.readiness === 'PARTIAL').length}`,
      `Not Ready Candidates: ${decision.candidates.filter((candidate) => candidate.readiness === 'NOT READY').length}`,
    ]),
    '',
    '## Next Manual Step',
    decision.actionableLead
      ? `Review ${decision.actionableLead.companyName} evidence and message pack manually before any external action.`
      : 'Collect evidence for more qualified leads before outreach review.',
    '',
    '## Safety Rules',
    renderList(decision.safetyRules),
    '',
  ].join('\n');
}

export function renderRotationReadiness(decision: LeadRotationDecision): string {
  return [
    '# Rotation Readiness',
    '',
    `Generated: ${decision.generatedAt}`,
    '',
    '| Company | Readiness | Commercial Score | Recommendation | Reasons |',
    '| --- | --- | ---: | --- | --- |',
    ...decision.candidates.map((candidate) => `| ${escapeTable(candidate.companyName)} | ${candidate.readiness} | ${candidate.commercialReadinessScore}/100 | ${candidate.recommendation} | ${escapeTable(candidate.reasons.join('; '))} |`),
    '',
    '## Safety Rules',
    renderList(decision.safetyRules),
    '',
  ].join('\n');
}

export function sortCommercialRanking(left: LeadRotationCandidate, right: LeadRotationCandidate): number {
  return readinessRank(right.readiness) - readinessRank(left.readiness)
    || right.commercialReadinessScore - left.commercialReadinessScore
    || left.rank - right.rank
    || left.companyName.localeCompare(right.companyName);
}

function readinessRank(readiness: LeadRotationCandidate['readiness']): number {
  if (readiness === 'READY') return 3;
  if (readiness === 'PARTIAL') return 2;
  return 1;
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)));
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function escapeTable(value: string): string {
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
