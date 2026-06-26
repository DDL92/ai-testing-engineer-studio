import fs = require('fs');
import path = require('path');
import { buildWebIntelligenceReport } from '../webIntelligence/intelligenceRules';
import { CompanyEvidenceSummary, PainConfidenceResult, WebIntelligenceReport } from '../webIntelligence/types';
import { NormalizedWebLead } from '../webLeadQualification/types';
import { LeadRotationCandidate, LeadRotationReadinessStatus, LeadRotationRecommendation } from './types';

export function evaluateLeadReadiness(
  lead: NormalizedWebLead,
  rank: number,
  webIntelligence = buildWebIntelligenceReport(),
): LeadRotationCandidate {
  const summary = findCompanySummary(lead, webIntelligence);
  const pain = findPainConfidence(lead, webIntelligence.painConfidence);
  const dynamic = dynamicEvidenceForLead(lead);
  const evidenceStatus = dynamic?.status ?? webEvidenceStatus(summary, lead);
  const companyConfidence = summaryScore(summary?.companyConfidence, summary?.averageConfidence, lead.confidence * 100);
  const evidenceConfidence = summaryScore(summary?.evidenceConfidence, summary?.averageConfidence, lead.confidence * 100);
  const painConfidence = pain?.confidenceScore ?? lead.scoreBreakdown.painSignalPresence;
  const falsePositivePenalty = falsePositivePenaltyFor(summary, webIntelligence);
  const blockers = buildBlockers(lead, evidenceStatus, companyConfidence, evidenceConfidence, dynamic?.blockers ?? [], summary);
  const commercialReadinessScore = commercialReadinessScoreFor({
    qualificationScore: lead.qualificationScore,
    qaOpportunityScore: lead.qaOpportunityScore,
    evidenceReadiness: readinessScore(evidenceStatus),
    evidenceConfidence,
    companyConfidence,
    painConfidence,
    falsePositivePenalty,
  });
  const readiness = readinessFor(evidenceStatus, companyConfidence, evidenceConfidence, blockers);
  const recommendation = recommendationFor(readiness);

  return {
    rank,
    companyId: slug(lead.normalizedName),
    companyName: lead.normalizedName,
    website: lead.website,
    category: lead.category,
    recommendedOffer: lead.recommendedOffer,
    qualificationScore: lead.qualificationScore,
    qaOpportunityScore: lead.qaOpportunityScore,
    evidenceStatus,
    companyConfidence,
    evidenceConfidence,
    painConfidence,
    falsePositivePenalty,
    commercialReadinessScore,
    readiness,
    recommendation,
    blockers,
    reasons: [
      `Qualified rank #${rank}`,
      `Qualification score ${lead.qualificationScore}/100`,
      `QA opportunity score ${lead.qaOpportunityScore}/100`,
      `Evidence status ${evidenceStatus}`,
      `Company confidence ${companyConfidence}/100`,
      `Evidence confidence ${evidenceConfidence}/100`,
      `Pain confidence ${painConfidence}/100`,
      `False-positive penalty ${falsePositivePenalty}/100`,
      dynamic ? 'Live Evidence Engine decision applied.' : 'Web Intelligence evidence applied.',
    ],
    sourceLead: lead,
  };
}

function dynamicEvidenceForLead(lead: NormalizedWebLead): { status: LeadRotationReadinessStatus; blockers: string[] } | null {
  const decision = readDynamicEvidenceDecision();
  if (!decision || normalize(decision.target.companyName) !== normalize(lead.normalizedName)) return null;
  return {
    status: decision.status,
    blockers: decision.blockers,
  };
}

function readDynamicEvidenceDecision(): { target: { companyName: string }; status: LeadRotationReadinessStatus; blockers: string[] } | null {
  const filePath = path.join(process.cwd(), 'output', 'evidence', '.state', 'evidence-readiness.json');
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, 'utf8').trim();
    if (!raw) return null;
    return JSON.parse(raw) as { target: { companyName: string }; status: LeadRotationReadinessStatus; blockers: string[] };
  } catch {
    return null;
  }
}

