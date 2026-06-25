import fs = require('fs');
import path = require('path');
import { DeliveryLeadCandidate } from './deliveryLeadTypes';
import { VerificationBatch, VerificationFailureItem, VerificationFailureReason, VerificationQueueItem } from './verificationTypes';

interface DeliveryBatch {
  generatedAt: string;
  sourceCandidates: number;
  deliveryCandidates: DeliveryLeadCandidate[];
  safetyRules: string[];
}

const deliveryPath = path.join(process.cwd(), 'output', 'lead-discovery', 'delivery-candidates', 'delivery-candidates.json');
const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'verification');
const summaryPath = path.join(outputDir, 'verification-summary.md');
const checklistPath = path.join(outputDir, 'manual-approval-checklist.md');
const floraQueuePath = path.join(outputDir, 'flora_and_fauna_foods_001-verification-queue.md');
const floraMessagesPath = path.join(outputDir, 'flora_and_fauna_foods_001-verification-messages.csv');
const verificationFailuresMdPath = path.join(outputDir, 'verification-failures.md');
const verificationFailuresCsvPath = path.join(outputDir, 'verification-failures.csv');

const safetyRules = [
  'Preparation only: no messages are sent.',
  'No email, phone, DM, call, form, CRM, browser automation, scraping, or contact extraction is performed.',
  'Suggested messages require Daniel approval before any manual contact.',
  'Every candidate must be reviewed for source context, fit, and consent before delivery or outreach.',
];

export function prepareInterestVerification(now = new Date()): VerificationBatch {
  const generatedAt = now.toISOString();
  const deliveryBatch = readDeliveryCandidates();
  const queueItems = deliveryBatch.deliveryCandidates
    .filter(isVerificationCandidate)
    .sort(compareVerificationPriority)
    .map((candidate, index) => toVerificationItem(candidate, index + 1));
  const failureItems = deliveryBatch.deliveryCandidates
    .filter((candidate) => candidate.clientId === 'flora_and_fauna_foods_001')
    .filter((candidate) => !isVerificationCandidate(candidate))
    .map((candidate, index) => toFailureItem(candidate, index + 1));

  const batch: VerificationBatch = {
    generatedAt,
    totalDeliveryCandidates: deliveryBatch.deliveryCandidates.length,
    totalVerificationCandidates: queueItems.length,
    queueItems,
    failureItems,
    safetyRules,
  };

  const floraItems = queueItems.filter((item) => item.clientId === 'flora_and_fauna_foods_001');

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(summaryPath, renderSummary(batch), 'utf8');
  fs.writeFileSync(checklistPath, renderApprovalChecklist(batch), 'utf8');
  fs.writeFileSync(floraQueuePath, renderFloraQueue(floraItems, generatedAt), 'utf8');
  fs.writeFileSync(floraMessagesPath, renderMessagesCsv(floraItems), 'utf8');
  fs.writeFileSync(verificationFailuresMdPath, renderVerificationFailures(failureItems, generatedAt), 'utf8');
  fs.writeFileSync(verificationFailuresCsvPath, renderVerificationFailuresCsv(failureItems), 'utf8');

  return batch;
}

function readDeliveryCandidates(): DeliveryBatch {
  if (!fs.existsSync(deliveryPath)) {
    throw new Error(`Delivery candidates not found: ${path.relative(process.cwd(), deliveryPath)}. Run npm run leads:quality first.`);
  }
  return JSON.parse(fs.readFileSync(deliveryPath, 'utf8')) as DeliveryBatch;
}

function isVerificationCandidate(candidate: DeliveryLeadCandidate): boolean {
  return (
    candidate.clientId === 'flora_and_fauna_foods_001'
    && !candidate.excluded
    && candidate.buyerType === 'buyer'
    && (candidate.intentStrength === 'strong' || hasStrongBuyerIntentSignal(candidate))
    && candidate.sourceQuality !== 'low'
    && candidate.overallScore >= 8.2
    && hasActualFloraServiceSignal(candidate)
    && hasActualFloraLocationSignal(candidate)
    && !hasStrictExclusionSignal(candidate)
  );
}

