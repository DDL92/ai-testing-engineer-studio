import { Lead, LeadCategory, Opportunity, ScoreBreakdown } from '../types/lead';
import { sourceQualityBoostForSource } from '../sources/sourceQualityService';

export function scoreText(input: { companyName?: string; website?: string; text: string; source?: string }): ScoreBreakdown {
  const text = `${input.companyName ?? ''} ${input.website ?? ''} ${input.text} ${input.source ?? ''}`.toLowerCase();
  const positive: string[] = [];
  const negative: string[] = [];
  let total = 0;

  total += addIf(/saas|web app|dashboard|platform|subscription|b2b/, 20, 'SaaS or web product company', positive, text);
  total += addIf(Boolean(input.website), 10, 'Has active website', positive);
  total += addIf(/login|sign up|signup|dashboard|portal|app\./, 15, 'Has login/signup/dashboard/app indicators', positive, text);
  total += addIf(/qa|testing|automation|bug|regression|release|sdet/, 20, 'Mentions QA/testing/automation/bug/regression/release', positive, text);
  total += addIf(/agency|software studio|development studio|product studio/, 15, 'Agency or software studio', positive, text);
  total += addIf(/react|next\.js|typescript|node|vue|angular|ci\/cd|github actions|vercel/, 10, 'Uses modern web stack indicators', positive, text);
  total += addIf(/hiring|job|role|qa engineer|automation engineer|sdet/, 20, 'Has hiring/job post for QA/Automation/SDET', positive, text);
  total += addIf(/\$\d|budget|monthly|retainer|contract|long-term|long term/, 10, 'Budget or commercial intent detected', positive, text);
  total += addIf(/playwright|cypress|selenium|e2e|end-to-end|api testing/, 20, 'Good fit for Playwright', positive, text);

  total -= subtractIf(/stealth|unclear|coming soon|placeholder/, 10, 'Unclear business', negative, text);
  total -= subtractIf(!input.website, 15, 'No website', negative);
  total -= subtractIf(/low budget|cheap|lowest rate|very small budget/, 20, 'Low budget', negative, text);
  total -= subtractIf(/restaurant|local plumbing|crypto giveaway|casino|adult/, 15, 'Irrelevant industry', negative, text);
  total -= subtractIf(/spam|guest post|directory listing|coupon/, 20, 'Spammy or low-quality source', negative, text);

  const normalized = Math.max(0, Math.min(100, total));
  return { positive, negative, total: normalized, category: categorize(normalized) };
}

export function applyScoreToLead(lead: Lead): Lead {
  const scoreBreakdown = scoreText({
    companyName: lead.companyName,
    website: lead.website,
    text: `${lead.detectedPainPoint} ${lead.techStackHints.join(' ')} ${lead.qaFitReason} ${lead.notes}`,
    source: lead.source,
  });
  const sourceBoost = sourceQualityBoostForSource(lead.source);
  const adjustedTotal = Math.max(0, Math.min(100, scoreBreakdown.total + sourceBoost.points));
  const adjustedBreakdown: ScoreBreakdown = {
    positive: sourceBoost.points > 0 ? [...scoreBreakdown.positive, sourceBoost.reason] : scoreBreakdown.positive,
    negative: sourceBoost.points < 0 ? [...scoreBreakdown.negative, sourceBoost.reason] : scoreBreakdown.negative,
    total: adjustedTotal,
    category: categorize(adjustedTotal),
  };

  return {
    ...lead,
    score: adjustedBreakdown.total,
    scoreBreakdown: adjustedBreakdown,
    status: nextScoredStatus(lead.status, adjustedBreakdown.category),
    suggestedOffer: recommendedOffer(adjustedBreakdown.total),
    nextAction: nextAction(adjustedBreakdown.category),
    updatedAt: new Date().toISOString(),
  };
}

export function opportunityToLead(opportunity: Opportunity): Lead {
  const now = new Date().toISOString();
  return {
    id: opportunity.id,
    companyName: opportunity.companyName,
    website: opportunity.website,
    contactName: '',
    contactRole: '',
    contactEmail: '',
    linkedinUrl: '',
    source: opportunity.source,
    sourceId: opportunity.sourceId,
    sourceName: opportunity.sourceName,
    sourceCategory: opportunity.sourceCategory,
    sourceUrl: opportunity.sourceUrl,
    detectedPainPoint: opportunity.summary,
    techStackHints: opportunity.detectedKeywords,
    qaFitReason: opportunity.scoreBreakdown.positive.join('; '),
    score: opportunity.score,
    scoreBreakdown: opportunity.scoreBreakdown,
    status: opportunity.category === 'ignore' ? 'ignored' : 'scored',
    suggestedOffer: opportunity.suggestedOffer,
    nextAction: nextAction(opportunity.category),
    createdAt: now,
    updatedAt: now,
    lastContactedAt: '',
    nextFollowUpAt: '',
    notes: `Created from opportunity: ${opportunity.title}`,
  };
}

export function recommendedOffer(score: number): string {
  if (score >= 80) return '$900 Playwright Starter Pack';
  if (score >= 50) return '$199 Detailed QA Audit';
  if (score >= 20) return 'Free Mini QA Audit';
  return 'No outreach recommended';
}

export function suggestedPrice(offer: string): string {
  if (offer.includes('$900')) return '$900';
  if (offer.includes('$199')) return '$199';
  if (offer.includes('$1,500')) return '$1,500/month';
  return '$0';
}

function categorize(score: number): LeadCategory {
  if (score >= 80) return 'hot';
  if (score >= 50) return 'warm';
  if (score >= 20) return 'low';
  return 'ignore';
}

function nextScoredStatus(currentStatus: Lead['status'], category: LeadCategory): Lead['status'] {
  if (currentStatus === 'new' || currentStatus === 'scored' || currentStatus === 'ignored') {
    return category === 'ignore' ? 'ignored' : 'scored';
  }

  return currentStatus;
}

function nextAction(category: LeadCategory): string {
  if (category === 'hot') return 'Review proposal draft and consider offering a quick Playwright audit today.';
  if (category === 'warm') return 'Review fit, personalize message, and decide whether to approve outreach.';
  if (category === 'low') return 'Keep for later review; do not prioritize outreach.';
  return 'Ignore unless new evidence improves fit.';
}

function addIf(condition: RegExp | boolean, points: number, reason: string, bucket: string[], text = ''): number {
  const matched = typeof condition === 'boolean' ? condition : condition.test(text);
  if (matched) bucket.push(`+${points} ${reason}`);
  return matched ? points : 0;
}

function subtractIf(condition: RegExp | boolean, points: number, reason: string, bucket: string[], text = ''): number {
  const matched = typeof condition === 'boolean' ? condition : condition.test(text);
  if (matched) bucket.push(`-${points} ${reason}`);
  return matched ? points : 0;
}
