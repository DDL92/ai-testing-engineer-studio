import fs = require('fs');
import path = require('path');
import { DeliveryLeadCandidate } from './deliveryLeadTypes';
import {
  PilotDeliveryHealth,
  PilotDeliveryStatus,
  PilotLead,
  PilotLeadPack,
  PilotMetrics,
  PilotRecommendedAction,
  PilotReviewStatus,
  PilotSalesIntelligence,
} from './pilotDeliveryTypes';
import type { ReviewHistory, ReviewHistoryRecord } from './reviewDecisionTypes';
import type { VerificationReviewBatch, VerificationReviewQueueItem } from './verificationTypes';

interface DeliveryBatch {
  generatedAt: string;
  deliveryCandidates: DeliveryLeadCandidate[];
}

interface PackageJson {
  version?: string;
}

const clientId = 'flora_and_fauna_foods_001';
const clientName = 'Flora and Fauna Foods';
const deliveryPath = path.join(process.cwd(), 'output', 'lead-discovery', 'delivery-candidates', 'delivery-candidates.json');
const verificationReviewPath = path.join(process.cwd(), 'output', 'lead-discovery', 'verification', 'review-queue.json');
const reviewHistoryPath = path.join(process.cwd(), 'output', 'lead-discovery', 'review-state', 'review-history.json');
const packageJsonPath = path.join(process.cwd(), 'package.json');
const outputDir = path.join(process.cwd(), 'output', 'pilot-pack');

const outputPaths = {
  packMd: path.join(outputDir, 'flora-pilot-pack.md'),
  packJson: path.join(outputDir, 'flora-pilot-pack.json'),
  summaryMd: path.join(outputDir, 'flora-pilot-summary.md'),
  summaryJson: path.join(outputDir, 'flora-pilot-summary.json'),
};

const safetyRules = [
  'Preparation only: no outreach, emails, DMs, calls, forms, browser automation, scraping, contact extraction, or auto-messaging is performed.',
  'Every lead remains manual-review only before client-facing delivery or any human-led contact step.',
  'Outputs use local reviewed lead metadata and deterministic scoring only.',
  'No credentials, private client data, or real contact details are included.',
];

export function generatePilotDeliveryPack(now = new Date(), sourceLeads?: PilotLead[], writeFiles = true): PilotLeadPack {
  const generatedAt = now.toISOString();
  const leads = sourceLeads ?? buildPilotLeads();
  const metrics = buildMetrics(leads);
  const status = deliveryStatus(metrics);
  const salesIntelligence = buildSalesIntelligence(leads);
  const deliveryHealth = buildDeliveryHealth(status, metrics);
  const summary = {
    client: clientName,
    date: generatedAt,
    systemVersion: systemVersion(),
    totalReviewedLeads: metrics.leadsReviewed,
    totalApprovedLeads: metrics.leadsApproved,
    verificationCandidates: metrics.verificationReviews,
    falsePositivesRemoved: leads.filter((lead) => lead.reviewStatus === 'false_positive').length,
    averageConfidence: metrics.averageConfidence,
    estimatedCommercialValue: metrics.estimatedOpportunityValue,
    status,
  };
  const pack: PilotLeadPack = {
    generatedAt,
    client: clientName,
    summary,
    leads,
    salesIntelligence,
    recommendedActions: leads.map((lead) => ({
      leadId: lead.leadId,
      action: lead.recommendedAction,
      reason: lead.recommendedActionReason,
    })),
    deliveryPackage: {
      packageName: 'Flora Pilot Delivery Pack v2',
      files: Object.values(outputPaths).map((filePath) => path.relative(process.cwd(), filePath)),
      safetyRules,
    },
    metrics,
    deliveryHealth,
  };

  if (writeFiles) {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPaths.packMd, renderPilotPack(pack), 'utf8');
    fs.writeFileSync(outputPaths.packJson, `${JSON.stringify(pack, null, 2)}\n`, 'utf8');
    fs.writeFileSync(outputPaths.summaryMd, renderSummary(pack), 'utf8');
    fs.writeFileSync(outputPaths.summaryJson, `${JSON.stringify(pack.summary, null, 2)}\n`, 'utf8');
  }

  return pack;
}

