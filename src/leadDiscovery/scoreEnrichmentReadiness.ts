import fs = require('fs');
import path = require('path');
import { buildMockSourceCandidates } from './generateMockSourceCandidates';
import {
  EnrichmentReadiness,
  EnrichmentReadinessMetadata,
  PublicSourceCandidate,
} from './sourceMonitorTypes';

const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'source-monitor');
const candidatesPath = path.join(outputDir, 'mock-source-candidates.json');
const readinessPath = path.join(outputDir, 'enrichment-readiness.json');
const reportPath = path.join(outputDir, 'enrichment-readiness.md');

interface ReadinessPayload {
  generatedAt: string;
  totalCandidates: number;
  readinessDistribution: Record<EnrichmentReadiness, number>;
  enrichmentReadyCandidates: number;
  supportedEnrichmentTypeDistribution: Record<string, number>;
  candidates: PublicSourceCandidate[];
  safetyRules: string[];
}

function main(): void {
  const generatedAt = new Date().toISOString();
  const candidates = readCandidates().map(scoreCandidate);
  const payload: ReadinessPayload = {
    generatedAt,
    totalCandidates: candidates.length,
    readinessDistribution: readinessDistribution(candidates),
    enrichmentReadyCandidates: candidates.filter((candidate) => candidate.enrichmentReadiness.readiness === 'ready').length,
    supportedEnrichmentTypeDistribution: distribution(candidates.flatMap((candidate) => candidate.supportedEnrichmentTypes)),
    candidates,
    safetyRules: [
      'Readiness scoring is offline only.',
      'No live enrichment, Tavily usage, providers, network calls, scraping, browser automation, or outreach were performed.',
      'Scores indicate future enrichment readiness, not verified lead quality.',
    ],
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(readinessPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  fs.writeFileSync(reportPath, renderReport(payload), 'utf8');

  console.log(`Enrichment readiness report generated: ${path.relative(process.cwd(), reportPath)}`);
  console.log(`Enrichment readiness JSON generated: ${path.relative(process.cwd(), readinessPath)}`);
  console.log('Offline scoring only. No live enrichment, Tavily, providers, network calls, scraping, browser automation, or outreach were performed.');
}

function readCandidates(): PublicSourceCandidate[] {
  if (!fs.existsSync(candidatesPath)) return buildMockSourceCandidates();
  const parsed = JSON.parse(fs.readFileSync(candidatesPath, 'utf8')) as { candidates?: PublicSourceCandidate[] };
  return parsed.candidates ?? [];
}

function scoreCandidate(candidate: PublicSourceCandidate): PublicSourceCandidate {
  const metadata = scoreMetadata(candidate);
  return {
    ...candidate,
    enrichmentReadiness: metadata,
  };
}

function scoreMetadata(candidate: PublicSourceCandidate): EnrichmentReadinessMetadata {
  const availableSignals = [
    candidate.locationHint ? 'locationHint' : null,
    candidate.dateHint ? 'dateHint' : null,
    candidate.eventTypeHint ? 'eventTypeHint' : null,
    candidate.projectTypeHint ? 'projectTypeHint' : null,
    candidate.expectedValue > 0 ? 'expectedValue' : null,
    verticalFitsCandidate(candidate) ? 'verticalFit' : null,
  ].filter((signal): signal is string => Boolean(signal));

  const missingSignals = [
    candidate.locationHint ? null : 'locationHint',
    candidate.dateHint ? null : 'dateHint',
    candidate.eventTypeHint || candidate.projectTypeHint ? null : 'eventTypeHint or projectTypeHint',
  ].filter((signal): signal is string => Boolean(signal));

  const score =
    (candidate.locationHint ? 20 : 0) +
    (candidate.dateHint ? 15 : 0) +
    (candidate.eventTypeHint ? 15 : 0) +
    (candidate.projectTypeHint ? 15 : 0) +
    Math.min(candidate.supportedEnrichmentTypes.length * 5, 25) +
    expectedValueScore(candidate.expectedValue) +
    (verticalFitsCandidate(candidate) ? 10 : 0);

  return {
    readiness: readinessFor(score, missingSignals.length),
    score,
    availableSignals,
    missingSignals,
    futureHooks: candidate.supportedEnrichmentTypes,
    notes: 'Scored from local hints only. No live enrichment performed.',
  };
}

function expectedValueScore(expectedValue: number): number {
  if (expectedValue >= 20000) return 15;
  if (expectedValue >= 5000) return 10;
  if (expectedValue > 0) return 5;
  return 0;
}

function readinessFor(score: number, missingSignalCount: number): EnrichmentReadiness {
  if (score >= 65 && missingSignalCount <= 1) return 'ready';
  if (score >= 35) return 'partial';
  return 'none';
}

function verticalFitsCandidate(candidate: PublicSourceCandidate): boolean {
  if (candidate.vertical === 'catering_leads') return Boolean(candidate.eventTypeHint);
  if (candidate.vertical === 'travel_leads') return Boolean(candidate.locationHint && (candidate.eventTypeHint || candidate.dateHint));
  if (candidate.vertical === 'real_estate_leads') return Boolean(candidate.projectTypeHint);
  if (candidate.vertical === 'website_leads') return Boolean(candidate.projectTypeHint && candidate.locationHint);
  return true;
}

function renderReport(payload: ReadinessPayload): string {
  const ready = payload.candidates.filter((candidate) => candidate.enrichmentReadiness.readiness === 'ready');
  return `# Enrichment Readiness

Generated: ${payload.generatedAt}

## Summary

- Candidates scored: ${payload.totalCandidates}
- Ready candidates: ${payload.enrichmentReadyCandidates}
- Partial candidates: ${payload.readinessDistribution.partial}
- None candidates: ${payload.readinessDistribution.none}
- Live enrichment performed: no
- Integration readiness: Ready for future Public Data Enrichment input; not connected to live search.

## Readiness Distribution

${Object.entries(payload.readinessDistribution).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

## Supported Enrichment Type Distribution

${Object.entries(payload.supportedEnrichmentTypeDistribution)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n') || '- None.'}

## Ready For Future Enrichment

${ready.map((candidate) => `- ${candidate.title} (${candidate.candidateId}) — score: ${candidate.enrichmentReadiness.score}; hooks: ${candidate.enrichmentReadiness.futureHooks.join(', ')}; value: $${candidate.expectedValue}; location: ${candidate.locationHint ?? 'missing'}; date: ${candidate.dateHint ?? 'missing'}; project/event: ${candidate.projectTypeHint ?? candidate.eventTypeHint ?? 'missing'}`).join('\n') || '- None.'}

## Candidate Scores

${payload.candidates.map((candidate) => `- ${candidate.candidateId}: ${candidate.enrichmentReadiness.readiness} (${candidate.enrichmentReadiness.score}) — available: ${candidate.enrichmentReadiness.availableSignals.join(', ') || 'none'}; missing: ${candidate.enrichmentReadiness.missingSignals.join(', ') || 'none'}`).join('\n')}

## Safety Rules

${payload.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function readinessDistribution(candidates: PublicSourceCandidate[]): Record<EnrichmentReadiness, number> {
  return {
    none: candidates.filter((candidate) => candidate.enrichmentReadiness.readiness === 'none').length,
    partial: candidates.filter((candidate) => candidate.enrichmentReadiness.readiness === 'partial').length,
    ready: candidates.filter((candidate) => candidate.enrichmentReadiness.readiness === 'ready').length,
  };
}

function distribution<T extends string>(items: T[]): Record<T, number> {
  return items.reduce<Record<T, number>>((counts, item) => {
    counts[item] = (counts[item] ?? 0) + 1;
    return counts;
  }, {} as Record<T, number>);
}

if (require.main === module) main();
