import { readClosedLeads, readConversions, readLeads, readOpportunities, readSources, writeSourceQualityReport } from '../storage/jsonStore';
import type { ClosedLeadRecord, ConversionRecord, Lead, LeadSource, Opportunity } from '../types/lead';
import { writeSourceQualityMarkdown } from './sourceQualityWriter';
import type { EnhancedLeadSource, SourceCategory, SourceQualityCategory, SourceQualityRecord, SourceQualityReport, SourceRecommendation } from './sourceTypes';

const qaKeywords = ['qa', 'testing', 'automation', 'playwright', 'cypress', 'selenium', 'sdet', 'regression', 'release', 'ci/cd', 'e2e'];

export function generateSourceQualityReport(): SourceQualityReport {
  const generatedAt = new Date().toISOString();
  const sources = readSources() as EnhancedLeadSource[];
  const opportunities = readOpportunities();
  const leads = readLeads();
  const conversions = readConversions();
  const closedLeads = readClosedLeads();
  const records = sources.map((source) => buildSourceQualityRecord(source, opportunities, leads, conversions, closedLeads, generatedAt));
  const report: SourceQualityReport = {
    generatedAt,
    summary: buildSummary(records),
    records,
    recommendations: buildRecommendations(records),
  };
  writeSourceQualityReport(report);
  writeSourceQualityMarkdown(report);
  return report;
}

export function readSourceQualitySnapshot(): Partial<SourceQualityReport> {
  try {
    const store = require('../storage/jsonStore') as typeof import('../storage/jsonStore');
    return store.readSourceQualityReport<Partial<SourceQualityReport>>({});
  } catch {
    return {};
  }
}

export function sourceQualityBoostForSource(sourceNameOrId: string): { points: number; reason: string } {
  const report = readSourceQualitySnapshot();
  const record = report.records?.find((item) => item.id === sourceNameOrId || item.name === sourceNameOrId);
  if (!record) return { points: 0, reason: '' };
  if (record.sourceQualityCategory === 'excellent') return { points: 5, reason: `+5 Excellent source quality: ${record.name}` };
  if (record.sourceQualityCategory === 'good') return { points: 3, reason: `+3 Good source quality: ${record.name}` };
  if (record.sourceQualityCategory === 'low priority') return { points: -5, reason: `-5 Low priority source quality: ${record.name}` };
  if (['manual_seed', 'referral', 'upwork_manual', 'linkedin_manual'].includes(record.category) && record.enabled) return { points: 3, reason: `+3 Manual high-intent source: ${record.name}` };
  return { points: 0, reason: '' };
}

function buildSourceQualityRecord(
  source: EnhancedLeadSource,
  opportunities: Opportunity[],
  leads: Lead[],
  conversions: ConversionRecord[],
  closedLeads: ClosedLeadRecord[],
  generatedAt: string,
): SourceQualityRecord {
  const sourceItems = [
    ...opportunities.filter((item) => matchesSource(item, source)),
    ...leads.filter((item) => matchesSource(item, source)),
  ];
  const unique = Array.from(new Map(sourceItems.map((item) => [item.id, item])).values());
  const hotLeadsFound = unique.filter((item) => item.scoreBreakdown.category === 'hot').length;
  const warmLeadsFound = unique.filter((item) => item.scoreBreakdown.category === 'warm').length;
  const lowLeadsFound = unique.filter((item) => item.scoreBreakdown.category === 'low').length;
  const ignoredLeadsFound = unique.filter((item) => item.scoreBreakdown.category === 'ignore' || ('status' in item && item.status === 'ignored')).length;
  const averageLeadScore = unique.length ? Math.round(unique.reduce((total, item) => total + item.score, 0) / unique.length) : 0;
  const conversionCount = conversions.filter((record) => unique.some((item) => item.id === record.leadId)).length;
  const wonCount = leads.filter((lead) => matchesSource(lead, source) && lead.status === 'won').length + conversionCount;
  const lostCount = closedLeads.filter((record) => unique.some((item) => item.id === record.leadId)).length;
  const keywords = source.includeKeywords ?? qaKeywords;
  const warnings = sourceWarnings(source, unique.length);
  const sourceQualityScore = scoreSource({
    source,
    total: unique.length,
    hotLeadsFound,
    warmLeadsFound,
    lowLeadsFound,
    ignoredLeadsFound,
    averageLeadScore,
    conversionCount,
    wonCount,
    hasContactOrWebsite: unique.some((item) => Boolean(item.website) || ('contactEmail' in item && Boolean(item.contactEmail)) || ('linkedinUrl' in item && Boolean(item.linkedinUrl))),
    hasKeywordMatch: unique.some((item) => sourceItemText(item).match(/qa|testing|automation|playwright|regression|sdet/)),
    warnings,
  });

  return {
    id: source.id,
    name: source.name,
    type: source.type,
    enabled: source.enabled,
    url: source.url ?? source.path ?? '',
    category: inferCategory(source),
    keywords,
    lastCheckedAt: generatedAt,
    totalOpportunitiesFound: unique.length,
    hotLeadsFound,
    warmLeadsFound,
    lowLeadsFound,
    ignoredLeadsFound,
    averageLeadScore,
    conversionCount,
    wonCount,
    lostCount,
    sourceQualityScore,
    sourceQualityCategory: categorizeQuality(sourceQualityScore),
    recommendation: recommendSource(sourceQualityScore, source, unique.length, ignoredLeadsFound + lowLeadsFound),
    notes: source.notes ?? '',
    warnings,
  };
}

