import fs = require('fs');
import path = require('path');
import { DeliveryLeadCandidate } from './deliveryLeadTypes';
import { DiscoveryQuery, DiscoveryQueryBatch } from './discoveryQueryTypes';
import { LeadOutcomeRecord } from './outcomeTypes';
import { SearchCandidate, SearchCandidateBatch, SearchSourceResult } from './searchCandidateTypes';
import { QueryExecutionDiagnostic, SearchDiagnosticsBatch } from './searchDiagnosticsTypes';
import { VerificationReviewBatch, VerificationReviewQueueItem } from './verificationTypes';

interface DeliveryBatch {
  deliveryCandidates: DeliveryLeadCandidate[];
}

const deliveryPath = path.join(process.cwd(), 'output', 'lead-discovery', 'delivery-candidates', 'delivery-candidates.json');
const searchCandidatesPath = path.join(process.cwd(), 'output', 'lead-discovery', 'search-candidates', 'search-candidates.json');
const behaviorQueriesPath = path.join(process.cwd(), 'output', 'lead-discovery', 'behavior-queries', 'behavior-queries.json');
const searchDiagnosticsPath = path.join(process.cwd(), 'output', 'lead-discovery', 'diagnostics', 'search-execution-diagnostics.json');
const tavilyHealthPath = path.join(process.cwd(), 'output', 'lead-discovery', 'diagnostics', 'tavily-health.json');
const verificationSummaryPath = path.join(process.cwd(), 'output', 'lead-discovery', 'verification', 'verification-summary.md');
const verificationReviewPath = path.join(process.cwd(), 'output', 'lead-discovery', 'verification', 'review-queue.json');
const outcomesPath = path.join(process.cwd(), 'data', 'lead-discovery', 'outcomes', 'sample-outcomes.json');
const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'dashboard');
const dashboardPath = path.join(outputDir, 'client-dashboard.md');
const csvPath = path.join(outputDir, 'client-dashboard.csv');

interface DashboardRow {
  clientName: string;
  searchCandidates: number;
  leadLikeCandidates: number;
  possiblyLeadLikeCandidates: number;
  leadLikePercentage: number;
  genericPercentage: number;
  queryQualityDistribution: string;
  topPerformingQueries: string;
  topFailingQueries: string;
  providerSelected: string;
  tavilyConfigured: string;
  fallbackEnabled: string;
  providerHealth: string;
  querySuccessRate: number;
  queryFailureRate: number;
  providerFailures: number;
  providerResultCount: number;
  emptyResponseCount: number;
  rateLimitCount: number;
  blockedQueryCount: number;
  averageSearchDuration: number;
  sourceCount: number;
  sourceCategories: string;
  highPrioritySourceCount: number;
  sourceRecommendations: string;
  topPerformingSources: string;
  weakestSources: string;
  behaviorQueryCount: number;
  topBuyerBehaviors: string;
  topPainSignals: string;
  topUrgencySignals: string;
  behaviorTopPerformingQueries: string;
  behaviorWorstQueries: string;
  promotedQueries: string;
  disabledQueries: string;
  buyerSignalsDiscovered: number;
  signalStrengthDistribution: string;
  topSignalCombinations: string;
  worstSignalCombinations: string;
  promotedDynamicQueries: string;
  disabledDynamicQueries: string;
  estimatedCommercialValue: number;
  deliveryCandidates: number;
  verificationCandidates: number;
  verificationReviewCandidates: number;
  verificationReadyCandidates: number;
  verificationConfidenceDistribution: string;
  verificationPromotionReasons: string;
  conversionFunnel: string;
  averageScore: number;
  qualifiedCold: number;
  warmIntent: number;
  interestVerification: number;
  readyCount: number;
  needsReviewCount: number;
  missingContactMethodCount: number;
  missingBuyerEvidenceCount: number;
  missingRecencyCount: number;
  notReadyCount: number;
  topContactMethod: string;
  averageBuyerEvidenceCount: number;
  averageRecencyEvidenceCount: number;
  blockedDomainsCount: number;
  irrelevantPagesCount: number;
  directoriesExcluded: number;
  vendorPagesExcluded: number;
  marketplacesExcluded: number;
  relevanceDistribution: string;
  outcomeCount: number;
  estimatedValue: number;
  nextAction: string;
}

interface BehaviorQueryMetric {
  query: string;
  leadLikeTotal: number;
  candidateCount: number;
  averageBehaviorScore: number;
  recommendation: string;
}

export function generateClientDashboard(): { filesGenerated: string[]; rows: DashboardRow[] } {
  const delivery = readJson<DeliveryBatch>(deliveryPath).deliveryCandidates;
  const searchBatch = readSearchBatch();
  const behaviorQueries = readBehaviorQueries();
  const diagnostics = readSearchDiagnostics();
  const tavilyHealth = readTavilyHealth();
  const outcomes = readOutcomes();
  const verificationReview = readVerificationReview();
  const rows = ['flora_and_fauna_foods_001', 'costa_retreats_001']
    .map((clientId) => rowFor(clientId, delivery, searchBatch, behaviorQueries, diagnostics, tavilyHealth, outcomes, verificationReview.reviewItems))
    .filter((row) => row.searchCandidates > 0 || row.deliveryCandidates > 0 || row.verificationCandidates > 0 || row.outcomeCount > 0 || row.behaviorQueryCount > 0);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(dashboardPath, renderDashboard(rows), 'utf8');
  fs.writeFileSync(csvPath, renderCsv(rows), 'utf8');
  return { filesGenerated: [dashboardPath, csvPath].map((file) => path.relative(process.cwd(), file)), rows };
}

