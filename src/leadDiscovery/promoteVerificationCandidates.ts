import fs = require('fs');
import path = require('path');
import { buildVerificationEvidence } from './buildVerificationEvidence';
import { DeliveryLeadCandidate } from './deliveryLeadTypes';
import { VerificationReviewBatch, VerificationReviewQueueItem } from './verificationTypes';

interface DeliveryBatch {
  generatedAt: string;
  sourceCandidates: number;
  deliveryCandidates: DeliveryLeadCandidate[];
  safetyRules: string[];
}

const deliveryPath = path.join(process.cwd(), 'output', 'lead-discovery', 'delivery-candidates', 'delivery-candidates.json');
const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'verification');
const reviewQueueMdPath = path.join(outputDir, 'review-queue.md');
const reviewQueueCsvPath = path.join(outputDir, 'review-queue.csv');
const reviewQueueJsonPath = path.join(outputDir, 'review-queue.json');
const learningMdPath = path.join(outputDir, 'verification-learning.md');
const learningCsvPath = path.join(outputDir, 'verification-learning.csv');

const safetyRules = [
  'Evidence promotion only: no messages are sent and no contact details are extracted.',
  'No scraping, page crawling, browser automation, login, email, phone, DM, call, form, CRM, or outreach is performed.',
  'verification_review and verification_ready both require Daniel manual approval before any contact or client-facing use.',
  'Promotion is based on local delivery candidate metadata, buyer evidence, intent evidence, and recency evidence only.',
];

