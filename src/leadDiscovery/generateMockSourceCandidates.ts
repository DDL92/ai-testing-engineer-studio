import fs = require('fs');
import path = require('path');
import { loadPublicSourceMonitors } from './generatePublicSourcePlan';
import {
  EnrichmentReadinessMetadata,
  PublicSourceCandidate,
  PublicSourceMonitor,
} from './sourceMonitorTypes';

const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'source-monitor');
const candidatesPath = path.join(outputDir, 'mock-source-candidates.json');
const reportPath = path.join(outputDir, 'mock-source-candidates.md');

export function buildMockSourceCandidates(): PublicSourceCandidate[] {
  const sources = loadPublicSourceMonitors();
  const sourceById = new Map(sources.map((source) => [source.sourceId, source]));

  return [
    candidate(sourceById, {
      candidateId: 'sample_flora_fundraiser_001',
      sourceId: 'flora_public_fundraiser_calendar',
      title: 'Sample fundraiser gala seeking food service context',
      snippet: 'Public event page sample for a fall fundraiser in New Jersey with dinner reception and 150 expected guests.',
      inferredIntent: 'Event organizer may need catering, bar service, or event rental support.',
      expectedValue: 9000,
      locationHint: 'New Jersey',
      eventTypeHint: 'fundraiser gala',
      projectTypeHint: null,
      dateHint: '2026-10-15',
    }),
    candidate(sourceById, {
      candidateId: 'sample_flora_wedding_forum_001',
      sourceId: 'flora_wedding_forum_recommendations',
      title: 'Sample wedding forum request for catering recommendations',
      snippet: 'Public discussion sample from a couple comparing caterers for a spring wedding near Philadelphia.',
      inferredIntent: 'Buyer is actively asking for wedding catering recommendations.',
      expectedValue: 12000,
      locationHint: 'Philadelphia, Pennsylvania',
      eventTypeHint: 'wedding',
      projectTypeHint: null,
      dateHint: '2027-04-20',
    }),
    candidate(sourceById, {
      candidateId: 'sample_flora_chamber_event_001',
      sourceId: 'flora_chamber_event_board',
      title: 'Sample chamber mixer with catering context',
      snippet: 'Public chamber event sample for a business mixer that includes reception planning and venue details.',
      inferredIntent: 'Business event could need catering or bar service support.',
      expectedValue: 4500,
      locationHint: 'New York, New York',
      eventTypeHint: 'business mixer',
      projectTypeHint: null,
      dateHint: '2026-09-08',
    }),
    candidate(sourceById, {
      candidateId: 'sample_costa_family_reunion_001',
      sourceId: 'costa_public_itinerary_forums',
      title: 'Sample family reunion travel planning discussion',
      snippet: 'Public itinerary sample asking how to coordinate lodging, transport, and activities for 18 relatives in Guanacaste.',
      inferredIntent: 'Group needs Costa Rica trip planning and concierge coordination.',
      expectedValue: 18000,
      locationHint: 'Guanacaste, Costa Rica',
      eventTypeHint: 'family reunion',
      projectTypeHint: null,
      dateHint: '2027-01-12',
    }),
    candidate(sourceById, {
      candidateId: 'sample_costa_villa_discussion_001',
      sourceId: 'costa_group_travel_boards',
      title: 'Sample villa recommendation discussion',
      snippet: 'Public group travel board sample comparing villas for a surf-and-wellness trip near Tamarindo.',
      inferredIntent: 'Travel group may need villa booking, activities, and concierge planning.',
      expectedValue: 15000,
      locationHint: 'Tamarindo, Costa Rica',
      eventTypeHint: 'group travel',
      projectTypeHint: null,
      dateHint: '2026-12-05',
    }),
    candidate(sourceById, {
      candidateId: 'sample_costa_corporate_retreat_001',
      sourceId: 'costa_tourism_event_calendar',
      title: 'Sample corporate retreat event page',
      snippet: 'Public tourism calendar sample around a corporate offsite window during dry season.',
      inferredIntent: 'Corporate team may need retreat planning, lodging, transport, and activity support.',
      expectedValue: 30000,
      locationHint: 'Uvita, Costa Rica',
      eventTypeHint: 'corporate retreat',
      projectTypeHint: null,
      dateHint: '2027-02-18',
    }),
    candidate(sourceById, {
      candidateId: 'sample_lzt_construction_notice_001',
      sourceId: 'lzt_construction_notice_pages',
      title: 'Sample Guanacaste construction notice',
      snippet: 'Public construction notice sample for a multi-unit villa project with wastewater planning implications.',
      inferredIntent: 'Development may need wastewater design, permitting support, or infrastructure review.',
      expectedValue: 25000,
      locationHint: 'Guanacaste, Costa Rica',
      eventTypeHint: null,
      projectTypeHint: 'multi-unit villa construction',
      dateHint: '2026-08-01',
    }),
    candidate(sourceById, {
      candidateId: 'sample_lzt_hotel_development_001',
      sourceId: 'lzt_real_estate_development_pages',
      title: 'Sample hotel development mention',
      snippet: 'Public development page sample mentioning boutique hotel expansion near a coastal municipality.',
      inferredIntent: 'Hotel expansion may require wastewater system review and municipality coordination.',
      expectedValue: 40000,
      locationHint: 'Nicoya Peninsula, Costa Rica',
      eventTypeHint: null,
      projectTypeHint: 'hotel expansion',
      dateHint: '2026-11-30',
    }),
    candidate(sourceById, {
      candidateId: 'sample_lzt_engineering_board_001',
      sourceId: 'lzt_municipality_public_notices',
      title: 'Sample architect wastewater context',
      snippet: 'Public municipality notice sample references an architect-led residential project requiring environmental review.',
      inferredIntent: 'Project may need wastewater feasibility, compliance, and engineering support.',
      expectedValue: 22000,
      locationHint: 'Santa Cruz, Guanacaste',
      eventTypeHint: null,
      projectTypeHint: 'residential development',
      dateHint: '2026-09-21',
    }),
    candidate(sourceById, {
      candidateId: 'sample_website_missing_site_001',
      sourceId: 'website_local_business_directories',
      title: 'Sample local restaurant listing with missing website signal',
      snippet: 'Public directory sample lists a restaurant with social profile only and no direct website field.',
      inferredIntent: 'Business may benefit from a lightweight website and direct booking/contact flow review.',
      expectedValue: 2500,
      locationHint: 'Tamarindo, Costa Rica',
      eventTypeHint: null,
      projectTypeHint: 'website review',
      dateHint: null,
    }),
    candidate(sourceById, {
      candidateId: 'sample_website_tourism_weak_site_001',
      sourceId: 'website_tourism_business_listings',
      title: 'Sample tourism business with weak website signal',
      snippet: 'Public tourism listing sample shows outdated booking language and no mobile-first direct booking path.',
      inferredIntent: 'Tourism operator may need website audit, conversion fixes, or rebuild proposal.',
      expectedValue: 3500,
      locationHint: 'La Fortuna, Costa Rica',
      eventTypeHint: null,
      projectTypeHint: 'website audit',
      dateHint: null,
    }),
    candidate(sourceById, {
      candidateId: 'sample_website_clinic_profile_001',
      sourceId: 'website_chamber_business_listings',
      title: 'Sample clinic chamber profile needing website review',
      snippet: 'Public chamber listing sample includes limited service information and unclear patient intake flow.',
      inferredIntent: 'Local clinic may need website clarity, intake flow, and trust signal improvements.',
      expectedValue: 4000,
      locationHint: 'San Jose, Costa Rica',
      eventTypeHint: null,
      projectTypeHint: 'website review',
      dateHint: null,
    }),
  ];
}

