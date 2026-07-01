import fs = require('fs');
import path = require('path');
import { runtimeOutputPath } from '../runtimePaths';
import { DeliveryLeadCandidate } from './deliveryLeadTypes';
import { ReviewHistory } from './reviewDecisionTypes';
import { SearchCandidate, SearchCandidateBatch } from './searchCandidateTypes';
import {
  ClientBudgetAllocationV2,
  SourceQualityV2BudgetRecommendations,
  SourceQualityV2Recommendation,
  SourceQualityV2Row,
  SourceQualityV2Summary,
  SourceQualityV2Weight,
} from './sourceQualityV2Types';

interface DeliveryBatch {
  deliveryCandidates: DeliveryLeadCandidate[];
}

interface SourceMonitorPlan {
  sources?: Array<{
    sourceId: string;
    sourceName: string;
    sourceType: string;
    clientId: string;
    vertical: string;
    allowed: boolean;
    requiresLogin: boolean;
    riskLevel: string;
    supportedEnrichmentTypes?: string[];
  }>;
}

interface EnrichmentReadinessReport {
  candidates?: Array<{
    clientId: string;
    sourceId: string;
    sourceType: string;
    enrichmentReadiness?: { readiness?: string; score?: number };
  }>;
}

interface GroupMetrics {
  clientId: string;
  clientName: string;
  vertical: string;
  sourceType: string;
  queryType: string;
  sourceName: string;
  candidateCount: number;
  leadLikeCount: number;
  deliveryCount: number;
  approvedCount: number;
  rejectedCount: number;
  falsePositiveCount: number;
  staleCount: number;
  buyerServiceCount: number;
  nonBuyerRoleCount: number;
  enrichmentScoreTotal: number;
  enrichmentSamples: number;
  commercialValue: number;
  estimatedCreditsSpent: number;
}

const outputDir = runtimeOutputPath('lead-discovery', 'source-quality-v2');
const summaryMdPath = path.join(outputDir, 'source-quality-summary.md');
const summaryJsonPath = path.join(outputDir, 'source-quality-summary.json');
const budgetMdPath = path.join(outputDir, 'budget-recommendations.md');
const budgetJsonPath = path.join(outputDir, 'budget-recommendations.json');

const searchPath = path.join(process.cwd(), 'output', 'lead-discovery', 'search-candidates', 'search-candidates.json');
const deliveryPath = path.join(process.cwd(), 'output', 'lead-discovery', 'delivery-candidates', 'delivery-candidates.json');
const reviewHistoryPath = path.join(process.cwd(), 'output', 'lead-discovery', 'review-state', 'review-history.json');
const sourceMonitorPath = path.join(process.cwd(), 'output', 'lead-discovery', 'source-monitor', 'source-monitor-plan.json');
const enrichmentReadinessPath = path.join(process.cwd(), 'output', 'lead-discovery', 'source-monitor', 'enrichment-readiness.json');

const safetyRules = [
  'Source Quality v2 uses local artifacts only.',
  'No Tavily, providers, network calls, live search, scraping, browser automation, login, contact extraction, or outreach are used.',
  'Recommendations are planning signals only and require human review before live budget changes.',
];

