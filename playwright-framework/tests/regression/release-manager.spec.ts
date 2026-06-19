import { expect, test } from '@playwright/test';
import {
  buildReleaseDashboard,
  buildStudioReleaseReport,
  renderOperationsRunbook,
  renderReleaseNotes,
  renderReleaseSummary,
  renderRevenueModeRunbook,
  renderStudioManifest,
  renderValidationReport,
} from '../../../src/releaseManager/releaseRules';

test.describe('Release Manager regression', () => {
  test('generates v1 release notes', () => {
    const report = buildStudioReleaseReport();
    const output = renderReleaseNotes(report);
    expect(report.version).toBe('1.0.0');
    expect(output).toContain('Feature Status: FEATURE COMPLETE');
    expect(output).toContain('Revenue Mode Status: REVENUE MODE READY');
  });

  test('generates a validation report from explicit gate results', () => {
    const report = buildStudioReleaseReport([{
      command: 'npm run typecheck',
      status: 'PASS',
      exitCode: 0,
      durationMs: 100,
      summary: 'TypeScript compilation completed.',
    }]);
    expect(renderValidationReport(report)).toContain('Overall Status: PASS');
  });

  test('generates the Studio manifest', () => {
    const output = renderStudioManifest(buildStudioReleaseReport());
    expect(output).toContain('Sources Of Truth');
    expect(output).toContain('Revenue Intelligence -> Lead Rotation -> Actionable Lead');
  });

  test('generates both operating runbooks', () => {
    const report = buildStudioReleaseReport();
    expect(renderOperationsRunbook(report)).toContain('Morning Workflow');
    expect(renderRevenueModeRunbook(report)).toContain('07:00 Runner');
    expect(renderRevenueModeRunbook(report)).toContain('Manual Outreach');
  });

  test('generates the release summary with manual boundaries', () => {
    const output = renderReleaseSummary(buildStudioReleaseReport());
    expect(output).toContain('Feature-complete local operating architecture');
    expect(output).toContain('Outreach, proposal sending');
  });

  test('exposes dashboard release status', () => {
    const dashboard = buildReleaseDashboard(buildStudioReleaseReport());
    expect(dashboard.studioVersion).toBe('1.0.0');
    expect(['RELEASE LOCKED', 'REVIEW REQUIRED']).toContain(dashboard.releaseStatus);
  });
});
