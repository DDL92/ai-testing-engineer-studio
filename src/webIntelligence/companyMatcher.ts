import { domainBrand, normalizeDomain } from './domainNormalizer';
import { ConfidenceLevel, CompanyIdentity, CompanyMatchResult, EvidenceInput } from './types';

const genericCompanyTerms = [
  'software',
  'platform',
  'system',
  'solution',
  'solutions',
  'best',
  'top',
  'online',
  'fitness',
  'gym',
  'scheduling',
  'booking',
  'management',
];

export function resolveCompanyIdentity(input: EvidenceInput): CompanyIdentity {
  const sourceDomain = normalizeDomain(input.sourceUrl);
  const domainName = domainBrand(sourceDomain);
  const titleName = companyFromTitle(input.sourceTitle);
  const rawName = cleanCompanyName(input.companyName);
  const canonicalCompany = input.sourceType === 'pain'
    ? rawName || titleName || 'Unknown Company'
    : titleName || rawName || domainName || 'Unknown Company';
  const normalizedDomain = input.sourceType === 'lead' || canonicalCompany.toLowerCase() === domainName.toLowerCase()
    ? sourceDomain
    : '';
  const aliases = Array.from(new Set([rawName, titleName, domainName, input.sourceTitle].filter(Boolean)));

  return {
    canonicalCompany,
    normalizedDomain,
    aliases,
  };
}

export function matchCompany(input: EvidenceInput, identity = resolveCompanyIdentity(input)): CompanyMatchResult {
  const sourceDomain = normalizeDomain(input.sourceUrl);
  const domainName = domainBrand(sourceDomain);
  const haystack = [input.companyName, input.sourceTitle, input.observedText, domainName].join(' ').toLowerCase();
  const canonical = identity.canonicalCompany.toLowerCase();
  const reasons: string[] = [];
  let score = 0;

  if (canonical && haystack.includes(canonical)) {
    score += 35;
    reasons.push('Company name appears in evidence.');
  }

  if (identity.normalizedDomain && sourceDomain === identity.normalizedDomain) {
    score += 35;
    reasons.push('Company domain matches source domain.');
  }

  if (domainName && haystack.includes(domainName.toLowerCase())) {
    score += 20;
    reasons.push('Domain brand appears in source text.');
  }

  if (identity.aliases.some((alias) => alias && haystack.includes(alias.toLowerCase()))) {
    score += 10;
    reasons.push('Known alias appears in source text.');
  }

  const bounded = Math.min(100, score);
  return {
    company: identity.canonicalCompany,
    normalizedDomain: identity.normalizedDomain,
    confidence: confidenceLevel(bounded),
    score: bounded,
    reasons: reasons.length > 0 ? reasons : ['No strong company association found.'],
  };
}

export function companyFromTitle(title: string): string {
  const clean = title.replace(/\s+/g, ' ').trim();
  const segments = clean.split(/\s[-–|]\s/).map((segment) => segment.trim()).filter(Boolean);
  const candidates = [...segments].reverse();
  return candidates.find((segment) => brandLike(segment)) ?? '';
}

export function cleanCompanyName(value: string): string {
  const clean = value.replace(/\s+/g, ' ').trim();
  const titleCandidate = companyFromTitle(clean);
  if (titleCandidate) return titleCandidate;
  if (brandLike(clean)) return clean;
  return '';
}

function brandLike(value: string): boolean {
  const words = value.split(/\s+/).filter(Boolean);
  if (words.length === 0 || words.length > 4) return false;
  const lower = value.toLowerCase();
  const genericCount = genericCompanyTerms.filter((term) => lower.includes(term)).length;
  return genericCount < Math.max(1, words.length);
}

function confidenceLevel(score: number): ConfidenceLevel {
  if (score >= 75) return 'HIGH';
  if (score >= 45) return 'MEDIUM';
  return 'LOW';
}