export function generateSourceQualityV2(now = new Date()): {
  summary: SourceQualityV2Summary;
  budgetRecommendations: SourceQualityV2BudgetRecommendations;
} {
  const generatedAt = now.toISOString();
  const rows = buildRows();
  const summary: SourceQualityV2Summary = {
    generatedAt,
    totalRows: rows.length,
    promotedSources: rows.filter((row) => row.recommendation === 'promote').length,
    keptSources: rows.filter((row) => row.recommendation === 'keep').length,
    reducedSources: rows.filter((row) => row.recommendation === 'reduce').length,
    disabledSources: rows.filter((row) => row.recommendation === 'disable').length,
    costPerApprovedOpportunityEstimate: costPerApproved(rows),
    nextBudgetAction: nextBudgetAction(rows),
    rows,
    sourceTypeWeights: weightsFor('source_type', rows),
    queryTypeWeights: weightsFor('query_type', rows),
    clientWeights: weightsFor('client', rows),
    verticalWeights: weightsFor('vertical', rows),
    safetyRules,
  };
  const budgetRecommendations = buildBudgetRecommendations(generatedAt, summary);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(summaryJsonPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  fs.writeFileSync(summaryMdPath, renderSummary(summary), 'utf8');
  fs.writeFileSync(budgetJsonPath, `${JSON.stringify(budgetRecommendations, null, 2)}\n`, 'utf8');
  fs.writeFileSync(budgetMdPath, renderBudgetRecommendations(budgetRecommendations), 'utf8');
  return { summary, budgetRecommendations };
}

function buildRows(): SourceQualityV2Row[] {
  const groups = new Map<string, GroupMetrics>();
  const searchCandidates = readJsonOrNull<SearchCandidateBatch>(searchPath)?.candidates ?? [];
  const deliveryCandidates = readJsonOrNull<DeliveryBatch>(deliveryPath)?.deliveryCandidates ?? [];
  const reviewHistory = readJsonOrNull<ReviewHistory>(reviewHistoryPath)?.decisions ?? [];
  const monitorSources = readJsonOrNull<SourceMonitorPlan>(sourceMonitorPath)?.sources ?? [];
  const enrichmentCandidates = readJsonOrNull<EnrichmentReadinessReport>(enrichmentReadinessPath)?.candidates ?? [];

  for (const candidate of searchCandidates) {
    const group = ensureGroup(groups, {
      clientId: candidate.clientId,
      clientName: candidate.clientName,
      vertical: candidate.vertical,
      sourceType: candidate.sourceCategory,
      queryType: candidate.queryTemplateType ?? 'standard',
      sourceName: candidate.sourceName,
    });
    group.candidateCount += 1;
    group.estimatedCreditsSpent += 1;
    if (['lead_like', 'possibly_lead_like'].includes(candidate.leadLikeClassification)) group.leadLikeCount += 1;
    if (candidate.buyerSignalStrength === 'strong') group.commercialValue += 750;
    if (candidate.buyerSignalStrength === 'medium') group.commercialValue += 350;
  }

  for (const candidate of deliveryCandidates) {
    const group = ensureGroup(groups, {
      clientId: candidate.clientId,
      clientName: candidate.clientName,
      vertical: candidate.vertical,
      sourceType: candidate.sourceCategory,
      queryType: candidate.queryTemplateType ?? 'standard',
      sourceName: candidate.sourceName,
    });
    if (!candidate.excluded) group.deliveryCount += 1;
    if (candidate.buyerRole === 'buyer_service' && !candidate.excluded) group.buyerServiceCount += 1;
    if (candidate.excluded || candidate.buyerRole !== 'buyer_service') group.nonBuyerRoleCount += 1;
    if (candidate.exclusionReason === 'not_buying_service') group.falsePositiveCount += 1;
    if (candidate.verificationReadiness === 'missing_recency' || (candidate.estimatedRecencyDays ?? 0) > 45) group.staleCount += 1;
    group.commercialValue += Math.max(0, candidate.overallScore) * 150;
  }

  for (const decision of reviewHistory) {
    const group = ensureGroup(groups, {
      clientId: decision.clientId,
      clientName: decision.clientName,
      vertical: 'review_history',
      sourceType: decision.sourceCategory,
      queryType: queryTypeFromText(decision.query),
      sourceName: sourceNameFromReview(decision.source),
    });
    if (decision.decision === 'approve') group.approvedCount += 1;
    if (decision.decision === 'reject') group.rejectedCount += 1;
    if (decision.decision === 'false_positive') group.falsePositiveCount += 1;
    if (decision.reviewReason === 'stale') group.staleCount += 1;
  }

  for (const source of monitorSources) {
    const group = ensureGroup(groups, {
      clientId: source.clientId,
      clientName: clientNameFor(source.clientId),
      vertical: source.vertical,
      sourceType: source.sourceType,
      queryType: 'public_source_monitor',
      sourceName: source.sourceName,
    });
    if (source.allowed && !source.requiresLogin) {
      group.enrichmentScoreTotal += source.supportedEnrichmentTypes?.length ? 7 : 4;
      group.enrichmentSamples += 1;
    }
    if (source.riskLevel === 'high' || source.requiresLogin || !source.allowed) group.falsePositiveCount += 1;
  }

  for (const candidate of enrichmentCandidates) {
    const group = ensureGroup(groups, {
      clientId: candidate.clientId,
      clientName: clientNameFor(candidate.clientId),
      vertical: 'public_source_monitor',
      sourceType: candidate.sourceType,
      queryType: 'public_source_monitor',
      sourceName: candidate.sourceId,
    });
    group.enrichmentScoreTotal += candidate.enrichmentReadiness?.score ?? (candidate.enrichmentReadiness?.readiness === 'ready' ? 8 : 3);
    group.enrichmentSamples += 1;
  }

  addFixtureAndGoldenSignals(groups);

  return [...groups.entries()]
    .map(([key, group]) => finalizeRow(key, group))
    .sort((left, right) => right.qualityScore - left.qualityScore || left.clientId.localeCompare(right.clientId) || left.sourceName.localeCompare(right.sourceName));
}

function ensureGroup(groups: Map<string, GroupMetrics>, input: {
  clientId: string;
  clientName: string;
  vertical: string;
  sourceType: string;
  queryType: string;
  sourceName: string;
}): GroupMetrics {
  const key = `${input.clientId}|${input.sourceType}|${input.queryType}|${input.sourceName}`;
  const existing = groups.get(key);
  if (existing) return existing;
  const next: GroupMetrics = {
    ...input,
    candidateCount: 0,
    leadLikeCount: 0,
    deliveryCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    falsePositiveCount: 0,
    staleCount: 0,
    buyerServiceCount: 0,
    nonBuyerRoleCount: 0,
    enrichmentScoreTotal: 0,
    enrichmentSamples: 0,
    commercialValue: 0,
    estimatedCreditsSpent: 0,
  };
  groups.set(key, next);
  return next;
}

function finalizeRow(key: string, group: GroupMetrics): SourceQualityV2Row {
  const leadLikeRate = ratio(group.leadLikeCount, group.candidateCount);
  const approvalRate = ratio(group.approvedCount, group.approvedCount + group.rejectedCount + group.falsePositiveCount);
  const rejectionRate = ratio(group.rejectedCount, group.approvedCount + group.rejectedCount + group.falsePositiveCount);
  const falsePositiveRate = ratio(group.falsePositiveCount, Math.max(group.candidateCount, group.deliveryCount, group.falsePositiveCount));
  const staleRate = ratio(group.staleCount, Math.max(group.deliveryCount, group.candidateCount));
  const buyerRoleQuality = ratio(group.buyerServiceCount, group.buyerServiceCount + group.nonBuyerRoleCount);
  const enrichmentReadiness = group.enrichmentSamples ? Math.min(1, group.enrichmentScoreTotal / group.enrichmentSamples / 10) : 0;
  const costEfficiency = group.estimatedCreditsSpent > 0
    ? (group.approvedCount * 10 + group.deliveryCount * 3 + group.leadLikeCount) / group.estimatedCreditsSpent
    : enrichmentReadiness;
  const qualityScore = Math.max(0, Math.round((
    leadLikeRate * 22
    + approvalRate * 18
    + buyerRoleQuality * 16
    + enrichmentReadiness * 12
    + Math.min(18, group.commercialValue / 500)
    + Math.min(14, costEfficiency * 4)
    - rejectionRate * 12
    - falsePositiveRate * 18
    - staleRate * 8
  ) * 10) / 10);
  const recommendation = recommendationFor(qualityScore, falsePositiveRate, staleRate, group);
  return {
    key,
    clientId: group.clientId,
    clientName: group.clientName,
    vertical: group.vertical,
    sourceType: group.sourceType,
    queryType: group.queryType,
    sourceName: group.sourceName,
    candidateCount: group.candidateCount,
    leadLikeCount: group.leadLikeCount,
    deliveryCount: group.deliveryCount,
    approvedCount: group.approvedCount,
    rejectedCount: group.rejectedCount,
    falsePositiveCount: group.falsePositiveCount,
    staleCount: group.staleCount,
    buyerRoleQuality,
    enrichmentReadiness,
    commercialValue: Math.round(group.commercialValue),
    estimatedCreditsSpent: group.estimatedCreditsSpent,
    leadLikeRate,
    approvalRate,
    rejectionRate,
    falsePositiveRate,
    staleRate,
    costEfficiency,
    qualityScore,
    recommendation,
    reasons: reasonsFor(recommendation, qualityScore, leadLikeRate, approvalRate, falsePositiveRate, enrichmentReadiness, costEfficiency),
  };
}

function recommendationFor(score: number, falsePositiveRate: number, staleRate: number, group: GroupMetrics): SourceQualityV2Recommendation {
  if (falsePositiveRate >= 0.5 || (group.candidateCount >= 5 && group.leadLikeCount === 0)) return 'disable';
  if (falsePositiveRate >= 0.25 || staleRate >= 0.5 || score < 15) return 'reduce';
  if (score >= 45 || group.approvedCount > 0 || group.deliveryCount >= 2) return 'promote';
  return 'keep';
}

function reasonsFor(
  recommendation: SourceQualityV2Recommendation,
  score: number,
  leadLikeRate: number,
  approvalRate: number,
  falsePositiveRate: number,
  enrichmentReadiness: number,
  costEfficiency: number,
): string[] {
  const reasons = [`${recommendation} based on quality score ${score.toFixed(1)}.`];
  if (leadLikeRate > 0) reasons.push(`Lead-like rate ${(leadLikeRate * 100).toFixed(1)}%.`);
  if (approvalRate > 0) reasons.push(`Approval rate ${(approvalRate * 100).toFixed(1)}%.`);
  if (falsePositiveRate > 0) reasons.push(`False-positive rate ${(falsePositiveRate * 100).toFixed(1)}%.`);
  if (enrichmentReadiness > 0) reasons.push(`Enrichment readiness ${(enrichmentReadiness * 100).toFixed(1)}%.`);
  if (costEfficiency > 0) reasons.push(`Cost efficiency ${costEfficiency.toFixed(2)} signal units per credit.`);
  return reasons;
}

function buildBudgetRecommendations(generatedAt: string, summary: SourceQualityV2Summary): SourceQualityV2BudgetRecommendations {
  return {
    generatedAt,
    sourceQualityV2Available: true,
    costPerApprovedOpportunityEstimate: summary.costPerApprovedOpportunityEstimate,
    nextBudgetAction: summary.nextBudgetAction,
    clientAllocations: [
      clientAllocation('flora_and_fauna_foods_001', 'Flora and Fauna Foods', [
        ['intent rewrites', 35],
        ['conversation queries', 25],
        ['source-specific', 20],
        ['public source monitor', 10],
        ['behavior/dynamic', 10],
      ], summary.rows),
      clientAllocation('lzt_costa_rica_001', 'LZT Costa Rica', [
        ['source-specific', 30],
        ['public notices/construction sources', 30],
        ['intent rewrites', 25],
        ['enrichment-ready sources', 15],
      ], summary.rows),
      clientAllocation('costa_retreats_001', 'Costa Retreats', [
        ['travel discussion sources', 30],
        ['intent rewrites', 30],
        ['tourism/event sources', 25],
        ['enrichment-ready sources', 15],
      ], summary.rows),
    ],
    promotedSources: summary.rows.filter((row) => row.recommendation === 'promote').slice(0, 10),
    reducedSources: summary.rows.filter((row) => row.recommendation === 'reduce').slice(0, 10),
    disabledSources: summary.rows.filter((row) => row.recommendation === 'disable').slice(0, 10),
    safetyRules,
  };
}

function clientAllocation(
  clientId: string,
  clientName: string,
  defaults: Array<[string, number]>,
  rows: SourceQualityV2Row[],
): ClientBudgetAllocationV2 {
  const clientRows = rows.filter((row) => row.clientId === clientId);
  return {
    clientId,
    clientName,
    allocation: defaults.map(([bucket, percentage]) => {
      const signal = signalForBucket(bucket, clientRows);
      return {
        bucket,
        percentage,
        sourceQualitySignal: signal,
        reason: `${bucket} starts at ${percentage}% and currently maps to ${signal} local source-quality evidence.`,
      };
    }),
  };
}

function signalForBucket(bucket: string, rows: SourceQualityV2Row[]): SourceQualityV2Recommendation {
  const normalized = bucket.toLowerCase();
  const matching = rows.filter((row) => normalized.includes(normalizeBucket(row.queryType)) || normalized.includes(normalizeBucket(row.sourceType)));
  if (matching.some((row) => row.recommendation === 'promote')) return 'promote';
  if (matching.some((row) => row.recommendation === 'disable')) return 'disable';
  if (matching.some((row) => row.recommendation === 'reduce')) return 'reduce';
  return 'keep';
}

function normalizeBucket(value: string): string {
  if (value === 'intent_rewrite') return 'intent';
  if (value === 'conversation') return 'conversation';
  if (value === 'source_specific') return 'source';
  if (value === 'public_source_monitor') return 'public';
  if (value === 'dynamic' || value === 'behavior') return value;
  if (value.includes('event')) return 'event';
  if (value.includes('notice') || value.includes('construction')) return 'notice';
  if (value.includes('forum') || value.includes('discussion')) return 'discussion';
  return value.replace(/_/g, ' ');
}

function weightsFor(dimension: SourceQualityV2Weight['dimension'], rows: SourceQualityV2Row[]): SourceQualityV2Weight[] {
  const keyForDimension = (row: SourceQualityV2Row): string => {
    if (dimension === 'client') return row.clientId;
    if (dimension === 'source_type') return row.sourceType;
    if (dimension === 'query_type') return row.queryType;
    return row.vertical;
  };
  const groups = new Map<string, SourceQualityV2Row[]>();
  for (const row of rows) groups.set(keyForDimension(row), [...(groups.get(keyForDimension(row)) ?? []), row]);
  const scored = [...groups.entries()].map(([key, groupRows]) => {
    const averageScore = groupRows.reduce((sum, row) => sum + row.qualityScore, 0) / groupRows.length;
    const recommendation = aggregateRecommendation(groupRows);
    return {
      dimension,
      key,
      weight: Math.max(0, Math.round(averageScore * 10) / 10),
      recommendation,
      reason: `${groupRows.length} local row(s), average score ${averageScore.toFixed(1)}.`,
    };
  });
  return scored.sort((left, right) => right.weight - left.weight || left.key.localeCompare(right.key));
}

function aggregateRecommendation(rows: SourceQualityV2Row[]): SourceQualityV2Recommendation {
  if (rows.some((row) => row.recommendation === 'promote')) return 'promote';
  if (rows.filter((row) => row.recommendation === 'disable').length >= Math.ceil(rows.length / 2)) return 'disable';
  if (rows.some((row) => row.recommendation === 'reduce')) return 'reduce';
  return 'keep';
}

function costPerApproved(rows: SourceQualityV2Row[]): number {
  const approved = rows.reduce((sum, row) => sum + row.approvedCount + row.deliveryCount * 0.35, 0);
  const credits = rows.reduce((sum, row) => sum + row.estimatedCreditsSpent, 0);
  return approved > 0 ? Math.round((credits / approved) * 100) / 100 : credits;
}

function nextBudgetAction(rows: SourceQualityV2Row[]): string {
  const disabled = rows.filter((row) => row.recommendation === 'disable').length;
  const reduced = rows.filter((row) => row.recommendation === 'reduce').length;
  const promoted = rows.filter((row) => row.recommendation === 'promote').length;
  if (disabled > 0) return 'Remove disabled source/query groups from the next Tavily allocation before live search.';
  if (reduced > promoted) return 'Shift credits away from reduced groups and toward promoted or enrichment-ready groups.';
  return 'Use Source Quality v2 allocations for the next scheduled run and review outcomes after completion.';
}

function addFixtureAndGoldenSignals(groups: Map<string, GroupMetrics>): void {
  const dataFiles = [
    ...filesIn(path.join(process.cwd(), 'data', 'lead-discovery', 'fixtures')),
    ...filesIn(path.join(process.cwd(), 'data', 'lead-discovery', 'golden-dataset')),
  ];
  for (const filePath of dataFiles) {
    const rows = readJsonOrNull<Array<{ expectedOutcome?: string; sourceCategory?: string; title?: string; snippet?: string; query?: string }>>(filePath) ?? [];
    const clientId = clientIdFromFile(filePath);
    for (const row of rows) {
      const group = ensureGroup(groups, {
        clientId,
        clientName: clientNameFor(clientId),
        vertical: 'fixture_or_golden',
        sourceType: row.sourceCategory ?? 'fixture',
        queryType: queryTypeFromText(row.query ?? ''),
        sourceName: 'fixture_or_golden_dataset',
      });
      group.candidateCount += 1;
      group.estimatedCreditsSpent += 0;
      if (row.expectedOutcome === 'positive') {
        group.leadLikeCount += 1;
        group.buyerServiceCount += 1;
        group.commercialValue += 500;
      } else if (row.expectedOutcome === 'negative') {
        group.falsePositiveCount += 1;
      }
    }
  }
}

function filesIn(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((file) => file.endsWith('.json')).map((file) => path.join(dir, file));
}

function clientIdFromFile(filePath: string): string {
  const base = path.basename(filePath);
  if (base.includes('flora')) return 'flora_and_fauna_foods_001';
  if (base.includes('lzt')) return 'lzt_costa_rica_001';
  if (base.includes('costa')) return 'costa_retreats_001';
  return 'unknown';
}

function queryTypeFromText(query: string): string {
  const text = query.toLowerCase();
  if (text.includes('conversation')) return 'conversation';
  if (text.includes('rewrite')) return 'intent_rewrite';
  if (text.includes('behavior')) return 'behavior';
  if (text.includes('dynamic')) return 'dynamic';
  if (text.includes('source')) return 'source_specific';
  return 'standard';
}

function sourceNameFromReview(source: string): string {
  return source.split(':')[0] || source || 'review_history';
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 1000) / 1000;
}

