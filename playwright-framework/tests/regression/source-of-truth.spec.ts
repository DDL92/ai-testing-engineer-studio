import { expect, test } from '@playwright/test';
import { getRevenueSourceOfTruth } from '../../../src/revenueIntelligence/sourceOfTruth';

test.describe('Source of truth regression', () => {
  test('revenue source-of-truth contains all required fields', () => {
    // Arrange
    const requiredFields = [
      'topLead',
      'recommendedOffer',
      'revenueDecision',
      'executionPriority',
      'executionPriorityDetail',
      'nextAction',
      'lastUpdated',
      'warnings',
    ];

    // Act
    const source = getRevenueSourceOfTruth();

    // Assert
    for (const field of requiredFields) {
      expect(source, `Missing source-of-truth field: ${field}`).toHaveProperty(field);
    }
    expect(source.topLead, 'Top lead missing').toBeTruthy();
    expect(source.recommendedOffer, 'Offer missing').toBeTruthy();
    expect(source.nextAction, 'Recommendation missing').toBeTruthy();
    expect(new Date(source.lastUpdated).toString()).not.toBe('Invalid Date');
  });
});
