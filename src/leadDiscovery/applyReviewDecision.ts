import fs = require('fs');
import path = require('path');
import type { DeliveryLeadCandidate } from './deliveryLeadTypes';
import type { SearchCandidate, SearchCandidateBatch } from './searchCandidateTypes';
import {
  ReviewCandidateContext,
  ReviewDecisionInput,
  ReviewDecisionRecord,
  ReviewHistory,
  ReviewHistoryRecord,
  ReviewMetrics,
  ReviewState,
  reviewSafetyRules,
} from './reviewDecisionTypes';

interface DeliveryBatch {
  deliveryCandidates: DeliveryLeadCandidate[];
}

interface ReviewLearningRow {
  candidateId: string;
  clientId: string;
  clientName: string;
  learningType: 'positive' | 'negative';
  decision: string;
  reviewReason: string;
  source: string;
  sourceCategory: string;
  query: string;
  buyerRole: string;
  buyerSignals: string[];
  intentSignals: string[];
  leadLikeSignals: string[];
  reasons: string[];
  commercialValue: string;
  learningAction: string;
}

const reviewStateDir = path.join(process.cwd(), 'output', 'lead-discovery', 'review-state');
const reviewOutputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'review');
const reviewStatePath = path.join(reviewStateDir, 'review-state.json');
const reviewHistoryPath = path.join(reviewStateDir, 'review-history.json');
const reviewHistoryCsvPath = path.join(reviewStateDir, 'review-history.csv');
const reviewSummaryPath = path.join(reviewOutputDir, 'review-summary.md');
const reviewSummaryCsvPath = path.join(reviewOutputDir, 'review-summary.csv');
const reviewLearningPath = path.join(reviewOutputDir, 'review-learning.md');
const reviewLearningCsvPath = path.join(reviewOutputDir, 'review-learning.csv');
const defaultDecisionInputPath = path.join(process.cwd(), 'data', 'lead-discovery', 'review-decisions.json');
const deliveryPath = path.join(process.cwd(), 'output', 'lead-discovery', 'delivery-candidates', 'delivery-candidates.json');
const searchCandidatesPath = path.join(process.cwd(), 'output', 'lead-discovery', 'search-candidates', 'search-candidates.json');

