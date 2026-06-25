import { DeliveryLeadCandidate } from './deliveryLeadTypes';
import { VerificationEvidenceResult, VerificationPromotionStatus } from './verificationTypes';

export function buildVerificationEvidence(candidate: DeliveryLeadCandidate): VerificationEvidenceResult {
  const buyerVerificationEvidence = buyerEvidenceFor(candidate);
  const intentVerificationEvidence = intentEvidenceFor(candidate);
  const recencyVerificationEvidence = recencyEvidenceFor(candidate);
  const promotionReasons = promotionReasonsFor(candidate, buyerVerificationEvidence, intentVerificationEvidence, recencyVerificationEvidence);
  const verificationPromotionStatus = promotionStatusFor(candidate, buyerVerificationEvidence, intentVerificationEvidence, recencyVerificationEvidence);
  const verificationEvidence = unique([
    ...buyerVerificationEvidence,
    ...intentVerificationEvidence,
    ...recencyVerificationEvidence,
  ]);

  return {
    verificationEvidence,
    verificationEvidenceCount: verificationEvidence.length,
    verificationConfidence: confidenceFor(candidate, buyerVerificationEvidence, intentVerificationEvidence, recencyVerificationEvidence, verificationPromotionStatus),
    buyerVerificationEvidence,
    intentVerificationEvidence,
    recencyVerificationEvidence,
    promotionReasons,
    verificationPromotionStatus,
  };
}

function buyerEvidenceFor(candidate: DeliveryLeadCandidate): string[] {
  const text = searchableText(candidate);
  const evidence = [
    ...candidate.buyerEvidence.map((item) => `buyer evidence: ${item}`),
    ...(candidate.buyerSignals ?? []).map((item) => `buyer signal: ${item}`),
  ];

  if (candidate.buyerType === 'buyer') evidence.push('classified as buyer');
  if (candidate.leadLikeClassification === 'lead_like') evidence.push('lead-like classification');
  if (candidate.leadLikeClassification === 'possibly_lead_like') evidence.push('possibly lead-like classification');
  if (/\b(need|needs|needed|looking for|seeking|searching for|trying to find)\b/.test(text)) evidence.push('explicit request language');
  if (/\b(recommend|recommendation|recommendations|anyone know|who do you recommend)\b/.test(text)) evidence.push('recommendation request language');
  if (/\b(planning|hosting|organizing|upcoming|event|wedding|retreat|trip|dinner|corporate|charity)\b/.test(text)) evidence.push('event or trip planning language');
  if (/\b(budget|quote|pricing|price|hire|book|booking|buy|purchase|vendor)\b/.test(text)) evidence.push('purchase or vendor selection language');

  return unique(evidence);
}

function intentEvidenceFor(candidate: DeliveryLeadCandidate): string[] {
  const text = searchableText(candidate);
  const evidence = [
    ...candidate.intentSignals.map((item) => `intent signal: ${item}`),
    ...(candidate.leadLikeSignals ?? []).map((item) => `lead-like signal: ${item}`),
  ];

  if (candidate.intentStrength === 'strong') evidence.push('strong intent classification');
  if (candidate.intentStrength === 'medium') evidence.push('medium intent classification');
  if (/\b(need|needs|needed|looking for|seeking|searching for|trying to find)\b/.test(text)) evidence.push('need or looking-for language');
  if (/\b(recommend|recommendation|recommendations|anyone know|where can i find)\b/.test(text)) evidence.push('recommendation or sourcing language');
  if (/\b(help|advice|suggestions|ideas|options)\b/.test(text)) evidence.push('help request language');
  if (/\b(cancelled|canceled|fell through|last minute|asap|urgent|quickly|soon)\b/.test(text)) evidence.push('urgency or replacement language');
  if (/\b(catering|caterer|food service|bar service|rentals|retreat|travel planner|villa|tour|private chef)\b/.test(text)) evidence.push('service category intent language');

  return unique(evidence);
}

