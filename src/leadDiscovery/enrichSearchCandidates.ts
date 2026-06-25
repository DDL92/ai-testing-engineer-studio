import fs = require('fs');
import path = require('path');
import { buildCandidateEvidence } from './buildCandidateEvidence';
import { classifyLeadLikeCandidate } from './classifyLeadLikeCandidate';
import { LeadDiscoveryClientConfig } from './clientTypes';
import { EnrichedLeadCandidate, LeadTier, ContactabilityLevel } from './enrichedLeadTypes';
import { SearchCandidate, SearchCandidateBatch } from './searchCandidateTypes';

interface EnrichmentBatch {
  generatedAt: string;
  totalCandidates: number;
  excludedByLeadLikeClassification: number;
  enrichedCandidates: EnrichedLeadCandidate[];
  safetyRules: string[];
}

interface ClientSignals {
  leadType: string;
  location: string;
  recencyDays: number | null;
  budgetSignal: string;
  eventType: string;
  tripType: string;
  contactability: ContactabilityLevel;
  intentScore: number;
  recencyScore: number;
  locationFitScore: number;
  budgetScore: number;
  contactabilityScore: number;
  fitScore: number;
  reasons: string[];
}

const clientsDir = path.join(process.cwd(), 'data', 'lead-discovery', 'clients');
const candidatesPath = path.join(process.cwd(), 'output', 'lead-discovery', 'search-candidates', 'search-candidates.json');
const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'enriched-leads');
const enrichedPath = path.join(outputDir, 'enriched-leads.json');
const summaryPath = path.join(outputDir, 'enrichment-summary.md');

const safetyRules = [
  'Deterministic local enrichment only: query, title, snippet, URL, and client config are used.',
  'No network requests, page visits, browser automation, scraping, AI calls, or LLM inference are performed.',
  'No email, phone, profile, or contact information is extracted.',
  'Human review is required before delivery, enrichment escalation, or contact.',
];

