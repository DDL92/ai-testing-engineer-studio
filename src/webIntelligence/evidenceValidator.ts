import { matchCompany, resolveCompanyIdentity } from './companyMatcher';
import { normalizeDomain } from './domainNormalizer';
import { detectFalsePositive } from './falsePositiveDetector';
import { ConfidenceLevel, EvidenceInput, EvidenceSourceQuality, EvidenceValidationResult } from './types';

export function validateEvidence(input: EvidenceInput): EvidenceValidationResult {
  const identity = resolveCompanyIdentity(input);
  const match = matchCompany(input, identity);
  const sourceDomain = normalizeDomain(input.sourceUrl);
  const sourceQuality = classifySourceQuality(input.sourceUrl, input.sourceTitle, identity.normalizedDomain);
  const falsePositive = detectFalsePositive(input.sourceTitle, input.sourceUrl, input.observedText);
  const baseScore = sourceQualityScore(sourceQuality);
  const relevanceScore = Math.min(100, Math.round(match.score * 0.7 + baseScore * 0.3));
  const confidenceScore = Math.max(0, Math.min(100, Math.round(baseScore * 0.55 + match.score * 0.45 - falsePositive.penalty)));
  const confidence = confidenceLevel(confidenceScore);
  const decision = confidenceScore < 35 || falsePositive.decision === 'rejected'
    ? 'rejected'
    : falsePositive.decision === 'suspicious' || confidenceScore < 70 ? 'suspicious' : 'accepted';

  return {
    ...input,
    canonicalCompany: identity.canonicalCompany,
    normalizedDomain: identity.normalizedDomain,
    sourceDomain,
    sourceQuality,
    decision,
    confidenceScore,
    confidence,
    relevanceScore,
    falsePositiveReasons: falsePositive.reasons,
    match,
  };
}

export function classifySourceQuality(sourceUrl: string, sourceTitle: string, companyDomain: string): EvidenceSourceQuality {
  const sourceDomain = normalizeDomain(sourceUrl);
  const lower = `${sourceUrl} ${sourceTitle}`.toLowerCase();

  if (companyDomain && sourceDomain === companyDomain && /docs|help|support|developer|api/.test(lower)) return 'official-docs';
  if (companyDomain && sourceDomain === companyDomain) return 'official-site';
  if (/g2\.com\/products|capterra\.com\/p\/|getapp\.com\/.+\/reviews|softwareadvice\.com\/.+\/reviews/.test(lower)) return 'verified-review';
  if (/capterra\.com|g2\.com|getapp\.com|softwareadvice\.com|trustradius\.com/.test(lower)) return 'directory';
  if (/blog|article|guide|resources/.test(lower)) return 'blog';
  return 'generic-article';
}

export function sourceQualityScore(sourceQuality: EvidenceSourceQuality): number {
  if (sourceQuality === 'official-site') return 96;
  if (sourceQuality === 'official-docs') return 92;
  if (sourceQuality === 'verified-review') return 80;
  if (sourceQuality === 'directory') return 55;
  if (sourceQuality === 'blog') return 35;
  return 20;
}

function confidenceLevel(score: number): ConfidenceLevel {
  if (score >= 75) return 'HIGH';
  if (score >= 45) return 'MEDIUM';
  return 'LOW';
}
