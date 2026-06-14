import { average, confidenceLevel } from './confidenceScorer';
import { CompanyEvidenceSummary, EvidenceValidationResult } from './types';

export function aggregateCompanyEvidence(evidence: EvidenceValidationResult[]): CompanyEvidenceSummary[] {
  const groups = new Map<string, EvidenceValidationResult[]>();
  for (const item of evidence) {
    const key = item.normalizedDomain || item.canonicalCompany;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return Array.from(groups.values())
    .map(toSummary)
    .sort((left, right) => right.averageConfidence - left.averageConfidence || left.company.localeCompare(right.company));
}

function toSummary(items: EvidenceValidationResult[]): CompanyEvidenceSummary {
  const accepted = items.filter((item) => item.decision === 'accepted');
  const suspicious = items.filter((item) => item.decision === 'suspicious');
  const rejected = items.filter((item) => item.decision === 'rejected');
  const sourceCount = new Set(items.map((item) => item.sourceDomain).filter(Boolean)).size;
  const sourceDiversity = new Set(items.map((item) => item.sourceQuality)).size;
  const averageConfidence = average(items.map((item) => item.confidenceScore));
  const falsePositiveScore = Math.round(((suspicious.length * 0.5 + rejected.length) / Math.max(1, items.length)) * 100);
  const firstLead = items.find((item) => item.sourceType === 'lead');
  const raw = firstLead?.raw as { niche?: string; query?: string } | undefined;

  return {
    company: items[0]?.canonicalCompany ?? 'Unknown Company',
    normalizedDomain: items[0]?.normalizedDomain ?? '',
    aliases: Array.from(new Set(items.flatMap((item) => [item.companyName, item.sourceTitle, item.canonicalCompany]).filter(Boolean))),
    evidenceCount: items.length,
    sourceCount,
    sourceDiversity,
    painSignals: items.filter((item) => item.sourceType === 'pain').length,
    leadCategory: raw?.niche ?? raw?.query ?? 'Unknown',
    averageConfidence,
    companyConfidence: confidenceLevel(average(items.map((item) => item.match.score))),
    evidenceConfidence: confidenceLevel(averageConfidence),
    falsePositiveRisk: confidenceLevel(100 - falsePositiveScore),
  };
}