export function enrichSearchCandidates(now = new Date()): EnrichmentBatch {
  const generatedAt = now.toISOString();
  const clients = readActiveClients().sort(compareClientPriority);
  const clientById = new Map(clients.map((client) => [client.clientId, client]));
  const sourceBatch = readSearchCandidates();
  const leadLikeCandidates = sourceBatch.candidates
    .map(ensureLeadLikeClassification)
    .filter((candidate) => clientById.has(candidate.clientId))
    .filter(isEligibleForEnrichment);
  const enrichedCandidates = leadLikeCandidates
    .map((candidate, index) => enrichCandidate(candidate, clientById.get(candidate.clientId)!, generatedAt, index + 1))
    .sort(compareEnrichedPriority);

  const batch: EnrichmentBatch = {
    generatedAt,
    totalCandidates: sourceBatch.candidates.length,
    excludedByLeadLikeClassification: sourceBatch.candidates.length - leadLikeCandidates.length,
    enrichedCandidates,
    safetyRules,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(enrichedPath, `${JSON.stringify(batch, null, 2)}\n`, 'utf8');
  fs.writeFileSync(summaryPath, renderSummary(batch, clients), 'utf8');
  for (const client of clients) {
    fs.writeFileSync(
      path.join(outputDir, `${client.clientId}-enriched.md`),
      renderClientEnrichment(client, batch, generatedAt),
      'utf8',
    );
  }

  return batch;
}

function enrichCandidate(
  candidate: SearchCandidate,
  client: LeadDiscoveryClientConfig,
  generatedAt: string,
  index: number,
): EnrichedLeadCandidate {
  const signals = client.vertical === 'travel_leads'
    ? travelSignals(candidate, client)
    : cateringSignals(candidate, client);
  const overallScore = weightedScore(client, signals);
  const leadTier = tierFor(overallScore, signals);
  const evidence = buildCandidateEvidence({
    sourceUrl: candidate.url,
    sourceName: candidate.sourceName,
    sourceCategory: candidate.sourceCategory,
    title: candidate.title,
    snippet: candidate.snippet,
    query: candidate.query,
    buyerType: signals.intentScore >= 4 ? 'buyer' : 'unknown',
    intentSignals: signals.reasons,
    sourceQuality: 'unknown',
    estimatedRecencyDays: signals.recencyDays,
  });

  return {
    id: `enriched-lead-${String(index).padStart(5, '0')}`,
    clientId: candidate.clientId,
    clientName: candidate.clientName,
    vertical: candidate.vertical,
    sourceName: candidate.sourceName,
    sourceCategory: candidate.sourceCategory,
    query: candidate.query,
    queryTemplateId: candidate.queryTemplateId,
    queryTemplateType: candidate.queryTemplateType,
    expectedSourceTypes: candidate.expectedSourceTypes,
    sourceQueryPriority: candidate.sourceQueryPriority,
    expectedLeadQuality: candidate.expectedLeadQuality,
    behaviorCategory: candidate.behaviorCategory,
    behaviorSignals: candidate.behaviorSignals,
    behaviorScore: candidate.behaviorScore,
    behaviorConfidence: candidate.behaviorConfidence,
    behaviorReasons: candidate.behaviorReasons,
    buyerSignals: candidate.buyerSignals,
    buyerSignalCount: candidate.buyerSignalCount,
    buyerSignalCategories: candidate.buyerSignalCategories,
    buyerSignalStrength: candidate.buyerSignalStrength,
    url: candidate.url,
    title: candidate.title,
    snippet: candidate.snippet,
    discoveredAt: candidate.discoveredAt || generatedAt,
    estimatedLeadType: signals.leadType,
    estimatedLocation: signals.location,
    estimatedRecencyDays: signals.recencyDays,
    estimatedBudgetSignal: signals.budgetSignal,
    estimatedEventType: signals.eventType,
    estimatedTripType: signals.tripType,
    estimatedContactability: signals.contactability,
    intentScore: signals.intentScore,
    recencyScore: signals.recencyScore,
    locationFitScore: signals.locationFitScore,
    budgetScore: signals.budgetScore,
    contactabilityScore: signals.contactabilityScore,
    overallScore,
    leadTier,
    manualReviewRequired: true,
    reasons: signals.reasons,
    notes: 'Rule-based enrichment only. No network request, page visit, scraping, contact extraction, AI call, outreach, DM, call, or form submission was performed.',
    leadLikeClassification: candidate.leadLikeClassification,
    leadLikeReasons: candidate.leadLikeReasons,
    leadLikeScore: candidate.leadLikeScore,
    leadLikeConfidence: candidate.leadLikeConfidence,
    leadLikeSignals: candidate.leadLikeSignals,
    ...evidence,
  };
}

function ensureLeadLikeClassification(candidate: SearchCandidate): SearchCandidate {
  if (candidate.leadLikeClassification) return candidate;
  return {
    ...candidate,
    ...classifyLeadLikeCandidate({
      sourceUrl: candidate.url,
      sourceName: candidate.sourceName,
      sourceCategory: candidate.sourceCategory,
      title: candidate.title,
      snippet: candidate.snippet,
      query: candidate.query,
    }),
  };
}

function isEligibleForEnrichment(candidate: SearchCandidate): boolean {
  return candidate.leadLikeClassification === 'lead_like' || candidate.leadLikeClassification === 'possibly_lead_like';
}

function cateringSignals(candidate: SearchCandidate, client: LeadDiscoveryClientConfig): ClientSignals {
  const text = normalizedText(candidate);
  const leadType = firstMatch(text, [
    'wedding catering',
    'corporate catering',
    'private dinner catering',
    'charity event catering',
    'bar service',
    'event rentals',
    'food service',
    'catering',
  ]) ?? 'catering lead';
  const location = locationFor(text, client.targetLocations, [
    ['New York', /\b(new york|nyc|ny)\b/],
    ['New Jersey', /\b(new jersey|nj)\b/],
    ['Pennsylvania', /\b(pennsylvania|pa)\b/],
    ['Tri-State Area', /\btri state\b/],
  ]);
  const recency = recencyFor(text);
  const budgetSignal = firstMatch(text, ['luxury', 'private chef', 'corporate event', 'wedding', '$75', 'per head', 'guest count', 'plated dinner']) ?? 'not detected';
  const eventType = firstMatch(text, ['wedding', 'corporate event', 'private dinner', 'charity event', 'bar service', 'event rentals']) ?? leadType;
  const contactability = contactabilityFor(candidate);
  const reasons: string[] = [];

  const intentScore = scoreFromMatches(text, ['need catering', 'looking for catering', 'catering recommendations', 'wedding catering', 'corporate catering', 'bar service', 'event rentals'], 4, 10);
  const recencyScore = recency.score;
  const locationFitScore = location === 'unknown' ? 2 : 9;
  const budgetScore = budgetSignal === 'not detected' ? 3 : 8;
  const contactabilityScore = contactabilityScoreFor(contactability);
  const fitScore = eventType === 'catering lead' ? 5 : 8;

  reasons.push(`Lead type signal: ${leadType}.`);
  reasons.push(`Location signal: ${location}.`);
  reasons.push(`Recency signal: ${recency.label}.`);
  reasons.push(`Budget signal: ${budgetSignal}.`);
  reasons.push(`Contactability: ${contactability}.`);

  return {
    leadType,
    location,
    recencyDays: recency.days,
    budgetSignal,
    eventType,
    tripType: 'not applicable',
    contactability,
    intentScore,
    recencyScore,
    locationFitScore,
    budgetScore,
    contactabilityScore,
    fitScore,
    reasons,
  };
}

function travelSignals(candidate: SearchCandidate, client: LeadDiscoveryClientConfig): ClientSignals {
  const text = normalizedText(candidate);
  const leadType = firstMatch(text, [
    'family trip',
    'group trip',
    'corporate retreat',
    'luxury travel',
    'surf trip',
    'wellness retreat',
    'honeymoon',
    'bachelor party',
    'bachelorette party',
    'adventure travel',
    'relocation scouting',
  ]) ?? 'travel lead';
  const location = locationFor(text, client.targetLocations, [
    ['Tamarindo', /\btamarindo\b/],
    ['Uvita', /\buvita\b/],
    ['Costa Rica', /\bcosta rica\b/],
  ]);
  const recency = recencyFor(text);
  const budgetSignal = firstMatch(text, ['luxury', 'private chef', 'villa', 'corporate retreat', 'honeymoon', '$1,000', 'boutique hotel', 'private tour']) ?? 'not detected';
  const tripType = firstMatch(text, ['family trip', 'group trip', 'corporate retreat', 'luxury travel', 'surf trip', 'wellness retreat', 'honeymoon', 'adventure travel']) ?? leadType;
  const contactability = contactabilityFor(candidate);
  const reasons: string[] = [];

  const intentScore = scoreFromMatches(text, ['planning trip', 'itinerary', 'costa rica', 'family trip', 'group trip', 'corporate retreat', 'surf trip', 'honeymoon'], 4, 10);
  const recencyScore = recency.score;
  const locationFitScore = location === 'unknown' ? 2 : 9;
  const budgetScore = budgetSignal === 'not detected' ? 3 : 8;
  const contactabilityScore = contactabilityScoreFor(contactability);
  const fitScore = tripType === 'travel lead' ? 5 : 8;

  reasons.push(`Lead type signal: ${leadType}.`);
  reasons.push(`Location signal: ${location}.`);
  reasons.push(`Recency signal: ${recency.label}.`);
  reasons.push(`Budget signal: ${budgetSignal}.`);
  reasons.push(`Contactability: ${contactability}.`);

  return {
    leadType,
    location,
    recencyDays: recency.days,
    budgetSignal,
    eventType: 'not applicable',
    tripType,
    contactability,
    intentScore,
    recencyScore,
    locationFitScore,
    budgetScore,
    contactabilityScore,
    fitScore,
    reasons,
  };
}

function weightedScore(client: LeadDiscoveryClientConfig, signals: ClientSignals): number {
  const score = client.vertical === 'travel_leads'
    ? signals.intentScore * 0.25
      + signals.budgetScore * 0.25
      + signals.fitScore * 0.20
      + signals.recencyScore * 0.15
      + signals.locationFitScore * 0.10
      + signals.contactabilityScore * 0.05
    : signals.recencyScore * 0.30
      + signals.intentScore * 0.25
      + signals.locationFitScore * 0.15
      + signals.fitScore * 0.15
      + signals.contactabilityScore * 0.10
      + signals.budgetScore * 0.05;
  return Math.round(score * 10) / 10;
}

function tierFor(overallScore: number, signals: ClientSignals): LeadTier {
  const strongIntent = signals.intentScore >= 8 && signals.fitScore >= 8;
  const recencyStrong = signals.recencyScore >= 8;
  const locationFit = signals.locationFitScore >= 8;
  const contactable = signals.contactability === 'medium' || signals.contactability === 'high';
  if (overallScore >= 9 && recencyStrong && locationFit && contactable) return 'interest_verification_candidate';
  if (overallScore >= 8 && strongIntent) return 'warm_intent';
  return 'qualified_cold';
}

function readActiveClients(): LeadDiscoveryClientConfig[] {
  if (!fs.existsSync(clientsDir)) return [];
  return fs.readdirSync(clientsDir)
    .filter((fileName) => fileName.endsWith('.json'))
    .filter((fileName) => !fileName.endsWith('.sample.json'))
    .sort()
    .map((fileName) => JSON.parse(fs.readFileSync(path.join(clientsDir, fileName), 'utf8')) as LeadDiscoveryClientConfig)
    .filter((client) => client.status === 'active');
}

function readSearchCandidates(): SearchCandidateBatch {
  if (!fs.existsSync(candidatesPath)) {
    throw new Error(`Search candidates not found: ${path.relative(process.cwd(), candidatesPath)}. Run npm run leads:search first.`);
  }
  return JSON.parse(fs.readFileSync(candidatesPath, 'utf8')) as SearchCandidateBatch;
}

function renderSummary(batch: EnrichmentBatch, clients: LeadDiscoveryClientConfig[]): string {
  return `# Enrichment Summary

Generated: ${batch.generatedAt}

## Client Priority

${clients.map((client, index) => `${index + 1}. ${client.clientName} (${client.clientId}) - ${client.vertical}`).join('\n') || '- No active clients found.'}

## Totals

- Source search candidates: ${batch.totalCandidates}
- Excluded before enrichment by lead-like classifier: ${batch.excludedByLeadLikeClassification}
- Enriched candidates: ${batch.enrichedCandidates.length}
- Average score: ${averageScore(batch.enrichedCandidates).toFixed(1)}

## Output Files

${clients.map((client) => `- output/lead-discovery/enriched-leads/${client.clientId}-enriched.md`).join('\n') || '- None.'}
- output/lead-discovery/enriched-leads/enriched-leads.json

## Tier Counts

${renderTierCounts(batch.enrichedCandidates)}

## Lead-Like Distribution

${renderTopValues(batch.enrichedCandidates.map((candidate) => candidate.leadLikeClassification))}

## Safety Rules

${batch.safetyRules.map((rule) => `- ${rule}`).join('\n')}
`;
}

function renderClientEnrichment(client: LeadDiscoveryClientConfig, batch: EnrichmentBatch, generatedAt: string): string {
  const candidates = batch.enrichedCandidates.filter((candidate) => candidate.clientId === client.clientId);
  return `# Enriched Leads - ${client.clientName}

Generated: ${generatedAt}

## Client Summary

- Client ID: ${client.clientId}
- Client name: ${client.clientName}
- Vertical: ${client.vertical}
- Status: ${client.status}
- Total enriched candidates: ${candidates.length}
- Average score: ${averageScore(candidates).toFixed(1)}

## Tier Counts

${renderTierCounts(candidates)}

## Top Sources

${renderTopValues(candidates.map((candidate) => hostFor(candidate.url)))}

## Top Event / Trip Types

${renderTopValues(candidates.map((candidate) => client.vertical === 'travel_leads' ? candidate.estimatedTripType : candidate.estimatedEventType))}

## Top 20 Candidates

${candidates.slice(0, 20).map((candidate, index) => `${index + 1}. [${cell(candidate.title)}](${candidate.url})
   - Score: ${candidate.overallScore}; tier: ${candidate.leadTier}; lead type: ${candidate.estimatedLeadType}; location: ${candidate.estimatedLocation}
   - Lead-like: ${candidate.leadLikeClassification}; score: ${candidate.leadLikeScore}; signals: ${candidate.leadLikeSignals.join(', ') || 'none'}
   - Recency: ${candidate.estimatedRecencyDays ?? 'unknown'} days; budget: ${candidate.estimatedBudgetSignal}; contactability: ${candidate.estimatedContactability}
   - Reasons: ${candidate.reasons.map(cell).join(' ')}`).join('\n') || '- No enriched candidates.'}

## Manual Review Disclaimer

These are enriched lead candidates only. They were scored with deterministic local rules from search result titles, snippets, URLs, queries, and client configuration. No scraping, page visits, AI calls, contact extraction, outreach, DMs, calls, or form submissions were performed. Daniel must review every candidate before delivery or contact.
`;
}

function renderTierCounts(candidates: EnrichedLeadCandidate[]): string {
  const tiers: LeadTier[] = ['interest_verification_candidate', 'warm_intent', 'qualified_cold'];
  return tiers.map((tier) => `- ${tier}: ${candidates.filter((candidate) => candidate.leadTier === tier).length}`).join('\n');
}

function renderTopValues(values: string[]): string {
  const rows = Object.entries(values.reduce<Record<string, number>>((counts, value) => {
    const key = value || 'unknown';
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {}))
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 10);
  return rows.map(([value, count]) => `- ${value}: ${count}`).join('\n') || '- None.';
}

function compareEnrichedPriority(left: EnrichedLeadCandidate, right: EnrichedLeadCandidate): number {
  if (left.clientId === 'flora_and_fauna_foods_001' && right.clientId !== 'flora_and_fauna_foods_001') return -1;
  if (right.clientId === 'flora_and_fauna_foods_001' && left.clientId !== 'flora_and_fauna_foods_001') return 1;
  return right.overallScore - left.overallScore || left.title.localeCompare(right.title);
}

function compareClientPriority(left: LeadDiscoveryClientConfig, right: LeadDiscoveryClientConfig): number {
  if (left.clientId === 'flora_and_fauna_foods_001') return -1;
  if (right.clientId === 'flora_and_fauna_foods_001') return 1;
  return left.clientName.localeCompare(right.clientName);
}

function normalizedText(candidate: SearchCandidate): string {
  return `${candidate.query} ${candidate.title} ${candidate.snippet} ${candidate.url}`.toLowerCase();
}

function firstMatch(text: string, terms: string[]): string | null {
  return terms.find((term) => text.includes(term.toLowerCase())) ?? null;
}

function locationFor(text: string, locations: string[], patterns: Array<[string, RegExp]>): string {
  for (const [label, pattern] of patterns) {
    if (pattern.test(text)) return label;
  }
  return locations.find((location) => text.includes(location.toLowerCase())) ?? 'unknown';
}

function recencyFor(text: string): { days: number | null; score: number; label: string } {
  if (/\b(today|this week|this weekend|coming soon)\b/.test(text)) return { days: 7, score: 10, label: 'very recent' };
  if (/\b(next month|august|september|planning now|in three weeks)\b/.test(text)) return { days: 30, score: 8, label: 'recent planning signal' };
  if (/\b(planning|date confirmed|traveling next month|event next month)\b/.test(text)) return { days: 45, score: 7, label: 'planning signal' };
  return { days: null, score: 3, label: 'not detected' };
}

function scoreFromMatches(text: string, terms: string[], base: number, max: number): number {
  const matches = terms.filter((term) => text.includes(term.toLowerCase())).length;
  return Math.min(max, base + matches * 2);
}

function contactabilityFor(candidate: SearchCandidate): ContactabilityLevel {
  const host = hostFor(candidate.url);
  const hostText = host.toLowerCase();
  if (/\b(eventective|tripadvisor|yelp|theknot|weddingwire)\b/.test(hostText)) return 'high';
  if (/\b(reddit|facebook)\b/.test(hostText)) return 'medium';
  if (/\b(wikipedia|dictionary|thesaurus|wordreference|cambridge|merriam|wiktionary)\b/.test(hostText)) return 'low';
  return 'unknown';
}

function contactabilityScoreFor(level: ContactabilityLevel): number {
  if (level === 'high') return 9;
  if (level === 'medium') return 6;
  if (level === 'low') return 3;
  return 2;
}

function averageScore(candidates: EnrichedLeadCandidate[]): number {
  if (candidates.length === 0) return 0;
  return candidates.reduce((sum, candidate) => sum + candidate.overallScore, 0) / candidates.length;
}

function hostFor(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

function cell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

function main(): void {
  try {
    const batch = enrichSearchCandidates();
    console.log(`Enriched candidates generated: ${path.relative(process.cwd(), summaryPath)}, ${path.relative(process.cwd(), enrichedPath)}`);
    console.log(`Enriched candidates: ${batch.enrichedCandidates.length}`);
    console.log(`Average score: ${averageScore(batch.enrichedCandidates).toFixed(1)}`);
    console.log('Deterministic local enrichment only. No network, scraping, browser automation, AI calls, contact extraction, or outreach was performed.');
  } catch (error) {
    console.error('Lead Signal Enrichment: FAILED');
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

if (require.main === module) main();
