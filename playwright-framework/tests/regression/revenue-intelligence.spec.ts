import { expect, test } from '@playwright/test';
import { buildRevenueIntelligenceReport } from '../../../src/revenueIntelligence/revenueIntelligenceRules';
import { getRevenueSourceOfTruth } from '../../../src/revenueIntelligence/sourceOfTruth';

test.describe('Revenue Intelligence regression', () => {
  test('returns a usable top lead recommendation structure', () => {
    // Arrange
    const report = buildRevenueIntelligenceReport();

    // Act
    const topLead = report.topLead;

    // Assert
    expect(topLead, 'Expected Revenue Intelligence to have a top lead').not.toBeNull();
    expect(topLead?.companyName, 'Top lead cannot be empty').toBeTruthy();
    expect(topLead?.selectionScore, 'Top lead score must be numeric').toEqual(expect.any(Number));
    expect(topLead?.recommendedOffer, 'Recommended offer must exist').toBeTruthy();
    expect(topLead?.nextRevenueAction, 'Recommendation must exist').toBeTruthy();
    expect(['GO', 'REVIEW', 'WAIT']).toContain(report.decision.status);
  });

  test('source-of-truth exposes required revenue fields consistently', () => {
    // Arrange
    const report = buildRevenueIntelligenceReport();

    // Act
    const source = getRevenueSourceOfTruth();

    // Assert
    expect(source.topLead).toBe(report.topLead?.companyName);
    expect(source.topLead).not.toBe('No unified top lead');
    expect(source.recommendedOffer).toBeTruthy();
    expect(source.revenueDecision).toBe(report.decision.status);
    expect(['HIGH', 'MEDIUM', 'LOW']).toContain(source.executionPriority);
    expect(source.nextAction).toBeTruthy();
    expect(source.lastUpdated).toBeTruthy();
    expect(Array.isArray(source.warnings)).toBe(true);
  });
});