function scoreSource(input: {
  source: EnhancedLeadSource;
  total: number;
  hotLeadsFound: number;
  warmLeadsFound: number;
  lowLeadsFound: number;
  ignoredLeadsFound: number;
  averageLeadScore: number;
  conversionCount: number;
  wonCount: number;
  hasContactOrWebsite: boolean;
  hasKeywordMatch: boolean;
  warnings: string[];
}): number {
  let score = 20;
  if (input.hotLeadsFound > 0) score += 30;
  if (input.warmLeadsFound > 0) score += 20;
  if (input.averageLeadScore >= 70) score += 20;
  else if (input.averageLeadScore >= 50) score += 12;
  if (input.hasContactOrWebsite) score += 10;
  if (input.hasKeywordMatch) score += 15;
  if (input.conversionCount > 0 || input.wonCount > 0 || hasContactedLead(input.source)) score += 20;
  if (input.total > 0 && input.lowLeadsFound + input.ignoredLeadsFound >= Math.max(3, input.total * 0.7)) score -= 25;
  if (input.total === 0) score -= 20;
  if (input.source.manualReviewRequired || ['upwork_manual', 'linkedin_manual'].includes(input.source.category ?? '')) score -= 10;
  return Math.max(0, Math.min(100, score));
}

function hasContactedLead(source: EnhancedLeadSource): boolean {
  return readLeads().some((lead) => matchesSource(lead, source) && ['contacted', 'proposal_sent', 'replied', 'won'].includes(lead.status));
}

function matchesSource(item: Opportunity | Lead, source: LeadSource): boolean {
  const sourceId = 'sourceId' in item ? item.sourceId : undefined;
  const sourceName = item.source;
  return sourceId === source.id || sourceName === source.name || sourceName === source.id;
}

function sourceItemText(item: Opportunity | Lead): string {
  if ('summary' in item) return `${item.detectedKeywords.join(' ')} ${item.summary}`.toLowerCase();
  return `${item.techStackHints.join(' ')} ${item.detectedPainPoint} ${item.qaFitReason}`.toLowerCase();
}

function inferCategory(source: EnhancedLeadSource): SourceCategory {
  if (source.category) return source.category;
  if (source.type === 'rss') return 'rss_feed';
  if (source.type === 'manual_json' || source.type === 'manual_text') return source.id.includes('seed') ? 'manual_seed' : 'other';
  if (source.id.includes('github')) return 'github_public_search';
  if (source.id.includes('upwork')) return 'upwork_manual';
  if (source.id.includes('linkedin')) return 'linkedin_manual';
  if (source.id.includes('agency')) return 'agency_directory';
  if (source.id.includes('startup')) return 'startup_directory';
  return source.type === 'public_page' ? 'public_job_board' : 'other';
}

function sourceWarnings(source: EnhancedLeadSource, total: number): string[] {
  return [
    source.manualReviewRequired ? 'Manual review required.' : '',
    ['upwork_manual', 'linkedin_manual'].includes(source.category ?? '') ? 'Manual-only source. Do not automate login or paid actions.' : '',
    source.enabled && total === 0 ? 'No usable opportunities found yet.' : '',
    source.enabled && !source.url && !source.path ? 'Enabled source has no URL or path.' : '',
  ].filter(Boolean);
}

function categorizeQuality(score: number): SourceQualityCategory {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'experimental';
  return 'low priority';
}

function recommendSource(score: number, source: EnhancedLeadSource, total: number, lowQualityCount: number): SourceRecommendation {
  if (source.manualReviewRequired) return 'review_manually';
  if (score >= 80) return 'add_more_similar_sources';
  if (score >= 60) return 'keep';
  if (total === 0 || lowQualityCount > total * 0.7) return 'improve_keywords';
  if (score < 40) return 'disable';
  return 'improve_keywords';
}

function buildSummary(records: SourceQualityRecord[]): SourceQualityReport['summary'] {
  const sorted = [...records].sort((a, b) => b.sourceQualityScore - a.sourceQualityScore);
  return {
    totalSources: records.length,
    enabledSources: records.filter((record) => record.enabled).length,
    disabledSources: records.filter((record) => !record.enabled).length,
    excellentSources: records.filter((record) => record.sourceQualityCategory === 'excellent').length,
    goodSources: records.filter((record) => record.sourceQualityCategory === 'good').length,
    experimentalSources: records.filter((record) => record.sourceQualityCategory === 'experimental').length,
    lowPrioritySources: records.filter((record) => record.sourceQualityCategory === 'low priority').length,
    bestSource: sorted[0] ? `${sorted[0].name} (${sorted[0].sourceQualityScore})` : 'None.',
    worstSource: sorted.at(-1) ? `${sorted.at(-1)!.name} (${sorted.at(-1)!.sourceQualityScore})` : 'None.',
  };
}

function buildRecommendations(records: SourceQualityRecord[]): string[] {
  return records.map((record) => {
    if (record.recommendation === 'add_more_similar_sources') return `${record.name}: excellent source. Add more similar public sources.`;
    if (record.recommendation === 'keep') return `${record.name}: keep enabled and monitor conversion quality.`;
    if (record.recommendation === 'improve_keywords') return `${record.name}: improve include/exclude keywords or review source fit.`;
    if (record.recommendation === 'disable') return `${record.name}: disable unless manual review shows better fit.`;
    return `${record.name}: review manually; do not automate login or paid actions.`;
  });
}