function hasActualFloraServiceSignal(candidate: DeliveryLeadCandidate): boolean {
  const text = normalizedResultText(candidate);
  return /\b(catering|caterer|caterers|food service|bar service|rentals?|private dinner|charity event|wedding|corporate event)\b/.test(text);
}

function hasActualFloraLocationSignal(candidate: DeliveryLeadCandidate): boolean {
  const text = normalizedResultText(candidate);
  return /\b(new york|nyc|brooklyn|manhattan|queens|bronx|staten island|new jersey|pennsylvania|tri state|ny|nj|pa)\b/.test(text);
}

function normalizedResultText(candidate: DeliveryLeadCandidate): string {
  return `${candidate.title} ${candidate.snippet} ${candidate.estimatedLeadType} ${candidate.estimatedEventType} ${candidate.estimatedLocation} ${candidate.url}`.toLowerCase().replace(/[^a-z0-9]+/g, ' ');
}

function hasStrongBuyerIntentSignal(candidate: DeliveryLeadCandidate): boolean {
  const text = normalizedResultText(candidate);
  return [
    'need catering',
    'looking for catering',
    'wedding catering',
    'planning corporate event',
    'anyone know a caterer',
    'need food service',
    'need bar service',
    'private dinner catering',
    'charity event catering',
  ].some((signal) => text.includes(signal));
}

function hasStrictExclusionSignal(candidate: DeliveryLeadCandidate): boolean {
  const text = normalizedResultText(candidate);
  return (
    candidate.exclusionReason === 'competitor_or_vendor'
    || candidate.exclusionReason === 'directory_listing'
    || candidate.exclusionSignals.length > 0
    || /\b(vendor directory|directory listing|vendor profile|catering company|catering companies|caterer profile|marketplace|weddingwire|the knot|zola|eventective caterers)\b/.test(text)
  );
}

function toVerificationItem(candidate: DeliveryLeadCandidate, index: number): VerificationQueueItem {
  return {
    id: `verification-${String(index).padStart(4, '0')}`,
    clientId: candidate.clientId,
    clientName: candidate.clientName,
    vertical: candidate.vertical,
    url: candidate.url,
    title: candidate.title,
    snippet: candidate.snippet,
    query: candidate.query,
    queryTemplateId: candidate.queryTemplateId,
    estimatedLeadType: candidate.estimatedLeadType,
    estimatedLocation: candidate.estimatedLocation,
    estimatedRecencyDays: candidate.estimatedRecencyDays,
    estimatedBudgetSignal: candidate.estimatedBudgetSignal,
    sourceQuality: candidate.sourceQuality,
    overallScore: candidate.overallScore,
    deliveryQueue: candidate.deliveryQueue,
    suggestedMessage: suggestedMessage(candidate),
    salesContext: salesContext(candidate),
    approvalStatus: 'pending_daniel_review',
    manualReviewRequired: true,
    notes: 'Prepared for interest verification only. Daniel must approve before any manual contact.',
  };
}

function toFailureItem(candidate: DeliveryLeadCandidate, index: number): VerificationFailureItem {
  return {
    id: `verification-failure-${String(index).padStart(4, '0')}`,
    clientId: candidate.clientId,
    clientName: candidate.clientName,
    title: candidate.title,
    url: candidate.url,
    query: candidate.query,
    queryTemplateId: candidate.queryTemplateId,
    overallScore: candidate.overallScore,
    buyerType: candidate.buyerType,
    intentStrength: candidate.intentStrength,
    sourceQuality: candidate.sourceQuality,
    failureReasons: failureReasonsFor(candidate),
    recommendedContactMethod: candidate.recommendedContactMethod,
    buyerEvidenceCount: candidate.buyerEvidenceCount,
    recencyEvidenceCount: candidate.recencyEvidenceCount,
    verificationReadiness: candidate.verificationReadiness,
    readinessReasons: candidate.readinessReasons,
    resultRelevance: candidate.resultRelevance,
    domainCategory: candidate.domainCategory,
    domainBlocked: candidate.domainBlocked,
    relevanceReasons: candidate.relevanceReasons,
  };
}

