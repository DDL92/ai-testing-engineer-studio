import { expect, test } from '@playwright/test';
import {
  buildStudioHealthReport,
  renderBackupPlan,
  renderCleanupPlan,
  renderHealthReport,
  renderHealthSummary,
  renderRepairPlan,
  renderSourceOfTruthHealth,
} from '../../../src/studioHealth/healthRules';

test.describe('Studio Health regression', () => {
  test('generates a health report with a bounded score', () => {
    const report = buildStudioHealthReport();
    const output = renderHealthReport(report);

    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(100);
    expect(output).toContain('Overall Health Score');
  });

  test('generates a recommendation-only repair plan', () => {
    const report = buildStudioHealthReport();
    const output = renderRepairPlan(report);

    expect(report.repairRecommendations.length).toBeGreaterThan(0);
    expect(output).toContain('No source, runtime, client');
  });

  test('generates a local backup plan', () => {
    const output = renderBackupPlan(buildStudioHealthReport());

    expect(output).toContain('## Critical Files');
    expect(output).toContain('Keep backups local');
  });

  test('generates a cleanup plan without deleting files', () => {
    const output = renderCleanupPlan(buildStudioHealthReport());

    expect(output).toContain('No file was deleted or moved');
    expect(output).toContain('do not remove automatically');
  });

  test('generates source-of-truth and doctor status reports', () => {
    const report = buildStudioHealthReport();

    expect(['HEALTHY', 'WATCH', 'AT RISK']).toContain(report.doctorStatus);
    expect(renderSourceOfTruthHealth(report)).toContain('Revenue Intelligence');
    expect(renderHealthSummary(report)).toContain('Doctor Status');
  });
});
