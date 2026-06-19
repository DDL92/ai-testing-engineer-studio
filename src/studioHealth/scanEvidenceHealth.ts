import fs = require('fs');
import path = require('path');
import { ComponentHealth, HealthIssue } from './types';

const required = [
  'output/evidence/evidence-summary.md',
  'output/evidence/evidence-readiness.md',
  'output/evidence/screenshots',
  'output/evidence/lighthouse',
];

export function scanEvidenceHealth(): ComponentHealth {
  const issues: HealthIssue[] = [];
  let healthyItems = 0;
  for (const filePath of required) {
    const absolute = path.join(process.cwd(), filePath);
    const exists = fs.existsSync(absolute);
    const healthy = exists && (fs.statSync(absolute).isDirectory() ? fs.readdirSync(absolute).length > 0 : fs.statSync(absolute).size > 0);
    if (!healthy) {
      issues.push({
        level: filePath.includes('screenshots') || filePath.includes('lighthouse') ? 'WARNING' : 'FAIL',
        area: 'Evidence Health',
        path: filePath,
        message: 'Required evidence artifact is missing or empty.',
        recommendation: 'Review approved evidence inputs and rebuild evidence reports manually.',
      });
    } else {
      healthyItems += 1;
    }
  }
  return {
    status: issues.some((item) => item.level === 'FAIL') ? 'FAIL' : issues.length > 0 ? 'WARNING' : 'PASS',
    checkedItems: required.length,
    healthyItems,
    issues,
  };
}
