import fs = require('fs');
import path = require('path');
import { expect, test } from '@playwright/test';
import { evaluateLeadReadiness } from '../../../src/leadRotation/evaluateLeadReadiness';
import { buildLeadRotationDecision, writeLeadRotationReports } from '../../../src/leadRotation/rotationRules';
import { WebIntelligenceReport } from '../../../src/webIntelligence/types';
import { NormalizedWebLead } from '../../../src/webLeadQualification/types';

test.describe('Lead Rotation regression', () => {
  test('demotes a not-ready top ranked lead', () => {
    // Arrange
    const decision = buildLeadRotationDecision();

    // Act
    const topRankedLead = decision.topRankedLead;

    // Assert
    expect(topRankedLead, 'Expected a top ranked lead').toBeTruthy();
    expect(topRankedLead?.companyName).toBe('Appointy');
    expect(topRankedLead?.readiness).toBe('NOT READY');
    expect(topRankedLead?.recommendation).toBe('DEMOTE');
  });

  test('promotes the highest commercially usable lead', () => {
    // Arrange
    const decision = buildLeadRotationDecision();

    // Act
    const actionableLead = decision.actionableLead;

    // Assert
    expect(actionableLead, 'Expected an actionable lead').toBeTruthy();
    expect(actionableLead?.readiness).toBe('READY');
    expect(actionableLead?.recommendation).toBe('PROMOTE');
    expect(actionableLead?.companyName).not.toBe(decision.topRankedLead?.companyName);
  });

  test('returns an actionable lead and rotation status', () => {
    // Arrange / Act
    const decision = buildLeadRotationDecision();

    // Assert
    expect(decision.rotationStatus).toBe('ACTIONABLE_LEAD_FOUND');
    expect(decision.actionableLead?.companyName).toBeTruthy();
    expect(decision.actionableLead?.commercialReadinessScore).toBeGreaterThan(0);
  });

  test('generates commercial ranking outputs', () => {
    // Arrange
    const decision = buildLeadRotationDecision();

    // Act
    const outputPaths = writeLeadRotationReports(decision);
    const commercialRankingPath = path.join(process.cwd(), 'output', 'lead-rotation', 'commercial-ranking.md');

    // Assert
    expect(outputPaths).toContain(commercialRankingPath);
    expect(fs.existsSync(commercialRankingPath)).toBe(true);
    expect(fs.readFileSync(commercialRankingPath, 'utf8')).toContain('Commercial Readiness Ranking');
  });

  test('does not promote incomplete evidence when qualification scores are high', () => {
    // Arrange
    const lead = leadFixture('IncompleteFlow', {
      qualificationScore: 94,
      qaOpportunityScore: 91,
      confidence: 0.91,
    });
    const report = intelligenceFixture({
      company: 'IncompleteFlow',
      averageConfidence: 73,
      companyConfidence: 'HIGH',
      evidenceConfidence: 'MEDIUM',
      falsePositiveRisk: 'MEDIUM',
    });

    // Act
    const evaluated = evaluateLeadReadiness(lead, 1, report);

    // Assert
    expect(evaluated.readiness).toBe('NOT READY');
    expect(evaluated.recommendation).toBe('DEMOTE');
    expect(evaluated.blockers).toContain('Evidence status is NOT READY.');
  });

  test('allows ready evidence to outrank not-ready evidence', () => {
    // Arrange
    const notReadyLead = leadFixture('IncompleteFlow', {
      qualificationScore: 94,
      qaOpportunityScore: 91,
    });
    const readyLead = leadFixture('ReadyFlow', {
      qualificationScore: 82,
      qaOpportunityScore: 84,
    });
    const report = intelligenceFixture(
      {
        company: 'IncompleteFlow',
        averageConfidence: 73,
        companyConfidence: 'HIGH',
        evidenceConfidence: 'MEDIUM',
        falsePositiveRisk: 'MEDIUM',
      },
      {
        company: 'ReadyFlow',
        averageConfidence: 98,
        companyConfidence: 'HIGH',
        evidenceConfidence: 'HIGH',
        falsePositiveRisk: 'HIGH',
      },
    );

    // Act
    const notReady = evaluateLeadReadiness(notReadyLead, 1, report);
    const ready = evaluateLeadReadiness(readyLead, 2, report);

    // Assert
    expect(notReady.readiness).toBe('NOT READY');
    expect(ready.readiness).toBe('READY');
    expect(ready.commercialReadinessScore).toBeGreaterThan(notReady.commercialReadinessScore);
  });

  test('does not promote false-positive evidence', () => {
    // Arrange
    const lead = leadFixture('FalsePositiveFlow', {
      qualificationScore: 90,
      qaOpportunityScore: 88,
    });
    const report = intelligenceFixture({
      company: 'FalsePositiveFlow',
      averageConfidence: 90,
      companyConfidence: 'HIGH',
      evidenceConfidence: 'HIGH',
      falsePositiveRisk: 'LOW',
    });

    // Act
    const evaluated = evaluateLeadReadiness(lead, 1, report);

    // Assert
    expect(evaluated.readiness).not.toBe('READY');
    expect(evaluated.recommendation).not.toBe('PROMOTE');
    expect(evaluated.blockers).toContain('False-positive risk is high.');
  });
});

