import {
  WebsiteAnalysis,
  WebsiteCandidateInput,
  WebsiteDecision,
  WebsiteInspection,
  WebsiteOffer,
  WebsitePresence,
  WebsiteScoreBreakdown,
} from './types';

export const SCORE_WEIGHTS = {
  websiteNeed: 30,
  nicheFit: 20,
  commercialPotential: 15,
  conversionOpportunity: 15,
  maintenancePotential: 10,
  evidenceConfidence: 10,
} as const;

const HIGH_FIT = new Set<WebsiteCandidateInput['category']>([
  'boutique_hotel',
  'villa',
  'surf_camp',
  'gym',
  'martial_arts',
  'wellness',
  'yoga',
  'restaurant',
  'real_estate',
  'aesthetic_clinic',
]);

export function analyzeWebsiteLead(
  candidate: WebsiteCandidateInput,
  inspection: WebsiteInspection,
): WebsiteAnalysis {
  const presence = determinePresence(candidate, inspection);
  const opportunitySignals = buildOpportunitySignals(presence, inspection);
  const evidenceGaps = buildEvidenceGaps(candidate, inspection);
  const scoreBreakdown = buildScore(candidate, inspection, presence);
  const score = Object.values(scoreBreakdown).reduce((total, value) => total + value, 0);
  const decision = decisionFor(score);
  const primaryOffer = routeOffer(presence, inspection);
  const strongestOpportunity = opportunitySignals[0] ?? 'Evidence is incomplete and requires manual verification';

  return {
    presence,
    opportunitySignals,
    evidenceGaps,
    score,
    scoreBreakdown,
    decision,
    primaryOffer,
    recurringFollowUp: 'Monthly Website Care — USD 100–300/month',
    strongestOpportunity,
    personalizedSalesAngle: buildSalesAngle(candidate, strongestOpportunity),
    nextAction: chooseNextAction(presence, decision, inspection),
    manualReviewRequired: true,
  };
}

function determinePresence(candidate: WebsiteCandidateInput, inspection: WebsiteInspection): WebsitePresence {
  if (!candidate.websiteUrl) {
    return candidate.instagramUrl || candidate.facebookUrl ? 'social_only' : 'no_website';
  }
  if (inspection.reachable === false || inspection.brokenResponse) return 'unreachable_website';
  if (inspection.reachable !== true) return 'unknown';

  const trustAndConversionSignals = [
    inspection.pageTitlePresent,
    inspection.metaDescriptionPresent,
    inspection.viewportMetaPresent,
    inspection.mailtoLinkPresent || inspection.telLinkPresent,
    inspection.conversionLinkPresent,
    (inspection.internalNavigationLinks ?? 0) >= 3,
  ].filter(Boolean).length;

  return trustAndConversionSignals >= 4 ? 'functioning_website' : 'basic_website';
}

function buildOpportunitySignals(presence: WebsitePresence, inspection: WebsiteInspection): string[] {
  const signals: string[] = [];
  if (presence === 'no_website') signals.push('no dedicated website');
  if (presence === 'social_only') signals.push('social-only presence');
  if (presence === 'unreachable_website') signals.push('website unreachable');
  if (inspection.pageTitlePresent === false) signals.push('no page title');
  if (inspection.metaDescriptionPresent === false) signals.push('no meta description');
  if (inspection.viewportMetaPresent === false) signals.push('no viewport meta');
  if (inspection.mailtoLinkPresent === false && inspection.telLinkPresent === false) signals.push('no visible contact link');
  if (inspection.conversionLinkPresent === false) signals.push('no visible booking or conversion link');
  if (inspection.internalNavigationLinks !== null && inspection.internalNavigationLinks < 3) signals.push('limited internal navigation');
  if (inspection.httpsUsed === false) signals.push('HTTP instead of HTTPS');
  if (inspection.responseTimeMs !== null && inspection.responseTimeMs > 3_000) signals.push('slow observed response');
  return signals;
}

