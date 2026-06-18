import { expect, test } from '@playwright/test';
import {
  buildCommercialOutcome,
  buildRevenueLearningReport,
  renderCalibrationSummary,
  renderRecommendations,
  renderRevenueLearningStatus,
  validateCommercialOutcome,
} from '../../../src/revenueLearning/learningRules';
import { CommercialOutcome, CommercialOutcomeRecord } from '../../../src/revenueLearning/types';

function outcome(
  value: CommercialOutcome,
  overrides: Partial<CommercialOutcomeRecord> = {},
): CommercialOutcomeRecord {
  return {
    ...buildCommercialOutcome({
      lead: 'Demo Lead',
      industry: 'Scheduling SaaS',
      leadCategory: 'Scheduling SaaS',
      channel: 'LinkedIn',
      offer: 'QA Audit',
      pricePoint: 299,
      messageType: 'Evidence-based QA observation',
      outcome: value,
      date: '2026-06-18',
      notes: 'Synthetic test record.',
    }),
    ...overrides,
  };
}

test.describe('Revenue Learning regression', () => {
  test('accepts every supported commercial outcome', () => {
    const values: CommercialOutcome[] = ['sent', 'replied', 'meeting', 'proposal', 'won', 'lost', 'retained', 'expanded', 'churned'];
    expect(values.map(validateCommercialOutcome)).toEqual(values);
  });

  test('rejects invalid commercial outcomes', () => {
    expect(() => validateCommercialOutcome('interested')).toThrow(/Invalid commercial outcome/);
  });

  test('generates channel, offer, industry, and pricing metrics', () => {
    const report = buildRevenueLearningReport([
      outcome('replied'),
      outcome('proposal'),
      outcome('won'),
      outcome('retained'),
      outcome('expanded'),
    ]);

    expect(report.channelPerformance[0]?.key).toBe('LinkedIn');
    expect(report.offerPerformance[0]?.key).toBe('QA Audit');
    expect(report.industryPerformance[0]?.key).toBe('Scheduling SaaS');
    expect(report.pricingPerformance[0]?.key).toBe('QA Audit - $299');
  });

  test('generates recommendations from real in-memory outcomes', () => {
    const report = buildRevenueLearningReport([
      outcome('won'),
      outcome('retained'),
      outcome('expanded'),
      outcome('lost', { channel: 'Email', industry: 'Booking SaaS' }),
      outcome('sent', { channel: 'Email', industry: 'Booking SaaS' }),
    ]);

    expect(report.recommendations.bestChannel).toBe('LinkedIn');
    expect(report.recommendations.worstChannel).toBe('Email');
    expect(renderRecommendations(report)).toContain('Best Price Point');
  });

  test('applies status thresholds and caps calibration at twenty percent', () => {
    const learning = buildRevenueLearningReport(Array.from({ length: 5 }, () => outcome('replied')));
    const calibrated = buildRevenueLearningReport(Array.from({ length: 20 }, () => outcome('proposal')));
    const highConfidence = buildRevenueLearningReport(Array.from({ length: 50 }, () => outcome('won')));

    expect(learning.status).toBe('LEARNING');
    expect(calibrated.status).toBe('CALIBRATED');
    expect(highConfidence.status).toBe('HIGH CONFIDENCE');
    expect(highConfidence.calibrationInfluence).toBe(20);
  });

  test('generates insufficient-history and calibration summaries without persisting the sample', () => {
    const report = buildRevenueLearningReport([]);

    expect(report.status).toBe('INSUFFICIENT HISTORY');
    expect(report.outcomes).toHaveLength(0);
    expect(renderRevenueLearningStatus(report)).toContain('INSUFFICIENT HISTORY');
    expect(renderCalibrationSummary(report)).toContain('Current Historical Influence: 0%');
  });
});
