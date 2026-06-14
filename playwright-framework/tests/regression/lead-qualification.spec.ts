import { expect, test } from '@playwright/test';
import { buildLeadQualificationReportFromCandidates } from '../../../src/webLeadQualification/normalizationRules';
import { WebLeadCandidate } from '../../../src/webLeadDiscovery/types';

function candidate(overrides: Partial<WebLeadCandidate>): WebLeadCandidate {
  return {
    id: overrides.id ?? 'lead-1',
    name: overrides.name ?? 'Sample Booking SaaS',
    companyName: overrides.companyName ?? 'Sample Booking SaaS',
    website: overrides.website ?? 'https://sample-booking.example',
    source: overrides.source ?? 'manual-test',
    sourceUrl: overrides.sourceUrl ?? 'https://sample-booking.example',
    sourceTitle: overrides.sourceTitle ?? 'Sample Booking SaaS | Scheduling and Membership Platform',
    snippet: overrides.snippet ?? 'Booking, scheduling, membership, mobile app, payments, integrations, and demo signup workflows.',
    niche: overrides.niche ?? 'booking saas',
    query: overrides.query ?? 'booking saas qa',
    discoveryDate: overrides.discoveryDate ?? '2026-06-14',
    discoveredAt: overrides.discoveredAt ?? '2026-06-14T00:00:00.000Z',
    sourceType: overrides.sourceType ?? 'manual',
    evidence: overrides.evidence ?? ['Sample public marketing page'],
    score: overrides.score ?? 80,
    confidence: overrides.confidence ?? 80,
    scoreReasons: overrides.scoreReasons ?? ['Workflow complexity'],
    recommendedOffer: overrides.recommendedOffer ?? 'QA Audit',
    recommendedAction: overrides.recommendedAction ?? 'Review manually',
    notes: overrides.notes ?? 'Regression-safe fixture.',
    painSignalCount: overrides.painSignalCount ?? 1,
    status: overrides.status ?? 'needs-human-review',
  };
}

test.describe('Lead Qualification regression', () => {
  test('normalizes leads, removes duplicates, and keeps scores in range', () => {
    // Arrange
    const leads = [
      candidate({ id: 'lead-1', name: 'Sample Booking SaaS' }),
      candidate({ id: 'lead-2', name: 'Sample Booking SaaS' }),
      candidate({ id: 'lead-3', name: 'Fit Scheduling Pro', companyName: 'Fit Scheduling Pro' }),
    ];

    // Act
    const report = buildLeadQualificationReportFromCandidates(leads);

    // Assert
    expect(report.rawCount).toBe(3);
    expect(report.duplicatesRemoved).toBeGreaterThanOrEqual(1);
    expect(report.normalizedLeads.length).toBeLessThan(report.rawCount);
    for (const lead of report.normalizedLeads) {
      expect(lead.normalizedName).toBeTruthy();
      expect(lead.category).toBeTruthy();
      expect(lead.qualificationScore).toBeGreaterThanOrEqual(0);
      expect(lead.qualificationScore).toBeLessThanOrEqual(100);
      expect(lead.qaOpportunityScore).toBeGreaterThanOrEqual(0);
      expect(lead.qaOpportunityScore).toBeLessThanOrEqual(100);
    }
  });
});
