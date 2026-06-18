import fs = require('fs');
import path = require('path');
import {
  CommercialOutcome,
  CommercialOutcomeInput,
  CommercialOutcomeRecord,
  PerformanceMetric,
  RevenueCalibrationSignal,
  RevenueLearningDashboard,
  RevenueLearningRecommendations,
  RevenueLearningReport,
  RevenueLearningStatus,
} from './types';

export const supportedCommercialOutcomes: CommercialOutcome[] = [
  'sent',
  'replied',
  'meeting',
  'proposal',
  'won',
  'lost',
  'retained',
  'expanded',
  'churned',
];

export const revenueLearningDataDir = path.join(process.cwd(), 'data', 'revenue-learning');
export const revenueLearningOutputDir = path.join(process.cwd(), 'output', 'revenue-learning');

const outcomesPath = path.join(revenueLearningDataDir, 'outcomes.json');
const performancePaths = {
  channels: path.join(revenueLearningDataDir, 'channel-performance.json'),
  offers: path.join(revenueLearningDataDir, 'offer-performance.json'),
  industries: path.join(revenueLearningDataDir, 'industry-performance.json'),
  pricing: path.join(revenueLearningDataDir, 'pricing-performance.json'),
  recommendations: path.join(revenueLearningDataDir, 'recommendations.json'),
};

const safetyRules = [
  'Revenue Learning uses manually recorded local outcomes only.',
  'No outreach, replies, meetings, proposals, wins, losses, retention, churn, revenue, invoices, payments, or CRM activity is invented.',
  'The Setmore workflow is an output example only and is never written to production outcome records.',
  'Historical calibration is optional and never exceeds 20% influence.',
  'Human approval remains required before any external or commercial action.',
];

const sampleWorkflow: CommercialOutcomeInput = {
  lead: 'Setmore',
  industry: 'Scheduling SaaS',
  leadCategory: 'Scheduling SaaS',
  channel: 'LinkedIn',
  offer: 'QA Audit',
  pricePoint: null,
  messageType: 'Evidence-based QA observation',
  outcome: 'replied',
  date: 'YYYY-MM-DD',
  notes: 'Example only. Do not persist without a real manually verified reply.',
};

export function ensureRevenueLearningStore(): void {
  fs.mkdirSync(revenueLearningDataDir, { recursive: true });
  if (!fs.existsSync(outcomesPath)) fs.writeFileSync(outcomesPath, '[]\n', 'utf8');
  for (const filePath of Object.values(performancePaths)) {
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, filePath.endsWith('recommendations.json') ? '{"status":"INSUFFICIENT HISTORY","recommendations":[]}\n' : '[]\n', 'utf8');
  }
}

export function loadCommercialOutcomes(): CommercialOutcomeRecord[] {
  ensureRevenueLearningStore();
  const raw = fs.readFileSync(outcomesPath, 'utf8').trim();
  if (!raw) return [];
  const parsed = JSON.parse(raw) as CommercialOutcomeRecord[];
  return parsed.map(normalizeStoredRecord);
}

export function validateCommercialOutcome(value: string): CommercialOutcome {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!supportedCommercialOutcomes.includes(normalized as CommercialOutcome)) {
    throw new Error(`Invalid commercial outcome "${value}". Allowed: ${supportedCommercialOutcomes.join(', ')}`);
  }
  return normalized as CommercialOutcome;
}

export function buildCommercialOutcome(
  input: CommercialOutcomeInput,
  index = 1,
  now = new Date().toISOString(),
): CommercialOutcomeRecord {
  const outcome = validateCommercialOutcome(input.outcome);
  const lead = required(input.lead, 'lead');
  const industry = required(input.industry, 'industry');
  const channel = required(input.channel, 'channel');
  const offer = required(input.offer, 'offer');
  const date = required(input.date, 'date');
  const pricePoint = normalizePrice(input.pricePoint);

  return {
    id: `${slug(lead)}-${outcome}-${slug(date)}-${index}`,
    lead,
    industry,
    leadCategory: String(input.leadCategory ?? industry).trim() || industry,
    channel,
    offer,
    pricePoint,
    messageType: String(input.messageType ?? 'Unspecified').trim() || 'Unspecified',
    outcome,
    date,
    notes: String(input.notes ?? '').trim(),
    createdAt: now,
    source: 'manual',
  };
}