function clientNameFor(clientId: string): string {
  if (clientId === 'flora_and_fauna_foods_001') return 'Flora and Fauna Foods';
  if (clientId === 'lzt_costa_rica_001') return 'LZT Costa Rica';
  if (clientId === 'costa_retreats_001') return 'Costa Retreats';
  return clientId;
}

function readJsonOrNull<T>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
  } catch {
    return null;
  }
}

function renderSummary(summary: SourceQualityV2Summary): string {
  return `# Source Quality v2

Generated: ${summary.generatedAt}

## Summary

- Rows scored: ${summary.totalRows}
- Promoted sources: ${summary.promotedSources}
- Kept sources: ${summary.keptSources}
- Reduced sources: ${summary.reducedSources}
- Disabled sources: ${summary.disabledSources}
- Cost-per-approved-opportunity estimate: ${summary.costPerApprovedOpportunityEstimate}
- Next budget action: ${summary.nextBudgetAction}

## Top Rows

${summary.rows.slice(0, 20).map((row, index) => `${index + 1}. ${row.recommendation.toUpperCase()} | ${row.clientName} | ${row.sourceType} | ${row.queryType} | ${row.sourceName}
   - Score: ${row.qualityScore}; lead-like rate: ${(row.leadLikeRate * 100).toFixed(1)}%; approval: ${(row.approvalRate * 100).toFixed(1)}%; false positive: ${(row.falsePositiveRate * 100).toFixed(1)}%; cost efficiency: ${row.costEfficiency.toFixed(2)}
   - Reasons: ${row.reasons.join(' ')}`).join('\n') || '- No rows.'}

## Query Type Weights

${summary.queryTypeWeights.map((weight) => `- ${weight.key}: ${weight.weight} (${weight.recommendation})`).join('\n') || '- None.'}

## Safety

${summary.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function renderBudgetRecommendations(recommendations: SourceQualityV2BudgetRecommendations): string {
  return `# Source Quality v2 Budget Recommendations

Generated: ${recommendations.generatedAt}

- Cost-per-approved-opportunity estimate: ${recommendations.costPerApprovedOpportunityEstimate}
- Next budget action: ${recommendations.nextBudgetAction}

## Client Allocations

${recommendations.clientAllocations.map((client) => `### ${client.clientName}
${client.allocation.map((row) => `- ${row.bucket}: ${row.percentage}% (${row.sourceQualitySignal}) - ${row.reason}`).join('\n')}`).join('\n\n')}

## Promoted Sources

${recommendations.promotedSources.map((row) => `- ${row.clientName}: ${row.sourceType}/${row.queryType} ${row.sourceName} score ${row.qualityScore}`).join('\n') || '- None.'}

## Reduced Sources

${recommendations.reducedSources.map((row) => `- ${row.clientName}: ${row.sourceType}/${row.queryType} ${row.sourceName} score ${row.qualityScore}`).join('\n') || '- None.'}

## Disabled Sources

${recommendations.disabledSources.map((row) => `- ${row.clientName}: ${row.sourceType}/${row.queryType} ${row.sourceName} score ${row.qualityScore}`).join('\n') || '- None.'}

## Safety

${recommendations.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

if (require.main === module) {
  const result = generateSourceQualityV2();
  console.log(`Source Quality v2 generated: ${path.relative(process.cwd(), summaryMdPath)}, ${path.relative(process.cwd(), summaryJsonPath)}`);
  console.log(`Budget recommendations generated: ${path.relative(process.cwd(), budgetMdPath)}, ${path.relative(process.cwd(), budgetJsonPath)}`);
  console.log(`Promoted: ${result.summary.promotedSources}; reduced: ${result.summary.reducedSources}; disabled: ${result.summary.disabledSources}`);
  console.log('Source Quality v2 only. No Tavily, provider, network, live search, scraping, browser automation, contact extraction, or outreach ran.');
}
