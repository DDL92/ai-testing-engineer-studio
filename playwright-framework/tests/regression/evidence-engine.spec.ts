import fs = require('fs');
import path = require('path');
import { expect, test } from '@playwright/test';
import {
  buildDynamicEvidenceSummary,
  buildEvidenceReadinessDecision,
  isValidScreenshotEvidencePath,
  writeEvidenceReadinessDecisionOutput,
  writeEvidenceSummaryOutput,
} from '../../../src/evidenceEngine/evidenceRules';

test.describe('Evidence Engine regression', () => {
  test('generates summary and readiness files from current evidence artifacts', () => {
    // Arrange
    const summary = buildDynamicEvidenceSummary();
    const decision = buildEvidenceReadinessDecision(summary);

    // Act
    const summaryPaths = writeEvidenceSummaryOutput(summary);
    const decisionPaths = writeEvidenceReadinessDecisionOutput(decision);

    // Assert
    for (const outputPath of [...summaryPaths, ...decisionPaths]) {
      expect(fs.existsSync(outputPath), `${path.relative(process.cwd(), outputPath)} should exist`).toBe(true);
    }
  });

  test('returns a valid evidence readiness decision', () => {
    // Arrange
    const summary = buildDynamicEvidenceSummary();

    // Act
    const decision = buildEvidenceReadinessDecision(summary);

    // Assert
    expect(['READY', 'PARTIAL', 'NOT READY']).toContain(decision.status);
    expect(['GO', 'PARTIAL', 'NO GO']).toContain(decision.goNoGo);
    expect(decision.target.companyName).toBeTruthy();
    expect(decision.safetyNotes.join(' ')).toContain('Do not claim bugs');
  });

  test('accepts only bounded screenshot evidence paths', () => {
    // Arrange
    const validPath = 'output/evidence/screenshots/demo-desktop.png';
    const invalidPaths = [
      '../screenshots/demo.png',
      '/tmp/demo.png',
      'output/evidence/demo.png',
      'output/evidence/screenshots/demo.jpg',
    ];

    // Act / Assert
    expect(isValidScreenshotEvidencePath(validPath)).toBe(true);
    for (const invalidPath of invalidPaths) {
      expect(isValidScreenshotEvidencePath(invalidPath), `${invalidPath} should be rejected`).toBe(false);
    }
  });
});