function buildEvidenceGaps(candidate: WebsiteCandidateInput, inspection: WebsiteInspection): string[] {
  const gaps: string[] = [];
  if (!candidate.websiteUrl) gaps.push('Current website presence requires manual verification');
  if (!candidate.location) gaps.push('Location not supplied');
  if (!candidate.email && !candidate.phone) gaps.push('Direct public contact not supplied');
  if (candidate.websiteUrl && inspection.failure) gaps.push(`Inspection incomplete: ${inspection.failure}`);
  if (candidate.websiteUrl && inspection.reachable !== true) gaps.push('Page-level website signals unavailable');
  return gaps.length > 0 ? gaps : ['No material evidence gap in the supplied public data'];
}

function buildScore(
  candidate: WebsiteCandidateInput,
  inspection: WebsiteInspection,
  presence: WebsitePresence,
): WebsiteScoreBreakdown {
  const websiteNeedByPresence: Record<WebsitePresence, number> = {
    no_website: 30,
    social_only: 30,
    unreachable_website: 28,
    basic_website: 20,
    functioning_website: inspection.conversionLinkPresent ? 6 : 12,
    unknown: 8,
  };
  const conversionByPresence: Record<WebsitePresence, number> = {
    no_website: 12,
    social_only: 14,
    unreachable_website: 12,
    basic_website: inspection.conversionLinkPresent ? 7 : 15,
    functioning_website: inspection.conversionLinkPresent ? 3 : 15,
    unknown: 5,
  };
  const knownContact = Boolean(candidate.email || candidate.phone || candidate.instagramUrl || candidate.facebookUrl);
  const evidenceKnown = candidate.websiteUrl ? inspection.reachable !== null : true;

  return {
    websiteNeed: websiteNeedByPresence[presence],
    nicheFit: HIGH_FIT.has(candidate.category) ? 20 : candidate.category === 'professional_services' ? 12 : 6,
    commercialPotential: HIGH_FIT.has(candidate.category) ? 15 : candidate.category === 'professional_services' ? 10 : 5,
    conversionOpportunity: conversionByPresence[presence],
    maintenancePotential: candidate.websiteUrl ? 10 : 6,
    evidenceConfidence: Math.min(10, 4 + (evidenceKnown ? 3 : 0) + (knownContact ? 2 : 0) + (candidate.location ? 1 : 0)),
  };
}

function decisionFor(score: number): WebsiteDecision {
  if (score >= 75) return 'PRIORITY';
  if (score >= 55) return 'QUALIFIED';
  if (score >= 35) return 'REVIEW';
  return 'LOW_PRIORITY';
}

function routeOffer(presence: WebsitePresence, inspection: WebsiteInspection): WebsiteOffer {
  if (presence === 'no_website' || presence === 'social_only') {
    return { name: 'Website Presence Starter', priceRange: 'USD 900–1,500' };
  }
  if (presence === 'unreachable_website' || presence === 'basic_website') {
    return { name: 'Website Recovery / Redesign Pack', priceRange: 'USD 1,500–3,000' };
  }
  if (presence === 'functioning_website' && inspection.conversionLinkPresent === false) {
    return { name: 'Conversion Landing Page', priceRange: 'USD 750–1,500' };
  }
  return { name: 'Website QA & Performance Audit', priceRange: 'USD 199–500' };
}

function chooseNextAction(
  presence: WebsitePresence,
  decision: WebsiteDecision,
  inspection: WebsiteInspection,
): WebsiteAnalysis['nextAction'] {
  if (decision === 'LOW_PRIORITY') return 'archive low-priority lead';
  if (presence === 'no_website' || presence === 'social_only') return 'verify website presence';
  if (presence === 'unreachable_website' || inspection.failure) return 'inspect website manually';
  if (presence === 'basic_website') return 'prepare homepage demo';
  if (presence === 'functioning_website') return 'prepare website audit';
  return 'manual review';
}

function buildSalesAngle(candidate: WebsiteCandidateInput, strongestOpportunity: string): string {
  return `${candidate.businessName} appears to have this verifiable opportunity: ${strongestOpportunity}. It may benefit from ${offerBenefitLanguage(strongestOpportunity)}, subject to manual verification.`;
}

function offerBenefitLanguage(signal: string): string {
  if (signal === 'no dedicated website' || signal === 'social-only presence') return 'a dedicated website presence';
  if (signal === 'website unreachable') return 'a website recovery review';
  if (signal.includes('booking') || signal.includes('contact')) return 'a clearer contact or booking path';
  return 'a focused website improvement review';
}
