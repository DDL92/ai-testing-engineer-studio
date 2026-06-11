import { Lead, LeadScoreResult, LeadScoringInput, RecommendedOffer } from './types';

const positiveIndustries = [
  'saas',
  'e-commerce',
  'ecommerce',
  'marketplace',
  'booking',
  'fintech',
  'healthcare',
  'agency',
  'ai product',
];

const painPointKeywords = [
  'checkout',
  'login',
  'signup',
  'sign up',
  'payment',
  'onboarding',
  'regression',
  'flaky tests',
  'flaky',
  'performance',
  'mobile',
  'api',
  'ci/cd',
  'cicd',
];

const vagueOrPoorFitTerms = [
  'unknown',
  'vague',
  'general local business',
  'directory',
  'brochure site',
  'not software',
  'poor fit',
];

export function scoreLead(input: LeadScoringInput): LeadScoreResult {
  const reasons: string[] = [];
  const text = [
    input.companyName,
    input.website,
    input.industry,
    input.source,
    input.fitNotes,
    input.painPoints.join(' '),
  ]
    .join(' ')
    .toLowerCase();

  let score = 0;

  if (input.website.trim()) {
    score += 1.5;
    reasons.push('+1.5 Has a website to review');
  } else {
    score -= 2;
    reasons.push('-2 Missing website');
  }

  const matchedIndustries = positiveIndustries.filter((industry) => text.includes(industry));
  if (matchedIndustries.length > 0) {
    const industryPoints = Math.min(2.5, matchedIndustries.length * 1.25);
    score += industryPoints;
    reasons.push(`+${industryPoints} Strong QA-fit industry: ${matchedIndustries.join(', ')}`);
  }

  const matchedPainPoints = painPointKeywords.filter((keyword) => text.includes(keyword));
  if (matchedPainPoints.length > 0) {
    const painPointPoints = Math.min(4, matchedPainPoints.length);
    score += painPointPoints;
    reasons.push(`+${painPointPoints} Relevant QA pain points: ${matchedPainPoints.join(', ')}`);
  }

  if (isAgencyPartnerPotential(text)) {
    score += 1.5;
    reasons.push('+1.5 Agency or partner retainer potential');
  }

  const matchedPoorFitTerms = vagueOrPoorFitTerms.filter((term) => text.includes(term));
  if (matchedPoorFitTerms.length > 0) {
    score -= 2.5;
    reasons.push(`-2.5 Vague or poor-fit signals: ${matchedPoorFitTerms.join(', ')}`);
  }

  let recommendedOffer = recommendOffer(input.recommendedOffer, score, text);

  if (input.recommendedOffer === 'not-fit') {
    score = Math.min(score, 3);
    recommendedOffer = 'not-fit';
    reasons.push('Score capped because offer is marked not-fit');
  }

  return {
    score: clampScore(score),
    reasons,
    recommendedOffer,
  };
}

export function scoreLeadRecord(lead: Lead): Lead {
  const result = scoreLead(lead);

  return {
    ...lead,
    score: result.score,
    recommendedOffer: result.recommendedOffer,
    updatedAt: new Date().toISOString(),
  };
}

function recommendOffer(currentOffer: RecommendedOffer, score: number, text: string): RecommendedOffer {
  if (currentOffer === 'not-fit') return 'not-fit';
  if (isAgencyPartnerPotential(text) && score >= 6) return 'agency-partner-retainer';
  if (score >= 8) return 'qa-automation-retainer';
  if (score >= 6) return 'playwright-starter-pack';
  if (score >= 4) return 'qa-audit';
  return 'not-fit';
}

function isAgencyPartnerPotential(text: string): boolean {
  return /agency|studio|partner|client portfolio|white label|white-label/.test(text);
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(10, Math.round(score)));
}
