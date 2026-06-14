import { expect, test } from '@playwright/test';
import { normalizeDomain } from '../../../src/webIntelligence/domainNormalizer';
import { validateEvidence } from '../../../src/webIntelligence/evidenceValidator';
import { detectFalsePositive } from '../../../src/webIntelligence/falsePositiveDetector';
import { resolveDuplicates } from '../../../src/webIntelligence/duplicateResolver';

test.describe('Web Intelligence quality regression', () => {
  test('normalizes common domain formats to the same domain', () => {
    // Arrange
    const variants = [
      'https://appointy.com',
      'https://www.appointy.com',
      '[www.appointy.com](http://www.appointy.com)',
      'appointy.com',
    ];

    // Act
    const normalized = variants.map(normalizeDomain);

    // Assert
    expect(new Set(normalized)).toEqual(new Set(['appointy.com']));
  });

  test('rejects generic exercise content as company evidence', () => {
    // Arrange
    const title = 'Push Press Weightlifting Technique';
    const url = 'https://example.com/blog/push-press-weightlifting-technique';
    const text = 'How to push press with correct exercise form.';

    // Act
    const result = detectFalsePositive(title, url, text);

    // Assert
    expect(result.decision).toBe('rejected');
    expect(result.penalty).toBeGreaterThanOrEqual(70);
  });

  test('accepts official company evidence with high confidence', () => {
    // Arrange
    const evidence = {
      companyName: 'Fitness Studio and Gym Scheduling Software - Appointy',
      sourceUrl: 'https://www.appointy.com/fitness-class-scheduling-software',
      sourceTitle: 'Fitness Studio and Gym Scheduling Software - Appointy',
      observedText: 'Appointy fitness and gym scheduling software supports bookings, payments, reminders, and mobile workflows.',
      sourceType: 'lead' as const,
      raw: {
        companyName: 'Fitness Studio and Gym Scheduling Software - Appointy',
        sourceUrl: 'https://www.appointy.com/fitness-class-scheduling-software',
      } as never,
    };

    // Act
    const result = validateEvidence(evidence);

    // Assert
    expect(result.canonicalCompany).toBe('Appointy');
    expect(result.normalizedDomain).toBe('appointy.com');
    expect(result.decision).toBe('accepted');
    expect(result.confidence).toBe('HIGH');
  });

  test('resolves company aliases into canonical records', () => {
    // Arrange
    const evidence = [
      validateEvidence({
        companyName: 'Appointy',
        sourceUrl: 'https://appointy.com',
        sourceTitle: 'Appointy',
        observedText: 'Appointy scheduling software.',
        sourceType: 'lead',
        raw: { companyName: 'Appointy' } as never,
      }),
      validateEvidence({
        companyName: 'Appointy Inc.',
        sourceUrl: 'https://www.appointy.com/features',
        sourceTitle: 'Scheduling Features - Appointy',
        observedText: 'Appointy booking and scheduling features.',
        sourceType: 'lead',
        raw: { companyName: 'Appointy Inc.' } as never,
      }),
    ];

    // Act
    const result = resolveDuplicates(evidence);

    // Assert
    expect(result.canonicalRecords).toHaveLength(1);
    expect(result.canonicalRecords[0]?.normalizedDomain).toBe('appointy.com');
    expect(result.duplicateGroups[0]?.aliases).toContain('Appointy Inc.');
  });
});