function rowFor(
  clientId: string,
  delivery: DeliveryLeadCandidate[],
  searchBatch: SearchCandidateBatch,
  behaviorQueries: DiscoveryQuery[],
  diagnostics: QueryExecutionDiagnostic[],
  tavilyHealth: { providerSelected: string; apiKeyConfigured: boolean; fallbackEnabled: boolean },
  outcomes: LeadOutcomeRecord[],
  verificationReviewItems: VerificationReviewQueueItem[],
): DashboardRow {
  const clientSearchCandidates = searchBatch.candidates.filter((candidate) => candidate.clientId === clientId);
  const queryRows = queryQualityRows(clientSearchCandidates);
  const sourceRows = sourceQualityRows(clientSearchCandidates);
  const behaviorStats = behaviorStatsFor(clientId, behaviorQueries, searchBatch, delivery);
  const signalStats = buyerSignalStatsFor(clientId, searchBatch.candidates, delivery);
  const searchHealth = searchHealthFor(clientId, diagnostics);
  const leadLikeCount = clientSearchCandidates.filter((candidate) => candidate.leadLikeClassification === 'lead_like').length;
  const possibleLeadLikeCount = clientSearchCandidates.filter((candidate) => candidate.leadLikeClassification === 'possibly_lead_like').length;
  const genericCount = clientSearchCandidates.filter((candidate) => !['lead_like', 'possibly_lead_like'].includes(candidate.leadLikeClassification)).length;
  const allClientCandidates = delivery.filter((candidate) => candidate.clientId === clientId);
  const candidates = delivery.filter((candidate) => candidate.clientId === clientId && !candidate.excluded && candidate.sourceQuality !== 'low' && candidate.overallScore >= 6);
  const clientOutcomes = outcomes.filter((outcome) => outcome.clientId === clientId);
  const clientName = candidates[0]?.clientName ?? clientSearchCandidates[0]?.clientName ?? clientOutcomes[0]?.clientName ?? clientId;
  const verificationCandidates = clientId === 'flora_and_fauna_foods_001' ? readFloraVerificationCount() : 0;
  const clientVerificationReviewItems = verificationReviewItems.filter((item) => item.clientId === clientId);
  return {
    clientName,
    searchCandidates: clientSearchCandidates.length,
    leadLikeCandidates: leadLikeCount,
    possiblyLeadLikeCandidates: possibleLeadLikeCount,
    leadLikePercentage: percentage(leadLikeCount + possibleLeadLikeCount, clientSearchCandidates.length),
    genericPercentage: percentage(genericCount, clientSearchCandidates.length),
    queryQualityDistribution: compactDistribution(queryRows.map((row) => row.recommendation)),
    topPerformingQueries: queryRows.filter((row) => row.leadLikeTotal > 0).slice(0, 3).map((row) => `${row.recommendation}:${row.leadLikePercentage.toFixed(0)}% ${row.query}`).join(' || ') || 'none',
    topFailingQueries: queryRows.filter((row) => row.recommendation === 'disable').slice(0, 3).map((row) => `${row.leadLikePercentage.toFixed(0)}% ${row.query}`).join(' || ') || 'none',
    providerSelected: tavilyHealth.providerSelected,
    tavilyConfigured: tavilyHealth.apiKeyConfigured ? 'yes' : 'no',
    fallbackEnabled: tavilyHealth.fallbackEnabled ? 'yes' : 'no',
    providerHealth: searchHealth.providerHealth,
    querySuccessRate: searchHealth.querySuccessRate,
    queryFailureRate: searchHealth.queryFailureRate,
    providerFailures: searchHealth.providerFailures,
    providerResultCount: searchHealth.providerResultCount,
    emptyResponseCount: searchHealth.emptyResponseCount,
    rateLimitCount: searchHealth.rateLimitCount,
    blockedQueryCount: searchHealth.blockedQueryCount,
    averageSearchDuration: searchHealth.averageSearchDuration,
    sourceCount: sourceRows.length,
    sourceCategories: compactDistribution(clientSearchCandidates.map((candidate) => candidate.sourceCategory)),
    highPrioritySourceCount: sourceRows.filter((row) => row.highPriority).length,
    sourceRecommendations: compactDistribution(sourceRows.map((row) => row.recommendation)),
    topPerformingSources: sourceRows.filter((row) => row.leadLikeTotal > 0).slice(0, 3).map((row) => `${row.recommendation}:${row.leadLikePercentage.toFixed(0)}% ${row.sourceId}`).join(' || ') || 'none',
    weakestSources: sourceRows.filter((row) => row.recommendation === 'disable').slice(0, 3).map((row) => `${row.leadLikePercentage.toFixed(0)}% ${row.sourceId}`).join(' || ') || 'none',
    behaviorQueryCount: behaviorStats.queryCount,
    topBuyerBehaviors: behaviorStats.topBuyerBehaviors,
    topPainSignals: behaviorStats.topPainSignals,
    topUrgencySignals: behaviorStats.topUrgencySignals,
    behaviorTopPerformingQueries: behaviorStats.topPerformingQueries,
    behaviorWorstQueries: behaviorStats.worstQueries,
    promotedQueries: behaviorStats.promotedQueries,
    disabledQueries: behaviorStats.disabledQueries,
    buyerSignalsDiscovered: signalStats.buyerSignalsDiscovered,
    signalStrengthDistribution: signalStats.signalStrengthDistribution,
    topSignalCombinations: signalStats.topSignalCombinations,
    worstSignalCombinations: signalStats.worstSignalCombinations,
    promotedDynamicQueries: signalStats.promotedDynamicQueries,
    disabledDynamicQueries: signalStats.disabledDynamicQueries,
    estimatedCommercialValue: behaviorStats.estimatedCommercialValue,
    deliveryCandidates: candidates.length,
    verificationCandidates,
    verificationReviewCandidates: clientVerificationReviewItems.filter((item) => item.verificationPromotionStatus === 'verification_review').length,
    verificationReadyCandidates: clientVerificationReviewItems.filter((item) => item.verificationPromotionStatus === 'verification_ready').length,
    verificationConfidenceDistribution: compactDistribution(clientVerificationReviewItems.map((item) => item.verificationConfidence)),
    verificationPromotionReasons: compactDistribution(clientVerificationReviewItems.flatMap((item) => item.promotionReasons)),
    conversionFunnel: `${clientSearchCandidates.length} search > ${leadLikeCount + possibleLeadLikeCount} possible > ${candidates.length} delivery > ${clientVerificationReviewItems.length} review > ${verificationCandidates} strict-ready`,
    averageScore: average(candidates.map((candidate) => candidate.overallScore)),
    qualifiedCold: candidates.filter((candidate) => candidate.deliveryQueue === 'qualified_cold').length,
    warmIntent: candidates.filter((candidate) => candidate.deliveryQueue === 'warm_intent').length,
    interestVerification: candidates.filter((candidate) => candidate.deliveryQueue === 'interest_verification').length,
    readyCount: candidates.filter((candidate) => candidate.verificationReadiness === 'ready').length,
    needsReviewCount: candidates.filter((candidate) => candidate.verificationReadiness === 'needs_review').length,
    missingContactMethodCount: candidates.filter((candidate) => candidate.verificationReadiness === 'missing_contact_method').length,
    missingBuyerEvidenceCount: candidates.filter((candidate) => candidate.verificationReadiness === 'missing_buyer_evidence').length,
    missingRecencyCount: candidates.filter((candidate) => candidate.verificationReadiness === 'missing_recency').length,
    notReadyCount: candidates.filter((candidate) => candidate.verificationReadiness === 'not_ready').length,
    topContactMethod: topValue(candidates.map((candidate) => candidate.recommendedContactMethod)),
    averageBuyerEvidenceCount: average(candidates.map((candidate) => candidate.buyerEvidenceCount)),
    averageRecencyEvidenceCount: average(candidates.map((candidate) => candidate.recencyEvidenceCount)),
    blockedDomainsCount: allClientCandidates.filter((candidate) => candidate.domainBlocked).length,
    irrelevantPagesCount: allClientCandidates.filter((candidate) => candidate.resultRelevance !== 'relevant').length,
    directoriesExcluded: allClientCandidates.filter((candidate) => candidate.resultRelevance === 'directory').length,
    vendorPagesExcluded: allClientCandidates.filter((candidate) => candidate.resultRelevance === 'vendor').length,
    marketplacesExcluded: allClientCandidates.filter((candidate) => candidate.resultRelevance === 'marketplace').length,
    relevanceDistribution: compactDistribution(allClientCandidates.map((candidate) => candidate.resultRelevance)),
    outcomeCount: clientOutcomes.length,
    estimatedValue: clientOutcomes.reduce((sum, outcome) => sum + outcome.estimatedValue, 0),
    nextAction: clientId === 'flora_and_fauna_foods_001'
      ? 'Review pilot pack, approve verification candidates, then run human-approved pilot.'
      : 'Keep as secondary config; prioritize after Flora pilot feedback.',
  };
}