export function getPilotDeliveryHealth(): PilotDeliveryHealth {
  const leads = buildPilotLeads();
  const metrics = buildMetrics(leads);
  return buildDeliveryHealth(deliveryStatus(metrics), metrics);
}

function buildPilotLeads(): PilotLead[] {
  const deliveryCandidates = readDeliveryCandidates();
  const reviewItems = readVerificationReviewItems();
  const reviews = readReviewHistory();
  const reviewByCandidateId = new Map(reviews.map((review) => [review.candidateId, review]));
  const reviewItemByCandidateId = new Map(reviewItems.map((item) => [item.candidateId, item]));
  const mappedFromDelivery = deliveryCandidates
    .filter((candidate) => candidate.clientId === clientId)
    .map((candidate) => mapDeliveryCandidate(candidate, reviewByCandidateId.get(candidate.id), reviewItemByCandidateId.get(candidate.id)));
  const deliveryIds = new Set(mappedFromDelivery.map((lead) => lead.leadId));
  const mappedFromReviewQueue = reviewItems
    .filter((item) => item.clientId === clientId && !deliveryIds.has(item.candidateId))
    .map((item) => mapReviewQueueItem(item));
  return [...mappedFromDelivery, ...mappedFromReviewQueue].sort((a, b) => b.score - a.score);
}

function mapDeliveryCandidate(
  candidate: DeliveryLeadCandidate,
  review: ReviewHistoryRecord | undefined,
  reviewItem: VerificationReviewQueueItem | undefined,
): PilotLead {
  const reviewStatus = reviewStatusFor(candidate, review, reviewItem);
  const confidence = confidenceFor(candidate.overallScore, candidate.buyerRoleConfidence, reviewItem?.verificationConfidence);
  const estimatedValue = estimatedValueFor(candidate.estimatedBudgetSignal, candidate.estimatedEventType, candidate.overallScore);
  const action = recommendedActionFor(reviewStatus, confidence, candidate.intentStrength, candidate.overallScore);
  const actionReason = actionReasonFor(action, reviewStatus, candidate.intentStrength, confidence);
  const recency = recencyFor(candidate.estimatedRecencyDays);
  const eventType = normalizeEventType(candidate.estimatedEventType || candidate.estimatedLeadType);
  const buyerSignals = unique([...(candidate.buyerSignals ?? []), ...(candidate.buyerRoleSignals ?? [])]);
  return {
    leadId: candidate.id,
    reviewStatus,
    buyerRole: candidate.buyerRole,
    confidence,
    source: candidate.sourceName || hostFor(candidate.url),
    sourceUrl: candidate.url,
    location: candidate.estimatedLocation || 'Unknown',
    eventType,
    estimatedGuests: estimateGuests(candidate.snippet, eventType),
    recency,
    intentStrength: candidate.intentStrength,
    buyerSignals,
    score: candidate.overallScore,
    estimatedValue,
    recommendedAction: action,
    recommendedActionReason: actionReason,
    reviewNotes: review?.notes || candidate.notes || candidate.reasons.join('; ') || 'Manual review required.',
    salesNotes: {
      eventType,
      location: candidate.estimatedLocation || 'Unknown',
      estimatedGuests: estimateGuests(candidate.snippet, eventType),
      estimatedValue,
      intentSignals: unique(candidate.intentSignals ?? []),
      buyerSignals,
      urgency: urgencyFor(candidate.intentStrength, candidate.estimatedRecencyDays),
      recommendedAction: action,
      actionReason,
    },
  };
}