function failureReasonsFor(candidate: DeliveryLeadCandidate): VerificationFailureReason[] {
  const reasons = new Set<VerificationFailureReason>(candidate.verificationFailureReasons ?? []);
  if (hasStrictExclusionSignal(candidate)) reasons.add('vendor_or_directory');
  if (candidate.estimatedContactability === 'low') reasons.add('contactability_too_low');
  if (candidate.estimatedRecencyDays === null) reasons.add('unknown_recency');
  return [...reasons];
}

function suggestedMessage(candidate: DeliveryLeadCandidate): string {
  const location = candidate.estimatedLocation === 'unknown' ? 'NY/NJ/PA' : candidate.estimatedLocation;
  return `Hi, I saw you may be looking for catering support for an upcoming event in ${location}. Would you be open to receiving information from a catering team that offers food service, bar service, and rentals?`;
}

function salesContext(candidate: DeliveryLeadCandidate): string {
  return [
    `Source: ${hostFor(candidate.url)}.`,
    `Estimated lead type: ${candidate.estimatedLeadType}.`,
    `Estimated event type: ${candidate.estimatedEventType}.`,
    `Location signal: ${candidate.estimatedLocation}.`,
    `Recency: ${candidate.estimatedRecencyDays ?? 'unknown'} days.`,
    `Score: ${candidate.overallScore}.`,
    `Use a soft opt-in; do not claim confirmed interest until human-verified.`,
  ].join(' ');
}

