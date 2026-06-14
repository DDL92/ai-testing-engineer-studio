import fs = require('fs');
import path = require('path');
import { buildTestInventory } from './testInventory';

export interface QualityGate {
  name: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
  evidence: string;
}

export interface QualityGateReport {
  generatedAt: string;
  status: 'PASS' | 'FAIL' | 'PENDING';
  gates: QualityGate[];
}

export function buildQualityGateReport(): QualityGateReport {
  const inventory = buildTestInventory();
  const gates: QualityGate[] = [
    {
      name: 'Required regression specs exist',
      status: inventory.missingRequiredCategories.length === 0 ? 'PASS' : 'FAIL',
      evidence: inventory.missingRequiredCategories.length === 0
        ? `${inventory.activeRegressionSpecs.length} required categories present.`
        : `Missing: ${inventory.missingRequiredCategories.map((item) => item.label).join(', ')}`,
    },
    {
      name: 'Dashboard security checks exist',
      status: fs.existsSync(path.join(process.cwd(), 'playwright-framework/tests/regression/dashboard-security.spec.ts')) ? 'PASS' : 'FAIL',
      evidence: 'Blocks private/runtime paths and allows dashboard static assets.',
    },
    {
      name: 'Source-of-truth checks exist',
      status: fs.existsSync(path.join(process.cwd(), 'playwright-framework/tests/regression/source-of-truth.spec.ts')) ? 'PASS' : 'FAIL',
      evidence: 'Fails when top lead, offer, decision, or recommendation are missing.',
    },
    {
      name: 'Runner checks exist',
      status: fs.existsSync(path.join(process.cwd(), 'playwright-framework/tests/regression/runner-orchestration.spec.ts')) ? 'PASS' : 'FAIL',
      evidence: 'Validates required daily refresh sequence ordering.',
    },
    {
      name: 'CI workflow exists',
      status: fs.existsSync(path.join(process.cwd(), '.github/workflows/studio-ci.yml')) ? 'PASS' : 'FAIL',
      evidence: '.github/workflows/studio-ci.yml',
    },
  ];
  const status = gates.some((gate) => gate.status === 'FAIL') ? 'FAIL' : gates.some((gate) => gate.status === 'PENDING') ? 'PENDING' : 'PASS';

  return {
    generatedAt: new Date().toISOString(),
    status,
    gates,
  };
}