function main(): void {
  const generatedAt = new Date().toISOString();
  const candidates = buildMockSourceCandidates();
  const payload = {
    generatedAt,
    totalCandidates: candidates.length,
    sampleOnly: true,
    candidates,
    safetyRules: [
      'Mock candidates are local fixtures only.',
      'No Tavily, providers, network calls, scraping, browser automation, contact extraction, or outreach were performed.',
      'All candidates require human review before any commercial use.',
    ],
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(candidatesPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  fs.writeFileSync(reportPath, renderReport(generatedAt, candidates), 'utf8');

  console.log(`Mock source candidates generated: ${path.relative(process.cwd(), reportPath)}`);
  console.log(`Mock source candidates JSON generated: ${path.relative(process.cwd(), candidatesPath)}`);
  console.log('Local fixtures only. No Tavily, providers, network calls, scraping, browser automation, or outreach were performed.');
}

function candidate(
  sourceById: Map<string, PublicSourceMonitor>,
  input: Omit<PublicSourceCandidate, 'sourceType' | 'clientId' | 'vertical' | 'supportedEnrichmentTypes' | 'enrichmentReadiness' | 'sampleOnly'>,
): PublicSourceCandidate {
  const source = sourceById.get(input.sourceId);
  if (!source) {
    throw new Error(`Missing public source monitor for candidate sourceId: ${input.sourceId}`);
  }
  const enrichmentReadiness = initialReadiness(input, source);
  return {
    ...input,
    sourceType: source.sourceType,
    clientId: source.clientId,
    vertical: source.vertical,
    supportedEnrichmentTypes: source.supportedEnrichmentTypes,
    enrichmentReadiness,
    sampleOnly: true,
  };
}

function initialReadiness(
  input: Pick<PublicSourceCandidate, 'locationHint' | 'dateHint' | 'eventTypeHint' | 'projectTypeHint' | 'expectedValue'>,
  source: PublicSourceMonitor,
): EnrichmentReadinessMetadata {
  const availableSignals = [
    input.locationHint ? 'locationHint' : null,
    input.dateHint ? 'dateHint' : null,
    input.eventTypeHint ? 'eventTypeHint' : null,
    input.projectTypeHint ? 'projectTypeHint' : null,
    input.expectedValue > 0 ? 'expectedValue' : null,
  ].filter((signal): signal is string => Boolean(signal));
  const missingSignals = ['locationHint', 'dateHint', 'eventTypeHint/projectTypeHint'].filter((signal) => {
    if (signal === 'locationHint') return !input.locationHint;
    if (signal === 'dateHint') return !input.dateHint;
    return !input.eventTypeHint && !input.projectTypeHint;
  });
  const score = availableSignals.length * 10 + source.supportedEnrichmentTypes.length * 5;
  return {
    readiness: score >= 50 && missingSignals.length <= 1 ? 'ready' : score >= 25 ? 'partial' : 'none',
    score,
    availableSignals,
    missingSignals,
    futureHooks: source.supportedEnrichmentTypes,
    notes: 'Initial offline readiness estimate; no live enrichment performed.',
  };
}

function renderReport(generatedAt: string, candidates: PublicSourceCandidate[]): string {
  return `# Mock Public Source Candidates

Generated: ${generatedAt}

## Summary

- Mock candidates: ${candidates.length}
- Sample-only: yes
- Network usage: none
- Tavily usage: none
- Provider usage: none
- Integration readiness: Candidate shape is ready for future enrichment, buyer role classification, lead-like classification, delivery candidates, and client-facing sales intelligence.

## Candidates

${candidates.map((candidateItem) => `- ${candidateItem.title} (${candidateItem.candidateId}) — client: ${candidateItem.clientId}; vertical: ${candidateItem.vertical}; source: ${candidateItem.sourceId}; value: $${candidateItem.expectedValue}; location: ${candidateItem.locationHint ?? 'missing'}; date: ${candidateItem.dateHint ?? 'missing'}; readiness: ${candidateItem.enrichmentReadiness.readiness}; enrichment: ${candidateItem.supportedEnrichmentTypes.join(', ') || 'none'}; sampleOnly: ${candidateItem.sampleOnly ? 'yes' : 'no'}`).join('\n')}

## Safety Rules

- Local fixtures only.
- No Tavily, providers, network calls, scraping, browser automation, login, contact extraction, outreach, emails, DMs, calls, or forms.
- Human review is required before future delivery or commercial use.
`;
}

if (require.main === module) main();
