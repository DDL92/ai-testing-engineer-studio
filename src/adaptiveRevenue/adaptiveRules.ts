import fs = require('fs');
import path = require('path');
import { loadOutcomeLearningRecords } from '../outcomeLearning/learningRules';
import { OutcomeLearningRecord } from '../outcomeLearning/types';
import { buildLeadQualificationReport } from '../webLeadQualification/normalizationRules';
import { NormalizedWebLead } from '../webLeadQualification/types';
import {
  AdaptiveHistoricalWeights,
  AdaptiveLeadScore,
  AdaptiveRevenueDashboard,
  AdaptiveRevenueReport,
  AdaptiveSignalScore,
} from './types';

const outputRoot = path.join(process.cwd(), 'output', 'adaptive-revenue');
const adaptiveOutcomes = ['SENT', 'REPLIED', 'MEETING', 'PROPOSAL', 'WON', 'LOST'];

const safetyRules = [
  'Adaptive Revenue uses manually recorded local outcomes only.',
  'No outcomes, replies, meetings, proposals, wins, losses, revenue, clients, or interest are invented.',
  'No outreach, emails, LinkedIn messages, CRM records, invoices, meetings, payments, or external actions are created.',
  'Adaptive learning is a small ranking signal and never exceeds 20% influence.',
  'Human approval remains required before external action.',
];

export function buildAdaptiveRevenueReport(): AdaptiveRevenueReport {
  const allOutcomes = loadOutcomeLearningRecords();
  const outcomes = allOutcomes.filter((record) => adaptiveOutcomes.includes(record.outcome));
  const weights = buildHistoricalWeights(allOutcomes.length, outcomes.length);
  const qualification = buildLeadQualificationReport();
  const offerScores = groupedScores(outcomes, (record) => record.offer);
  const categoryScores = groupedScores(outcomes, (record) => record.category);
  const channelScores = groupedScores(outcomes, (record) => record.channel);
  const leadScores = qualification.topQualifiedLeads.map((lead) => adaptiveScoreForLead(lead, weights, outcomes, offerScores, categoryScores));
  const bestOffer = offerScores[0]?.key ?? 'Insufficient outcome history.';
  const bestCategory = categoryScores[0]?.key ?? 'Insufficient outcome history.';
  const bestChannel = channelScores[0]?.key ?? 'Insufficient outcome history.';

  return {
    generatedAt: new Date().toISOString(),
    weights,
    leadScores: leadScores.sort((left, right) => right.adaptiveScore - left.adaptiveScore || right.baseScore - left.baseScore || left.companyName.localeCompare(right.companyName)),
    offerScores,
    categoryScores,
    channelScores,
    bestPerformingCategory: bestCategory,
    bestPerformingOffer: bestOffer,
    bestPerformingChannel: bestChannel,
    adaptiveRecommendation: recommendation(weights, bestCategory, bestOffer, bestChannel),
    safetyRules,
  };
}

export function buildAdaptiveRevenueDashboard(): AdaptiveRevenueDashboard {
  const report = buildAdaptiveRevenueReport();
  return {
    adaptiveLearningStatus: report.weights.readiness,
    bestPerformingCategory: report.bestPerformingCategory,
    bestPerformingOffer: report.bestPerformingOffer,
    learningInfluence: `${report.weights.learningWeight}%`,
  };
}

