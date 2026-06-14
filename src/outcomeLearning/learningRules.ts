import fs = require('fs');
import path = require('path');
import {
  LearningOutcomeType,
  OutcomeLearningAnalysis,
  OutcomeLearningDashboard,
  OutcomeLearningMetric,
  OutcomeLearningRecord,
  OutcomeLearningState,
} from './types';

export const allowedLearningOutcomes: LearningOutcomeType[] = [
  'SENT',
  'NO_RESPONSE',
  'REPLIED',
  'MEETING',
  'PROPOSAL',
  'WON',
  'LOST',
];

const dataRoot = path.join(process.cwd(), 'data', 'outcome-learning');
const outputRoot = path.join(process.cwd(), 'output', 'outcome-learning');
const outcomesPath = path.join(dataRoot, 'outcomes.json');
const statePath = path.join(dataRoot, 'learning-state.json');

const safetyRules = [
  'Outcome Learning uses manually entered outcomes only.',
  'No outreach, emails, LinkedIn messages, CRM records, meetings, proposals, invoices, payments, revenue, replies, wins, losses, or client interest are created.',
  'Do not invent outcomes. Empty outcome history is valid.',
  'Human approval remains required before external action.',
];

export function ensureOutcomeLearningStore(): void {
  fs.mkdirSync(dataRoot, { recursive: true });
  if (!fs.existsSync(outcomesPath)) fs.writeFileSync(outcomesPath, '[]\n', 'utf8');
  if (!fs.existsSync(statePath)) {
    const state: OutcomeLearningState = {
      schemaVersion: 1,
      lastUpdatedAt: null,
      totalOutcomes: 0,
      safetyRules,
    };
    fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
  }
}

export function loadOutcomeLearningRecords(): OutcomeLearningRecord[] {
  ensureOutcomeLearningStore();
  const raw = fs.readFileSync(outcomesPath, 'utf8').trim();
  if (!raw) return [];
  const parsed = JSON.parse(raw) as OutcomeLearningRecord[];
  return parsed.map(normalizeRecord).filter((record) => allowedLearningOutcomes.includes(record.outcome));
}

export function recordOutcomeLearning(record: Omit<OutcomeLearningRecord, 'id' | 'createdAt' | 'source'>): OutcomeLearningRecord {
  const records = loadOutcomeLearningRecords();
  const normalized = normalizeRecord({
    ...record,
    id: buildRecordId(record.lead, record.outcome, record.date, records.length + 1),
    createdAt: new Date().toISOString(),
    source: 'manual',
  });
  records.push(normalized);
  saveOutcomeLearningRecords(records);
  return normalized;
}

