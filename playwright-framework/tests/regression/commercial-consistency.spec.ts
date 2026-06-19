import { expect, test } from '@playwright/test';
import { runnerSequence } from '../../../src/autonomousRunner/runnerRules';
import {
  buildCommercialConsistencyReport,
  scanSourceOfTruthUsage,
  scanText,
} from '../../../src/commercialConsistency/consistencyRules';
import { buildPwaDashboardData } from '../../../src/dashboard/dashboardDataBuilder';
import { buildMobileCommandCenterSummary } from '../../../src/mobileCommandCenter/mobileRules';
import { getRevenueSourceOfTruth } from '../../../src/revenueIntelligence/sourceOfTruth';

test.describe('Commercial consistency regression', () => {
  test('exposes one actionable commercial lead', () => {
    const truth = getRevenueSourceOfTruth();
    expect(truth.actionableLead).not.toBe('No actionable lead');
    expect(truth.topLead).toBe(truth.actionableLead);
  });

  test('uses the approved source-of-truth path', () => {
    expect(scanSourceOfTruthUsage().status).toBe('PASS');
  });

  test('dashboard commercial cards use the actionable lead', () => {
    const truth = getRevenueSourceOfTruth();
    const dashboard = buildPwaDashboardData();
    expect(dashboard.revenue.bestAuditOpportunity).toBe(truth.actionableLead);
    expect(dashboard.leadIntelligence.bestLead).toBe(truth.actionableLead);
    expect(dashboard.commercialUx.target).toBe(truth.actionableLead);
    expect(dashboard.revenueMode.morningBrief).toContain(truth.actionableLead);
  });

  test('mobile commercial fields use the actionable lead', () => {
    const truth = getRevenueSourceOfTruth();
    const mobile = buildMobileCommandCenterSummary();
    expect(mobile.topLead).toBe(truth.actionableLead);
    expect(mobile.commercialTarget).toBe(truth.actionableLead);
    expect(mobile.revenueModeTopAction).toContain(truth.actionableLead);
  });

  test('runner refreshes rotation before Revenue Mode reports', () => {
    const scripts = runnerSequence.map((item) => item.script);
    expect(scripts.indexOf('lead:rotation')).toBeLessThan(scripts.indexOf('revenue:morning'));
    expect(scripts.indexOf('revenue:morning')).toBeLessThan(scripts.indexOf('revenue:today'));
    expect(scripts.indexOf('revenue:today')).toBeLessThan(scripts.indexOf('revenue:summary'));
  });

  test('detects an active legacy recommendation', () => {
    const findings = scanText(
      'dashboard/app.js',
      'Today top action: Review Appointy package',
      'dashboard',
      'Setmore',
      'Appointy',
    );
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe('FAIL');
  });

  test('generates repair recommendations without applying repairs', () => {
    const report = buildCommercialConsistencyReport();
    expect(report.repairRecommendations).toBeInstanceOf(Array);
    expect(report.safetyRules.join(' ')).toContain('never edit');
  });
});