export function applyReviewDecisions(inputDecisions: ReviewDecisionInput[], now = new Date()): {
  filesGenerated: string[];
  history: ReviewHistoryRecord[];
  metrics: ReviewMetrics;
  learningRows: ReviewLearningRow[];
} {
  const generatedAt = now.toISOString();
  const previousHistory = readHistory();
  const contexts = readCandidateContexts();
  const records = inputDecisions.map((decision) => enrichDecision(decision, contexts, generatedAt));
  const history = dedupeHistory([...previousHistory, ...records]);
  const latestDecisions = latestByCandidate(history);
  const state: ReviewState = {
    generatedAt,
    latestDecisions,
    safetyRules: reviewSafetyRules,
  };
  const historyDoc: ReviewHistory = {
    generatedAt,
    decisions: history,
    safetyRules: reviewSafetyRules,
  };
  const metrics = metricsFor(history);
  const learningRows = learningRowsFor(history);

  fs.mkdirSync(reviewStateDir, { recursive: true });
  fs.mkdirSync(reviewOutputDir, { recursive: true });
  fs.writeFileSync(reviewStatePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  fs.writeFileSync(reviewHistoryPath, `${JSON.stringify(historyDoc, null, 2)}\n`, 'utf8');
  fs.writeFileSync(reviewHistoryCsvPath, renderHistoryCsv(history), 'utf8');
  fs.writeFileSync(reviewSummaryPath, renderSummary(metrics, history), 'utf8');
  fs.writeFileSync(reviewSummaryCsvPath, renderSummaryCsv(metrics), 'utf8');
  fs.writeFileSync(reviewLearningPath, renderLearning(learningRows), 'utf8');
  fs.writeFileSync(reviewLearningCsvPath, renderLearningCsv(learningRows), 'utf8');

  return {
    filesGenerated: [
      reviewStatePath,
      reviewHistoryPath,
      reviewHistoryCsvPath,
      reviewSummaryPath,
      reviewSummaryCsvPath,
      reviewLearningPath,
      reviewLearningCsvPath,
    ].map((filePath) => path.relative(process.cwd(), filePath)),
    history,
    metrics,
    learningRows,
  };
}

function enrichDecision(
  decision: ReviewDecisionInput,
  contexts: Map<string, ReviewCandidateContext>,
  generatedAt: string,
): ReviewHistoryRecord {
  const context = contexts.get(decision.candidateId) ?? fallbackContext(decision);
  const normalizedDecision: ReviewDecisionRecord = {
    candidateId: decision.candidateId,
    clientId: decision.clientId,
    reviewDate: decision.reviewDate ?? generatedAt,
    decision: decision.decision,
    reviewReason: decision.reviewReason,
    notes: decision.notes ?? '',
  };
  const learningType = learningTypeFor(decision.decision);
  return {
    ...normalizedDecision,
    clientName: context.clientName,
    source: context.source,
    sourceCategory: context.sourceCategory,
    query: context.query,
    title: context.title,
    snippet: context.snippet,
    buyerRole: context.buyerRole,
    buyerSignals: context.buyerSignals,
    intentSignals: context.intentSignals,
    leadLikeSignals: context.leadLikeSignals,
    reasons: context.reasons,
    commercialValue: context.commercialValue,
    intentStrength: context.intentStrength,
    learningApplied: learningType !== 'none',
    learningType,
  };
}

function readCandidateContexts(): Map<string, ReviewCandidateContext> {
  const contexts = new Map<string, ReviewCandidateContext>();
  for (const candidate of readDeliveryCandidates()) {
    contexts.set(candidate.id, {
      candidateId: candidate.id,
      clientId: candidate.clientId,
      clientName: candidate.clientName,
      source: `${candidate.sourceName}: ${candidate.title}`,
      sourceCategory: candidate.sourceCategory,
      query: candidate.query,
      title: candidate.title,
      snippet: candidate.snippet,
      buyerRole: candidate.buyerRole,
      buyerSignals: candidate.buyerSignals ?? [],
      intentSignals: candidate.intentSignals,
      leadLikeSignals: candidate.leadLikeSignals,
      reasons: [...candidate.reasons, ...candidate.buyerRoleReasons, ...candidate.relevanceReasons],
      commercialValue: String(candidate.overallScore),
      intentStrength: candidate.intentStrength,
    });
  }
  for (const candidate of readSearchCandidates()) {
    if (contexts.has(candidate.id)) continue;
    contexts.set(candidate.id, {
      candidateId: candidate.id,
      clientId: candidate.clientId,
      clientName: candidate.clientName,
      source: `${candidate.sourceName}: ${candidate.title}`,
      sourceCategory: candidate.sourceCategory,
      query: candidate.query,
      title: candidate.title,
      snippet: candidate.snippet,
      buyerRole: 'unknown',
      buyerSignals: candidate.buyerSignals ?? [],
      intentSignals: candidate.behaviorSignals ?? [],
      leadLikeSignals: candidate.leadLikeSignals,
      reasons: [...candidate.leadLikeReasons, ...(candidate.behaviorReasons ?? [])],
      commercialValue: String(candidate.leadLikeScore),
      intentStrength: candidate.buyerSignalStrength ?? 'unknown',
    });
  }
  return contexts;
}

function readDeliveryCandidates(): DeliveryLeadCandidate[] {
  if (!fs.existsSync(deliveryPath)) return [];
  return (JSON.parse(fs.readFileSync(deliveryPath, 'utf8')) as DeliveryBatch).deliveryCandidates ?? [];
}

function readSearchCandidates(): SearchCandidate[] {
  if (!fs.existsSync(searchCandidatesPath)) return [];
  return (JSON.parse(fs.readFileSync(searchCandidatesPath, 'utf8')) as SearchCandidateBatch).candidates ?? [];
}

function fallbackContext(decision: ReviewDecisionInput): ReviewCandidateContext {
  return {
    candidateId: decision.candidateId,
    clientId: decision.clientId,
    clientName: clientNameFor(decision.clientId),
    source: 'manual review input',
    sourceCategory: 'manual',
    query: 'manual review',
    title: decision.candidateId,
    snippet: decision.notes ?? '',
    buyerRole: 'unknown',
    buyerSignals: [],
    intentSignals: [],
    leadLikeSignals: [],
    reasons: [decision.reviewReason],
    commercialValue: 'unknown',
    intentStrength: 'unknown',
  };
}

function readHistory(): ReviewHistoryRecord[] {
  if (!fs.existsSync(reviewHistoryPath)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(reviewHistoryPath, 'utf8')) as ReviewHistory;
    return parsed.decisions ?? [];
  } catch {
    return [];
  }
}

