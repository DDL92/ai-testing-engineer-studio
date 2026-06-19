import { expect, test } from '@playwright/test';
import {
  buildArchiveDashboard,
  buildArchiveReport,
  calculateArchiveScore,
  renderArchiveSummary,
  renderPortfolioArtifacts,
  renderRetentionPolicy,
  retentionPolicy,
} from '../../../src/archiveManager/archiveRules';
import { ArchiveArtifact } from '../../../src/archiveManager/types';

function artifact(classification: ArchiveArtifact['classification']): ArchiveArtifact {
  return {
    path: `output/${classification.toLowerCase()}.md`,
    classification,
    reason: 'Fixture',
    recommendation: retentionPolicy[classification],
    sizeBytes: 100,
    modifiedAt: '2026-06-18T00:00:00.000Z',
    staleDays: 0,
    publicSafe: 'REVIEW',
    containsRuntimeData: false,
    portfolioValue: classification === 'PORTFOLIO' ? 'HIGH' : 'NONE',
  };
}

test.describe('Archive Manager regression', () => {
  test('inventories historical artifacts', () => {
    const report = buildArchiveReport();
    expect(report.historical.length).toBeGreaterThan(0);
    expect(report.historical.every((item) => item.classification === 'HISTORICAL')).toBe(true);
  });

  test('inventories portfolio artifacts with safety metadata', () => {
    const report = buildArchiveReport();
    expect(report.portfolio.length).toBeGreaterThan(0);
    expect(renderPortfolioArtifacts(report)).toContain('Public Safe');
  });

  test('covers all six classifications in the retention policy', () => {
    expect(Object.keys(retentionPolicy)).toHaveLength(6);
    expect(renderRetentionPolicy(buildArchiveReport())).toContain('ARCHIVE_CANDIDATE');
  });

  test('generates an archive summary', () => {
    const report = buildArchiveReport();
    const summary = renderArchiveSummary(report);
    expect(summary).toContain('Archive Summary');
    expect(summary).toContain('Total Artifacts');
  });

  test('produces a bounded archive score and status', () => {
    const score = calculateArchiveScore([
      artifact('ACTIVE'),
      artifact('HISTORICAL'),
      artifact('PORTFOLIO'),
      artifact('EXAMPLE'),
      artifact('TEMPORARY'),
      artifact('ARCHIVE_CANDIDATE'),
    ]);
    expect(score.score).toBeGreaterThanOrEqual(0);
    expect(score.score).toBeLessThanOrEqual(100);
    expect(['HEALTHY', 'WATCH', 'AT RISK']).toContain(score.status);
  });

  test('exposes dashboard archive metrics', () => {
    const dashboard = buildArchiveDashboard(buildArchiveReport());
    expect(dashboard.archiveScore).toMatch(/^\d+\/100$/);
    expect(dashboard.retentionStatus).toBe('6/6 classifications covered');
  });

  test('does not move or delete files while scanning', () => {
    const before = buildArchiveReport().artifacts.map((item) => item.path).sort();
    const after = buildArchiveReport().artifacts.map((item) => item.path).sort();
    expect(after).toEqual(before);
  });
});