function leadFixture(
  companyName: string,
  overrides: Partial<Pick<NormalizedWebLead, 'qualificationScore' | 'qaOpportunityScore' | 'confidence'>> = {},
): NormalizedWebLead {
  return {
    id: companyName.toLowerCase(),
    rawName: `${companyName} Scheduling Platform`,
    normalizedName: companyName,
    website: `https://${companyName.toLowerCase()}.example.com`,
    source: `https://${companyName.toLowerCase()}.example.com`,
    sourceTitle: `${companyName} Scheduling Platform`,
    query: 'fitness scheduling software',
    date: '2026-06-14',
    category: 'Scheduling SaaS',
    qualificationScore: overrides.qualificationScore ?? 80,
    qaOpportunityScore: overrides.qaOpportunityScore ?? 80,
    recommendedOffer: 'QA Automation Retainer ($1500-$3000/month)',
    duplicateOf: null,
    isAggregatorOrArticle: false,
    confidence: overrides.confidence ?? 0.9,
    notes: 'Scheduling, booking, payment, mobile, membership, and integration workflows.',
    scoreBreakdown: {
      industryFit: 95,
      qaFit: 90,
      automationOpportunity: 90,
      painSignalPresence: 70,
      websiteQuality: 80,
      productComplexity: 90,
      publicJourneys: 80,
      bookingFlow: 90,
      checkoutFlow: 85,
      mobileFlow: 85,
      schedulingFlow: 90,
      membershipFlow: 85,
      integrations: 75,
      releaseRisk: 70,
    },
    rawLead: {} as NormalizedWebLead['rawLead'],
  };
}

function intelligenceFixture(
  ...summaries: Array<Pick<WebIntelligenceReport['companySummaries'][number], 'company' | 'averageConfidence' | 'companyConfidence' | 'evidenceConfidence' | 'falsePositiveRisk'>>
): WebIntelligenceReport {
  return {
    generatedAt: '2026-06-14T00:00:00.000Z',
    evidence: [],
    acceptedEvidence: [],
    suspiciousEvidence: [],
    rejectedEvidence: summaries
      .filter((summary) => summary.falsePositiveRisk === 'LOW')
      .map((summary) => ({ canonicalCompany: summary.company }) as WebIntelligenceReport['rejectedEvidence'][number]),
    companySummaries: summaries.map((summary) => ({
      ...summary,
      normalizedDomain: `${summary.company.toLowerCase()}.example.com`,
      aliases: [summary.company],
      evidenceCount: 1,
      sourceCount: 1,
      sourceDiversity: 1,
      painSignals: 0,
      leadCategory: 'fitness scheduling software',
    })),
    duplicateResolution: {
      canonicalRecords: [],
      duplicateGroups: [],
    },
    painConfidence: [],
    readiness: {
      companyConfidence: 0,
      evidenceConfidence: 0,
      painConfidence: 0,
      duplicateQuality: 100,
      rankingConfidence: 0,
      status: 'PARTIAL',
    },
  };
}