function recencyEvidenceFor(candidate: DeliveryLeadCandidate): string[] {
  const text = searchableText(candidate);
  const evidence: string[] = [];

  if (candidate.estimatedRecencyDays !== null) {
    evidence.push(`estimated recency: ${candidate.estimatedRecencyDays} days`);
    if (candidate.estimatedRecencyDays <= 30) evidence.push('recency within 30 days');
    if (candidate.estimatedRecencyDays <= 60) evidence.push('recency within 60 days');
  }
  if (/\b(today|yesterday|this week|last week|this month|recent|recently|currently|now)\b/.test(text)) evidence.push('recent discussion language');
  if (/\b(upcoming|next week|next month|this weekend|tomorrow|soon|planning for)\b/.test(text)) evidence.push('upcoming planning language');
  if (/\b(asap|urgent|last minute|quickly|currently looking|looking now|need now)\b/.test(text)) evidence.push('current or urgent planning language');
  if (/\b(20[2-9][0-9]|jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)\b/.test(text)) evidence.push('date expression present');

  return unique(evidence);
}

function promotionStatusFor(
  candidate: DeliveryLeadCandidate,
  buyerEvidence: string[],
  intentEvidence: string[],
  recencyEvidence: string[],
): VerificationPromotionStatus {
  if (hasDisqualifyingSignal(candidate)) return 'pending_review';
  const hasEvidenceThreshold = buyerEvidence.length >= 2 && intentEvidence.length >= 2 && recencyEvidence.length >= 1;
  if (!hasEvidenceThreshold) return 'pending_review';
  if (candidate.verificationReadiness === 'ready' && candidate.overallScore >= 8.2 && candidate.sourceQuality !== 'low') return 'verification_ready';
  return 'verification_review';
}

function promotionReasonsFor(
  candidate: DeliveryLeadCandidate,
  buyerEvidence: string[],
  intentEvidence: string[],
  recencyEvidence: string[],
): string[] {
  const reasons: string[] = [];
  if (buyerEvidence.length >= 2) reasons.push('buyer evidence threshold met');
  if (intentEvidence.length >= 2) reasons.push('intent evidence threshold met');
  if (recencyEvidence.length >= 1) reasons.push('recency evidence present');
  if (candidate.sourceQuality !== 'low') reasons.push(`source quality ${candidate.sourceQuality}`);
  if (candidate.overallScore >= 8.2) reasons.push('score >= 8.2');
  if (candidate.overallScore >= 6 && candidate.overallScore < 8.2) reasons.push('score >= 6; manual review required');
  if (candidate.verificationReadiness === 'ready') reasons.push('verification readiness already ready');
  if (candidate.verificationReadiness !== 'ready') reasons.push(`verification readiness ${candidate.verificationReadiness}; evidence review required`);
  if (hasDisqualifyingSignal(candidate)) reasons.push('not promoted because exclusion or relevance risk remains');
  return unique(reasons);
}

function confidenceFor(
  candidate: DeliveryLeadCandidate,
  buyerEvidence: string[],
  intentEvidence: string[],
  recencyEvidence: string[],
  status: VerificationPromotionStatus,
): 'low' | 'medium' | 'high' {
  let score = buyerEvidence.length * 2 + intentEvidence.length * 1.5 + recencyEvidence.length;
  if (candidate.buyerType === 'buyer') score += 2;
  if (candidate.intentStrength === 'strong') score += 2;
  if (candidate.sourceQuality === 'high') score += 1;
  if (candidate.sourceQuality === 'low') score -= 2;
  if (candidate.resultRelevance !== 'relevant') score -= 3;
  if (candidate.excluded) score -= 4;
  if (status === 'verification_ready') score += 2;
  if (score >= 13) return 'high';
  if (score >= 8) return 'medium';
  return 'low';
}

function hasDisqualifyingSignal(candidate: DeliveryLeadCandidate): boolean {
  return (
    candidate.excluded
    || candidate.sourceQuality === 'low'
    || candidate.resultRelevance !== 'relevant'
    || candidate.domainBlocked
    || candidate.buyerType === 'vendor'
    || candidate.buyerType === 'directory'
    || candidate.competitorDetected
    || candidate.exclusionSignals.length > 0
  );
}

function searchableText(candidate: DeliveryLeadCandidate): string {
  return normalize([
    candidate.title,
    candidate.snippet,
    candidate.query,
    candidate.estimatedLeadType,
    candidate.estimatedLocation,
    candidate.estimatedBudgetSignal,
    candidate.estimatedEventType,
    candidate.estimatedTripType,
    candidate.url,
    candidate.intentSignals.join(' '),
    candidate.leadLikeSignals.join(' '),
    candidate.buyerEvidence.join(' '),
    candidate.recencyEvidence.join(' '),
    (candidate.buyerSignals ?? []).join(' '),
  ].join(' '));
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}