export function adaptiveSignalForLead(lead: { companyName: string; category: string; recommendedOffer: string; qualificationScore: number; qaOpportunityScore: number }): { score: number; influence: number; reason: string; hasOutcomes: boolean } {
  const report = buildAdaptiveRevenueReport();
  if (report.weights.learningWeight === 0) {
    return {
      score: baseLeadScore(lead.qualificationScore, lead.qaOpportunityScore),
      influence: 0,
      reason: 'No usable historical outcomes. Adaptive signal is inactive.',
      hasOutcomes: false,
    };
  }

  const match = report.leadScores.find((item) => normalizeKey(item.companyName) === normalizeKey(lead.companyName))
    ?? adaptiveScoreForLead(
      {
        normalizedName: lead.companyName,
        category: lead.category,
        recommendedOffer: lead.recommendedOffer,
        qualificationScore: lead.qualificationScore,
        qaOpportunityScore: lead.qaOpportunityScore,
      } as NormalizedWebLead,
      report.weights,
      loadOutcomeLearningRecords().filter((record) => adaptiveOutcomes.includes(record.outcome)),
      report.offerScores,
      report.categoryScores,
    );

  return {
    score: match.learningScore,
    influence: match.learningInfluence,
    reason: match.reason,
    hasOutcomes: true,
  };
}

export function writeAdaptiveWeightsOutput(report = buildAdaptiveRevenueReport()): string[] {
  return writeOutputs([
    { fileName: 'historical-weights.md', body: renderHistoricalWeights(report) },
    { fileName: 'adaptive-readiness.md', body: renderAdaptiveReadiness(report) },
  ]);
}

export function writeAdaptiveLeadScoresOutput(report = buildAdaptiveRevenueReport()): string[] {
  return writeOutputs([
    { fileName: 'adaptive-lead-scores.md', body: renderAdaptiveLeadScores(report) },
    { fileName: 'adaptive-readiness.md', body: renderAdaptiveReadiness(report) },
  ]);
}

export function writeAdaptiveOfferScoresOutput(report = buildAdaptiveRevenueReport()): string[] {
  return writeOutputs([
    { fileName: 'adaptive-offer-scores.md', body: renderAdaptiveSignalScores('Adaptive Offer Scores', report.generatedAt, report.offerScores, report) },
    { fileName: 'adaptive-readiness.md', body: renderAdaptiveReadiness(report) },
  ]);
}

export function writeAdaptiveCategoryScoresOutput(report = buildAdaptiveRevenueReport()): string[] {
  return writeOutputs([
    { fileName: 'adaptive-category-scores.md', body: renderAdaptiveSignalScores('Adaptive Category Scores', report.generatedAt, report.categoryScores, report) },
    { fileName: 'adaptive-readiness.md', body: renderAdaptiveReadiness(report) },
  ]);
}

export function writeAdaptiveRecommendationsOutput(report = buildAdaptiveRevenueReport()): string[] {
  return writeOutputs([
    { fileName: 'adaptive-recommendations.md', body: renderAdaptiveRecommendations(report) },
    { fileName: 'adaptive-readiness.md', body: renderAdaptiveReadiness(report) },
  ]);
}