export function promoteVerificationCandidates(now = new Date()): VerificationReviewBatch {
  const generatedAt = now.toISOString();
  const deliveryBatch = readDeliveryCandidates();
  const reviewItems = deliveryBatch.deliveryCandidates
    .map((candidate) => ({ candidate, evidence: buildVerificationEvidence(candidate) }))
    .filter((item) => item.evidence.verificationPromotionStatus !== 'pending_review')
    .sort(comparePromotionPriority)
    .map((item, index) => toReviewQueueItem(item.candidate, item.evidence, index + 1));

  const batch: VerificationReviewBatch = {
    generatedAt,
    totalDeliveryCandidates: deliveryBatch.deliveryCandidates.length,
    totalReviewCandidates: reviewItems.filter((item) => item.verificationPromotionStatus === 'verification_review').length,
    totalReadyCandidates: reviewItems.filter((item) => item.verificationPromotionStatus === 'verification_ready').length,
    reviewItems,
    safetyRules,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(reviewQueueMdPath, renderReviewQueue(batch), 'utf8');
  fs.writeFileSync(reviewQueueCsvPath, renderReviewQueueCsv(batch.reviewItems), 'utf8');
  fs.writeFileSync(reviewQueueJsonPath, `${JSON.stringify(batch, null, 2)}\n`, 'utf8');
  fs.writeFileSync(learningMdPath, renderLearning(batch), 'utf8');
  fs.writeFileSync(learningCsvPath, renderLearningCsv(batch.reviewItems), 'utf8');

  return batch;
}

function readDeliveryCandidates(): DeliveryBatch {
  if (!fs.existsSync(deliveryPath)) {
    throw new Error(`Delivery candidates not found: ${path.relative(process.cwd(), deliveryPath)}. Run npm run leads:quality first.`);
  }
  return JSON.parse(fs.readFileSync(deliveryPath, 'utf8')) as DeliveryBatch;
}

function toReviewQueueItem(
  candidate: DeliveryLeadCandidate,
  evidence: ReturnType<typeof buildVerificationEvidence>,
  index: number,
): VerificationReviewQueueItem {
  return {
    id: `verification-review-${String(index).padStart(4, '0')}`,
    candidateId: candidate.id,
    clientId: candidate.clientId,
    clientName: candidate.clientName,
    sourceName: candidate.sourceName,
    sourceCategory: candidate.sourceCategory,
    url: candidate.url,
    title: candidate.title,
    snippet: candidate.snippet,
    query: candidate.query,
    queryTemplateId: candidate.queryTemplateId,
    queryTemplateType: candidate.queryTemplateType,
    overallScore: candidate.overallScore,
    buyerType: candidate.buyerType,
    intentStrength: candidate.intentStrength,
    sourceQuality: candidate.sourceQuality,
    resultRelevance: candidate.resultRelevance,
    deliveryQueue: candidate.deliveryQueue,
    verificationPromotionStatus: evidence.verificationPromotionStatus,
    verificationConfidence: evidence.verificationConfidence,
    verificationEvidence: evidence.verificationEvidence,
    verificationEvidenceCount: evidence.verificationEvidenceCount,
    buyerVerificationEvidence: evidence.buyerVerificationEvidence,
    intentVerificationEvidence: evidence.intentVerificationEvidence,
    recencyVerificationEvidence: evidence.recencyVerificationEvidence,
    recommendedContactMethod: candidate.recommendedContactMethod,
    promotionReasons: evidence.promotionReasons,
    approvalStatus: 'pending_daniel_review',
    manualReviewRequired: true,
  };
}

function comparePromotionPriority(
  left: { candidate: DeliveryLeadCandidate; evidence: ReturnType<typeof buildVerificationEvidence> },
  right: { candidate: DeliveryLeadCandidate; evidence: ReturnType<typeof buildVerificationEvidence> },
): number {
  return clientRank(left.candidate.clientId) - clientRank(right.candidate.clientId)
    || statusRank(left.evidence.verificationPromotionStatus) - statusRank(right.evidence.verificationPromotionStatus)
    || confidenceRank(left.evidence.verificationConfidence) - confidenceRank(right.evidence.verificationConfidence)
    || right.evidence.verificationEvidenceCount - left.evidence.verificationEvidenceCount
    || right.candidate.overallScore - left.candidate.overallScore
    || left.candidate.title.localeCompare(right.candidate.title);
}

function clientRank(clientId: string): number {
  if (clientId === 'flora_and_fauna_foods_001') return 0;
  if (clientId === 'lzt_costa_rica_001') return 1;
  if (clientId === 'costa_retreats_001') return 2;
  return 3;
}

function statusRank(status: string): number {
  if (status === 'verification_ready') return 0;
  if (status === 'verification_review') return 1;
  return 2;
}

function confidenceRank(confidence: string): number {
  if (confidence === 'high') return 0;
  if (confidence === 'medium') return 1;
  return 2;
}

function renderReviewQueue(batch: VerificationReviewBatch): string {
  return `# Verification Review Queue

Generated: ${batch.generatedAt}

## Summary

- Delivery candidates reviewed: ${batch.totalDeliveryCandidates}
- Verification review candidates: ${batch.totalReviewCandidates}
- Verification ready candidates: ${batch.totalReadyCandidates}
- Total promoted for human review: ${batch.reviewItems.length}
- Approval status: pending Daniel review

## Confidence Distribution

${renderDistribution(batch.reviewItems.map((item) => item.verificationConfidence))}

## Promotion Reasons

${renderDistribution(batch.reviewItems.flatMap((item) => item.promotionReasons))}

## Review Candidates

${batch.reviewItems.map((item, index) => `## ${index + 1}. ${item.title}

- Review ID: ${item.id}
- Client: ${item.clientName} (${item.clientId})
- Status: ${item.verificationPromotionStatus}
- Confidence: ${item.verificationConfidence}
- URL: ${item.url}
- Query: ${item.query}
- Source: ${item.sourceName} (${item.sourceCategory})
- Score: ${item.overallScore}
- Buyer type: ${item.buyerType}
- Intent strength: ${item.intentStrength}
- Source quality: ${item.sourceQuality}
- Recommended contact method: ${item.recommendedContactMethod}
- Buyer evidence: ${item.buyerVerificationEvidence.join('; ') || 'none'}
- Intent evidence: ${item.intentVerificationEvidence.join('; ') || 'none'}
- Recency evidence: ${item.recencyVerificationEvidence.join('; ') || 'none'}
- Promotion reason: ${item.promotionReasons.join('; ') || 'none'}
- Approval status: ${item.approvalStatus}`).join('\n\n') || '- No candidates promoted to verification review.'}

## Safety Rules

${batch.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function renderReviewQueueCsv(items: VerificationReviewQueueItem[]): string {
  const headers = [
    'review_id',
    'candidate_id',
    'client_id',
    'client_name',
    'status',
    'confidence',
    'query',
    'source_name',
    'source_category',
    'url',
    'title',
    'overall_score',
    'buyer_type',
    'intent_strength',
    'source_quality',
    'recommended_contact_method',
    'buyer_evidence',
    'intent_evidence',
    'recency_evidence',
    'promotion_reasons',
  ];
  const rows = items.map((item) => [
    item.id,
    item.candidateId,
    item.clientId,
    item.clientName,
    item.verificationPromotionStatus,
    item.verificationConfidence,
    item.query,
    item.sourceName,
    item.sourceCategory,
    item.url,
    item.title,
    item.overallScore.toFixed(1),
    item.buyerType,
    item.intentStrength,
    item.sourceQuality,
    item.recommendedContactMethod,
    item.buyerVerificationEvidence.join('|'),
    item.intentVerificationEvidence.join('|'),
    item.recencyVerificationEvidence.join('|'),
    item.promotionReasons.join('|'),
  ]);
  return `${headers.map(csvCell).join(',')}\n${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function renderLearning(batch: VerificationReviewBatch): string {
  return `# Verification Learning

Generated: ${batch.generatedAt}

## Promoted Queries

${renderDistribution(batch.reviewItems.map((item) => item.query))}

## Promoted Sources

${renderDistribution(batch.reviewItems.map((item) => item.sourceName))}

## Promotion Reasons

${renderDistribution(batch.reviewItems.flatMap((item) => item.promotionReasons))}

## Future Recommendations

${futureRecommendations(batch.reviewItems).map((item) => `- ${item}`).join('\n') || '- Keep collecting evidence until at least one candidate reaches verification_review.'}

No scraping, browser automation, contact extraction, outreach, email, DM, calls, or forms were performed.
`;
}

function renderLearningCsv(items: VerificationReviewQueueItem[]): string {
  const headers = ['client_id', 'client_name', 'query', 'source_name', 'status', 'confidence', 'promotion_reasons', 'future_recommendation'];
  const rows = items.map((item) => [
    item.clientId,
    item.clientName,
    item.query,
    item.sourceName,
    item.verificationPromotionStatus,
    item.verificationConfidence,
    item.promotionReasons.join('|'),
    recommendationFor(item),
  ]);
  return `${headers.map(csvCell).join(',')}\n${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function futureRecommendations(items: VerificationReviewQueueItem[]): string[] {
  const recommendations = new Set<string>();
  for (const item of items) {
    recommendations.add(recommendationFor(item));
  }
  return [...recommendations].sort();
}

function recommendationFor(item: VerificationReviewQueueItem): string {
  if (item.verificationPromotionStatus === 'verification_ready' && item.verificationConfidence === 'high') {
    return `Prioritize manual review for ${item.clientName} query "${item.query}".`;
  }
  if (item.recencyVerificationEvidence.length === 0) {
    return `Improve recency phrasing for query "${item.query}".`;
  }
  if (item.buyerVerificationEvidence.length < 3) {
    return `Prefer sources with stronger explicit buyer language for ${item.sourceName}.`;
  }
  return `Keep query "${item.query}" and monitor confirmed outcomes.`;
}

function renderDistribution(values: string[]): string {
  const rows = Object.entries(values.reduce<Record<string, number>>((acc, value) => {
    const key = value || 'unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {}))
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  return rows.map(([value, count]) => `- ${value}: ${count}`).join('\n') || '- None.';
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function main(): void {
  try {
    const batch = promoteVerificationCandidates();
    console.log(`Verification review generated: ${[
      path.relative(process.cwd(), reviewQueueMdPath),
      path.relative(process.cwd(), reviewQueueCsvPath),
      path.relative(process.cwd(), learningMdPath),
      path.relative(process.cwd(), learningCsvPath),
    ].join(', ')}`);
    console.log(`Verification review candidates: ${batch.totalReviewCandidates}`);
    console.log(`Verification ready candidates: ${batch.totalReadyCandidates}`);
    console.log('Review only. No outreach, contact extraction, scraping, browser automation, email, DM, calls, or forms were performed.');
  } catch (error) {
    console.error('Verification Review Promotion: FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) main();
