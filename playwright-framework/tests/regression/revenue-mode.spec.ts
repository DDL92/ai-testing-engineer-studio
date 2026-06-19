import { expect, test } from '@playwright/test';
import {
  buildRevenueModeDashboard,
  buildRevenueModeReport,
  renderEndOfDayReview,
  renderRevenueGoals,
  renderTodayActions,
} from '../../../src/revenueMode/revenueModeRules';
import { RevenueModeInput } from '../../../src/revenueMode/types';

const input: RevenueModeInput = {
  generatedAt: '2026-06-18T12:00:00.000Z',
  studioHealth: '84/100',
  doctorStatus: 'WATCH',
  actionableLead: 'Setmore',
  commercialReadiness: '86/100',
  evidenceStatus: 'READY',
  evidencePackageStatus: 'READY',
  deliveryAssetsStatus: 'READY FOR REVIEW',
  recommendedOffer: 'qa-audit',
  currentMrr: 0,
  outcomeCount: 0,
  discoveredLeadCount: 10,
  qualifiedLeadCount: 10,
  followUps: [{
    company: 'Setmore',
    category: 'Evidence Review',
    status: 'Needs First Message',
    nextManualAction: 'Review the evidence package manually.',
  }],
};

test.describe('Revenue Mode regression', () => {
  test('creates an active morning operating state from recorded inputs', () => {
    const report = buildRevenueModeReport(input);
    expect(report.status).toBe('ACTIVE');
    expect(report.actionableLead).toBe('Setmore');
    expect(report.topAction).toContain('Setmore');
  });

  test('limits today to three revenue-priority actions', () => {
    const report = buildRevenueModeReport(input);
    expect(report.todayActions.length).toBeLessThanOrEqual(3);
    expect(renderTodayActions(report)).toContain('Maximum three actions');
  });

  test('calculates target gaps without inventing booked revenue', () => {
    const report = buildRevenueModeReport(input);
    expect(report.goals.currentMrr).toBe(0);
    expect(report.goals.gapLow).toBe(3000);
    expect(renderRevenueGoals(report)).toContain('planning equivalents only');
  });

  test('keeps delivery and follow-up review ahead of internal work', () => {
    const report = buildRevenueModeReport(input);
    expect(report.actionQueue[0].priority).toBe('HIGH');
    expect(report.actionQueue[1].action).toContain('Setmore');
    expect(report.actionQueue.at(-1)?.priority).toBe('LOW');
  });

  test('does not infer end-of-day outcomes or revenue', () => {
    const output = renderEndOfDayReview(buildRevenueModeReport(input));
    expect(output).toContain('Actions completed: not inferred');
    expect(output).toContain('Revenue created today: not inferred');
  });

  test('exposes the requested dashboard and mobile operating fields', () => {
    const dashboard = buildRevenueModeDashboard(buildRevenueModeReport(input));
    expect(dashboard.revenueModeStatus).toBe('ACTIVE');
    expect(dashboard.todaysTopAction).toContain('Setmore');
    expect(dashboard.followUpsWaiting).toBe(1);
  });
});
