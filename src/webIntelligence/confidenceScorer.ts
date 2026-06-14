import { ConfidenceLevel, EvidenceValidationResult, PainConfidenceResult } from './types';

export function confidenceLevel(score: number): ConfidenceLevel {
  if (score >= 75) return 'HIGH';
  if (score >= 45) return 'MEDIUM';
  return 'LOW';
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function scorePainConfidence(company: string, category: string, evidence: EvidenceValidationResult[]): PainConfidenceResult {
  const relevant = evidence.filter((item) => {
    const raw = item.raw as { category?: string };
    return item.sourceType === 'pain' && item.canonicalCompany === company && raw.category === category;
  });
  const sourceCount = new Set(relevant.map((item) => item.sourceDomain)).size;
  const evidenceCount = relevant.length;
  const sourceQuality = average(relevant.map((item) => item.confidenceScore));
  const repetitionScore = Math.min(100, evidenceCount * 25);
  const diversityScore = Math.min(100, sourceCount * 35);
  const confidenceScore = average([sourceQuality, repetitionScore, diversityScore].filter((value) => value > 0));

  return {
    company,
    category,
    confidenceScore,
    confidence: confidenceLevel(confidenceScore),
    evidenceCount,
    sourceCount,
    reasons: [
      `${evidenceCount} evidence item(s).`,
      `${sourceCount} source domain(s).`,
      `Average evidence confidence ${sourceQuality}/100.`,
    ],
  };
}