function renderDashboard(rows: DashboardRow[]): string {
  return `# AI Lead Discovery Client Dashboard

Generated: ${new Date().toISOString()}

| Client | Search candidates | Lead-like | Possible | Lead-like % | Generic % | Query quality | Provider selected | Tavily configured | Fallback enabled | Provider health | Query success % | Query failure % | Provider failures | Provider results | Empty responses | Rate limits | Blocked queries | Avg search ms | Sources | High-priority sources | Source categories | Source recs | Behavior queries | Buyer behaviors | Pain signals | Urgency signals | Buyer signals | Signal strength | Top signal combos | Worst signal combos | Promoted dynamic queries | Disabled dynamic queries | Behavior top queries | Behavior worst queries | Promoted behavior queries | Disabled behavior queries | Est. commercial value | Delivery candidates | Verification review | Verification ready | Verification candidates | Confidence | Promotion reasons | Funnel | Avg score | Ready | Missing buyer evidence | Missing recency | Top contact method | Blocked domains | Irrelevant pages | Directories | Vendors | Marketplaces | Relevance distribution | Avg buyer evidence | Avg recency evidence | Outcomes | Est. value | Next action |
| --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- | ---: | --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: | --- |
${rows.map((row) => `| ${row.clientName} | ${row.searchCandidates} | ${row.leadLikeCandidates} | ${row.possiblyLeadLikeCandidates} | ${row.leadLikePercentage.toFixed(1)}% | ${row.genericPercentage.toFixed(1)}% | ${row.queryQualityDistribution} | ${row.providerSelected} | ${row.tavilyConfigured} | ${row.fallbackEnabled} | ${row.providerHealth} | ${row.querySuccessRate.toFixed(1)}% | ${row.queryFailureRate.toFixed(1)}% | ${row.providerFailures} | ${row.providerResultCount} | ${row.emptyResponseCount} | ${row.rateLimitCount} | ${row.blockedQueryCount} | ${row.averageSearchDuration.toFixed(0)} | ${row.sourceCount} | ${row.highPrioritySourceCount} | ${row.sourceCategories} | ${row.sourceRecommendations} | ${row.behaviorQueryCount} | ${row.topBuyerBehaviors} | ${row.topPainSignals} | ${row.topUrgencySignals} | ${row.buyerSignalsDiscovered} | ${row.signalStrengthDistribution} | ${row.topSignalCombinations} | ${row.worstSignalCombinations} | ${row.promotedDynamicQueries} | ${row.disabledDynamicQueries} | ${row.behaviorTopPerformingQueries} | ${row.behaviorWorstQueries} | ${row.promotedQueries} | ${row.disabledQueries} | $${row.estimatedCommercialValue.toFixed(0)} | ${row.deliveryCandidates} | ${row.verificationReviewCandidates} | ${row.verificationReadyCandidates} | ${row.verificationCandidates} | ${row.verificationConfidenceDistribution} | ${row.verificationPromotionReasons} | ${row.conversionFunnel} | ${row.averageScore.toFixed(1)} | ${row.readyCount} | ${row.missingBuyerEvidenceCount} | ${row.missingRecencyCount} | ${row.topContactMethod} | ${row.blockedDomainsCount} | ${row.irrelevantPagesCount} | ${row.directoriesExcluded} | ${row.vendorPagesExcluded} | ${row.marketplacesExcluded} | ${row.relevanceDistribution} | ${row.averageBuyerEvidenceCount.toFixed(1)} | ${row.averageRecencyEvidenceCount.toFixed(1)} | ${row.outcomeCount} | $${row.estimatedValue.toFixed(0)} | ${row.nextAction} |`).join('\n')}

## Top Performing Queries

${rows.map((row) => `- ${row.clientName}: ${row.topPerformingQueries}`).join('\n') || '- None.'}

## Top Failing Queries

${rows.map((row) => `- ${row.clientName}: ${row.topFailingQueries}`).join('\n') || '- None.'}

## Search Health

${rows.map((row) => `- ${row.clientName}: selected ${row.providerSelected}; Tavily configured ${row.tavilyConfigured}; fallback ${row.fallbackEnabled}; health ${row.providerHealth}; success ${row.querySuccessRate.toFixed(1)}%; failure ${row.queryFailureRate.toFixed(1)}%; provider failures ${row.providerFailures}; provider results ${row.providerResultCount}; empty ${row.emptyResponseCount}; rate limits ${row.rateLimitCount}; blocked ${row.blockedQueryCount}; avg ${row.averageSearchDuration.toFixed(0)}ms`).join('\n') || '- None.'}

## Top Performing Sources

${rows.map((row) => `- ${row.clientName}: ${row.topPerformingSources}`).join('\n') || '- None.'}

## Weakest Sources

${rows.map((row) => `- ${row.clientName}: ${row.weakestSources}`).join('\n') || '- None.'}

## Behavioral Buyer Intent

${rows.map((row) => `- ${row.clientName}: ${row.behaviorQueryCount} queries; top behaviors: ${row.topBuyerBehaviors}; promoted: ${row.promotedQueries}; disabled: ${row.disabledQueries}; estimated commercial value: $${row.estimatedCommercialValue.toFixed(0)}`).join('\n') || '- None.'}

## Buyer Signal Extraction

${rows.map((row) => `- ${row.clientName}: ${row.buyerSignalsDiscovered} signals; strength ${row.signalStrengthDistribution}; top combinations: ${row.topSignalCombinations}; worst combinations: ${row.worstSignalCombinations}; promoted dynamic: ${row.promotedDynamicQueries}; disabled dynamic: ${row.disabledDynamicQueries}`).join('\n') || '- None.'}

## Verification Promotion

${rows.map((row) => `- ${row.clientName}: ${row.conversionFunnel}; review ${row.verificationReviewCandidates}; ready ${row.verificationReadyCandidates}; confidence ${row.verificationConfidenceDistribution}; reasons ${row.verificationPromotionReasons}`).join('\n') || '- None.'}

Manual review required before delivery or contact. No outreach, contact extraction, scraping, emails, DMs, calls, or forms were performed.
`;
}

