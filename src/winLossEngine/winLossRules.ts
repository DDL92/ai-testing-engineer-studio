import fs = require('fs');
import path = require('path');
import { loadOutcomes } from '../outcomeTracking/outcomeRules';
import { OutcomeRecord } from '../outcomeTracking/types';
import { WinLossMetricSet, WinLossPattern, WinLossReport } from './types';

const outputRoot = path.join(process.cwd(), 'output', 'winloss');
const insufficientDataMessage = 'Not enough outcome data available.';

const safetyRules = [
  'Local-only win/loss intelligence.',
  'Use manually recorded Outcome Tracking data only.',
  'Never invent outcomes, replies, meetings, revenue, clients, wins, losses, segments, or patterns.',
  'Never send outreach, emails, proposals, meeting invites, invoices, payment links, or payments.',
  'Human approval remains required before any external action or strategy change.',
];

export function buildWinLossReport(records = loadOutcomes()): WinLossReport {
  const metrics = buildMetrics(records);
  const hasEnoughData = records.length >= 3;
  const replyPatterns = hasEnoughData ? supportedPatterns(records, 'channel', 'replied') : [];
  const offerPerformance = hasEnoughData ? supportedPatterns(records, 'action_type', 'won') : [];

  return {
    generatedAt: new Date().toISOString(),
    hasEnoughData,
    insufficientDataMessage,
    metrics,
    lostReasons: hasEnoughData ? lostReasons(records) : [],
    bestIndustries: hasEnoughData ? supportedPatterns(records, 'company', 'won') : [],
    bestOfferTypes: offerPerformance,
    bestLeadSources: hasEnoughData ? supportedPatterns(records, 'channel', 'won') : [],
    bestContactRoles: hasEnoughData ? supportedPatterns(records, 'contact', 'replied') : [],
    replyPatterns,
    offerPerformance,
    recommendations: buildRecommendations(hasEnoughData, replyPatterns, offerPerformance, records),
    safetyRules,
  };
}

export function writeWinLossAnalysis(report: WinLossReport): string[] {
  return writeOutputs([
    { fileName: 'win-loss-analysis.md', body: renderWinLossAnalysis(report) },
    { fileName: 'offer-performance.md', body: renderOfferPerformance(report) },
  ]);
}

export function writePatternAnalysis(report: WinLossReport): string[] {
  return writeOutputs([
    { fileName: 'pattern-analysis.md', body: renderPatternAnalysis(report) },
    { fileName: 'reply-patterns.md', body: renderReplyPatterns(report) },
  ]);
}

export function writeOpportunityInsights(report: WinLossReport): string[] {
  return writeOutputs([
    { fileName: 'opportunity-insights.md', body: renderOpportunityInsights(report) },
  ]);
}

export function writeStrategyRecommendations(report: WinLossReport): string[] {
  return writeOutputs([
    { fileName: 'strategy-recommendations.md', body: renderStrategyRecommendations(report) },
  ]);
}

