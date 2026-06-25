import fs = require('fs');
import path = require('path');
import { buildCandidateEvidence } from './buildCandidateEvidence';
import { classifyBuyerIntent } from './classifyBuyerIntent';
import { evaluateResultRelevance } from './evaluateResultRelevance';
import { LeadDiscoveryClientConfig } from './clientTypes';
import { DeliveryLeadCandidate, DeliveryQueue, SourceQuality } from './deliveryLeadTypes';
import { EnrichedLeadCandidate } from './enrichedLeadTypes';
import { ResultRelevance } from './relevanceTypes';
import { VerificationFailureReason } from './verificationTypes';

interface EnrichedLeadBatch {
  generatedAt: string;
  totalCandidates: number;
  enrichedCandidates: EnrichedLeadCandidate[];
  safetyRules: string[];
}

interface DeliveryBatch {
  generatedAt: string;
  sourceCandidates: number;
  deliveryCandidates: DeliveryLeadCandidate[];
  safetyRules: string[];
}

const clientsDir = path.join(process.cwd(), 'data', 'lead-discovery', 'clients');
const enrichedPath = path.join(process.cwd(), 'output', 'lead-discovery', 'enriched-leads', 'enriched-leads.json');
const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'delivery-candidates');
const deliveryPath = path.join(outputDir, 'delivery-candidates.json');
const summaryPath = path.join(outputDir, 'delivery-summary.md');
const reviewPath = path.join(outputDir, 'review-needed.md');
const readinessSummaryPath = path.join(outputDir, 'readiness-summary.md');
const relevanceSummaryPath = path.join(outputDir, 'relevance-summary.md');

const safetyRules = [
  'Deterministic local quality rules only: enriched candidate fields are used.',
  'No network requests, page visits, scraping, browser automation, AI calls, contact extraction, or outreach are performed.',
  'Excluded candidates remain in the JSON for auditability but are not delivery-ready.',
  'Human review is required before delivery, contact, or client-facing use.',
];

