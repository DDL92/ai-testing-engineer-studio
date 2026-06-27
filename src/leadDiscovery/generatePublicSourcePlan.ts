import fs = require('fs');
import path = require('path');
import {
  PublicSourceEnrichmentType,
  PublicSourceMonitor,
  SourceMonitorResult,
} from './sourceMonitorTypes';

const sourceDir = path.join(process.cwd(), 'data', 'lead-discovery', 'public-source-monitor');
const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'source-monitor');
const planPath = path.join(outputDir, 'source-monitor-plan.md');
const summaryPath = path.join(outputDir, 'source-monitor-plan.json');

const safetyRules = [
  'No Tavily usage is included in this source-monitor plan.',
  'No providers, network calls, scraping, browser automation, or outreach are performed.',
  'No login-required sources are automated.',
  'No contact extraction, emails, DMs, calls, or form submissions are performed.',
  'All configured sources are sampleOnly planning metadata unless explicitly approved in a future sprint.',
];

export function loadPublicSourceMonitors(): PublicSourceMonitor[] {
  if (!fs.existsSync(sourceDir)) return [];
  return fs.readdirSync(sourceDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .sort()
    .flatMap((fileName) => JSON.parse(fs.readFileSync(path.join(sourceDir, fileName), 'utf8')) as PublicSourceMonitor[]);
}

export function buildPublicSourceMonitorResult(generatedAt = new Date().toISOString()): SourceMonitorResult {
  const sources = loadPublicSourceMonitors();
  const allowedSources = sources.filter((source) => source.allowed && !source.requiresLogin);
  const blockedSources = sources.filter((source) => !source.allowed || source.requiresLogin);
  const lowRiskSources = sources.filter((source) => source.riskLevel === 'low');
  const highRiskSources = sources.filter((source) => source.riskLevel === 'high');
  const enrichmentTypeDistribution = distribution(allowedSources.flatMap((source) => source.supportedEnrichmentTypes));
  const enrichmentSupportedCount = allowedSources.filter((source) => source.supportedEnrichmentTypes.length > 0).length;

  return {
    generatedAt,
    sources,
    health: {
      status: highRiskSources.length > 0 ? 'needs_review' : 'ready',
      enabledSourceCount: allowedSources.length,
      blockedSourceCount: blockedSources.length,
      lowRiskSourceCount: lowRiskSources.length,
      highRiskSourceCount: highRiskSources.length,
      recommendedNextAction: 'Keep this layer offline, review blocked sources manually, then add bounded RSS/Cheerio adapters in a future sprint.',
    },
    summary: {
      totalSources: sources.length,
      allowedSources: allowedSources.length,
      blockedSources: blockedSources.length,
      sourcesByClient: distribution(sources.map((source) => source.clientId)),
      sourcesByVertical: distribution(sources.map((source) => source.vertical)),
      riskDistribution: distribution(sources.map((source) => source.riskLevel)),
      enrichmentTypeDistribution,
    },
    safetyRules: [
      ...safetyRules,
      `${enrichmentSupportedCount} allowed source(s) include future enrichment hooks.`,
    ],
  };
}

function main(): void {
  const result = buildPublicSourceMonitorResult();

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(summaryPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  fs.writeFileSync(planPath, renderPlan(result), 'utf8');

  console.log(`Source monitor plan generated: ${path.relative(process.cwd(), planPath)}`);
  console.log(`Source monitor JSON generated: ${path.relative(process.cwd(), summaryPath)}`);
  console.log('Offline planning only. No Tavily, providers, network calls, scraping, browser automation, or outreach were performed.');
}

function renderPlan(result: SourceMonitorResult): string {
  const allowedSources = result.sources.filter((source) => source.allowed && !source.requiresLogin);
  const blockedSources = result.sources.filter((source) => !source.allowed || source.requiresLogin);
  const lowRiskSources = result.sources.filter((source) => source.riskLevel === 'low');
  const highRiskSources = result.sources.filter((source) => source.riskLevel === 'high');
  const enrichmentReadySources = allowedSources.filter((source) => source.supportedEnrichmentTypes.length > 0);

  return `# Public Source Monitor Plan

Generated: ${result.generatedAt}

## Status

- Source monitor status: ${result.health.status}
- Enabled sources: ${result.health.enabledSourceCount}
- Blocked sources: ${result.health.blockedSourceCount}
- Low-risk sources: ${result.health.lowRiskSourceCount}
- High-risk sources: ${result.health.highRiskSourceCount}
- Enrichment-supported sources: ${enrichmentReadySources.length}
- Integration readiness: Ready for offline candidate shaping; not integrated with live search.
- Recommended next action: ${result.health.recommendedNextAction}

## Sources By Client

${renderCounts(result.summary.sourcesByClient)}

## Sources By Vertical

${renderCounts(result.summary.sourcesByVertical)}

## Supported Enrichment Type Distribution

${renderCounts(result.summary.enrichmentTypeDistribution)}

## Enabled Sources

${allowedSources.map(renderSourceLine).join('\n') || '- None.'}

## Blocked Sources

${blockedSources.map(renderSourceLine).join('\n') || '- None.'}

## Low-Risk Sources

${lowRiskSources.map(renderSourceLine).join('\n') || '- None.'}

## High-Risk Sources

${highRiskSources.map(renderSourceLine).join('\n') || '- None.'}

## Recommended Next Sources

- RSS feeds for public event calendars with no login and clear robots/terms review.
- Bounded public notice pages where municipality/project metadata is visible without authentication.
- Public tourism calendars with date/location fields suitable for seasonality enrichment.
- Chamber and local directory listings with business profile context and no contact extraction.

## Sources Best Suited For Future Enrichment

${enrichmentReadySources
    .sort((left, right) => right.supportedEnrichmentTypes.length - left.supportedEnrichmentTypes.length || left.sourceId.localeCompare(right.sourceId))
    .map((source) => `- ${source.sourceName}: ${source.supportedEnrichmentTypes.join(', ')}. ${source.enrichmentNotes ?? source.notes}`)
    .join('\n') || '- None.'}

## Safety Rules

${result.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function renderSourceLine(source: PublicSourceMonitor): string {
  return `- ${source.sourceName} (${source.sourceId}) — client: ${source.clientId}; vertical: ${source.vertical}; type: ${source.sourceType}; allowed: ${source.allowed ? 'yes' : 'no'}; login: ${source.requiresLogin ? 'yes' : 'no'}; risk: ${source.riskLevel}; enrichment: ${source.supportedEnrichmentTypes.join(', ') || 'none'}; sampleOnly: ${source.sampleOnly ? 'yes' : 'no'}`;
}

function renderCounts(counts: Record<string, number>): string {
  const rows = Object.entries(counts).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  return rows.map(([key, count]) => `- ${key}: ${count}`).join('\n') || '- None.';
}

function distribution<T extends string>(items: T[]): Record<T, number> {
  return items.reduce<Record<T, number>>((counts, item) => {
    counts[item] = (counts[item] ?? 0) + 1;
    return counts;
  }, {} as Record<T, number>);
}

export function countEnrichmentTypes(sources: PublicSourceMonitor[]): Record<PublicSourceEnrichmentType, number> {
  return distribution(sources.flatMap((source) => source.supportedEnrichmentTypes));
}

if (require.main === module) main();
