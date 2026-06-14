import { EvidenceDecision } from './types';

export interface FalsePositiveResult {
  decision: EvidenceDecision;
  reasons: string[];
  penalty: number;
}

const rejectedPatterns = [
  /push press (exercise|movement|technique|workout|weightlifting)/i,
  /how to push press/i,
  /push press descent/i,
  /weakpoint wednesday.*push press/i,
  /105kg push press/i,
  /exercise technique/i,
  /workout guide/i,
  /what is .+ software/i,
  /educational guide/i,
  /wizard101/i,
  /marvel/i,
  /idle champions/i,
];

const suspiciousPatterns = [
  /best .+ software/i,
  /top \d+/i,
  /alternatives/i,
  /compare| vs\.? | versus /i,
  /directory/i,
  /buyer'?s guide/i,
  /listicle/i,
  /reviews? 20\d{2}/i,
  /free .+ software/i,
];

export function detectFalsePositive(sourceTitle: string, sourceUrl: string, observedText: string): FalsePositiveResult {
  const haystack = [sourceTitle, sourceUrl, observedText].join(' ');
  const reasons: string[] = [];

  for (const pattern of rejectedPatterns) {
    if (pattern.test(haystack)) reasons.push(`Rejected pattern: ${pattern.source}`);
  }

  if (reasons.length > 0) {
    return { decision: 'rejected', reasons, penalty: 70 };
  }

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(haystack)) reasons.push(`Suspicious pattern: ${pattern.source}`);
  }

  if (/\/compare\//i.test(sourceUrl)) reasons.push('Comparison URL.');
  if (/reddit\.com\/r\/(weightroom|strength_training)\//i.test(sourceUrl) && /push press/i.test(haystack)) reasons.push('Exercise subreddit reference.');
  if (/reddit\.com\/r\/(Wizard101|MisterFantasticMains|idlechampions|MarvelStrikeForce|MarvelUnlimited)\//i.test(sourceUrl)) reasons.push('Unrelated brand/community mention.');
  if (/\/(blog|article|guide|resources)\//i.test(sourceUrl)) reasons.push('Blog/article-style URL.');
  if (/capterra\.com\/gym-management-software|g2\.com\/categories/i.test(sourceUrl)) reasons.push('Directory category URL.');

  if (reasons.length > 0) {
    return { decision: 'suspicious', reasons, penalty: Math.min(45, 15 + reasons.length * 10) };
  }

  return { decision: 'accepted', reasons: ['No false-positive pattern detected.'], penalty: 0 };
}
