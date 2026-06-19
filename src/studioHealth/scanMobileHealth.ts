import fs = require('fs');
import path = require('path');
import { ComponentHealth, HealthIssue } from './types';

const required = [
  'output/mobile/mobile-summary.md',
  'output/mobile/today.md',
  'output/mobile/pipeline.md',
  'output/mobile/action-center.md',
];

export function scanMobileHealth(): ComponentHealth {
  const issues: HealthIssue[] = [];
  let healthyItems = 0;
  for (const filePath of required) {
    const absolute = path.join(process.cwd(), filePath);
    if (!fs.existsSync(absolute) || fs.statSync(absolute).size === 0) {
      issues.push({
        level: 'FAIL',
        area: 'Mobile Health',
        path: filePath,
        message: 'Required mobile report is missing or empty.',
        recommendation: 'Run the relevant mobile generator after manual review.',
      });
    } else {
      healthyItems += 1;
    }
  }
  return {
    status: issues.length > 0 ? 'FAIL' : 'PASS',
    checkedItems: required.length,
    healthyItems,
    issues,
  };
}
