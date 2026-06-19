import fs = require('fs');
import path = require('path');
import { ComponentHealth, HealthIssue } from './types';

const required = [
  'dashboard/dashboard.json',
  'output/dashboard/dashboard.html',
  'dashboard/index.html',
  'dashboard/app.js',
];

export function scanDashboardHealth(): ComponentHealth {
  const issues: HealthIssue[] = [];
  let healthyItems = 0;
  for (const filePath of required) {
    const absolute = path.join(process.cwd(), filePath);
    if (!fs.existsSync(absolute) || fs.statSync(absolute).size === 0) {
      issues.push(issue('FAIL', filePath, 'Required dashboard asset is missing or empty.', 'Run npm run dashboard:generate after review.'));
      continue;
    }
    if (filePath.endsWith('.json')) {
      try {
        JSON.parse(fs.readFileSync(absolute, 'utf8'));
      } catch {
        issues.push(issue('FAIL', filePath, 'Dashboard JSON is invalid.', 'Regenerate dashboard data from source modules.'));
        continue;
      }
    }
    healthyItems += 1;
  }
  return component(required.length, healthyItems, issues);
}

function component(checkedItems: number, healthyItems: number, issues: HealthIssue[]): ComponentHealth {
  return {
    status: issues.some((item) => item.level === 'FAIL') ? 'FAIL' : issues.length > 0 ? 'WARNING' : 'PASS',
    checkedItems,
    healthyItems,
    issues,
  };
}

function issue(level: HealthIssue['level'], filePath: string, message: string, recommendation: string): HealthIssue {
  return { level, area: 'Dashboard Health', path: filePath, message, recommendation };
}