function renderCsv(rows: DashboardRow[]): string {
  const headers = ['client_name', 'search_candidates', 'lead_like_candidates', 'possibly_lead_like_candidates', 'lead_like_percentage', 'generic_percentage', 'query_quality_distribution', 'top_performing_queries', 'top_failing_queries', 'provider_selected', 'tavily_configured', 'fallback_enabled', 'provider_health', 'query_success_rate', 'query_failure_rate', 'provider_failures', 'provider_result_count', 'empty_response_count', 'rate_limit_count', 'blocked_query_count', 'average_search_duration', 'source_count', 'source_categories', 'high_priority_source_count', 'source_recommendations', 'top_performing_sources', 'weakest_sources', 'behavior_query_count', 'top_buyer_behaviors', 'top_pain_signals', 'top_urgency_signals', 'buyer_signals_discovered', 'signal_strength_distribution', 'top_signal_combinations', 'worst_signal_combinations', 'promoted_dynamic_queries', 'disabled_dynamic_queries', 'behavior_top_performing_queries', 'behavior_worst_queries', 'promoted_queries', 'disabled_queries', 'estimated_commercial_value', 'delivery_candidates', 'verification_review_candidates', 'verification_ready_candidates', 'verification_candidates', 'verification_confidence_distribution', 'verification_promotion_reasons', 'conversion_funnel', 'average_score', 'qualified_cold', 'warm_intent', 'interest_verification', 'ready', 'needs_review', 'missing_contact_method', 'missing_buyer_evidence', 'missing_recency', 'not_ready', 'top_contact_method', 'average_buyer_evidence_count', 'average_recency_evidence_count', 'blocked_domains', 'irrelevant_pages', 'directories_excluded', 'vendor_pages_excluded', 'marketplaces_excluded', 'relevance_distribution', 'outcome_count', 'estimated_value', 'next_action'];
  const body = rows.map((row) => [
    row.clientName,
    String(row.searchCandidates),
    String(row.leadLikeCandidates),
    String(row.possiblyLeadLikeCandidates),
    row.leadLikePercentage.toFixed(1),
    row.genericPercentage.toFixed(1),
    row.queryQualityDistribution,
    row.topPerformingQueries,
    row.topFailingQueries,
    row.providerSelected,
    row.tavilyConfigured,
    row.fallbackEnabled,
    row.providerHealth,
    row.querySuccessRate.toFixed(1),
    row.queryFailureRate.toFixed(1),
    String(row.providerFailures),
    String(row.providerResultCount),
    String(row.emptyResponseCount),
    String(row.rateLimitCount),
    String(row.blockedQueryCount),
    row.averageSearchDuration.toFixed(0),
    String(row.sourceCount),
    row.sourceCategories,
    String(row.highPrioritySourceCount),
    row.sourceRecommendations,
    row.topPerformingSources,
    row.weakestSources,
    String(row.behaviorQueryCount),
    row.topBuyerBehaviors,
    row.topPainSignals,
    row.topUrgencySignals,
    String(row.buyerSignalsDiscovered),
    row.signalStrengthDistribution,
    row.topSignalCombinations,
    row.worstSignalCombinations,
    row.promotedDynamicQueries,
    row.disabledDynamicQueries,
    row.behaviorTopPerformingQueries,
    row.behaviorWorstQueries,
    row.promotedQueries,
    row.disabledQueries,
    row.estimatedCommercialValue.toFixed(0),
    String(row.deliveryCandidates),
    String(row.verificationReviewCandidates),
    String(row.verificationReadyCandidates),
    String(row.verificationCandidates),
    row.verificationConfidenceDistribution,
    row.verificationPromotionReasons,
    row.conversionFunnel,
    row.averageScore.toFixed(1),
    String(row.qualifiedCold),
    String(row.warmIntent),
    String(row.interestVerification),
    String(row.readyCount),
    String(row.needsReviewCount),
    String(row.missingContactMethodCount),
    String(row.missingBuyerEvidenceCount),
    String(row.missingRecencyCount),
    String(row.notReadyCount),
    row.topContactMethod,
    row.averageBuyerEvidenceCount.toFixed(1),
    row.averageRecencyEvidenceCount.toFixed(1),
    String(row.blockedDomainsCount),
    String(row.irrelevantPagesCount),
    String(row.directoriesExcluded),
    String(row.vendorPagesExcluded),
    String(row.marketplacesExcluded),
    row.relevanceDistribution,
    String(row.outcomeCount),
    row.estimatedValue.toFixed(0),
    row.nextAction,
  ]);
  return `${headers.map(csvCell).join(',')}\n${body.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function readFloraVerificationCount(): number {
  if (!fs.existsSync(verificationSummaryPath)) return 0;
  const match = fs.readFileSync(verificationSummaryPath, 'utf8').match(/Flora verification candidates: (\d+)/);
  return match ? Number(match[1]) : 0;
}

function readVerificationReview(): VerificationReviewBatch {
  if (!fs.existsSync(verificationReviewPath)) {
    return {
      generatedAt: new Date().toISOString(),
      totalDeliveryCandidates: 0,
      totalReviewCandidates: 0,
      totalReadyCandidates: 0,
      reviewItems: [],
      safetyRules: [],
    };
  }
  return readJson<VerificationReviewBatch>(verificationReviewPath);
}

function readOutcomes(): LeadOutcomeRecord[] {
  if (!fs.existsSync(outcomesPath)) return [];
  return JSON.parse(fs.readFileSync(outcomesPath, 'utf8')) as LeadOutcomeRecord[];
}

function readSearchBatch(): SearchCandidateBatch {
  if (!fs.existsSync(searchCandidatesPath)) {
    return {
      generatedAt: new Date().toISOString(),
      maxQueriesPerClient: 0,
      maxCandidatesPerQuery: 0,
      totalClients: 0,
      totalQueriesExecuted: 0,
      totalCandidates: 0,
      candidates: [],
      sourceResults: [],
      safetyRules: [],
    };
  }
  return readJson<SearchCandidateBatch>(searchCandidatesPath);
}

function readBehaviorQueries(): DiscoveryQuery[] {
  if (!fs.existsSync(behaviorQueriesPath)) return [];
  return readJson<DiscoveryQueryBatch>(behaviorQueriesPath).queries;
}

function readSearchDiagnostics(): QueryExecutionDiagnostic[] {
  if (!fs.existsSync(searchDiagnosticsPath)) return [];
  return readJson<SearchDiagnosticsBatch>(searchDiagnosticsPath).diagnostics ?? [];
}

function readTavilyHealth(): { providerSelected: string; apiKeyConfigured: boolean; fallbackEnabled: boolean } {
  if (!fs.existsSync(tavilyHealthPath)) {
    return { providerSelected: 'unknown', apiKeyConfigured: false, fallbackEnabled: false };
  }
  const parsed = readJson<{ providerSelected?: string; apiKeyConfigured?: boolean; fallbackEnabled?: boolean }>(tavilyHealthPath);
  return {
    providerSelected: parsed.providerSelected ?? 'unknown',
    apiKeyConfigured: Boolean(parsed.apiKeyConfigured),
    fallbackEnabled: Boolean(parsed.fallbackEnabled),
  };
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function percentage(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 1000) / 10;
}

function queryQualityRows(candidates: SearchCandidate[]): Array<{ query: string; leadLikeTotal: number; leadLikePercentage: number; recommendation: string }> {
  const groups = candidates.reduce<Record<string, SearchCandidate[]>>((acc, candidate) => {
    acc[candidate.query] = acc[candidate.query] ?? [];
    acc[candidate.query].push(candidate);
    return acc;
  }, {});
  return Object.entries(groups)
    .map(([query, items]) => {
      const leadLikeTotal = items.filter((item) => item.leadLikeClassification === 'lead_like' || item.leadLikeClassification === 'possibly_lead_like').length;
      const leadLikePercentage = percentage(leadLikeTotal, items.length);
      return {
        query,
        leadLikeTotal,
        leadLikePercentage,
        recommendation: queryRecommendation(items.length, leadLikeTotal, leadLikePercentage),
      };
    })
    .sort((left, right) => right.leadLikePercentage - left.leadLikePercentage || right.leadLikeTotal - left.leadLikeTotal || left.query.localeCompare(right.query));
}

function queryRecommendation(candidatesGenerated: number, leadLikeTotal: number, leadLikePercentage: number): string {
  if (leadLikeTotal === 0) return 'disable';
  if (leadLikePercentage >= 45 && leadLikeTotal >= 3) return 'increase';
  if (leadLikePercentage >= 20) return 'keep';
  if (candidatesGenerated >= 5) return 'reduce';
  return 'disable';
}

function sourceQualityRows(candidates: SearchCandidate[]): Array<{
  sourceId: string;
  highPriority: boolean;
  leadLikeTotal: number;
  leadLikePercentage: number;
  recommendation: string;
}> {
  const groups = candidates.reduce<Record<string, SearchCandidate[]>>((acc, candidate) => {
    const key = candidate.sourceId ?? candidate.sourceName;
    acc[key] = acc[key] ?? [];
    acc[key].push(candidate);
    return acc;
  }, {});
  return Object.entries(groups)
    .map(([sourceId, items]) => {
      const leadLikeTotal = items.filter((item) => item.leadLikeClassification === 'lead_like' || item.leadLikeClassification === 'possibly_lead_like').length;
      const leadLikePercentage = percentage(leadLikeTotal, items.length);
      return {
        sourceId,
        highPriority: items.some((item) => item.sourceQueryPriority === 'high'),
        leadLikeTotal,
        leadLikePercentage,
        recommendation: queryRecommendation(items.length, leadLikeTotal, leadLikePercentage),
      };
    })
    .sort((left, right) => right.leadLikePercentage - left.leadLikePercentage || right.leadLikeTotal - left.leadLikeTotal || left.sourceId.localeCompare(right.sourceId));
}

function behaviorStatsFor(
  clientId: string,
  behaviorQueries: DiscoveryQuery[],
  searchBatch: SearchCandidateBatch,
  delivery: DeliveryLeadCandidate[],
): {
  queryCount: number;
  topBuyerBehaviors: string;
  topPainSignals: string;
  topUrgencySignals: string;
  topPerformingQueries: string;
  worstQueries: string;
  promotedQueries: string;
  disabledQueries: string;
  estimatedCommercialValue: number;
} {
  const queries = behaviorQueries.filter((query) => query.clientId === clientId);
  const results = searchBatch.sourceResults.filter((result) => result.clientId === clientId && result.queryTemplateType === 'behavior');
  const candidates = searchBatch.candidates.filter((candidate) => candidate.clientId === clientId && candidate.queryTemplateType === 'behavior');
  const metrics = behaviorQueryMetrics(queries, results, candidates);
  const deliveryForClient = delivery.filter((candidate) => candidate.clientId === clientId && candidate.queryTemplateType === 'behavior' && !candidate.excluded);
  const commercialSignalCount = queries.filter((query) => query.behaviorCategory === 'commercial_value').length;
  const leadLikeTotal = candidates.filter((candidate) => candidate.leadLikeClassification === 'lead_like' || candidate.leadLikeClassification === 'possibly_lead_like').length;

  return {
    queryCount: queries.length,
    topBuyerBehaviors: compactDistribution(queries.map((query) => query.behaviorCategory ?? 'unknown')),
    topPainSignals: topSignals(queries, 'pain'),
    topUrgencySignals: topSignals(queries, 'urgency'),
    topPerformingQueries: metrics.filter((row) => row.leadLikeTotal > 0 || row.averageBehaviorScore >= 4).slice(0, 3).map(formatBehaviorMetric).join(' || ') || 'none',
    worstQueries: metrics.filter((row) => row.recommendation === 'disable' || row.recommendation === 'reduce').slice(0, 3).map(formatBehaviorMetric).join(' || ') || 'none',
    promotedQueries: metrics.filter((row) => row.recommendation === 'promote' || row.recommendation === 'increase').slice(0, 3).map((row) => row.query).join(' || ') || 'none',
    disabledQueries: metrics.filter((row) => row.recommendation === 'disable').slice(0, 3).map((row) => row.query).join(' || ') || 'none',
    estimatedCommercialValue: commercialSignalCount * 250 + leadLikeTotal * 500 + deliveryForClient.length * 1000,
  };
}

function buyerSignalStatsFor(clientId: string, searchCandidates: SearchCandidate[], delivery: DeliveryLeadCandidate[]): {
  buyerSignalsDiscovered: number;
  signalStrengthDistribution: string;
  topSignalCombinations: string;
  worstSignalCombinations: string;
  promotedDynamicQueries: string;
  disabledDynamicQueries: string;
} {
  const candidates = searchCandidates.filter((candidate) => candidate.clientId === clientId);
  const dynamicCandidates = candidates.filter((candidate) => candidate.queryTemplateType === 'dynamic');
  const comboRows = signalCombinationRows(candidates, delivery.filter((candidate) => candidate.clientId === clientId));
  return {
    buyerSignalsDiscovered: candidates.reduce((sum, candidate) => sum + (candidate.buyerSignalCount ?? 0), 0),
    signalStrengthDistribution: compactDistribution(candidates.map((candidate) => candidate.buyerSignalStrength ?? 'none')),
    topSignalCombinations: comboRows.filter((row) => row.score > 0).slice(0, 3).map((row) => `${row.combo}:${row.score}`).join(' || ') || 'none',
    worstSignalCombinations: comboRows.filter((row) => row.score <= 0).slice(0, 3).map((row) => `${row.combo}:${row.score}`).join(' || ') || 'none',
    promotedDynamicQueries: dynamicCandidates
      .filter((candidate) => candidate.leadLikeClassification === 'lead_like' || candidate.buyerSignalStrength === 'strong')
      .slice(0, 3)
      .map((candidate) => candidate.query)
      .join(' || ') || 'none',
    disabledDynamicQueries: dynamicCandidates
      .filter((candidate) => (candidate.buyerSignalCount ?? 0) === 0 && !['lead_like', 'possibly_lead_like'].includes(candidate.leadLikeClassification))
      .slice(0, 3)
      .map((candidate) => candidate.query)
      .join(' || ') || 'none',
  };
}

function signalCombinationRows(candidates: SearchCandidate[], delivery: DeliveryLeadCandidate[]): Array<{ combo: string; score: number }> {
  const groups = new Map<string, { leadLike: number; possible: number; delivery: number; strong: number; total: number }>();
  for (const candidate of candidates) {
    const combo = (candidate.buyerSignalCategories ?? []).join('+') || 'none';
    const row = groups.get(combo) ?? { leadLike: 0, possible: 0, delivery: 0, strong: 0, total: 0 };
    row.total += 1;
    if (candidate.leadLikeClassification === 'lead_like') row.leadLike += 1;
    if (candidate.leadLikeClassification === 'possibly_lead_like') row.possible += 1;
    if (candidate.buyerSignalStrength === 'strong') row.strong += 1;
    groups.set(combo, row);
  }
  for (const candidate of delivery) {
    const combo = (candidate.buyerSignalCategories ?? []).join('+') || 'none';
    const row = groups.get(combo) ?? { leadLike: 0, possible: 0, delivery: 0, strong: 0, total: 0 };
    if (!candidate.excluded) row.delivery += 1;
    groups.set(combo, row);
  }
  return [...groups.entries()].map(([combo, row]) => ({
    combo,
    score: row.leadLike * 8 + row.possible * 4 + row.delivery * 10 + row.strong * 3 - (row.total >= 5 && row.leadLike + row.possible === 0 ? 5 : 0),
  })).sort((left, right) => right.score - left.score || left.combo.localeCompare(right.combo));
}

function behaviorQueryMetrics(
  queries: DiscoveryQuery[],
  results: SearchSourceResult[],
  candidates: SearchCandidate[],
): BehaviorQueryMetric[] {
  const knownQueries = new Set([...queries.map((query) => query.query), ...results.map((result) => result.query), ...candidates.map((candidate) => candidate.query)]);
  return [...knownQueries].map((query) => {
    const resultRows = results.filter((result) => result.query === query);
    const candidateRows = candidates.filter((candidate) => candidate.query === query);
    const candidateCount = resultRows.length > 0 ? resultRows.reduce((sum, result) => sum + result.candidateCount, 0) : candidateRows.length;
    const leadLikeTotal = candidateRows.filter((candidate) => candidate.leadLikeClassification === 'lead_like' || candidate.leadLikeClassification === 'possibly_lead_like').length;
    const averageBehaviorScore = average(candidateRows.map((candidate) => candidate.behaviorScore ?? 0));
    return {
      query,
      leadLikeTotal,
      candidateCount,
      averageBehaviorScore,
      recommendation: behaviorRecommendation(candidateCount, leadLikeTotal, averageBehaviorScore),
    };
  }).sort((left, right) => {
    if (left.recommendation !== right.recommendation) return behaviorRecommendationRank(left.recommendation) - behaviorRecommendationRank(right.recommendation);
    return right.leadLikeTotal - left.leadLikeTotal || right.averageBehaviorScore - left.averageBehaviorScore || left.query.localeCompare(right.query);
  });
}

function behaviorRecommendation(candidateCount: number, leadLikeTotal: number, averageBehaviorScore: number): string {
  if (leadLikeTotal >= 2 || averageBehaviorScore >= 6) return 'promote';
  if (leadLikeTotal === 1 || averageBehaviorScore >= 4) return 'increase';
  if (candidateCount >= 5) return 'reduce';
  if (candidateCount === 0) return 'disable';
  return 'needs_more_data';
}

function behaviorRecommendationRank(value: string): number {
  if (value === 'promote') return 0;
  if (value === 'increase') return 1;
  if (value === 'needs_more_data') return 2;
  if (value === 'reduce') return 3;
  return 4;
}

function formatBehaviorMetric(row: BehaviorQueryMetric): string {
  return `${row.recommendation}:${row.leadLikeTotal} lead-like/${row.candidateCount} candidates score ${row.averageBehaviorScore.toFixed(1)} ${row.query}`;
}

function topSignals(queries: DiscoveryQuery[], category: string): string {
  return compactDistribution(queries
    .filter((query) => query.behaviorCategory === category)
    .flatMap((query) => query.behaviorSignals ?? []));
}

function searchHealthFor(clientId: string, diagnostics: QueryExecutionDiagnostic[]): {
  providerHealth: string;
  querySuccessRate: number;
  queryFailureRate: number;
  providerFailures: number;
  providerResultCount: number;
  emptyResponseCount: number;
  rateLimitCount: number;
  blockedQueryCount: number;
  averageSearchDuration: number;
} {
  const rows = diagnostics.filter((diagnostic) => diagnostic.clientId === clientId);
  const sentRows = rows.filter((diagnostic) => diagnostic.wasSentToProvider);
  const successful = rows.filter((diagnostic) => diagnostic.success).length;
  const failed = rows.length - successful;
  return {
    providerHealth: providerHealthLabel(rows),
    querySuccessRate: percentage(successful, rows.length),
    queryFailureRate: percentage(failed, rows.length),
    providerFailures: sentRows.filter((diagnostic) => !diagnostic.success).length,
    providerResultCount: sentRows.reduce((sum, diagnostic) => sum + (diagnostic.providerResultCount ?? diagnostic.response.resultsReturned), 0),
    emptyResponseCount: rows.filter((diagnostic) => diagnostic.response.emptyResponse || diagnostic.failureReason === 'provider_empty').length,
    rateLimitCount: rows.filter((diagnostic) => diagnostic.response.rateLimited || diagnostic.failureReason === 'rate_limit').length,
    blockedQueryCount: rows.filter((diagnostic) => diagnostic.blockedByGuardrails).length,
    averageSearchDuration: average(sentRows.map((diagnostic) => diagnostic.durationMs)),
  };
}

function providerHealthLabel(rows: QueryExecutionDiagnostic[]): string {
  if (rows.length === 0) return 'unknown';
  if (rows.every((row) => row.blockedByGuardrails)) return 'query_blocked';
  if (rows.some((row) => row.response.rateLimited)) return 'rate_limited';
  if (rows.some((row) => row.response.timeout)) return 'timeouts';
  if (rows.some((row) => row.response.parserFailure)) return 'provider_failure';
  const failed = rows.filter((row) => !row.success);
  if (failed.length > 0 && failed.every((row) => row.response.emptyResponse || row.failureReason === 'provider_empty')) return 'empty_responses';
  if (failed.length > 0 && rows.some((row) => row.success)) return 'degraded';
  if (failed.length > 0) return 'provider_failure';
  return 'healthy';
}

function topValue(values: string[]): string {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    const key = value || 'none';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0] ?? 'none';
}

function compactDistribution(values: string[]): string {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    const key = value || 'unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([value, count]) => `${value}:${count}`)
    .join('; ') || 'none';
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function main(): void {
  const result = generateClientDashboard();
  console.log(`Client dashboard generated: ${result.filesGenerated.join(', ')}`);
  console.log(`Dashboard clients: ${result.rows.length}`);
  console.log('Dashboard only. Manual review required before delivery or contact.');
}

if (require.main === module) main();