export function renderHistoricalWeights(report: AdaptiveRevenueReport): string {
  return [
    '# Historical Weights',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderList([
      `Total recorded outcomes: ${report.weights.totalOutcomes}`,
      `Usable adaptive outcomes: ${report.weights.usableOutcomes}`,
      `Existing Revenue Intelligence weight: ${report.weights.existingModelWeight}%`,
      `Historical learning weight: ${report.weights.learningWeight}%`,
      `Readiness: ${report.weights.readiness}`,
      `Explanation: ${report.weights.explanation}`,
    ]),
    '',
    '## Weighting Rules',
    renderList([
      '0 usable outcomes: 100% existing model, 0% learning.',
      '1-9 usable outcomes: 95% existing model, 5% learning.',
      '10-24 usable outcomes: 90% existing model, 10% learning.',
      '25-49 usable outcomes: 85% existing model, 15% learning.',
      '50-99 usable outcomes: 80% existing model, 20% learning.',
      '100+ usable outcomes: 80% existing model, 20% learning.',
    ]),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderAdaptiveLeadScores(report: AdaptiveRevenueReport): string {
  return [
    '# Adaptive Lead Scores',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    report.leadScores.length > 0 ? [
      '| Rank | Lead | Category | Offer | Base Score | Learning Score | Learning Influence | Adaptive Score | Reason |',
      '| ---: | --- | --- | --- | ---: | ---: | ---: | ---: | --- |',
      ...report.leadScores.map((lead, index) => `| ${index + 1} | ${escapeTable(lead.companyName)} | ${escapeTable(lead.category)} | ${escapeTable(lead.recommendedOffer)} | ${lead.baseScore} | ${lead.learningScore} | ${lead.learningInfluence}% | ${lead.adaptiveScore} | ${escapeTable(lead.reason)} |`),
    ].join('\n') : 'No qualified leads available.',
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderAdaptiveRecommendations(report: AdaptiveRevenueReport): string {
  return [
    '# Adaptive Recommendations',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderList([
      `Adaptive learning status: ${report.weights.readiness}`,
      `Best performing category: ${report.bestPerformingCategory}`,
      `Best performing offer: ${report.bestPerformingOffer}`,
      `Best performing channel: ${report.bestPerformingChannel}`,
      `Learning influence: ${report.weights.learningWeight}%`,
      `Recommendation: ${report.adaptiveRecommendation}`,
    ]),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderAdaptiveReadiness(report: AdaptiveRevenueReport): string {
  return [
    '# Adaptive Readiness',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    renderList([
      `Status: ${report.weights.readiness}`,
      `Usable outcomes: ${report.weights.usableOutcomes}`,
      `Learning influence: ${report.weights.learningWeight}%`,
      `Best category: ${report.bestPerformingCategory}`,
      `Best offer: ${report.bestPerformingOffer}`,
      `Best channel: ${report.bestPerformingChannel}`,
    ]),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

function renderAdaptiveSignalScores(title: string, generatedAt: string, scores: AdaptiveSignalScore[], report: AdaptiveRevenueReport): string {
  return [
    `# ${title}`,
    '',
    `Generated: ${generatedAt}`,
    '',
    scores.length > 0 ? [
      '| Rank | Segment | Outcomes | Reply Rate | Meeting Rate | Proposal Rate | Win Rate | Loss Rate | Performance Score |',
      '| ---: | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
      ...scores.map((score, index) => `| ${index + 1} | ${escapeTable(score.key)} | ${score.total} | ${score.replyRate}% | ${score.meetingRate}% | ${score.proposalRate}% | ${score.winRate}% | ${score.lossRate}% | ${score.performanceScore} |`),
    ].join('\n') : 'Insufficient outcome history.',
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

function buildHistoricalWeights(totalOutcomes: number, usableOutcomes: number): AdaptiveHistoricalWeights {
  const learningWeight = learningWeightFor(usableOutcomes);
  return {
    generatedAt: new Date().toISOString(),
    totalOutcomes,
    usableOutcomes,
    existingModelWeight: 100 - learningWeight,
    learningWeight,
    readiness: learningWeight > 0 ? 'Learning Active' : 'Insufficient History',
    explanation: learningWeight > 0
      ? `Using ${learningWeight}% adaptive influence from ${usableOutcomes} manually recorded usable outcome(s).`
      : 'No usable historical outcomes. Existing Revenue Intelligence behavior is unchanged.',
  };
}

function learningWeightFor(usableOutcomes: number): number {
  if (usableOutcomes <= 0) return 0;
  if (usableOutcomes < 10) return 5;
  if (usableOutcomes < 25) return 10;
  if (usableOutcomes < 50) return 15;
  if (usableOutcomes < 100) return 20;
  return 20;
}

function adaptiveScoreForLead(
  lead: NormalizedWebLead,
  weights: AdaptiveHistoricalWeights,
  outcomes: OutcomeLearningRecord[],
  offerScores: AdaptiveSignalScore[],
  categoryScores: AdaptiveSignalScore[],
): AdaptiveLeadScore {
  const baseScore = baseLeadScore(lead.qualificationScore, lead.qaOpportunityScore);
  const leadScores = groupedScores(outcomes, (record) => record.lead);
  const leadMetric = leadScores.find((score) => sameKey(score.key, lead.normalizedName));
  const offerMetric = offerScores.find((score) => sameKey(score.key, lead.recommendedOffer));
  const categoryMetric = categoryScores.find((score) => sameKey(score.key, lead.category));
  const available = [leadMetric, offerMetric, categoryMetric].filter((score): score is AdaptiveSignalScore => Boolean(score));
  const learningScore = available.length > 0
    ? Math.round(available.reduce((sum, score) => sum + score.performanceScore, 0) / available.length)
    : 50;
  const adaptiveScore = weights.learningWeight > 0
    ? Math.round(baseScore * (weights.existingModelWeight / 100) + learningScore * (weights.learningWeight / 100))
    : baseScore;

  return {
    companyName: lead.normalizedName,
    category: lead.category,
    recommendedOffer: lead.recommendedOffer,
    qualificationScore: lead.qualificationScore,
    qaOpportunityScore: lead.qaOpportunityScore,
    baseScore,
    learningScore,
    adaptiveScore,
    learningInfluence: weights.learningWeight,
    reason: available.length > 0
      ? `Learning from ${available.map((score) => score.key).join(', ')}.`
      : weights.learningWeight > 0 ? 'No matching historical segment yet; neutral learning score used.' : 'No usable outcome history; existing model unchanged.',
  };
}

function groupedScores(records: OutcomeLearningRecord[], keyFor: (record: OutcomeLearningRecord) => string): AdaptiveSignalScore[] {
  const groups = new Map<string, OutcomeLearningRecord[]>();
  for (const record of records) {
    const key = keyFor(record).trim() || 'Unknown';
    groups.set(key, [...(groups.get(key) ?? []), record]);
  }
  return Array.from(groups.entries())
    .map(([key, items]) => signalScoreFor(key, items))
    .sort((left, right) => right.performanceScore - left.performanceScore || right.total - left.total || left.key.localeCompare(right.key));
}

function signalScoreFor(key: string, records: OutcomeLearningRecord[]): AdaptiveSignalScore {
  const total = records.length;
  const replied = records.filter((record) => reached(record.outcome, 'REPLIED')).length;
  const meetings = records.filter((record) => reached(record.outcome, 'MEETING')).length;
  const proposals = records.filter((record) => reached(record.outcome, 'PROPOSAL')).length;
  const won = records.filter((record) => record.outcome === 'WON').length;
  const lost = records.filter((record) => record.outcome === 'LOST').length;
  const replyRate = rate(replied, total);
  const meetingRate = rate(meetings, total);
  const proposalRate = rate(proposals, total);
  const winRate = rate(won, total);
  const lossRate = rate(lost, total);
  return {
    key,
    total,
    replied,
    meetings,
    proposals,
    won,
    lost,
    replyRate,
    meetingRate,
    proposalRate,
    winRate,
    lossRate,
    performanceScore: Math.max(0, Math.min(100, Math.round(replyRate * 0.25 + meetingRate * 0.2 + proposalRate * 0.25 + winRate * 0.3 - lossRate * 0.1))),
  };
}

function reached(outcome: string, stage: 'REPLIED' | 'MEETING' | 'PROPOSAL'): boolean {
  if (outcome === 'WON') return true;
  if (outcome === 'LOST') return true;
  const order = ['SENT', 'REPLIED', 'MEETING', 'PROPOSAL'];
  return order.indexOf(outcome) >= order.indexOf(stage);
}

function recommendation(weights: AdaptiveHistoricalWeights, category: string, offer: string, channel: string): string {
  if (weights.learningWeight === 0) {
    return 'Insufficient outcome history. Keep using existing Revenue Intelligence ranking until real outcomes are recorded.';
  }
  return `Apply ${weights.learningWeight}% learning influence. Favor ${category}, ${offer}, and ${channel} only where current qualification remains strong.`;
}

function baseLeadScore(qualificationScore: number, qaOpportunityScore: number): number {
  return Math.round(qualificationScore * 0.55 + qaOpportunityScore * 0.45);
}

function rate(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function sameKey(left: string, right: string): boolean {
  return normalizeKey(left) === normalizeKey(right);
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
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