export function generateDeliveryCandidates(now = new Date()): DeliveryBatch {
  const generatedAt = now.toISOString();
  const clients = readActiveClients().sort(compareClientPriority);
  const clientById = new Map(clients.map((client) => [client.clientId, client]));
  const enrichedBatch = readEnrichedLeads();
  const candidates = enrichedBatch.enrichedCandidates
    .filter((candidate) => clientById.has(candidate.clientId))
    .map((candidate, index) => toDeliveryCandidate(candidate, clientById.get(candidate.clientId)!, index + 1));
  applyDuplicateFlags(candidates);
  const sorted = candidates.sort(compareDeliveryPriority);

  const batch: DeliveryBatch = {
    generatedAt,
    sourceCandidates: enrichedBatch.enrichedCandidates.length,
    deliveryCandidates: sorted,
    safetyRules,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(deliveryPath, `${JSON.stringify(batch, null, 2)}\n`, 'utf8');
  fs.writeFileSync(summaryPath, renderSummary(batch, clients), 'utf8');
  fs.writeFileSync(reviewPath, renderReviewNeeded(batch), 'utf8');
  fs.writeFileSync(readinessSummaryPath, renderReadinessSummary(batch), 'utf8');
  fs.writeFileSync(relevanceSummaryPath, renderRelevanceSummary(batch), 'utf8');
  for (const client of clients) {
    fs.writeFileSync(
      path.join(outputDir, `${client.clientId}-delivery.md`),
      renderClientDelivery(client, batch, generatedAt),
      'utf8',
    );
  }

  return batch;
}

function toDeliveryCandidate(
  candidate: EnrichedLeadCandidate,
  client: LeadDiscoveryClientConfig,
  index: number,
): DeliveryLeadCandidate {
  const sourceQuality = sourceQualityFor(candidate);
  const recency = recencyAdjustment(candidate.estimatedRecencyDays);
  const priorityBoost = client.vertical === 'travel_leads' ? costaBoost(candidate) : floraBoost(candidate);
  const buyerIntent = classifyBuyerIntent(candidate);
  const relevance = evaluateResultRelevance({
    clientId: candidate.clientId,
    sourceUrl: candidate.url,
    sourceName: candidate.sourceName,
    sourceCategory: candidate.sourceCategory,
    title: candidate.title,
    snippet: candidate.snippet,
  });
  const evidence = buildCandidateEvidence({
    sourceUrl: candidate.url,
    sourceName: candidate.sourceName,
    sourceCategory: candidate.sourceCategory,
    title: candidate.title,
    snippet: candidate.snippet,
    query: candidate.query,
    buyerType: buyerIntent.buyerType,
    intentSignals: buyerIntent.intentSignals,
    sourceQuality,
    estimatedRecencyDays: candidate.estimatedRecencyDays,
  });
  const intentBoost = buyerIntent.intentStrength === 'strong' ? 0.8 : buyerIntent.intentStrength === 'medium' ? 0.3 : 0;
  const sourceAdjustment = sourceQuality === 'high' ? 0.5 : sourceQuality === 'medium' ? 0 : -1.2;
  const adjustedScore = clampScore(candidate.overallScore + recency.scoreAdjustment + sourceAdjustment + priorityBoost + intentBoost);
  const exclusionReason = exclusionReasonFor(
    buyerIntent.buyerType,
    buyerIntent.competitorDetected,
    recency.exclude,
    relevance.resultRelevance,
    relevance.domainBlocked,
    evidence.buyerEvidenceCount,
  );
  const excluded = exclusionReason !== null;
  const deliveryQueue = deliveryQueueFor(adjustedScore, candidate, sourceQuality, excluded, buyerIntent.buyerType, buyerIntent.intentStrength);
  const reasons = [
    ...candidate.reasons,
    `Source quality: ${sourceQuality}.`,
    `Buyer type: ${buyerIntent.buyerType}.`,
    `Intent strength: ${buyerIntent.intentStrength}.`,
    buyerIntent.intentSignals.length > 0 ? `Intent signals: ${buyerIntent.intentSignals.join(', ')}.` : 'Intent signals: none.',
    buyerIntent.exclusionSignals.length > 0 ? `Exclusion signals: ${buyerIntent.exclusionSignals.join(', ')}.` : 'Exclusion signals: none.',
    `Recency quality: ${recency.reason}.`,
    priorityBoost > 0 ? `Client priority boost: ${priorityBoost.toFixed(1)}.` : 'Client priority boost: none.',
    intentBoost > 0 ? `Buyer intent boost: ${intentBoost.toFixed(1)}.` : 'Buyer intent boost: none.',
  ];

  return {
    id: `delivery-lead-${String(index).padStart(5, '0')}`,
    clientId: candidate.clientId,
    clientName: candidate.clientName,
    vertical: candidate.vertical,
    sourceName: candidate.sourceName,
    sourceCategory: candidate.sourceCategory,
    query: candidate.query,
    queryTemplateId: candidate.queryTemplateId,
    queryTemplateType: candidate.queryTemplateType,
    expectedSourceTypes: candidate.expectedSourceTypes,
    sourceQueryPriority: candidate.sourceQueryPriority,
    expectedLeadQuality: candidate.expectedLeadQuality,
    behaviorCategory: candidate.behaviorCategory,
    behaviorSignals: candidate.behaviorSignals,
    behaviorScore: candidate.behaviorScore,
    behaviorConfidence: candidate.behaviorConfidence,
    behaviorReasons: candidate.behaviorReasons,
    buyerSignals: candidate.buyerSignals,
    buyerSignalCount: candidate.buyerSignalCount,
    buyerSignalCategories: candidate.buyerSignalCategories,
    buyerSignalStrength: candidate.buyerSignalStrength,
    url: candidate.url,
    title: candidate.title,
    snippet: candidate.snippet,
    discoveredAt: candidate.discoveredAt,
    estimatedLeadType: candidate.estimatedLeadType,
    estimatedLocation: candidate.estimatedLocation,
    estimatedRecencyDays: candidate.estimatedRecencyDays,
    estimatedBudgetSignal: candidate.estimatedBudgetSignal,
    estimatedEventType: candidate.estimatedEventType,
    estimatedTripType: candidate.estimatedTripType,
    estimatedContactability: candidate.estimatedContactability,
    sourceQuality,
    buyerType: buyerIntent.buyerType,
    intentStrength: buyerIntent.intentStrength,
    intentSignals: buyerIntent.intentSignals,
    exclusionSignals: buyerIntent.exclusionSignals,
    competitorDetected: buyerIntent.competitorDetected,
    leadTier: candidate.leadTier,
    overallScore: adjustedScore,
    deliveryQueue,
    duplicateGroupId: duplicateKey(candidate),
    duplicateReason: null,
    excluded,
    exclusionReason,
    verificationFailureReasons: verificationFailureReasonsFor({
      candidate,
      buyerType: buyerIntent.buyerType,
      intentStrength: buyerIntent.intentStrength,
      intentSignals: buyerIntent.intentSignals,
      sourceQuality,
      score: adjustedScore,
      excluded,
      exclusionReason,
    }),
    manualReviewRequired: true,
    reasons,
    notes: 'Quality-screened delivery candidate. No network request, scraping, contact extraction, outreach, DM, call, or form submission was performed.',
    leadLikeClassification: candidate.leadLikeClassification,
    leadLikeReasons: candidate.leadLikeReasons,
    leadLikeScore: candidate.leadLikeScore,
    leadLikeConfidence: candidate.leadLikeConfidence,
    leadLikeSignals: candidate.leadLikeSignals,
    ...evidence,
    ...relevance,
  };
}

function applyDuplicateFlags(candidates: DeliveryLeadCandidate[]): void {
  const groups = candidates.reduce<Record<string, DeliveryLeadCandidate[]>>((acc, candidate) => {
    acc[candidate.duplicateGroupId] = acc[candidate.duplicateGroupId] ?? [];
    acc[candidate.duplicateGroupId].push(candidate);
    return acc;
  }, {});

  for (const group of Object.values(groups)) {
    if (group.length <= 1) continue;
    const sorted = [...group].sort((left, right) => right.overallScore - left.overallScore || left.title.localeCompare(right.title));
    const keeper = sorted[0];
    for (const duplicate of sorted.slice(1)) {
      duplicate.excluded = true;
      duplicate.exclusionReason = duplicate.exclusionReason ?? 'duplicate';
      duplicate.duplicateReason = `Duplicate of ${keeper.id}: same normalized URL/title/snippet, lead type, and location.`;
      duplicate.reasons.push(duplicate.duplicateReason);
    }
  }
}

function readActiveClients(): LeadDiscoveryClientConfig[] {
  if (!fs.existsSync(clientsDir)) return [];
  return fs.readdirSync(clientsDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .filter((fileName) => !fileName.endsWith('.sample.json'))
    .sort()
    .map((fileName) => JSON.parse(fs.readFileSync(path.join(clientsDir, fileName), 'utf8')) as LeadDiscoveryClientConfig)
    .filter((client) => client.status === 'active');
}

function readEnrichedLeads(): EnrichedLeadBatch {
  if (!fs.existsSync(enrichedPath)) {
    throw new Error(`Enriched leads not found: ${path.relative(process.cwd(), enrichedPath)}. Run npm run leads:enrich first.`);
  }
  return JSON.parse(fs.readFileSync(enrichedPath, 'utf8')) as EnrichedLeadBatch;
}

function renderSummary(batch: DeliveryBatch, clients: LeadDiscoveryClientConfig[]): string {
  const active = activeCandidates(batch.deliveryCandidates);
  return `# Delivery Candidate Summary

Generated: ${batch.generatedAt}

## Client Priority

${clients.map((client, index) => `${index + 1}. ${client.clientName} (${client.clientId}) - ${client.vertical}`).join('\n') || '- No active clients found.'}

## Totals

- Source enriched candidates: ${batch.sourceCandidates}
- Total quality-screened candidates: ${batch.deliveryCandidates.length}
- Active delivery candidates: ${active.length}
- Excluded duplicates: ${countExcluded(batch.deliveryCandidates, 'duplicate')}
- Excluded stale leads: ${countExcluded(batch.deliveryCandidates, 'stale_recency')}
- Buyer candidates: ${batch.deliveryCandidates.filter((candidate) => candidate.buyerType === 'buyer' && !candidate.excluded).length}
- Lead-like candidates: ${batch.deliveryCandidates.filter((candidate) => candidate.leadLikeClassification === 'lead_like').length}
- Possibly lead-like candidates: ${batch.deliveryCandidates.filter((candidate) => candidate.leadLikeClassification === 'possibly_lead_like').length}
- Vendor exclusions: ${countExcluded(batch.deliveryCandidates, 'competitor_or_vendor')}
- Directory exclusions: ${countExcluded(batch.deliveryCandidates, 'directory_listing')}
- Average active score: ${averageScore(active).toFixed(1)}

## Buyer Candidates By Client

${renderBuyerCandidateCounts(batch.deliveryCandidates, clients)}

## Verification Failure Reasons

${renderVerificationFailureCounts(batch.deliveryCandidates)}

## Queue Counts

${renderQueueCounts(active)}

## Intent Strength Distribution

${renderIntentStrengthCounts(batch.deliveryCandidates)}

## Top Intent Signals

${renderTopValues(batch.deliveryCandidates.flatMap((candidate) => candidate.intentSignals))}

## Next Recommended Action

${nextDeliveryAction(batch.deliveryCandidates)}

## Output Files

${clients.map((client) => `- output/lead-discovery/delivery-candidates/${client.clientId}-delivery.md`).join('\n') || '- None.'}
- output/lead-discovery/delivery-candidates/delivery-candidates.json
- output/lead-discovery/delivery-candidates/review-needed.md
- output/lead-discovery/delivery-candidates/readiness-summary.md
- output/lead-discovery/delivery-candidates/relevance-summary.md

## Safety Rules

${batch.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function renderRelevanceSummary(batch: DeliveryBatch): string {
  return `# Result Relevance Summary

Generated: ${batch.generatedAt}

## Relevance Distribution

${renderTopValues(batch.deliveryCandidates.map((candidate) => candidate.resultRelevance))}

## Exclusion Counts

- Blocked domains: ${batch.deliveryCandidates.filter((candidate) => candidate.domainBlocked).length}
- Definition pages: ${countRelevance(batch.deliveryCandidates, 'definition_page')}
- Reference pages: ${countRelevance(batch.deliveryCandidates, 'reference_page')}
- Directories: ${countRelevance(batch.deliveryCandidates, 'directory')}
- Vendor pages: ${countRelevance(batch.deliveryCandidates, 'vendor')}
- Marketplaces: ${countRelevance(batch.deliveryCandidates, 'marketplace')}
- Relevant candidates: ${countRelevance(batch.deliveryCandidates, 'relevant')}

## Top Blocked Domains

${renderTopValues(batch.deliveryCandidates.filter((candidate) => candidate.domainBlocked).map((candidate) => hostFor(candidate.url)))}

## Relevance Failures

${batch.deliveryCandidates
    .filter((candidate) => candidate.resultRelevance !== 'relevant' || candidate.domainBlocked || candidate.buyerEvidenceCount === 0)
    .slice(0, 50)
    .map((candidate, index) => `${index + 1}. ${candidate.clientName}: ${candidate.title}
   - URL: ${candidate.url}
   - Query: ${candidate.query}
   - Relevance: ${candidate.resultRelevance}; domain category: ${candidate.domainCategory}; blocked: ${candidate.domainBlocked ? 'yes' : 'no'}
   - Buyer evidence count: ${candidate.buyerEvidenceCount}
   - Reasons: ${candidate.relevanceReasons.join('; ')}`)
    .join('\n') || '- No relevance failures.'}

No pages were visited or scraped. Relevance was evaluated from existing result metadata only.
`;
}

function renderReadinessSummary(batch: DeliveryBatch): string {
  return `# Verification Readiness Summary

Generated: ${batch.generatedAt}

## Readiness Counts

${renderTopValues(batch.deliveryCandidates.map((candidate) => candidate.verificationReadiness))}

## Contact Method Distribution

${renderTopValues(batch.deliveryCandidates.map((candidate) => candidate.recommendedContactMethod))}

## Buyer Evidence Counts

${renderEvidenceCountBuckets(batch.deliveryCandidates.map((candidate) => candidate.buyerEvidenceCount))}

## Recency Evidence Counts

${renderEvidenceCountBuckets(batch.deliveryCandidates.map((candidate) => candidate.recencyEvidenceCount))}

## Ready Candidates

${batch.deliveryCandidates
    .filter((candidate) => candidate.verificationReadiness === 'ready' && !candidate.excluded)
    .slice(0, 25)
    .map((candidate, index) => `${index + 1}. ${candidate.clientName}: ${candidate.title}
   - Query: ${candidate.query}
   - Contact method: ${candidate.recommendedContactMethod}
   - Buyer evidence: ${candidate.buyerEvidenceCount}; recency evidence: ${candidate.recencyEvidenceCount}
   - Readiness reasons: ${candidate.readinessReasons.join('; ')}`)
    .join('\n') || '- No ready candidates. Review missing evidence counts before manual verification.'}

No contact details were extracted and no outreach was performed.
`;
}

function renderClientDelivery(client: LeadDiscoveryClientConfig, batch: DeliveryBatch, generatedAt: string): string {
  const all = batch.deliveryCandidates.filter((candidate) => candidate.clientId === client.clientId);
  const active = activeCandidates(all);
  return `# Delivery Candidates - ${client.clientName}

Generated: ${generatedAt}

## Client Summary

- Client ID: ${client.clientId}
- Client name: ${client.clientName}
- Vertical: ${client.vertical}
- Candidate count: ${active.length}
- Duplicates removed: ${countExcluded(all, 'duplicate')}
- Stale leads excluded: ${countExcluded(all, 'stale_recency')}
- Vendor exclusions: ${countExcluded(all, 'competitor_or_vendor')}
- Directory exclusions: ${countExcluded(all, 'directory_listing')}
- Average score: ${averageScore(active).toFixed(1)}
- Buyer candidates: ${all.filter((candidate) => candidate.buyerType === 'buyer' && !candidate.excluded).length}

## Verification Failure Reasons

${renderVerificationFailureCounts(all)}

## Queue Counts

${renderQueueCounts(active)}

## Top Sources

${renderTopValues(active.map((candidate) => hostFor(candidate.url)))}

## Top Event / Trip Types

${renderTopValues(active.map((candidate) => client.vertical === 'travel_leads' ? candidate.estimatedTripType : candidate.estimatedEventType))}

## Top 20 Delivery Candidates

${active.slice(0, 20).map((candidate, index) => `${index + 1}. [${cell(candidate.title)}](${candidate.url})
   - Score: ${candidate.overallScore}; queue: ${candidate.deliveryQueue}; source quality: ${candidate.sourceQuality}; contactability: ${candidate.estimatedContactability}
   - Buyer type: ${candidate.buyerType}; intent: ${candidate.intentStrength}; type: ${candidate.estimatedLeadType}; location: ${candidate.estimatedLocation}; recency: ${candidate.estimatedRecencyDays ?? 'unknown'} days
   - Reasons: ${candidate.reasons.map(cell).join(' ')}`).join('\n') || '- No active delivery candidates.'}

## Manual Review Disclaimer

These are delivery candidates for Daniel review only. Duplicates and stale leads were flagged locally with deterministic rules. No scraping, page crawling, browser automation, contact extraction, outreach, DMs, calls, or form submissions were performed.
`;
}

function renderReviewNeeded(batch: DeliveryBatch): string {
  const needsReview = batch.deliveryCandidates.filter((candidate) => (
    candidate.estimatedRecencyDays === null
    || candidate.overallScore < 6
    || candidate.estimatedLocation === 'unknown'
    || candidate.sourceQuality === 'low'
    || candidate.excluded
  ));

  return `# Delivery Candidate Review Needed

Generated: ${batch.generatedAt}

Review reasons include unknown recency, low confidence, weak location fit, duplicate exclusion, stale exclusion, low source quality, excluded vendors, excluded directories, and weak buyer intent.

## Review Buckets

- Excluded vendors: ${countExcluded(batch.deliveryCandidates, 'competitor_or_vendor')}
- Excluded directories: ${countExcluded(batch.deliveryCandidates, 'directory_listing')}
- Weak intent candidates: ${batch.deliveryCandidates.filter((candidate) => candidate.intentStrength === 'weak').length}

${needsReview.slice(0, 100).map((candidate, index) => `## ${index + 1}. ${candidate.title}

- Client: ${candidate.clientName}
- URL: ${candidate.url}
- Score: ${candidate.overallScore}
- Queue: ${candidate.deliveryQueue}
- Buyer type: ${candidate.buyerType}
- Intent strength: ${candidate.intentStrength}
- Intent signals: ${candidate.intentSignals.join(', ') || 'none'}
- Exclusion signals: ${candidate.exclusionSignals.join(', ') || 'none'}
- Query: ${candidate.query}
- Source quality: ${candidate.sourceQuality}
- Recency: ${candidate.estimatedRecencyDays ?? 'unknown'} days
- Location: ${candidate.estimatedLocation}
- Excluded: ${candidate.excluded ? 'yes' : 'no'}
- Exclusion reason: ${candidate.exclusionReason ?? 'none'}
- Manual review reasons: ${reviewReasons(candidate).join('; ')}`).join('\n\n') || '- No candidates require extra review beyond standard manual approval.'}

No outreach, contact extraction, scraping, browser automation, calls, DMs, or form submissions were performed.
`;
}

function sourceQualityFor(candidate: EnrichedLeadCandidate): SourceQuality {
  const host = hostFor(candidate.url).toLowerCase();
  const source = `${candidate.sourceName} ${candidate.sourceCategory}`.toLowerCase();
  if (!hasActualClientSignal(candidate)) return 'low';
  if (/\b(wikipedia|dictionary|thesaurus|wordreference|cambridge|merriam|wiktionary|vocabulary|grammarlearns|usdictionary|microsoft|poki)\b/.test(host)) return 'low';
  if (/\b(eventective|tripadvisor|yelp|theknot|weddingwire|zola)\b/.test(host)) return 'high';
  if (/\b(reddit|facebook|forum|community|public_forum|public_social)\b/.test(`${host} ${source}`)) return 'medium';
  if (/\b(public_directory|public_event_board|public_business_listing|event platform|business listing|directory)\b/.test(source)) return 'medium';
  return 'low';
}

function hasActualClientSignal(candidate: EnrichedLeadCandidate): boolean {
  const text = normalize(`${candidate.title} ${candidate.snippet} ${candidate.url}`);
  const terms = candidate.vertical === 'travel_leads'
    ? ['costa rica', 'tamarindo', 'uvita', 'travel', 'trip', 'surf trip', 'retreat', 'honeymoon', 'villa', 'itinerary', 'wellness', 'tour']
    : ['catering', 'caterer', 'wedding', 'event', 'bar service', 'rentals', 'food service', 'new york', 'new jersey', 'pennsylvania', 'nyc'];
  return terms.some((term) => text.includes(normalize(term)));
}

function recencyAdjustment(days: number | null): { scoreAdjustment: number; exclude: boolean; reason: string } {
  if (days === null) return { scoreAdjustment: -0.4, exclude: false, reason: 'unknown recency; kept for manual review' };
  if (days <= 30) return { scoreAdjustment: 0.5, exclude: false, reason: 'preferred recency <= 30 days' };
  if (days <= 60) return { scoreAdjustment: -0.5, exclude: false, reason: 'allowed recency 31-60 days' };
  if (days <= 90) return { scoreAdjustment: -1.5, exclude: false, reason: 'heavily penalized recency 61-90 days' };
  return { scoreAdjustment: -3, exclude: true, reason: 'excluded stale recency > 90 days' };
}

function deliveryQueueFor(
  score: number,
  candidate: EnrichedLeadCandidate,
  sourceQuality: SourceQuality,
  excluded: boolean,
  buyerType: string,
  intentStrength: string,
): DeliveryQueue {
  if (
    candidate.clientId === 'flora_and_fauna_foods_001'
    && floraVerificationEligible({
      candidate,
      score,
      sourceQuality,
      excluded,
      buyerType,
      intentStrength,
    })
  ) {
    return 'interest_verification';
  }
  if (
    !excluded
    && score >= 9
    && buyerType === 'buyer'
    && intentStrength === 'strong'
    && candidate.estimatedRecencyDays !== null
    && candidate.estimatedRecencyDays <= 30
    && (candidate.estimatedContactability === 'medium' || candidate.estimatedContactability === 'high')
    && (sourceQuality === 'medium' || sourceQuality === 'high')
  ) {
    return 'interest_verification';
  }
  if (sourceQuality === 'low') return 'qualified_cold';
  if (!excluded && score >= 8 && buyerType === 'buyer') return 'warm_intent';
  return 'qualified_cold';
}

function floraVerificationEligible(input: {
  candidate: EnrichedLeadCandidate;
  score: number;
  sourceQuality: SourceQuality;
  excluded: boolean;
  buyerType: string;
  intentStrength: string;
}): boolean {
  return (
    !input.excluded
    && input.buyerType === 'buyer'
    && (input.intentStrength === 'strong' || hasStrongFloraIntentSignal(input.candidate))
    && hasFloraLocationSignal(input.candidate)
    && (input.sourceQuality === 'medium' || input.sourceQuality === 'high')
    && input.score >= 8.2
    && hasActualFloraServiceSignal(input.candidate)
  );
}

function exclusionReasonFor(
  buyerType: string,
  competitorDetected: boolean,
  stale: boolean,
  resultRelevance: ResultRelevance,
  domainBlocked: boolean,
  buyerEvidenceCount: number,
): string | null {
  if (domainBlocked) return 'blocked_domain';
  if (resultRelevance !== 'relevant') return `result_${resultRelevance}`;
  if (buyerEvidenceCount === 0) return 'missing_result_buyer_evidence';
  if (buyerType === 'directory') return 'directory_listing';
  if (buyerType === 'vendor' || competitorDetected) return 'competitor_or_vendor';
  if (buyerType !== 'buyer') return 'weak_or_unknown_buyer_intent';
  if (stale) return 'stale_recency';
  return null;
}

function floraBoost(candidate: EnrichedLeadCandidate): number {
  return boostFor(candidate, ['wedding', 'corporate', 'catering', 'food service', 'bar service', 'rentals', 'new york', 'new jersey', 'pennsylvania', 'tri-state', 'ny', 'nj', 'pa']);
}

function costaBoost(candidate: EnrichedLeadCandidate): number {
  return boostFor(candidate, ['family', 'group', 'corporate retreat', 'luxury', 'wellness', 'surf', 'honeymoon', 'tamarindo', 'uvita', 'costa rica', 'villa', 'private chef', '30']);
}

function boostFor(candidate: EnrichedLeadCandidate, terms: string[]): number {
  const text = normalize(`${candidate.estimatedLeadType} ${candidate.estimatedLocation} ${candidate.estimatedBudgetSignal} ${candidate.estimatedEventType} ${candidate.estimatedTripType} ${candidate.title} ${candidate.snippet}`);
  const matches = terms.filter((term) => text.includes(normalize(term))).length;
  return Math.min(1.2, matches * 0.2);
}

function duplicateKey(candidate: EnrichedLeadCandidate): string {
  const url = normalizeUrl(candidate.url);
  if (url !== 'unknown') return `${candidate.clientId}|url|${url}`;
  const title = normalize(candidate.title).slice(0, 80);
  const snippet = normalize(candidate.snippet).slice(0, 80);
  const type = normalize(candidate.estimatedLeadType);
  const location = normalize(candidate.estimatedLocation);
  return `${candidate.clientId}|text|${title}|${snippet}|${type}|${location}`;
}

function reviewReasons(candidate: DeliveryLeadCandidate): string[] {
  const reasons: string[] = [];
  if (candidate.buyerType !== 'buyer') reasons.push(`buyer type ${candidate.buyerType}`);
  if (candidate.intentStrength === 'weak') reasons.push('weak buyer intent');
  if (candidate.estimatedRecencyDays === null) reasons.push('unknown recency');
  if (candidate.overallScore < 6) reasons.push('low confidence score');
  if (candidate.estimatedLocation === 'unknown') reasons.push('weak location fit');
  if (candidate.sourceQuality === 'low') reasons.push('low source quality');
  if (candidate.excluded && candidate.exclusionReason) reasons.push(candidate.exclusionReason);
  return reasons.length > 0 ? reasons : ['standard manual review required'];
}

function verificationFailureReasonsFor(input: {
  candidate: EnrichedLeadCandidate;
  buyerType: string;
  intentStrength: string;
  intentSignals: string[];
  sourceQuality: SourceQuality;
  score: number;
  excluded: boolean;
  exclusionReason: string | null;
}): VerificationFailureReason[] {
  if (input.candidate.clientId !== 'flora_and_fauna_foods_001') return [];
  const reasons: VerificationFailureReason[] = [];
  if (input.buyerType !== 'buyer') reasons.push('not_buyer');
  if (input.intentStrength !== 'strong' && !hasStrongFloraIntentSignal(input.candidate, input.intentSignals)) reasons.push('weak_intent');
  if (!hasFloraLocationSignal(input.candidate)) reasons.push('location_mismatch');
  if (input.score < 8.2) reasons.push('low_score');
  if (input.sourceQuality === 'low') reasons.push('low_source_quality');
  if (input.candidate.estimatedRecencyDays === null) reasons.push('unknown_recency');
  if (input.exclusionReason === 'competitor_or_vendor' || input.exclusionReason === 'directory_listing') reasons.push('vendor_or_directory');
  if (!hasActualFloraServiceSignal(input.candidate)) reasons.push('missing_event_signal');
  if (input.candidate.estimatedContactability === 'low') reasons.push('contactability_too_low');
  return reasons;
}

function hasStrongFloraIntentSignal(candidate: EnrichedLeadCandidate, intentSignals: string[] = []): boolean {
  const text = normalize(`${candidate.query} ${candidate.title} ${candidate.snippet} ${candidate.estimatedLeadType} ${candidate.estimatedEventType} ${intentSignals.join(' ')}`);
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
  ].some((signal) => text.includes(normalize(signal)));
}

function hasActualFloraServiceSignal(candidate: EnrichedLeadCandidate): boolean {
  const text = normalize(`${candidate.query} ${candidate.title} ${candidate.snippet} ${candidate.estimatedLeadType} ${candidate.estimatedEventType}`);
  return /\b(catering|caterer|caterers|food service|bar service|event rentals|private dinner|charity event|wedding|corporate event)\b/.test(text);
}

function hasFloraLocationSignal(candidate: EnrichedLeadCandidate): boolean {
  const text = normalize(`${candidate.query} ${candidate.title} ${candidate.snippet} ${candidate.estimatedLocation} ${candidate.url}`);
  return /\b(ny|nj|pa|nyc|new york|new jersey|pennsylvania|tri state|tri-state)\b/.test(text);
}

function compareDeliveryPriority(left: DeliveryLeadCandidate, right: DeliveryLeadCandidate): number {
  if (left.clientId === 'flora_and_fauna_foods_001' && right.clientId !== 'flora_and_fauna_foods_001') return -1;
  if (right.clientId === 'flora_and_fauna_foods_001' && left.clientId !== 'flora_and_fauna_foods_001') return 1;
  if (left.excluded !== right.excluded) return left.excluded ? 1 : -1;
  return right.overallScore - left.overallScore || left.title.localeCompare(right.title);
}

function compareClientPriority(left: LeadDiscoveryClientConfig, right: LeadDiscoveryClientConfig): number {
  if (left.clientId === 'flora_and_fauna_foods_001') return -1;
  if (right.clientId === 'flora_and_fauna_foods_001') return 1;
  return left.clientName.localeCompare(right.clientName);
}

function renderQueueCounts(candidates: DeliveryLeadCandidate[]): string {
  const queues: DeliveryQueue[] = ['qualified_cold', 'warm_intent', 'interest_verification'];
  return queues.map((queue) => `- ${queue}: ${candidates.filter((candidate) => candidate.deliveryQueue === queue).length}`).join('\n');
}

function renderBuyerCandidateCounts(candidates: DeliveryLeadCandidate[], clients: LeadDiscoveryClientConfig[]): string {
  return clients.map((client) => {
    const count = candidates.filter((candidate) => candidate.clientId === client.clientId && candidate.buyerType === 'buyer' && !candidate.excluded).length;
    return `- ${client.clientName} (${client.clientId}): ${count}`;
  }).join('\n') || '- No active clients found.';
}

function renderVerificationFailureCounts(candidates: DeliveryLeadCandidate[]): string {
  const counts = candidates
    .filter((candidate) => candidate.clientId === 'flora_and_fauna_foods_001')
    .flatMap((candidate) => candidate.verificationFailureReasons ?? [])
    .reduce<Record<string, number>>((acc, reason) => {
      acc[reason] = (acc[reason] ?? 0) + 1;
      return acc;
    }, {});
  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([reason, count]) => `- ${reason}: ${count}`)
    .join('\n') || '- No Flora verification failures recorded.';
}

function nextDeliveryAction(candidates: DeliveryLeadCandidate[]): string {
  const floraVerification = candidates.filter((candidate) => candidate.clientId === 'flora_and_fauna_foods_001' && !candidate.excluded && candidate.deliveryQueue === 'interest_verification');
  if (floraVerification.length > 0) return `Review ${floraVerification.length} Flora verification candidate(s) manually before any contact.`;
  const topReason = mostCommon(candidates
    .filter((candidate) => candidate.clientId === 'flora_and_fauna_foods_001')
    .flatMap((candidate) => candidate.verificationFailureReasons ?? []));
  return topReason
    ? `No active Flora verification candidates. Improve or replace queries failing most on ${topReason}.`
    : 'No active Flora verification candidates. Review source quality and buyer-intent signals before spending more search budget.';
}

function mostCommon(values: string[]): string | null {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
}

function renderIntentStrengthCounts(candidates: DeliveryLeadCandidate[]): string {
  const strengths = ['weak', 'medium', 'strong'];
  return strengths.map((strength) => `- ${strength}: ${candidates.filter((candidate) => candidate.intentStrength === strength).length}`).join('\n');
}

function renderTopValues(values: string[]): string {
  const rows = Object.entries(values.reduce<Record<string, number>>((counts, value) => {
    const key = value || 'unknown';
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {}))
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 10);
  return rows.map(([value, count]) => `- ${value}: ${count}`).join('\n') || '- None.';
}

function countRelevance(candidates: DeliveryLeadCandidate[], relevance: string): number {
  return candidates.filter((candidate) => candidate.resultRelevance === relevance).length;
}

function renderEvidenceCountBuckets(values: number[]): string {
  const buckets = values.reduce<Record<string, number>>((acc, value) => {
    const key = value >= 3 ? '3+' : String(value);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  return ['0', '1', '2', '3+'].map((bucket) => `- ${bucket}: ${buckets[bucket] ?? 0}`).join('\n');
}

function activeCandidates(candidates: DeliveryLeadCandidate[]): DeliveryLeadCandidate[] {
  return candidates.filter((candidate) => (
    !candidate.excluded
    && candidate.buyerType === 'buyer'
    && candidate.overallScore >= 6
    && candidate.sourceQuality !== 'low'
  ));
}

function countExcluded(candidates: DeliveryLeadCandidate[], reason: string): number {
  return candidates.filter((candidate) => candidate.excluded && candidate.exclusionReason === reason).length;
}

function averageScore(candidates: DeliveryLeadCandidate[]): number {
  if (candidates.length === 0) return 0;
  return candidates.reduce((sum, candidate) => sum + candidate.overallScore, 0) / candidates.length;
}

function normalizeUrl(value: string): string {
  try {
    const parsed = new URL(value);
    parsed.hash = '';
    parsed.search = '';
    return parsed.href.replace(/\/$/, '').toLowerCase();
  } catch {
    return 'unknown';
  }
}

function hostFor(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function cell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

function main(): void {
  try {
    const batch = generateDeliveryCandidates();
    const files = [
      path.relative(process.cwd(), summaryPath),
      path.relative(process.cwd(), deliveryPath),
      path.relative(process.cwd(), reviewPath),
      path.relative(process.cwd(), readinessSummaryPath),
      path.relative(process.cwd(), relevanceSummaryPath),
    ];
    console.log(`Delivery candidates generated: ${files.join(', ')}`);
    console.log(`Active delivery candidates: ${activeCandidates(batch.deliveryCandidates).length}`);
    console.log(`Excluded duplicates: ${countExcluded(batch.deliveryCandidates, 'duplicate')}`);
    console.log(`Excluded stale leads: ${countExcluded(batch.deliveryCandidates, 'stale_recency')}`);
    console.log('Deterministic local quality rules only. No network, scraping, browser automation, contact extraction, or outreach was performed.');
  } catch (error) {
    console.error('Lead Quality Engine: FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) main();