export function recordCommercialOutcome(input: CommercialOutcomeInput): CommercialOutcomeRecord {
  const records = loadCommercialOutcomes();
  const record = buildCommercialOutcome(input, records.length + 1);
  records.push(record);
  fs.writeFileSync(outcomesPath, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
  writeRevenueLearningData(buildRevenueLearningReport(records));
  return record;
}

export function buildRevenueLearningReport(records = loadCommercialOutcomes()): RevenueLearningReport {
  const status = statusFor(records.length);
  const channelPerformance = groupPerformance(records, (record) => record.channel);
  const offerPerformance = groupPerformance(records, (record) => record.offer);
  const leadPerformance = groupPerformance(records, (record) => record.leadCategory);
  const industryPerformance = groupPerformance(records, (record) => canonicalIndustry(record.industry));
  const pricingPerformance = groupPerformance(
    records.filter((record) => record.pricePoint !== null),
    (record) => `${record.offer} - $${record.pricePoint}`,
  );
  const messagePerformance = groupPerformance(records, (record) => record.messageType);
  const recommendations = buildRecommendations(
    records.length,
    channelPerformance,
    offerPerformance,
    leadPerformance,
    industryPerformance,
    pricingPerformance,
    messagePerformance,
  );

  return {
    generatedAt: new Date().toISOString(),
    outcomes: records,
    status,
    calibrationInfluence: calibrationInfluenceFor(records.length),
    channelPerformance,
    offerPerformance,
    leadPerformance,
    industryPerformance,
    pricingPerformance,
    messagePerformance,
    recommendations,
    sampleWorkflow,
    safetyRules,
  };
}

export function buildRevenueLearningDashboard(): RevenueLearningDashboard {
  const report = buildRevenueLearningReport();
  return {
    revenueLearningStatus: report.status,
    outcomesRecorded: report.outcomes.length,
    bestChannel: report.recommendations.bestChannel,
    bestOffer: report.recommendations.bestOffer,
    bestIndustry: report.recommendations.bestIndustry,
    calibrationStatus: `${report.status}; ${report.calibrationInfluence}% influence`,
    recommendationConfidence: report.recommendations.confidence,
  };
}

export function revenueCalibrationForLead(lead: {
  companyName: string;
  category: string;
  recommendedOffer: string;
}): RevenueCalibrationSignal {
  const report = buildRevenueLearningReport();
  if (report.calibrationInfluence === 0) {
    return {
      score: 50,
      influence: 0,
      status: report.status,
      reason: 'No real revenue-learning outcomes. Ranking remains unchanged.',
      hasHistory: false,
    };
  }

  const metrics = [
    findMetric(report.leadPerformance, lead.category),
    findMetric(report.industryPerformance, canonicalIndustry(lead.category)),
    findMetric(report.offerPerformance, normalizedOffer(lead.recommendedOffer)),
  ].filter((metric): metric is PerformanceMetric => Boolean(metric));

  if (metrics.length === 0) {
    return {
      score: 50,
      influence: report.calibrationInfluence,
      status: report.status,
      reason: `Revenue Learning is ${report.status}, but no matching category, industry, or offer history exists; neutral calibration used.`,
      hasHistory: true,
    };
  }

  const score = Math.round(metrics.reduce((sum, metric) => sum + metric.performanceScore, 0) / metrics.length);
  return {
    score,
    influence: report.calibrationInfluence,
    status: report.status,
    reason: `Revenue-learning calibration ${score}/100 from ${metrics.map((metric) => metric.key).join(', ')}.`,
    hasHistory: true,
  };
}

export function writeRevenueLearningOutputs(report = buildRevenueLearningReport()): string[] {
  fs.mkdirSync(revenueLearningOutputDir, { recursive: true });
  writeRevenueLearningData(report);
  const outputs = [
    ['outcomes-summary.md', renderOutcomesSummary(report)],
    ['channel-performance.md', renderPerformance('Channel Performance', report.channelPerformance, report)],
    ['offer-performance.md', renderPerformance('Offer Performance', report.offerPerformance, report)],
    ['lead-performance.md', renderPerformance('Lead Performance', report.leadPerformance, report)],
    ['industry-performance.md', renderPerformance('Industry Performance', report.industryPerformance, report)],
    ['pricing-performance.md', renderPerformance('Pricing Performance', report.pricingPerformance, report)],
    ['recommendations.md', renderRecommendations(report)],
    ['calibration-summary.md', renderCalibrationSummary(report)],
    ['revenue-learning-status.md', renderRevenueLearningStatus(report)],
  ] as const;

  return outputs.map(([fileName, body]) => {
    const filePath = path.join(revenueLearningOutputDir, fileName);
    fs.writeFileSync(filePath, body, 'utf8');
    return filePath;
  });
}

export function renderOutcomesSummary(report: RevenueLearningReport): string {
  return document(report, 'Commercial Outcomes Summary', [
    bullets([
      `Outcomes Recorded: ${report.outcomes.length}`,
      `Revenue Learning Status: ${report.status}`,
      `Calibration Influence: ${report.calibrationInfluence}%`,
    ]),
    '',
    report.outcomes.length > 0 ? performanceRecordTable(report.outcomes) : 'No real commercial outcomes recorded.',
    '',
    '## Non-Persisted Setmore Example',
    '',
    bullets([
      `Lead: ${report.sampleWorkflow.lead}`,
      `Industry: ${report.sampleWorkflow.industry}`,
      `Channel: ${report.sampleWorkflow.channel}`,
      `Offer: ${report.sampleWorkflow.offer}`,
      `Outcome: ${report.sampleWorkflow.outcome}`,
      'This example is not stored in data/revenue-learning/outcomes.json.',
    ]),
  ]);
}

export function renderRecommendations(report: RevenueLearningReport): string {
  const recommendation = report.recommendations;
  return document(report, 'Revenue Learning Recommendations', [
    bullets([
      `Best Channel: ${recommendation.bestChannel}`,
      `Best Offer: ${recommendation.bestOffer}`,
      `Best Industry: ${recommendation.bestIndustry}`,
      `Best Price Point: ${recommendation.bestPricePoint}`,
      `Best Lead Category: ${recommendation.bestLeadCategory}`,
      `Best Message Type: ${recommendation.bestMessageType}`,
      `Worst Channel: ${recommendation.worstChannel}`,
      `Worst Offer: ${recommendation.worstOffer}`,
      `Worst Industry: ${recommendation.worstIndustry}`,
      `Recommendation Confidence: ${recommendation.confidence}`,
    ]),
    '',
    '## Recommended Actions',
    '',
    numbered(recommendation.actions),
  ]);
}

export function renderCalibrationSummary(report: RevenueLearningReport): string {
  return document(report, 'Revenue Calibration Summary', [
    bullets([
      `Calibration Status: ${report.status}`,
      `Outcomes Recorded: ${report.outcomes.length}`,
      `Maximum Historical Influence: 20%`,
      `Current Historical Influence: ${report.calibrationInfluence}%`,
      `Discovery and qualification influence: ${100 - report.calibrationInfluence}%`,
    ]),
    '',
    'Revenue Intelligence consumes this signal only when real outcomes exist.',
  ]);
}

export function renderRevenueLearningStatus(report: RevenueLearningReport): string {
  return document(report, 'Revenue Learning Status', [
    bullets([
      `Status: ${report.status}`,
      `Outcomes Recorded: ${report.outcomes.length}`,
      `Recommendation Confidence: ${report.recommendations.confidence}`,
      `Calibration Influence: ${report.calibrationInfluence}%`,
    ]),
    '',
    'Thresholds: 0-4 INSUFFICIENT HISTORY; 5-19 LEARNING; 20-49 CALIBRATED; 50+ HIGH CONFIDENCE.',
  ]);
}

export function renderPerformance(title: string, metrics: PerformanceMetric[], report: RevenueLearningReport): string {
  return document(report, title, [
    metrics.length > 0 ? [
      '| Segment | Outcomes | Sent | Replies | Meetings | Proposals | Wins | Retained | Expanded | Churned | Reply Rate | Meeting Rate | Close Rate | Retention Rate | Score |',
      '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
      ...metrics.map((metric) => `| ${escapeTable(metric.key)} | ${metric.outcomes} | ${metric.messagesSent} | ${metric.replies} | ${metric.meetings} | ${metric.proposals} | ${metric.wins} | ${metric.retained} | ${metric.expanded} | ${metric.churned} | ${metric.replyRate}% | ${metric.meetingRate}% | ${metric.closeRate}% | ${metric.retentionRate}% | ${metric.performanceScore} |`),
    ].join('\n') : 'Insufficient outcome history.',
  ]);
}

function groupPerformance(records: CommercialOutcomeRecord[], keyFor: (record: CommercialOutcomeRecord) => string): PerformanceMetric[] {
  const groups = new Map<string, CommercialOutcomeRecord[]>();
  for (const record of records) {
    const key = keyFor(record).trim() || 'Other';
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }
  return [...groups.entries()]
    .map(([key, group]) => metricFor(key, group))
    .sort((left, right) => right.performanceScore - left.performanceScore || right.outcomes - left.outcomes || left.key.localeCompare(right.key));
}

function metricFor(key: string, records: CommercialOutcomeRecord[]): PerformanceMetric {
  const count = (outcomes: CommercialOutcome[]) => records.filter((record) => outcomes.includes(record.outcome)).length;
  const messagesSent = records.length;
  const replies = count(['replied', 'meeting', 'proposal', 'won', 'lost', 'retained', 'expanded', 'churned']);
  const meetings = count(['meeting', 'proposal', 'won', 'lost', 'retained', 'expanded', 'churned']);
  const proposals = count(['proposal', 'won', 'lost', 'retained', 'expanded', 'churned']);
  const wins = count(['won', 'retained', 'expanded', 'churned']);
  const losses = count(['lost']);
  const retained = count(['retained', 'expanded']);
  const expanded = count(['expanded']);
  const churned = count(['churned']);
  const replyRate = rate(replies, messagesSent);
  const meetingRate = rate(meetings, messagesSent);
  const closeRate = rate(wins, proposals || messagesSent);
  const retentionRate = rate(retained, retained + churned);
  const interestRate = replyRate;
  const performanceScore = clamp(Math.round(
    replyRate * 0.2
    + meetingRate * 0.2
    + closeRate * 0.3
    + retentionRate * 0.2
    + rate(expanded, messagesSent) * 0.1
    - rate(losses + churned, messagesSent) * 0.1,
  ));

  return {
    key,
    outcomes: records.length,
    messagesSent,
    replies,
    meetings,
    proposals,
    wins,
    losses,
    retained,
    expanded,
    churned,
    replyRate,
    meetingRate,
    closeRate,
    retentionRate,
    interestRate,
    performanceScore,
  };
}

function buildRecommendations(
  total: number,
  channels: PerformanceMetric[],
  offers: PerformanceMetric[],
  leads: PerformanceMetric[],
  industries: PerformanceMetric[],
  pricing: PerformanceMetric[],
  messages: PerformanceMetric[],
): RevenueLearningRecommendations {
  const insufficient = 'Insufficient outcome history.';
  const confidence = confidenceFor(total);
  return {
    bestChannel: best(channels)?.key ?? insufficient,
    bestOffer: best(offers)?.key ?? insufficient,
    bestIndustry: best(industries)?.key ?? insufficient,
    bestPricePoint: best(pricing)?.key ?? insufficient,
    bestLeadCategory: best(leads)?.key ?? insufficient,
    bestMessageType: best(messages)?.key ?? insufficient,
    worstChannel: worst(channels)?.key ?? insufficient,
    worstOffer: worst(offers)?.key ?? insufficient,
    worstIndustry: worst(industries)?.key ?? insufficient,
    confidence,
    actions: total === 0 ? [
      'Record only real, manually verified commercial outcomes.',
      'Keep current discovery and Revenue Intelligence rankings unchanged.',
    ] : [
      'Use the strongest recorded segments as a bounded review signal, not an automatic decision.',
      'Review weak segments for message, offer, qualification, or delivery causes before reducing focus.',
      'Continue recording retention, expansion, and churn outcomes to improve long-term calibration.',
    ],
  };
}

function writeRevenueLearningData(report: RevenueLearningReport): void {
  ensureRevenueLearningStore();
  fs.writeFileSync(performancePaths.channels, `${JSON.stringify(report.channelPerformance, null, 2)}\n`, 'utf8');
  fs.writeFileSync(performancePaths.offers, `${JSON.stringify(report.offerPerformance, null, 2)}\n`, 'utf8');
  fs.writeFileSync(performancePaths.industries, `${JSON.stringify(report.industryPerformance, null, 2)}\n`, 'utf8');
  fs.writeFileSync(performancePaths.pricing, `${JSON.stringify(report.pricingPerformance, null, 2)}\n`, 'utf8');
  fs.writeFileSync(performancePaths.recommendations, `${JSON.stringify({
    generatedAt: report.generatedAt,
    status: report.status,
    calibrationInfluence: report.calibrationInfluence,
    recommendations: report.recommendations,
  }, null, 2)}\n`, 'utf8');
}

function normalizeStoredRecord(record: CommercialOutcomeRecord): CommercialOutcomeRecord {
  const normalized = buildCommercialOutcome({
    lead: record.lead,
    industry: record.industry,
    leadCategory: record.leadCategory,
    channel: record.channel,
    offer: record.offer,
    pricePoint: record.pricePoint,
    messageType: record.messageType,
    outcome: record.outcome,
    date: record.date,
    notes: record.notes,
  }, 1, record.createdAt);
  return {
    ...normalized,
    id: String(record.id ?? '').trim() || normalized.id,
  };
}

function statusFor(total: number): RevenueLearningStatus {
  if (total >= 50) return 'HIGH CONFIDENCE';
  if (total >= 20) return 'CALIBRATED';
  if (total >= 5) return 'LEARNING';
  return 'INSUFFICIENT HISTORY';
}

function calibrationInfluenceFor(total: number): number {
  if (total >= 50) return 20;
  if (total >= 20) return 15;
  if (total >= 5) return 5;
  return 0;
}

function confidenceFor(total: number): string {
  if (total >= 50) return 'HIGH';
  if (total >= 20) return 'MEDIUM';
  if (total >= 5) return 'LOW';
  return 'INSUFFICIENT HISTORY';
}

function best(metrics: PerformanceMetric[]): PerformanceMetric | undefined {
  return metrics[0];
}

function worst(metrics: PerformanceMetric[]): PerformanceMetric | undefined {
  return metrics.length > 1
    ? [...metrics].sort((left, right) => left.performanceScore - right.performanceScore || right.outcomes - left.outcomes)[0]
    : undefined;
}

function findMetric(metrics: PerformanceMetric[], key: string): PerformanceMetric | undefined {
  const normalized = normalizeKey(key);
  return metrics.find((metric) => normalizeKey(metric.key) === normalized || normalized.includes(normalizeKey(metric.key)) || normalizeKey(metric.key).includes(normalized));
}

function normalizedOffer(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized.includes('retainer')) return 'Retainer';
  if (normalized.includes('starter')) return 'Starter Pack';
  if (normalized.includes('audit')) return 'QA Audit';
  return value;
}