function dedupeHistory(history: ReviewHistoryRecord[]): ReviewHistoryRecord[] {
  const seen = new Set<string>();
  const deduped: ReviewHistoryRecord[] = [];
  for (const record of history) {
    const key = `${record.candidateId}|${record.clientId}|${record.reviewDate}|${record.decision}|${record.reviewReason}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(record);
  }
  return deduped.sort((left, right) => left.reviewDate.localeCompare(right.reviewDate) || left.candidateId.localeCompare(right.candidateId));
}

function latestByCandidate(history: ReviewHistoryRecord[]): ReviewHistoryRecord[] {
  const latest = new Map<string, ReviewHistoryRecord>();
  for (const record of history) {
    const key = `${record.clientId}|${record.candidateId}`;
    const existing = latest.get(key);
    if (!existing || record.reviewDate >= existing.reviewDate) latest.set(key, record);
  }
  return [...latest.values()].sort((left, right) => right.reviewDate.localeCompare(left.reviewDate) || left.candidateId.localeCompare(right.candidateId));
}

function metricsFor(history: ReviewHistoryRecord[]): ReviewMetrics {
  const approvedCount = history.filter((record) => record.decision === 'approve').length;
  const rejectedCount = history.filter((record) => record.decision === 'reject').length;
  const holdCount = history.filter((record) => record.decision === 'hold').length;
  const needsRecencyCheckCount = history.filter((record) => record.decision === 'needs_recency_check').length;
  const falsePositiveCount = history.filter((record) => record.decision === 'false_positive').length;
  return {
    totalDecisions: history.length,
    approvedCount,
    rejectedCount,
    holdCount,
    needsRecencyCheckCount,
    falsePositiveCount,
    approvalRate: ratio(approvedCount, history.length),
    rejectionRate: ratio(rejectedCount + falsePositiveCount, history.length),
    topApprovalReasons: distributionText(history.filter((record) => record.decision === 'approve').map((record) => record.reviewReason)),
    topRejectionReasons: distributionText(history.filter((record) => record.decision === 'reject' || record.decision === 'false_positive').map((record) => record.reviewReason)),
    learningCount: history.filter((record) => record.learningApplied).length,
    lastReviewDate: history.length ? history.map((record) => record.reviewDate).sort().at(-1) ?? null : null,
  };
}

function learningRowsFor(history: ReviewHistoryRecord[]): ReviewLearningRow[] {
  return history
    .filter((record) => record.decision === 'approve' || record.decision === 'false_positive')
    .map((record) => {
      const learningType = record.decision === 'approve' ? 'positive' : 'negative';
      return {
        candidateId: record.candidateId,
        clientId: record.clientId,
        clientName: record.clientName,
        learningType,
        decision: record.decision,
        reviewReason: record.reviewReason,
        source: record.source,
        sourceCategory: record.sourceCategory,
        query: record.query,
        buyerRole: String(record.buyerRole),
        buyerSignals: record.buyerSignals,
        intentSignals: record.intentSignals,
        leadLikeSignals: record.leadLikeSignals,
        reasons: record.reasons,
        commercialValue: record.commercialValue,
        learningAction: learningType === 'positive'
          ? 'promote similar future candidates with matching buyer, intent, source, and commercial-value signals'
          : penaltyActionFor(record),
      };
    });
}

function penaltyActionFor(record: ReviewHistoryRecord): string {
  const text = `${record.reviewReason} ${record.buyerRole} ${record.sourceCategory} ${record.reasons.join(' ')}`.toLowerCase();
  if (text.includes('staffing')) return 'increase staffing penalty and reject recruiting-worker patterns';
  if (text.includes('directory')) return 'increase directory penalty and reject listing pages';
  if (text.includes('article')) return 'increase reference-article penalty and reject generic editorial pages';
  if (text.includes('vendor')) return 'increase vendor-page penalty and reject supplier self-promotion';
  return 'increase non-buyer penalty for similar future candidates';
}

function learningTypeFor(decision: string): ReviewHistoryRecord['learningType'] {
  if (decision === 'approve') return 'positive';
  if (decision === 'false_positive') return 'negative';
  if (decision === 'hold') return 'hold';
  if (decision === 'needs_recency_check') return 'recency';
  return 'none';
}

function renderSummary(metrics: ReviewMetrics, history: ReviewHistoryRecord[]): string {
  return `# Human Review Summary

Generated: ${new Date().toISOString()}

## Metrics

- Total decisions: ${metrics.totalDecisions}
- Approved: ${metrics.approvedCount}
- Rejected: ${metrics.rejectedCount}
- Hold: ${metrics.holdCount}
- Needs recency check: ${metrics.needsRecencyCheckCount}
- False positives: ${metrics.falsePositiveCount}
- Approval rate: ${toPercent(metrics.approvalRate)}
- Rejection rate: ${toPercent(metrics.rejectionRate)}
- Top approval reasons: ${metrics.topApprovalReasons}
- Top rejection reasons: ${metrics.topRejectionReasons}
- Learning count: ${metrics.learningCount}
- Last review date: ${metrics.lastReviewDate ?? 'none'}

## Recent Decisions

${history.slice(-10).reverse().map((record) => `- ${record.reviewDate}: ${record.clientName} ${record.candidateId} -> ${record.decision} (${record.reviewReason})`).join('\n') || '- No review decisions recorded yet.'}

## Safety

${reviewSafetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function renderLearning(rows: ReviewLearningRow[]): string {
  const positiveRows = rows.filter((row) => row.learningType === 'positive');
  const negativeRows = rows.filter((row) => row.learningType === 'negative');
  return `# Review Learning

Generated: ${new Date().toISOString()}

## Positive Learning

- Approved examples: ${positiveRows.length}
- Promoted signals: ${distributionText(positiveRows.flatMap((row) => [...row.buyerSignals, ...row.intentSignals, ...row.leadLikeSignals]))}

## False Positive Learning

- False-positive examples: ${negativeRows.length}
- Penalties increased for: ${distributionText(negativeRows.map((row) => row.learningAction))}

## Learning Rows

${rows.map((row, index) => `${index + 1}. ${row.clientName} ${row.candidateId}
   - Type: ${row.learningType}
   - Decision: ${row.decision}
   - Reason: ${row.reviewReason}
   - Source: ${row.source}
   - Query: ${row.query}
   - Buyer role: ${row.buyerRole}
   - Commercial value: ${row.commercialValue}
   - Action: ${row.learningAction}`).join('\n') || '- No approval or false-positive learning rows yet.'}

Local learning only. No provider calls, network requests, Tavily usage, browser automation, scraping, contact extraction, or outreach were performed.
`;
}

function renderHistoryCsv(history: ReviewHistoryRecord[]): string {
  const headers = ['candidate_id', 'client_id', 'client_name', 'review_date', 'decision', 'review_reason', 'notes', 'source', 'source_category', 'query', 'buyer_role', 'buyer_signals', 'intent_signals', 'lead_like_signals', 'commercial_value', 'learning_applied', 'learning_type'];
  const body = history.map((record) => [
    record.candidateId,
    record.clientId,
    record.clientName,
    record.reviewDate,
    record.decision,
    record.reviewReason,
    record.notes,
    record.source,
    record.sourceCategory,
    record.query,
    String(record.buyerRole),
    record.buyerSignals.join('|'),
    record.intentSignals.join('|'),
    record.leadLikeSignals.join('|'),
    record.commercialValue,
    String(record.learningApplied),
    record.learningType,
  ]);
  return csvRows(headers, body);
}

function renderSummaryCsv(metrics: ReviewMetrics): string {
  const headers = ['metric', 'value'];
  const body = Object.entries(metrics).map(([key, value]) => [key, String(value)]);
  return csvRows(headers, body);
}

function renderLearningCsv(rows: ReviewLearningRow[]): string {
  const headers = ['candidate_id', 'client_id', 'client_name', 'learning_type', 'decision', 'review_reason', 'source', 'source_category', 'query', 'buyer_role', 'buyer_signals', 'intent_signals', 'lead_like_signals', 'commercial_value', 'learning_action'];
  const body = rows.map((row) => [
    row.candidateId,
    row.clientId,
    row.clientName,
    row.learningType,
    row.decision,
    row.reviewReason,
    row.source,
    row.sourceCategory,
    row.query,
    row.buyerRole,
    row.buyerSignals.join('|'),
    row.intentSignals.join('|'),
    row.leadLikeSignals.join('|'),
    row.commercialValue,
    row.learningAction,
  ]);
  return csvRows(headers, body);
}

function parseDecisionArgs(args: string[]): ReviewDecisionInput[] {
  const fileArg = readArg(args, '--file');
  if (fileArg) return readDecisionFile(path.resolve(process.cwd(), fileArg));
  if (fs.existsSync(defaultDecisionInputPath)) return readDecisionFile(defaultDecisionInputPath);
  const candidateId = readArg(args, '--candidateId');
  const clientId = readArg(args, '--clientId');
  const decision = readArg(args, '--decision');
  const reviewReason = readArg(args, '--reviewReason');
  if (!candidateId && !clientId && !decision && !reviewReason) return [];
  if (!candidateId || !clientId || !decision || !reviewReason) {
    throw new Error('Provide --candidateId, --clientId, --decision, and --reviewReason, or pass --file path/to/review-decisions.json.');
  }
  return [{
    candidateId,
    clientId,
    decision: decision as ReviewDecisionInput['decision'],
    reviewReason: reviewReason as ReviewDecisionInput['reviewReason'],
    reviewDate: readArg(args, '--reviewDate') ?? undefined,
    notes: readArg(args, '--notes') ?? '',
  }];
}

function readDecisionFile(filePath: string): ReviewDecisionInput[] {
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as ReviewDecisionInput[] | { decisions: ReviewDecisionInput[] };
  return Array.isArray(parsed) ? parsed : parsed.decisions;
}

function readArg(args: string[], name: string): string | null {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] ?? null;
}

function clientNameFor(clientId: string): string {
  if (clientId === 'flora_and_fauna_foods_001') return 'Flora and Fauna Foods';
  if (clientId === 'lzt_costa_rica_001') return 'LZT Costa Rica';
  if (clientId === 'costa_retreats_001') return 'Costa Retreats';
  return clientId;
}

function distributionText(values: string[]): string {
  const rows = Object.entries(values.filter(Boolean).reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {})).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  return rows.map(([value, count]) => `${value}:${count}`).join('; ') || 'none';
}

function ratio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : Math.round((numerator / denominator) * 1000) / 1000;
}

function toPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function csvRows(headers: string[], body: string[][]): string {
  return `${headers.map(csvCell).join(',')}\n${body.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function main(): void {
  const decisions = parseDecisionArgs(process.argv.slice(2));
  const result = applyReviewDecisions(decisions);
  console.log(`Review decision artifacts generated: ${result.filesGenerated.join(', ')}`);
  console.log(`Applied decisions this run: ${decisions.length}`);
  console.log(`Total review decisions: ${result.metrics.totalDecisions}`);
  console.log(`Approval rate: ${toPercent(result.metrics.approvalRate)}`);
  console.log(`False positives: ${result.metrics.falsePositiveCount}`);
  console.log('Local review only. No Tavily, provider calls, network, browser automation, scraping, contact extraction, outreach, email, DM, calls, or login was performed.');
}

if (require.main === module) main();