function renderSummary(batch: VerificationBatch): string {
  const floraItems = batch.queueItems.filter((item) => item.clientId === 'flora_and_fauna_foods_001');
  return `# Interest Verification Summary

Generated: ${batch.generatedAt}

## Totals

- Total delivery candidates reviewed: ${batch.totalDeliveryCandidates}
- Total verification candidates prepared: ${batch.totalVerificationCandidates}
- Flora verification candidates: ${floraItems.length}
- Verification failures recorded: ${batch.failureItems?.length ?? 0}
- Approval status: pending Daniel review
- Warning: ${floraItems.length === 0 ? 'active verification candidates = 0; fail closed until candidate quality improves.' : 'verification candidates require Daniel review before any contact.'}

## Generated Files

- output/lead-discovery/verification/flora_and_fauna_foods_001-verification-queue.md
- output/lead-discovery/verification/flora_and_fauna_foods_001-verification-messages.csv
- output/lead-discovery/verification/manual-approval-checklist.md
- output/lead-discovery/verification/verification-failures.md
- output/lead-discovery/verification/verification-failures.csv

## Queue Counts

- Interest verification: ${floraItems.length}

## Verification Failure Reason Counts

${renderFailureReasonCounts(batch.failureItems ?? [])}

## Buyer Candidates By Client

${renderBuyerCandidateCounts()}

## Next Recommended Action

${floraItems.length > 0 ? `Manually review ${floraItems.length} Flora verification candidate(s); do not contact until approved.` : nextFailureAction(batch.failureItems ?? [])}

## Safety Rules

${batch.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function renderFloraQueue(items: VerificationQueueItem[], generatedAt: string): string {
  return `# Flora and Fauna Foods Verification Queue

Generated: ${generatedAt}

## Client Summary

- Client ID: flora_and_fauna_foods_001
- Client name: Flora and Fauna Foods
- Queue purpose: prepare human-approved interest verification
- Candidates ready for Daniel review: ${items.length}
- Manual contact only after approval.

## Verification Candidates

${items.map((item, index) => `## ${index + 1}. ${item.title}

- Verification ID: ${item.id}
- URL: ${item.url}
- Query: ${item.query ?? 'unknown'}
- Score: ${item.overallScore}
- Source quality: ${item.sourceQuality}
- Estimated lead type: ${item.estimatedLeadType}
- Estimated location: ${item.estimatedLocation}
- Estimated recency: ${item.estimatedRecencyDays ?? 'unknown'} days
- Budget signal: ${item.estimatedBudgetSignal}
- Sales context: ${item.salesContext}
- Suggested soft intro: ${item.suggestedMessage}
- Approval status: ${item.approvalStatus}`).join('\n\n') || '- No verification candidates available.'}

## Manual Review Disclaimer

This queue is preparation only. No outreach, email, DM, call, form submission, contact extraction, scraping, or browser automation was performed. Daniel must approve each item before any manual contact.
`;
}

function renderVerificationFailures(items: VerificationFailureItem[], generatedAt: string): string {
  return `# Verification Failures

Generated: ${generatedAt}

## Summary

- Flora candidates failed verification: ${items.length}
- Purpose: explain why candidates did not enter the human-approved verification queue.
- No outreach, contact extraction, scraping, calls, emails, DMs, or forms were performed.

## Failure Reason Counts

${renderFailureReasonCounts(items)}

## Failed Candidates

${items.map((item, index) => `## ${index + 1}. ${item.title}

- Client: ${item.clientName} (${item.clientId})
- URL: ${item.url}
- Query: ${item.query}
- Template: ${item.queryTemplateId ?? 'none'}
- Score: ${item.overallScore}
- Buyer type: ${item.buyerType}
- Intent strength: ${item.intentStrength}
- Source quality: ${item.sourceQuality}
- Recommended contact method: ${item.recommendedContactMethod}
- Buyer evidence count: ${item.buyerEvidenceCount}
- Recency evidence count: ${item.recencyEvidenceCount}
- Verification readiness: ${item.verificationReadiness}
- Readiness reasons: ${item.readinessReasons.join('; ') || 'none'}
- Result relevance: ${item.resultRelevance}
- Domain category: ${item.domainCategory}
- Domain blocked: ${item.domainBlocked ? 'yes' : 'no'}
- Relevance reasons: ${item.relevanceReasons.join('; ') || 'none'}
- Failure reasons: ${item.failureReasons.join(', ') || 'standard manual review required'}`).join('\n\n') || '- No verification failures.'}
`;
}

function renderVerificationFailuresCsv(items: VerificationFailureItem[]): string {
  const headers = [
    'client_id',
    'client_name',
    'title',
    'url',
    'query',
    'query_template_id',
    'overall_score',
    'buyer_type',
    'intent_strength',
    'source_quality',
    'recommended_contact_method',
    'buyer_evidence_count',
    'recency_evidence_count',
    'verification_readiness',
    'readiness_reasons',
    'result_relevance',
    'domain_category',
    'domain_blocked',
    'relevance_reasons',
    'failure_reasons',
  ];
  const rows = items.map((item) => [
    item.clientId,
    item.clientName,
    item.title,
    item.url,
    item.query,
    item.queryTemplateId ?? '',
    item.overallScore.toFixed(1),
    item.buyerType,
    item.intentStrength,
    item.sourceQuality,
    item.recommendedContactMethod,
    String(item.buyerEvidenceCount),
    String(item.recencyEvidenceCount),
    item.verificationReadiness,
    item.readinessReasons.join('|'),
    item.resultRelevance,
    item.domainCategory,
    item.domainBlocked ? 'true' : 'false',
    item.relevanceReasons.join('|'),
    item.failureReasons.join('|'),
  ]);
  return `${headers.map(csvCell).join(',')}\n${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function renderFailureReasonCounts(items: VerificationFailureItem[]): string {
  const counts = items.flatMap((item) => item.failureReasons).reduce<Record<string, number>>((acc, reason) => {
    acc[reason] = (acc[reason] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([reason, count]) => `- ${reason}: ${count}`)
    .join('\n') || '- No failure reasons recorded.';
}

function renderBuyerCandidateCounts(): string {
  const deliveryBatch = readDeliveryCandidates();
  const rows = Object.entries(deliveryBatch.deliveryCandidates.reduce<Record<string, number>>((acc, candidate) => {
    if (candidate.buyerType === 'buyer' && !candidate.excluded) acc[candidate.clientName] = (acc[candidate.clientName] ?? 0) + 1;
    return acc;
  }, {})).sort((left, right) => left[0].localeCompare(right[0]));
  return rows.map(([clientName, count]) => `- ${clientName}: ${count}`).join('\n') || '- No buyer candidates.';
}

function nextFailureAction(items: VerificationFailureItem[]): string {
  const topReason = Object.entries(items.flatMap((item) => item.failureReasons).reduce<Record<string, number>>((acc, reason) => {
    acc[reason] = (acc[reason] ?? 0) + 1;
    return acc;
  }, {})).sort((left, right) => right[1] - left[1])[0]?.[0];
  return topReason
    ? `No Flora verification candidates. Tune or replace sources/queries failing most on ${topReason}.`
    : 'No Flora verification candidates. Review search material before spending more search budget.';
}

function renderMessagesCsv(items: VerificationQueueItem[]): string {
  const headers = [
    'verification_id',
    'client_id',
    'client_name',
    'source_url',
    'title',
    'estimated_lead_type',
    'estimated_location',
    'overall_score',
    'source_quality',
    'approval_status',
    'suggested_message',
    'sales_context',
  ];
  const rows = items.map((item) => [
    item.id,
    item.clientId,
    item.clientName,
    item.url,
    item.title,
    item.estimatedLeadType,
    item.estimatedLocation,
    item.overallScore.toFixed(1),
    item.sourceQuality,
    item.approvalStatus,
    item.suggestedMessage,
    item.salesContext,
  ]);
  return `${headers.map(csvCell).join(',')}\n${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function renderApprovalChecklist(batch: VerificationBatch): string {
  return `# Manual Approval Checklist

Generated: ${batch.generatedAt}

Before any manual contact, Daniel must verify:

- Source page context matches a real public business/event/travel context.
- Candidate is relevant to Flora and Fauna Foods.
- Location is in NY, NJ, PA, NYC, or the Tri-State Area.
- Suggested message is accurate and does not overstate interest.
- No email, phone, private profile, or sensitive personal data is used.
- No automated outreach, DMs, calls, or forms are triggered.
- Candidate is approved, edited, or rejected manually.

## Approval Workflow

1. Open the verification queue.
2. Review source URL and snippet.
3. Edit the suggested message if needed.
4. Mark approval decision outside the automated system.
5. Contact manually only after approval.

No automatic messaging is authorized by this artifact.
`;
}

function compareVerificationPriority(left: DeliveryLeadCandidate, right: DeliveryLeadCandidate): number {
  if (left.clientId === 'flora_and_fauna_foods_001' && right.clientId !== 'flora_and_fauna_foods_001') return -1;
  if (right.clientId === 'flora_and_fauna_foods_001' && left.clientId !== 'flora_and_fauna_foods_001') return 1;
  return right.overallScore - left.overallScore || left.title.localeCompare(right.title);
}

function hostFor(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function main(): void {
  try {
    const batch = prepareInterestVerification();
    console.log(`Verification prep generated: ${[
      path.relative(process.cwd(), summaryPath),
      path.relative(process.cwd(), floraQueuePath),
      path.relative(process.cwd(), floraMessagesPath),
      path.relative(process.cwd(), checklistPath),
      path.relative(process.cwd(), verificationFailuresMdPath),
      path.relative(process.cwd(), verificationFailuresCsvPath),
    ].join(', ')}`);
    console.log(`Verification candidates prepared: ${batch.totalVerificationCandidates}`);
    console.log('Preparation only. No outreach, contact extraction, scraping, browser automation, email, DM, calls, or forms were performed.');
  } catch (error) {
    console.error('Interest Verification Preparation: FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) main();