function canonicalIndustry(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized.includes('gym') || normalized.includes('fitness')) return 'Gym SaaS';
  if (normalized.includes('schedul')) return 'Scheduling SaaS';
  if (normalized.includes('membership')) return 'Membership SaaS';
  if (normalized.includes('booking')) return 'Booking SaaS';
  return 'Other';
}

function performanceRecordTable(records: CommercialOutcomeRecord[]): string {
  return [
    '| Lead | Industry | Channel | Offer | Outcome | Date | Notes |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...records.map((record) => `| ${escapeTable(record.lead)} | ${escapeTable(record.industry)} | ${escapeTable(record.channel)} | ${escapeTable(record.offer)} | ${record.outcome} | ${record.date} | ${escapeTable(record.notes)} |`),
  ].join('\n');
}

function document(report: RevenueLearningReport, title: string, body: string[]): string {
  return [
    `# ${title}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    ...body,
    '',
    '## Safety Rules',
    '',
    bullets(report.safetyRules),
    '',
  ].join('\n');
}

function required(value: string, field: string): string {
  const normalized = String(value ?? '').trim();
  if (!normalized) throw new Error(`Commercial outcome ${field} is required.`);
  return normalized;
}

function normalizePrice(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value) || value <= 0) throw new Error('Commercial outcome pricePoint must be a positive number.');
  return Math.round(value);
}

function rate(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function normalizeKey(value: string): string {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function slug(value: string): string {
  return normalizeKey(value).replace(/^-|-$/g, '') || 'outcome';
}

function bullets(items: string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : '- None.';
}

function numbered(items: string[]): string {
  return items.length > 0 ? items.map((item, index) => `${index + 1}. ${item}`).join('\n') : '1. None.';
}

function escapeTable(value: string): string {
  return String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
