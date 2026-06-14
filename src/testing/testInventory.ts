import fs = require('fs');
import path = require('path');

export interface TestCategory {
  id: string;
  label: string;
  specPath: string;
  required: boolean;
}

export interface SkippedTest {
  path: string;
  line: number;
  reason: string;
}

export interface TestInventory {
  generatedAt: string;
  testFiles: string[];
  requiredCategories: TestCategory[];
  missingRequiredCategories: TestCategory[];
  skippedTests: SkippedTest[];
  activeRegressionSpecs: TestCategory[];
}

export const requiredTestCategories: TestCategory[] = [
  { id: 'revenue-intelligence', label: 'Revenue Intelligence', specPath: 'playwright-framework/tests/regression/revenue-intelligence.spec.ts', required: true },
  { id: 'source-of-truth', label: 'Source Of Truth', specPath: 'playwright-framework/tests/regression/source-of-truth.spec.ts', required: true },
  { id: 'dashboard-security', label: 'Dashboard Security', specPath: 'playwright-framework/tests/regression/dashboard-security.spec.ts', required: true },
  { id: 'lead-qualification', label: 'Lead Qualification', specPath: 'playwright-framework/tests/regression/lead-qualification.spec.ts', required: true },
  { id: 'runner-orchestration', label: 'Runner Orchestration', specPath: 'playwright-framework/tests/regression/runner-orchestration.spec.ts', required: true },
  { id: 'client-preparation', label: 'Client Conversion Preparation', specPath: 'playwright-framework/tests/regression/client-preparation.spec.ts', required: true },
];

export function buildTestInventory(): TestInventory {
  const testFiles = listFiles(path.join(process.cwd(), 'playwright-framework', 'tests'))
    .filter((filePath) => filePath.endsWith('.spec.ts'))
    .map((filePath) => toRepoPath(path.relative(process.cwd(), filePath)))
    .sort();
  const missingRequiredCategories = requiredTestCategories.filter((category) => !fs.existsSync(path.join(process.cwd(), category.specPath)));
  const activeRegressionSpecs = requiredTestCategories.filter((category) => !missingRequiredCategories.includes(category));

  return {
    generatedAt: new Date().toISOString(),
    testFiles,
    requiredCategories: requiredTestCategories,
    missingRequiredCategories,
    skippedTests: findSkippedTests(testFiles),
    activeRegressionSpecs,
  };
}

function findSkippedTests(testFiles: string[]): SkippedTest[] {
  return testFiles.flatMap((filePath) => {
    const absolutePath = path.join(process.cwd(), filePath);
    const lines = fs.readFileSync(absolutePath, 'utf8').split(/\r?\n/);
    return lines.flatMap((line, index) => {
      if (!line.includes('test.skip')) return [];
      return [{
        path: filePath,
        line: index + 1,
        reason: skipReason(line),
      }];
    });
  });
}

function skipReason(line: string): string {
  const match = line.match(/,\s*['"`]([^'"`]+)['"`]/);
  return match?.[1] ?? line.trim();
}

function listFiles(directory: string): string[] {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(fullPath);
    if (entry.isFile()) return [fullPath];
    return [];
  });
}

function toRepoPath(value: string): string {
  return value.split(path.sep).join('/');
}
