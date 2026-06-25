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
  if (isInspectionInconclusive(inspection)) {
    return {
      presence: 'unknown',
      opportunitySignals: [],
      evidenceGaps: [
        `Inspection inconclusive: ${inspection.status ?? 'UNKNOWN_FAILURE'}`,
        'External reachability remains unverified; do not infer downtime from this result.',
      ],
      score: 0,
      scoreBreakdown: zeroScore(),
      decision: 'INSPECTION_INCONCLUSIVE',
      primaryOffer: { name: 'Website QA & Performance Audit', priceRange: 'USD 199–500' },
      recurringFollowUp: 'Monthly Website Care — USD 100–300/month',
      strongestOpportunity: 'Request aborted or timed out; downtime is not verified',
      personalizedSalesAngle: 'No outreach angle is available until the public website inspection succeeds.',
      nextAction: 'RETRY_INSPECTION',
      manualReviewRequired: true,
    };
  }
  if (isHealthyMigratedSite(inspection)) {
    return {
      presence: 'functioning_website',
      opportunitySignals: [],
      evidenceGaps: inspection.migrationEvidence ?? [],
      score: 0,
      scoreBreakdown: zeroScore(),
      decision: 'NOT_QUALIFIED',
      primaryOffer: { name: 'Website QA & Performance Audit', priceRange: 'USD 199–500' },
      recurringFollowUp: 'Monthly Website Care — USD 100–300/month',
      strongestOpportunity: 'Current official website has navigation, contact details, and booking paths',
      personalizedSalesAngle: 'No verified redesign opportunity. The legacy domain points to a current functioning official website.',
      nextAction: 'skip — migrated domain; no verified redesign opportunity',
      manualReviewRequired: true,
    };
  }
  const presence = determinePresence(candidate, inspection);
  const opportunitySignals = buildOpportunitySignals(presence, inspection);
  if (isHealthyFunctioningSiteWithoutVerifiedOpportunity(presence, inspection, opportunitySignals)) {
    return {
      presence: 'functioning_website',
      opportunitySignals: [],
      evidenceGaps: ['No specific verified redesign, recovery, booking, or QA opportunity was found.'],
      score: 0,
      scoreBreakdown: zeroScore(),
      decision: 'NOT_QUALIFIED',
      primaryOffer: { name: 'Website QA & Performance Audit', priceRange: 'USD 199–500' },
      recurringFollowUp: 'Monthly Website Care — USD 100–300/month',
      strongestOpportunity: inspection.parentPlatformPage
        ? 'Active booking/conversion path and established functioning parent website'
        : 'Functioning website with active booking/conversion path and substantial navigation',
      personalizedSalesAngle: 'No Website Studio outreach should be prepared because the site is already functioning and no strong verified opportunity was found.',
      nextAction: 'skip — functioning site; no verified redesign opportunity',
      manualReviewRequired: true,
    };
  }
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

function isInspectionInconclusive(inspection: WebsiteInspection): boolean {
  const failure = inspection.failure?.toLowerCase() ?? '';
  return inspection.status === 'TIMEOUT'
    || inspection.status === 'ABORTED'
    || failure.includes('abort')
    || failure.includes('timeout')
    || failure.includes('timed out');
}

function isHealthyMigratedSite(inspection: WebsiteInspection): boolean {
  return inspection.migrationDetected === true
    && inspection.reachable === true
    && (inspection.internalNavigationLinks ?? 0) >= 3
    && Boolean(inspection.mailtoLinkPresent || inspection.telLinkPresent)
    && inspection.conversionLinkPresent === true
    && inspection.pageTitlePresent === true
    && inspection.viewportMetaPresent === true;
}

function zeroScore(): WebsiteScoreBreakdown {
  return {
    websiteNeed: 0,
    nicheFit: 0,
    commercialPotential: 0,
    conversionOpportunity: 0,
    maintenancePotential: 0,
    evidenceConfidence: 0,
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
    hasContactOrConversionPath(inspection),
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
  if (!hasContactOrConversionPath(inspection)) signals.push('no visible contact link');
  if (inspection.conversionLinkPresent === false) signals.push('no visible booking or conversion link');
  if (inspection.internalNavigationLinks !== null && inspection.internalNavigationLinks < 3) signals.push('limited internal navigation');
  if (inspection.httpsUsed === false) signals.push('HTTP instead of HTTPS');
  if (inspection.responseTimeMs !== null && inspection.responseTimeMs > 3_000) signals.push('slow observed response');
  return signals;
}

function hasContactOrConversionPath(inspection: WebsiteInspection): boolean {
  return Boolean(inspection.mailtoLinkPresent || inspection.telLinkPresent || inspection.conversionLinkPresent);
}

function isHealthyFunctioningSiteWithoutVerifiedOpportunity(
  presence: WebsitePresence,
  inspection: WebsiteInspection,
  opportunitySignals: string[],
): boolean {
  const weakOnly = opportunitySignals.every((signal) => weakSignalPattern.test(signal));
  return presence === 'functioning_website'
    && inspection.conversionLinkPresent === true
    && (inspection.internalNavigationLinks ?? 0) >= 10
    && weakOnly;
}

const weakSignalPattern = /^(no visible contact link|slow observed response)$/i;

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
