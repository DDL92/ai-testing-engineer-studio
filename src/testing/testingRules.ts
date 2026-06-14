import fs = require('fs');
import path = require('path');
import { buildQualityGateReport, QualityGateReport } from './qualityGateRules';
import { buildTestInventory, TestInventory } from './testInventory';

export const testingOutputDir = path.join(process.cwd(), 'output', 'testing');

export interface TestingReadiness {
  generatedAt: string;
  testingStatus: string;
  coverageStatus: string;
  qualityGateStatus: string;
  ciStatus: string;
  skippedTests: number;
  requiredCategories: number;
  missingCategories: number;
}

export interface TestingReportBundle {
  inventory: TestInventory;
  gates: QualityGateReport;
  readiness: TestingReadiness;
}

export function buildTestingReportBundle(): TestingReportBundle {
  const inventory = buildTestInventory();
  const gates = buildQualityGateReport();
  const ciExists = fs.existsSync(path.join(process.cwd(), '.github/workflows/studio-ci.yml'));
  const readiness: TestingReadiness = {
    generatedAt: new Date().toISOString(),
    testingStatus: inventory.missingRequiredCategories.length === 0 ? 'Regression foundation active' : 'Missing required tests',
    coverageStatus: `${inventory.activeRegressionSpecs.length}/${inventory.requiredCategories.length} required categories covered`,
    qualityGateStatus: gates.status,
    ciStatus: ciExists ? 'Configured' : 'Missing',
    skippedTests: inventory.skippedTests.length,
    requiredCategories: inventory.requiredCategories.length,
    missingCategories: inventory.missingRequiredCategories.length,
  };

  return { inventory, gates, readiness };
}

export function writeTestingReports(bundle = buildTestingReportBundle()): string[] {
  fs.mkdirSync(testingOutputDir, { recursive: true });
  const reports = [
    ['test-inventory.md', renderTestInventory(bundle.inventory)],
    ['testing-report.md', renderTestingReport(bundle)],
    ['coverage-plan.md', renderCoveragePlan(bundle)],
    ['quality-gates.md', renderQualityGates(bundle.gates)],
    ['testing-readiness.md', renderTestingReadiness(bundle.readiness)],
  ] as const;

  return reports.map(([fileName, body]) => {
    const outputPath = path.join(testingOutputDir, fileName);
    fs.writeFileSync(outputPath, body, 'utf8');
    return outputPath;
  });
}

function renderTestInventory(inventory: TestInventory): string {
  return [
    '# Test Inventory',
    '',
    `Generated at: ${inventory.generatedAt}`,
    '',
    '## Required Categories',
    '',
    ...inventory.requiredCategories.map((category) => `- ${inventory.missingRequiredCategories.includes(category) ? '[ ]' : '[x]'} ${category.label}: \`${category.specPath}\``),
    '',
    '## Test Files',
    '',
    ...inventory.testFiles.map((filePath) => `- \`${filePath}\``),
    '',
    '## Skipped Test Audit',
    '',
    ...renderSkippedTests(inventory),
    '',
  ].join('\n');
}

function renderTestingReport(bundle: TestingReportBundle): string {
  return [
    '# Testing Report',
    '',
    `Generated at: ${bundle.readiness.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Testing Status: ${bundle.readiness.testingStatus}`,
    `- Coverage Status: ${bundle.readiness.coverageStatus}`,
    `- Quality Gate Status: ${bundle.readiness.qualityGateStatus}`,
    `- CI Status: ${bundle.readiness.ciStatus}`,
    `- Skipped Tests: ${bundle.readiness.skippedTests}`,
    '',
    '## What Is Protected',
    '',
    '- Revenue Intelligence structure and top lead invariants.',
    '- Revenue source-of-truth required fields and consistency.',
    '- Dashboard security boundary helper.',
    '- Lead qualification score ranges, category presence, normalization, and duplicate removal.',
    '- Runner orchestration order.',
    '- Client conversion package validation and delivery plan structure.',
    '',
  ].join('\n');
}

function renderCoveragePlan(bundle: TestingReportBundle): string {
  return [
    '# Coverage Plan',
    '',
    '## Current Foundation',
    '',
    ...bundle.inventory.activeRegressionSpecs.map((category) => `- ${category.label}: covered by \`${category.specPath}\``),
    '',
    '## Activation Plan For Skipped Tests',
    '',
    '- API health: activate only when `API_BASE_URL` and an approved health endpoint exist.',
    '- Authenticated UI smoke: activate only when safe test credentials exist in local/CI secrets.',
    '- AI response tests: activate only when `AI_API_URL` points to a safe staging endpoint.',
    '',
    '## Next Coverage Priorities',
    '',
    '- Add fixture-based tests for scoring edge cases.',
    '- Add dashboard JSON schema checks.',
    '- Add command report smoke tests for architecture/security/testing generators.',
    '- Add data integrity checks for private runtime migration.',
    '',
  ].join('\n');
}

function renderQualityGates(report: QualityGateReport): string {
  return [
    '# Quality Gates',
    '',
    `Generated at: ${report.generatedAt}`,
    `Status: ${report.status}`,
    '',
    '## Required Release Gate',
    '',
    '- PASS: typecheck',
    '- PASS: required regression tests',
    '- PASS: dashboard security checks',
    '- PASS: source-of-truth checks',
    '',
    '## Fail Conditions',
    '',
    '- FAIL if source-of-truth is invalid.',
    '- FAIL if dashboard security boundary is broken.',
    '- FAIL if runner sequence is invalid.',
    '- FAIL if top lead is empty.',
    '',
    '## Gate Evidence',
    '',
    ...report.gates.map((gate) => `- [${gate.status}] ${gate.name}: ${gate.evidence}`),
    '',
  ].join('\n');
}

function renderTestingReadiness(readiness: TestingReadiness): string {
  return [
    '# Testing Readiness',
    '',
    `Generated at: ${readiness.generatedAt}`,
    '',
    `- Testing Status: ${readiness.testingStatus}`,
    `- Coverage Status: ${readiness.coverageStatus}`,
    `- Quality Gate Status: ${readiness.qualityGateStatus}`,
    `- CI Status: ${readiness.ciStatus}`,
    `- Skipped Tests: ${readiness.skippedTests}`,
    '',
  ].join('\n');
}

function renderSkippedTests(inventory: TestInventory): string[] {
  if (inventory.skippedTests.length === 0) return ['- None.'];
  return inventory.skippedTests.map((item) => `- \`${item.path}:${item.line}\`: ${item.reason}`);
}