function mapReviewQueueItem(item: VerificationReviewQueueItem): PilotLead {
  const confidence = confidenceFor(item.overallScore, item.buyerRoleConfidence, item.verificationConfidence);
  const eventType = normalizeEventType(item.title);
  const estimatedValue = estimatedValueFor('', eventType, item.overallScore);
  const reviewStatus: PilotReviewStatus = item.verificationPromotionStatus === 'verification_ready' ? 'verification_candidate' : 'needs_review';
  const action = recommendedActionFor(reviewStatus, confidence, item.intentStrength, item.overallScore);
  const actionReason = actionReasonFor(action, reviewStatus, item.intentStrength, confidence);
  return {
    leadId: item.candidateId,
    reviewStatus,
    buyerRole: item.buyerRole ?? 'unknown',
    confidence,
    source: item.sourceName || hostFor(item.url),
    sourceUrl: item.url,
    location: 'Unknown',
    eventType,
    estimatedGuests: estimateGuests(item.snippet, eventType),
    recency: item.recencyVerificationEvidence.length > 0 ? item.recencyVerificationEvidence.join('; ') : 'Needs review',
    intentStrength: item.intentStrength,
    buyerSignals: unique(item.buyerVerificationEvidence),
    score: item.overallScore,
    estimatedValue,
    recommendedAction: action,
    recommendedActionReason: actionReason,
    reviewNotes: item.promotionReasons.join('; ') || 'Verification review queued; manual approval required.',
    salesNotes: {
      eventType,
      location: 'Unknown',
      estimatedGuests: estimateGuests(item.snippet, eventType),
      estimatedValue,
      intentSignals: unique(item.intentVerificationEvidence),
      buyerSignals: unique(item.buyerVerificationEvidence),
      urgency: urgencyFor(item.intentStrength, null),
      recommendedAction: action,
      actionReason,
    },
  };
}

function buildMetrics(leads: PilotLead[]): PilotMetrics {
  const approved = leads.filter((lead) => lead.reviewStatus === 'approved');
  const rejected = leads.filter((lead) => ['rejected', 'false_positive'].includes(lead.reviewStatus));
  const falsePositives = leads.filter((lead) => lead.reviewStatus === 'false_positive').length;
  return {
    leadsReviewed: leads.length,
    leadsApproved: approved.length,
    leadsRejected: rejected.length,
    verificationReviews: leads.filter((lead) => lead.reviewStatus === 'verification_candidate' || lead.reviewStatus === 'needs_review').length,
    averageConfidence: round(average(leads.map((lead) => lead.confidence))),
    falsePositiveRate: round(leads.length === 0 ? 0 : falsePositives / leads.length),
    estimatedOpportunityValue: approved.reduce((sum, lead) => sum + lead.estimatedValue, 0),
    reviewTimeEstimateMinutes: leads.filter((lead) => lead.reviewStatus !== 'approved' && lead.reviewStatus !== 'rejected').length * 6,
  };
}

function buildSalesIntelligence(leads: PilotLead[]): PilotSalesIntelligence {
  return {
    topEventTypes: topValues(leads.map((lead) => lead.eventType)),
    topLocations: topValues(leads.map((lead) => lead.location)),
    topIntentSignals: topValues(leads.flatMap((lead) => lead.salesNotes.intentSignals)),
    topBuyerSignals: topValues(leads.flatMap((lead) => lead.buyerSignals)),
    urgencyDistribution: distribution(leads.map((lead) => lead.salesNotes.urgency)),
    estimatedRevenueOpportunity: leads
      .filter((lead) => lead.reviewStatus === 'approved')
      .reduce((sum, lead) => sum + lead.estimatedValue, 0),
  };
}