export function renderWinLossAnalysis(report: WinLossReport): string {
  return [
    '# Win/Loss Analysis',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    report.hasEnoughData ? renderMetrics(report.metrics) : report.insufficientDataMessage,
    '',
    '## Lost Reasons',
    report.hasEnoughData ? renderList(report.lostReasons) : report.insufficientDataMessage,
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderPatternAnalysis(report: WinLossReport): string {
  return [
    '# Pattern Analysis',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    report.hasEnoughData ? [
      '## Best Industries',
      renderPatterns(report.bestIndustries),
      '',
      '## Best Offer Types',
      renderPatterns(report.bestOfferTypes),
      '',
      '## Best Lead Sources',
      renderPatterns(report.bestLeadSources),
      '',
      '## Best Contact Roles',
      renderPatterns(report.bestContactRoles),
    ].join('\n') : report.insufficientDataMessage,
    '',
    '## Rule',
    'Only patterns supported by local outcome data are reported.',
    '',
  ].join('\n');
}

export function renderOpportunityInsights(report: WinLossReport): string {
  return [
    '# Opportunity Insights',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    report.hasEnoughData ? renderList([
      `Highest converting segment: ${report.recommendations.highestConvertingSegment}`,
      `Highest converting offer: ${report.recommendations.highestConvertingOffer}`,
      `Most promising next target profile: ${report.recommendations.mostPromisingNextTargetProfile}`,
      `Biggest weakness in current pipeline: ${report.recommendations.biggestWeakness}`,
    ]) : report.insufficientDataMessage,
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderStrategyRecommendations(report: WinLossReport): string {
  return [
    '# Strategy Recommendations',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    report.hasEnoughData ? [
      '## What To Do More Of',
      renderList(report.recommendations.doMoreOf),
      '',
      '## What To Do Less Of',
      renderList(report.recommendations.doLessOf),
      '',
      '## Highest Converting Segment',
      report.recommendations.highestConvertingSegment,
      '',
      '## Highest Converting Offer',
      report.recommendations.highestConvertingOffer,
      '',
      '## Most Promising Next Target Profile',
      report.recommendations.mostPromisingNextTargetProfile,
      '',
      '## Biggest Weakness In Current Pipeline',
      report.recommendations.biggestWeakness,
      '',
      '## Top Learning',
      report.recommendations.topLearning,
      '',
      '## Top Recommendation',
      report.recommendations.topRecommendation,
    ].join('\n') : report.insufficientDataMessage,
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderReplyPatterns(report: WinLossReport): string {
  return [
    '# Reply Patterns',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    report.hasEnoughData ? renderPatterns(report.replyPatterns) : report.insufficientDataMessage,
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderOfferPerformance(report: WinLossReport): string {
  return [
    '# Offer Performance',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    report.hasEnoughData ? renderPatterns(report.offerPerformance) : report.insufficientDataMessage,
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

function buildMetrics(records: OutcomeRecord[]): WinLossMetricSet {
  const messagesSent = records.filter((record) => record.message_sent || record.response_status !== 'not_sent').length;
  const replies = records.filter((record) => record.response_status === 'replied').length;
  const meetings = records.filter((record) => record.meeting_status === 'meeting_booked').length;
  const proposals = records.filter((record) => record.proposal_status === 'proposal_sent').length;
  const wins = records.filter((record) => record.deal_status === 'won').length;
  const losses = records.filter((record) => record.deal_status === 'lost').length;

  return {
    totalOutcomes: records.length,
    messagesSent,
    replies,
    meetings,
    proposals,
    wins,
    losses,
    replyRate: rate(replies, messagesSent),
    meetingRate: rate(meetings, messagesSent),
    proposalRate: rate(proposals, messagesSent),
    closeRate: rate(wins, wins + losses),
  };
}

function supportedPatterns(records: OutcomeRecord[], key: keyof OutcomeRecord, successType: 'replied' | 'won'): WinLossPattern[] {
  const grouped = new Map<string, OutcomeRecord[]>();
  for (const record of records) {
    const rawValue = String(record[key] ?? '').trim();
    const value = rawValue || 'Unknown';
    grouped.set(value, [...(grouped.get(value) ?? []), record]);
  }

  return [...grouped.entries()]
    .filter(([, items]) => items.length >= 2)
    .map(([label, items]) => {
      const successes = successType === 'replied'
        ? items.filter((record) => record.response_status === 'replied').length
        : items.filter((record) => record.deal_status === 'won').length;
      return {
        label,
        evidence: `${successes}/${items.length} local outcomes matched ${successType}.`,
        sampleSize: items.length,
      };
    })
    .filter((pattern) => !pattern.evidence.startsWith('0/'))
    .sort((left, right) => right.sampleSize - left.sampleSize || left.label.localeCompare(right.label));
}

function lostReasons(records: OutcomeRecord[]): string[] {
  return records
    .filter((record) => record.deal_status === 'lost')
    .map((record) => `${record.company}: ${record.notes || 'No local lost reason recorded.'}`);
}

function buildRecommendations(
  hasEnoughData: boolean,
  replyPatterns: WinLossPattern[],
  offerPerformance: WinLossPattern[],
  records: OutcomeRecord[],
) {
  if (!hasEnoughData) {
    return {
      doMoreOf: [insufficientDataMessage],
      doLessOf: [insufficientDataMessage],
      highestConvertingSegment: 'Insufficient outcome history.',
      highestConvertingOffer: 'Insufficient outcome history.',
      mostPromisingNextTargetProfile: 'Insufficient outcome history.',
      biggestWeakness: records.length === 0 ? 'No manual outcomes recorded yet.' : 'Not enough outcome records to detect a reliable weakness.',
      topLearning: 'Insufficient outcome history.',
      topRecommendation: 'Record real outcomes after Daniel manually sends outreach.',
    };
  }

  const bestReplyPattern = replyPatterns[0];
  const bestOffer = offerPerformance[0];

  return {
    doMoreOf: [
      bestReplyPattern ? `Use more of the segment/source with evidence: ${bestReplyPattern.label}.` : 'Continue collecting outcomes before scaling a segment.',
      bestOffer ? `Use more of the offer/action type with evidence: ${bestOffer.label}.` : 'Keep offer testing conservative until wins are recorded.',
    ],
    doLessOf: [
      'Do less of any channel, role, or offer type after it has multiple no_reply or lost outcomes recorded locally.',
    ],
    highestConvertingSegment: bestReplyPattern ? `${bestReplyPattern.label}: ${bestReplyPattern.evidence}` : 'No supported segment pattern yet.',
    highestConvertingOffer: bestOffer ? `${bestOffer.label}: ${bestOffer.evidence}` : 'No supported offer pattern yet.',
    mostPromisingNextTargetProfile: bestReplyPattern ? `More targets similar to ${bestReplyPattern.label}.` : 'Continue with the current top local target profile until more outcomes exist.',
    biggestWeakness: 'Outcome sample size remains small; strategy confidence depends on more manually recorded results.',
    topLearning: bestReplyPattern ? bestReplyPattern.evidence : 'No supported pattern yet.',
    topRecommendation: 'Keep recording manual outcomes after each send so future recommendations can be evidence-based.',
  };
}

function renderMetrics(metrics: WinLossMetricSet): string {
  return renderList([
    `Total outcomes: ${metrics.totalOutcomes}`,
    `Messages sent: ${metrics.messagesSent}`,
    `Replies: ${metrics.replies}`,
    `Meetings: ${metrics.meetings}`,
    `Proposals: ${metrics.proposals}`,
    `Wins: ${metrics.wins}`,
    `Losses: ${metrics.losses}`,
    `Reply rate: ${metrics.replyRate}`,
    `Meeting rate: ${metrics.meetingRate}`,
    `Proposal rate: ${metrics.proposalRate}`,
    `Close rate: ${metrics.closeRate}`,
  ]);
}

function renderPatterns(patterns: WinLossPattern[]): string {
  if (patterns.length === 0) return '- No supported local pattern found.';
  return patterns.map((pattern) => `- ${pattern.label}: ${pattern.evidence} Sample size: ${pattern.sampleSize}.`).join('\n');
}

function writeOutputs(outputs: { fileName: string; body: string }[]): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });
  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }
  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

function rate(numerator: number, denominator: number): string {
  if (denominator <= 0) return 'Insufficient outcome history.';
  return `${Math.round((numerator / denominator) * 100)}%`;
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None from local outcome data.';
  return items.map((item) => `- ${item}`).join('\n');
}