function webEvidenceStatus(summary: CompanyEvidenceSummary | undefined, lead: NormalizedWebLead): LeadRotationReadinessStatus {
  if (!lead.website || !summary) return 'NOT READY';
  if (summary.evidenceConfidence === 'HIGH' && summary.companyConfidence === 'HIGH' && summary.falsePositiveRisk === 'HIGH') return 'READY';
  if (summary.averageConfidence >= 75 && summary.falsePositiveRisk !== 'LOW') return 'PARTIAL';
  return 'NOT READY';
}

function buildBlockers(
  lead: NormalizedWebLead,
  evidenceStatus: LeadRotationReadinessStatus,
  companyConfidence: number,
  evidenceConfidence: number,
  dynamicBlockers: string[],
  summary: CompanyEvidenceSummary | undefined,
): string[] {
  const blockers = [...dynamicBlockers];
  if (!lead.website) blockers.push('No public website recorded.');
  if (evidenceStatus === 'NOT READY') blockers.push('Evidence status is NOT READY.');
  if (companyConfidence < 70) blockers.push('Company confidence below 70.');
  if (evidenceConfidence < 60) blockers.push('Evidence confidence below 60.');
  if (summary?.falsePositiveRisk === 'LOW') blockers.push('False-positive risk is high.');
  return unique(blockers);
}

function readinessFor(
  evidenceStatus: LeadRotationReadinessStatus,
  companyConfidence: number,
  evidenceConfidence: number,
  blockers: string[],
): LeadRotationReadinessStatus {
  const criticalBlocker = blockers.some((blocker) => /403|cloudflare|not ready|no public website|no evidence|no screenshots/i.test(blocker));
  if (evidenceStatus === 'READY' && companyConfidence >= 70 && evidenceConfidence >= 60 && !criticalBlocker) return 'READY';
  if (evidenceStatus !== 'NOT READY' && companyConfidence >= 60 && evidenceConfidence >= 50) return 'PARTIAL';
  return 'NOT READY';
}

function recommendationFor(readiness: LeadRotationReadinessStatus): LeadRotationRecommendation {
  if (readiness === 'READY') return 'PROMOTE';
  if (readiness === 'PARTIAL') return 'REVIEW';
  return 'DEMOTE';
}

function commercialReadinessScoreFor(input: {
  qualificationScore: number;
  qaOpportunityScore: number;
  evidenceReadiness: number;
  evidenceConfidence: number;
  companyConfidence: number;
  painConfidence: number;
  falsePositivePenalty: number;
}): number {
  return clamp(Math.round(
    input.qualificationScore * 0.22
    + input.qaOpportunityScore * 0.22
    + input.evidenceReadiness * 0.22
    + input.evidenceConfidence * 0.14
    + input.companyConfidence * 0.12
    + input.painConfidence * 0.08
    - input.falsePositivePenalty * 0.2,
  ));
}

function falsePositivePenaltyFor(summary: CompanyEvidenceSummary | undefined, report: WebIntelligenceReport): number {
  if (!summary) return 35;
  const rejected = report.rejectedEvidence.filter((item) => normalize(item.canonicalCompany) === normalize(summary.company)).length;
  const suspicious = report.suspiciousEvidence.filter((item) => normalize(item.canonicalCompany) === normalize(summary.company)).length;
  return clamp(rejected * 25 + suspicious * 10 + (summary.falsePositiveRisk === 'LOW' ? 20 : 0));
}

function findCompanySummary(lead: NormalizedWebLead, report: WebIntelligenceReport): CompanyEvidenceSummary | undefined {
  return report.companySummaries.find((summary) => normalize(summary.company) === normalize(lead.normalizedName));
}

function findPainConfidence(lead: NormalizedWebLead, pain: PainConfidenceResult[]): PainConfidenceResult | undefined {
  return pain.find((item) => normalize(item.company) === normalize(lead.normalizedName));
}

function summaryScore(level: string | undefined, average: number | undefined, fallback: number): number {
  if (average !== undefined) return clamp(Math.round(average));
  if (level === 'HIGH') return 90;
  if (level === 'MEDIUM') return 65;
  if (level === 'LOW') return 35;
  return clamp(Math.round(fallback));
}

function readinessScore(status: LeadRotationReadinessStatus): number {
  if (status === 'READY') return 100;
  if (status === 'PARTIAL') return 65;
  return 0;
}

function unique(items: string[]): string[] {
  return Array.from(new Set(items.filter(Boolean)));
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'lead';
}