export function saveOutcomeLearningRecords(records: OutcomeLearningRecord[]): void {
  fs.mkdirSync(dataRoot, { recursive: true });
  const normalized = records.map(normalizeRecord);
  fs.writeFileSync(outcomesPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  const state: OutcomeLearningState = {
    schemaVersion: 1,
    lastUpdatedAt: normalized.length > 0 ? new Date().toISOString() : null,
    totalOutcomes: normalized.length,
    safetyRules,
  };
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

export function buildOutcomeLearningAnalysis(records = loadOutcomeLearningRecords()): OutcomeLearningAnalysis {
  const byLead = groupedMetrics(records, (record) => record.lead);
  const byOffer = groupedMetrics(records, (record) => record.offer);
  const byCategory = groupedMetrics(records, (record) => record.category);
  const byChannel = groupedMetrics(records, (record) => record.channel);
  const overall = metricFor('All outcomes', records);
  const topOffer = bestMetric(byOffer);
  const topCategory = bestMetric(byCategory);
  const topLead = bestMetric(byLead);
  const topChannel = bestMetric(byChannel);

  return {
    generatedAt: new Date().toISOString(),
    totalOutcomes: records.length,
    hasOutcomes: records.length > 0,
    overall,
    byLead,
    byOffer,
    byCategory,
    byChannel,
    topPerformingOffer: topOffer?.key ?? 'Insufficient outcome history.',
    topPerformingCategory: topCategory?.key ?? 'Insufficient outcome history.',
    topPerformingLead: topLead?.key ?? 'Insufficient outcome history.',
    topPerformingChannel: topChannel?.key ?? 'Insufficient outcome history.',
    topPatterns: buildTopPatterns(records.length, topOffer, topCategory, topLead, topChannel),
    improvementRecommendations: buildRecommendations(records.length, overall, topOffer, topCategory, topChannel),
    safetyRules,
  };
}

export function buildOutcomeLearningDashboard(): OutcomeLearningDashboard {
  const analysis = buildOutcomeLearningAnalysis();
  return {
    outcomesRecorded: analysis.totalOutcomes,
    replyRate: analysis.hasOutcomes ? percent(analysis.overall.replyRate) : 'No outcomes recorded yet.',
    proposalRate: analysis.hasOutcomes ? percent(analysis.overall.proposalRate) : 'No outcomes recorded yet.',
    winRate: analysis.hasOutcomes ? percent(analysis.overall.winRate) : 'No outcomes recorded yet.',
    topPerformingOffer: analysis.topPerformingOffer,
  };
}

export function historicalPerformanceForLead(lead: { companyName: string; category: string; recommendedOffer: string }): { score: number; reason: string; hasOutcomes: boolean } {
  const analysis = buildOutcomeLearningAnalysis();
  if (!analysis.hasOutcomes) {
    return { score: 50, reason: 'No real outcome history yet. Historical signal is neutral.', hasOutcomes: false };
  }

  const leadMetric = analysis.byLead.find((metric) => sameKey(metric.key, lead.companyName));
  const offerMetric = analysis.byOffer.find((metric) => sameKey(metric.key, lead.recommendedOffer));
  const categoryMetric = analysis.byCategory.find((metric) => sameKey(metric.key, lead.category));
  const available = [leadMetric, offerMetric, categoryMetric].filter((item): item is OutcomeLearningMetric => Boolean(item));
  if (available.length === 0) {
    return { score: 50, reason: 'No historical outcomes match this lead, offer, or category yet. Historical signal is neutral.', hasOutcomes: true };
  }

  const score = Math.round(available.reduce((sum, metric) => sum + performanceScore(metric), 0) / available.length);
  return {
    score,
    reason: `Historical performance signal ${score}/100 from ${available.map((metric) => metric.key).join(', ')}.`,
    hasOutcomes: true,
  };
}

export function writeLearningAnalysisOutputs(analysis = buildOutcomeLearningAnalysis()): string[] {
  return writeOutputs([
    { fileName: 'learning-summary.md', body: renderLearningSummary(analysis) },
    { fileName: 'lead-performance.md', body: renderLeadPerformance(analysis) },
    { fileName: 'offer-performance.md', body: renderOfferPerformance(analysis) },
    { fileName: 'channel-performance.md', body: renderChannelPerformance(analysis) },
    { fileName: 'top-performing-patterns.md', body: renderTopPatterns(analysis) },
    { fileName: 'improvement-recommendations.md', body: renderImprovementRecommendations(analysis) },
  ]);
}

export function writeLearningSummaryOutput(analysis = buildOutcomeLearningAnalysis()): string[] {
  return writeOutputs([
    { fileName: 'learning-summary.md', body: renderLearningSummary(analysis) },
    { fileName: 'top-performing-patterns.md', body: renderTopPatterns(analysis) },
    { fileName: 'improvement-recommendations.md', body: renderImprovementRecommendations(analysis) },
  ]);
}

export function writeLeadPerformanceOutput(analysis = buildOutcomeLearningAnalysis()): string[] {
  return writeOutputs([{ fileName: 'lead-performance.md', body: renderLeadPerformance(analysis) }]);
}

export function writeOfferPerformanceOutput(analysis = buildOutcomeLearningAnalysis()): string[] {
  return writeOutputs([{ fileName: 'offer-performance.md', body: renderOfferPerformance(analysis) }]);
}

export function writeChannelPerformanceOutput(analysis = buildOutcomeLearningAnalysis()): string[] {
  return writeOutputs([{ fileName: 'channel-performance.md', body: renderChannelPerformance(analysis) }]);
}

export function renderLearningSummary(analysis: OutcomeLearningAnalysis): string {
  return [
    '# Outcome Learning Summary',
    '',
    `Generated: ${analysis.generatedAt}`,
    '',
    analysis.hasOutcomes ? renderList([
      `Outcomes recorded: ${analysis.totalOutcomes}`,
      `Reply rate: ${percent(analysis.overall.replyRate)}`,
      `Meeting rate: ${percent(analysis.overall.meetingRate)}`,
      `Proposal rate: ${percent(analysis.overall.proposalRate)}`,
      `Win rate: ${percent(analysis.overall.winRate)}`,
      `Loss rate: ${percent(analysis.overall.lossRate)}`,
      `Top performing offer: ${analysis.topPerformingOffer}`,
      `Top performing lead category: ${analysis.topPerformingCategory}`,
    ]) : 'Not enough outcome data available. Record real manual outcomes with `npm run learning:record -- --lead "Company" --offer "QA Audit ($199-$500)" --category "Scheduling SaaS" --channel linkedin --outcome SENT`.',
    '',
    '## Safety Rules',
    renderList(analysis.safetyRules),
    '',
  ].join('\n');
}

export function renderLeadPerformance(analysis: OutcomeLearningAnalysis): string {
  return renderPerformanceTable('Lead Performance', analysis.generatedAt, analysis.byLead, analysis);
}

export function renderOfferPerformance(analysis: OutcomeLearningAnalysis): string {
  return renderPerformanceTable('Offer Performance', analysis.generatedAt, analysis.byOffer, analysis);
}

export function renderChannelPerformance(analysis: OutcomeLearningAnalysis): string {
  return renderPerformanceTable('Channel Performance', analysis.generatedAt, analysis.byChannel, analysis);
}

export function renderTopPatterns(analysis: OutcomeLearningAnalysis): string {
  return [
    '# Top Performing Patterns',
    '',
    `Generated: ${analysis.generatedAt}`,
    '',
    analysis.hasOutcomes ? renderList(analysis.topPatterns) : 'Not enough outcome data available.',
    '',
    '## Safety Rules',
    renderList(analysis.safetyRules),
    '',
  ].join('\n');
}

export function renderImprovementRecommendations(analysis: OutcomeLearningAnalysis): string {
  return [
    '# Improvement Recommendations',
    '',
    `Generated: ${analysis.generatedAt}`,
    '',
    analysis.hasOutcomes ? renderList(analysis.improvementRecommendations) : 'Not enough outcome data available.',
    '',
    '## Safety Rules',
    renderList(analysis.safetyRules),
    '',
  ].join('\n');
}

function renderPerformanceTable(title: string, generatedAt: string, metrics: OutcomeLearningMetric[], analysis: OutcomeLearningAnalysis): string {
  return [
    `# ${title}`,
    '',
    `Generated: ${generatedAt}`,
    '',
    metrics.length > 0 ? [
      '| Segment | Outcomes | Reply Rate | Meeting Rate | Proposal Rate | Win Rate | Loss Rate |',
      '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
      ...metrics.map((metric) => `| ${escapeTable(metric.key)} | ${metric.total} | ${percent(metric.replyRate)} | ${percent(metric.meetingRate)} | ${percent(metric.proposalRate)} | ${percent(metric.winRate)} | ${percent(metric.lossRate)} |`),
    ].join('\n') : 'Not enough outcome data available.',
    '',
    '## Safety Rules',
    renderList(analysis.safetyRules),
    '',
  ].join('\n');
}

function groupedMetrics(records: OutcomeLearningRecord[], keyFor: (record: OutcomeLearningRecord) => string): OutcomeLearningMetric[] {
  const groups = new Map<string, OutcomeLearningRecord[]>();
  for (const record of records) {
    const key = keyFor(record).trim() || 'Unknown';
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }
  return Array.from(groups.entries())
    .map(([key, items]) => metricFor(key, items))
    .sort((left, right) => performanceScore(right) - performanceScore(left) || right.total - left.total || left.key.localeCompare(right.key));
}

function metricFor(key: string, records: OutcomeLearningRecord[]): OutcomeLearningMetric {
  const sent = records.length;
  const replied = records.filter((record) => reached(record.outcome, 'REPLIED')).length;
  const meetings = records.filter((record) => reached(record.outcome, 'MEETING')).length;
  const proposals = records.filter((record) => reached(record.outcome, 'PROPOSAL')).length;
  const won = records.filter((record) => record.outcome === 'WON').length;
  const lost = records.filter((record) => record.outcome === 'LOST').length;
  const noResponse = records.filter((record) => record.outcome === 'NO_RESPONSE').length;
  return {
    key,
    total: records.length,
    sent,
    noResponse,
    replied,
    meetings,
    proposals,
    won,
    lost,
    replyRate: rate(replied, sent),
    meetingRate: rate(meetings, sent),
    proposalRate: rate(proposals, sent),
    winRate: rate(won, sent),
    lossRate: rate(lost, sent),
  };
}

function reached(outcome: LearningOutcomeType, stage: 'REPLIED' | 'MEETING' | 'PROPOSAL'): boolean {
  const order: LearningOutcomeType[] = ['SENT', 'NO_RESPONSE', 'REPLIED', 'MEETING', 'PROPOSAL', 'WON', 'LOST'];
  const outcomeIndex = order.indexOf(outcome);
  const stageIndex = order.indexOf(stage);
  if (outcome === 'LOST') return stage !== 'REPLIED' ? true : true;
  if (outcome === 'WON') return true;
  return outcomeIndex >= stageIndex;
}

function bestMetric(metrics: OutcomeLearningMetric[]): OutcomeLearningMetric | undefined {
  return metrics.filter((metric) => metric.total > 0).sort((left, right) => performanceScore(right) - performanceScore(left) || right.total - left.total)[0];
}

function performanceScore(metric: OutcomeLearningMetric): number {
  return Math.round(
    metric.replyRate * 25
    + metric.meetingRate * 20
    + metric.proposalRate * 25
    + metric.winRate * 30
    - metric.lossRate * 10,
  );
}

function buildTopPatterns(total: number, offer?: OutcomeLearningMetric, category?: OutcomeLearningMetric, lead?: OutcomeLearningMetric, channel?: OutcomeLearningMetric): string[] {
  if (total === 0) return ['Not enough outcome data available.'];
  return [
    offer ? `Best offer so far: ${offer.key} with ${percent(offer.replyRate)} reply rate and ${percent(offer.winRate)} win rate.` : undefined,
    category ? `Best lead category so far: ${category.key} with ${category.total} recorded outcome(s).` : undefined,
    lead ? `Best lead so far: ${lead.key} with ${lead.total} recorded outcome(s).` : undefined,
    channel ? `Best channel so far: ${channel.key} with ${percent(channel.replyRate)} reply rate.` : undefined,
  ].filter((item): item is string => Boolean(item));
}

function buildRecommendations(total: number, overall: OutcomeLearningMetric, offer?: OutcomeLearningMetric, category?: OutcomeLearningMetric, channel?: OutcomeLearningMetric): string[] {
  if (total === 0) return ['Record real manual outcomes before changing strategy.'];
  return [
    offer ? `Do more of: ${offer.key}, if Daniel manually confirms the offer remains relevant.` : 'Keep offer testing controlled until more outcomes exist.',
    category ? `Prioritize category cautiously: ${category.key}, based only on recorded local outcomes.` : 'No category pattern is supported yet.',
    channel ? `Use channel learning cautiously: ${channel.key} currently has the strongest recorded signal.` : 'No channel pattern is supported yet.',
    overall.replyRate < 20 ? 'Improve message clarity before increasing volume.' : 'Maintain concise evidence-based messaging.',
    overall.proposalRate < 10 ? 'Review whether replies are converting into proposal conversations.' : 'Continue tracking proposal outcomes manually.',
  ];
}

function normalizeRecord(record: OutcomeLearningRecord): OutcomeLearningRecord {
  return {
    id: String(record.id || buildRecordId(record.lead, record.outcome, record.date, 1)),
    lead: String(record.lead ?? '').trim() || 'Unknown',
    offer: String(record.offer ?? '').trim() || 'Unknown',
    category: String(record.category ?? '').trim() || 'Unknown',
    channel: String(record.channel ?? '').trim() || 'Unknown',
    outcome: normalizeOutcome(record.outcome),
    date: String(record.date ?? '').trim() || new Date().toISOString().slice(0, 10),
    notes: String(record.notes ?? '').trim(),
    createdAt: String(record.createdAt ?? new Date().toISOString()),
    source: 'manual',
  };
}

function normalizeOutcome(outcome: string): LearningOutcomeType {
  const normalized = String(outcome ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (!allowedLearningOutcomes.includes(normalized as LearningOutcomeType)) {
    throw new Error(`Invalid outcome "${outcome}". Allowed: ${allowedLearningOutcomes.join(', ')}`);
  }
  return normalized as LearningOutcomeType;
}

function buildRecordId(lead: string, outcome: string, date: string, index: number): string {
  return `${slug(lead)}-${slug(outcome)}-${slug(date)}-${index}`;
}

function rate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function percent(value: number): string {
  return `${value}%`;
}

function sameKey(left: string, right: string): boolean {
  return normalizeKey(left) === normalizeKey(right);
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function slug(value: string): string {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'outcome';
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function escapeTable(value: string): string {
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function writeOutputs(outputs: { fileName: string; body: string }[]): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });
  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }
  return outputs.map((output) => path.join(outputRoot, output.fileName));
}