function buildDeliveryHealth(status: PilotDeliveryStatus, metrics: PilotMetrics): PilotDeliveryHealth {
  return {
    pilotReadiness: status,
    approvedLeadCount: metrics.leadsApproved,
    commercialReadiness: status === 'READY' ? 'Client-facing pack is ready for manual review.' : status === 'PARTIAL' ? 'More review needed before delivery.' : 'No approved leads available for delivery.',
    estimatedOpportunityValue: metrics.estimatedOpportunityValue,
    reviewWorkload: metrics.reviewTimeEstimateMinutes === 0 ? 'No pending review workload.' : `${metrics.reviewTimeEstimateMinutes} minutes estimated review work`,
    nextRecommendedAction: status === 'READY'
      ? 'Review final pack manually before any client-facing use.'
      : status === 'PARTIAL'
        ? 'Approve or reject verification candidates before delivery.'
        : 'Run offline review simulation or add reviewed leads; do not perform outreach.',
  };
}

function renderPilotPack(pack: PilotLeadPack): string {
  return `# Flora Pilot Delivery Pack v2

Generated: ${pack.generatedAt}

## Executive Summary

${summaryBullets(pack)}

## Reviewed Lead Table

| Lead ID | Review Status | Confidence | Source | Location | Event Type | Estimated Guests | Recency | Intent Strength | Estimated Value | Recommended Action | Review Notes |
| --- | --- | ---: | --- | --- | --- | ---: | --- | --- | ---: | --- | --- |
${pack.leads.map((lead) => `| ${cell(lead.leadId)} | ${lead.reviewStatus} | ${lead.confidence.toFixed(2)} | ${cell(lead.source)} | ${cell(lead.location)} | ${cell(lead.eventType)} | ${lead.estimatedGuests ?? 0} | ${cell(lead.recency)} | ${cell(String(lead.intentStrength))} | $${lead.estimatedValue.toFixed(0)} | ${lead.recommendedAction} | ${cell(lead.reviewNotes)} |`).join('\n') || '| No reviewed leads | NO_DELIVERY | 0.00 | none | none | none | 0 | none | none | 0 | WAIT | No approved leads available. |'}

## Sales Intelligence

- Top Event Types: ${pack.salesIntelligence.topEventTypes.join(', ') || 'none'}
- Top Locations: ${pack.salesIntelligence.topLocations.join(', ') || 'none'}
- Top Intent Signals: ${pack.salesIntelligence.topIntentSignals.join(', ') || 'none'}
- Top Buyer Signals: ${pack.salesIntelligence.topBuyerSignals.join(', ') || 'none'}
- Urgency Distribution: ${formatDistribution(pack.salesIntelligence.urgencyDistribution)}
- Estimated Revenue Opportunity: $${pack.salesIntelligence.estimatedRevenueOpportunity.toFixed(0)}

## Recommended Actions

${pack.recommendedActions.map((action) => `- ${action.leadId}: ${action.action} - ${action.reason}`).join('\n') || '- WAIT - No approved leads are available for delivery.'}

## Delivery Package

- Package: ${pack.deliveryPackage.packageName}
- Files: ${pack.deliveryPackage.files.join(', ')}
- Status: ${pack.summary.status}

## Commercial Metrics

- Leads reviewed: ${pack.metrics.leadsReviewed}
- Leads approved: ${pack.metrics.leadsApproved}
- Leads rejected: ${pack.metrics.leadsRejected}
- Verification reviews: ${pack.metrics.verificationReviews}
- Average confidence: ${pack.metrics.averageConfidence.toFixed(2)}
- False positive rate: ${(pack.metrics.falsePositiveRate * 100).toFixed(1)}%
- Estimated opportunity value: $${pack.metrics.estimatedOpportunityValue.toFixed(0)}
- Review time estimate: ${pack.metrics.reviewTimeEstimateMinutes} minutes

## Safety Rules

${pack.deliveryPackage.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function renderSummary(pack: PilotLeadPack): string {
  return `# Flora Pilot Summary

${summaryBullets(pack)}

## Pilot Delivery Health

- Pilot readiness: ${pack.deliveryHealth.pilotReadiness}
- Number of approved leads: ${pack.deliveryHealth.approvedLeadCount}
- Commercial readiness: ${pack.deliveryHealth.commercialReadiness}
- Estimated opportunity value: $${pack.deliveryHealth.estimatedOpportunityValue.toFixed(0)}
- Review workload: ${pack.deliveryHealth.reviewWorkload}
- Next recommended action: ${pack.deliveryHealth.nextRecommendedAction}
`;
}

function summaryBullets(pack: PilotLeadPack): string {
  return `- Client: ${pack.summary.client}
- Date: ${pack.summary.date}
- System version: ${pack.summary.systemVersion}
- Total reviewed leads: ${pack.summary.totalReviewedLeads}
- Total approved leads: ${pack.summary.totalApprovedLeads}
- Verification candidates: ${pack.summary.verificationCandidates}
- False positives removed: ${pack.summary.falsePositivesRemoved}
- Average confidence: ${pack.summary.averageConfidence.toFixed(2)}
- Estimated commercial value: $${pack.summary.estimatedCommercialValue.toFixed(0)}
- Status: ${pack.summary.status}`;
}

function readDeliveryCandidates(): DeliveryLeadCandidate[] {
  if (!fs.existsSync(deliveryPath)) return [];
  const batch = JSON.parse(fs.readFileSync(deliveryPath, 'utf8')) as DeliveryBatch;
  return batch.deliveryCandidates ?? [];
}

function readVerificationReviewItems(): VerificationReviewQueueItem[] {
  if (!fs.existsSync(verificationReviewPath)) return [];
  const batch = JSON.parse(fs.readFileSync(verificationReviewPath, 'utf8')) as VerificationReviewBatch;
  return batch.reviewItems ?? [];
}

function readReviewHistory(): ReviewHistoryRecord[] {
  if (!fs.existsSync(reviewHistoryPath)) return [];
  const history = JSON.parse(fs.readFileSync(reviewHistoryPath, 'utf8')) as ReviewHistory;
  return history.decisions ?? [];
}

function reviewStatusFor(
  candidate: DeliveryLeadCandidate,
  review: ReviewHistoryRecord | undefined,
  reviewItem: VerificationReviewQueueItem | undefined,
): PilotReviewStatus {
  if (review?.decision === 'approve') return 'approved';
  if (review?.decision === 'reject') return 'rejected';
  if (review?.decision === 'false_positive') return 'false_positive';
  if (candidate.excluded || candidate.exclusionReason) return candidate.exclusionReason === 'not_buying_service' ? 'false_positive' : 'rejected';
  if (reviewItem?.verificationPromotionStatus === 'verification_ready') return 'verification_candidate';
  if (reviewItem || candidate.manualReviewRequired) return 'needs_review';
  return 'needs_review';
}

function recommendedActionFor(
  reviewStatus: PilotReviewStatus,
  confidence: number,
  intentStrength: string,
  score: number,
): PilotRecommendedAction {
  if (reviewStatus === 'rejected' || reviewStatus === 'false_positive') return 'REJECT';
  if (reviewStatus === 'approved' && (confidence >= 0.8 || score >= 8)) return 'HIGH_PRIORITY';
  if (reviewStatus === 'approved') return 'SOFT_CONTACT';
  if (reviewStatus === 'verification_candidate' && (intentStrength === 'strong' || confidence >= 0.7)) return 'RESEARCH_MORE';
  return 'WAIT';
}

function actionReasonFor(
  action: PilotRecommendedAction,
  reviewStatus: PilotReviewStatus,
  intentStrength: string,
  confidence: number,
): string {
  if (action === 'REJECT') return `Marked ${reviewStatus}; keep out of delivery.`;
  if (action === 'HIGH_PRIORITY') return `Approved with ${confidence.toFixed(2)} confidence and ${intentStrength} intent.`;
  if (action === 'SOFT_CONTACT') return 'Approved for manual soft contact after final human review.';
  if (action === 'RESEARCH_MORE') return 'Promising verification candidate; gather more evidence before delivery.';
  return 'Wait for manual approval before any client-facing use.';
}

function deliveryStatus(metrics: PilotMetrics): PilotDeliveryStatus {
  if (metrics.leadsApproved >= 3) return 'READY';
  if (metrics.leadsApproved > 0 || metrics.verificationReviews > 0 || metrics.leadsReviewed > 0) return 'PARTIAL';
  return 'NO_DELIVERY';
}

function confidenceFor(score: number, buyerRoleConfidence?: string, verificationConfidence?: string): number {
  const scoreConfidence = Math.max(0, Math.min(score / 10, 1));
  const roleConfidence = buyerRoleConfidence === 'high' ? 0.9 : buyerRoleConfidence === 'medium' ? 0.65 : buyerRoleConfidence === 'low' ? 0.4 : scoreConfidence;
  const verification = verificationConfidence === 'high' ? 0.9 : verificationConfidence === 'medium' ? 0.65 : verificationConfidence === 'low' ? 0.4 : scoreConfidence;
  return round((scoreConfidence + roleConfidence + verification) / 3);
}

function estimatedValueFor(budgetSignal: string, eventType: string, score: number): number {
  const normalizedBudget = budgetSignal.toLowerCase();
  if (normalizedBudget.includes('high')) return 15000;
  if (normalizedBudget.includes('medium')) return 8000;
  if (eventType.toLowerCase().includes('wedding')) return 12000;
  if (eventType.toLowerCase().includes('corporate')) return 9000;
  if (eventType.toLowerCase().includes('fundraiser')) return 7500;
  if (eventType.toLowerCase().includes('bar')) return 5000;
  return score >= 8 ? 7000 : 4000;
}

function normalizeEventType(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized.includes('wedding')) return 'Wedding';
  if (normalized.includes('corporate')) return 'Corporate Event';
  if (normalized.includes('fundraiser') || normalized.includes('charity')) return 'Fundraiser';
  if (normalized.includes('dinner')) return 'Private Dinner';
  if (normalized.includes('bar')) return 'Bar Service';
  if (value.trim()) return value.trim();
  return 'General Catering';
}

function estimateGuests(text: string, eventType: string): number | null {
  const match = text.match(/(\d{2,4})\s*(guests|people|attendees)/i);
  if (match) return Number(match[1]);
  if (eventType === 'Wedding') return 100;
  if (eventType === 'Corporate Event') return 75;
  if (eventType === 'Fundraiser') return 120;
  if (eventType === 'Private Dinner') return 20;
  return null;
}

function recencyFor(days: number | null): string {
  if (days === null) return 'Unknown';
  if (days <= 7) return `${days} days`;
  if (days <= 30) return `${days} days`;
  return `${days} days - stale check recommended`;
}

function urgencyFor(intentStrength: string, recencyDays: number | null): 'low' | 'medium' | 'high' {
  if (intentStrength === 'strong' || (recencyDays !== null && recencyDays <= 14)) return 'high';
  if (intentStrength === 'medium' || recencyDays === null) return 'medium';
  return 'low';
}

function systemVersion(): string {
  if (!fs.existsSync(packageJsonPath)) return 'unknown';
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as PackageJson;
  return packageJson.version ?? 'unknown';
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

function topValues(values: string[], limit = 5): string[] {
  return Object.entries(distribution(values.filter(Boolean)))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([value, count]) => `${value} (${count})`);
}

function distribution(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function formatDistribution(values: Record<string, number>): string {
  return Object.entries(values).map(([key, value]) => `${key}: ${value}`).join(', ') || 'none';
}

function hostFor(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'Unknown source';
  }
}

function cell(value: string): string {
  return value.replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
}

if (require.main === module) {
  const pack = generatePilotDeliveryPack();
  console.log(`Generated pilot delivery pack: ${pack.deliveryPackage.files.join(', ')}`);
}
