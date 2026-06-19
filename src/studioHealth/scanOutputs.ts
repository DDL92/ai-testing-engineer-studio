import fs = require('fs');
import path = require('path');
import { HealthIssue, OutputHealth } from './types';

const requiredReports = [
  'output/dashboard/dashboard.json',
  'output/dashboard/dashboard.html',
  'output/mobile/mobile-summary.md',
  'output/mobile/today.md',
  'output/mobile/pipeline.md',
  'output/mobile/action-center.md',
  'output/evidence/evidence-summary.md',
  'output/evidence/evidence-readiness.md',
  'output/revenue-learning/calibration-summary.md',
  'output/revenue-learning/revenue-learning-status.md',
  'output/retainer-operations/retainer-summary.md',
  'output/delivery-router/delivery-plan.md',
];

export function scanOutputHealth(now = Date.now()): OutputHealth {
  const issues: HealthIssue[] = [];
  const missingReports = requiredReports.filter((filePath) => !fs.existsSync(path.join(process.cwd(), filePath)));
  const staleReports = requiredReports.filter((filePath) => {
    const absolute = path.join(process.cwd(), filePath);
    return fs.existsSync(absolute) && now - fs.statSync(absolute).mtimeMs > 14 * 24 * 60 * 60 * 1000;
  });
  const unexpectedReports = listFiles('output')
    .filter((filePath) => filePath.endsWith('.tmp') || filePath.endsWith('.bak') || filePath.endsWith('~'))
    .map(repoPath);

  for (const filePath of missingReports) {
    issues.push(issue('FAIL', filePath, 'Required report is missing.', regenerationFor(filePath)));
  }
  for (const filePath of staleReports) {
    issues.push(issue('WARNING', filePath, 'Required report is older than 14 days.', regenerationFor(filePath)));
  }
  for (const filePath of unexpectedReports) {
    issues.push(issue('WARNING', filePath, 'Temporary or backup-style output detected.', 'Review manually before archiving or removing.'));
  }

  return {
    status: missingReports.length > 0 ? 'FAIL'
      : staleReports.length > 0 || unexpectedReports.length > 0 ? 'WARNING' : 'PASS',
    requiredReports: requiredReports.length,
    presentReports: requiredReports.length - missingReports.length,
    missingReports,
    staleReports,
    unexpectedReports,
    issues,
  };
}

function regenerationFor(filePath: string): string {
  if (filePath.includes('/dashboard/')) return 'Run npm run dashboard:generate after manual approval.';
  if (filePath.includes('/mobile/')) return 'Run npm run mobile:summary or the relevant mobile generator.';
  if (filePath.includes('/evidence/')) return 'Review evidence inputs, then run the approved evidence summary command.';
  if (filePath.includes('/revenue-learning/')) return 'Run npm run learning:summary.';
  if (filePath.includes('/retainer-operations/')) return 'Run npm run retainer:plan.';
  return 'Run npm run delivery:plan.';
}

function listFiles(root: string): string[] {
  const absolute = path.join(process.cwd(), root);
  if (!fs.existsSync(absolute)) return [];
  return walk(absolute);
}

function walk(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(child) : [child];
  });
}

function repoPath(filePath: string): string {
  return path.relative(process.cwd(), filePath).split(path.sep).join('/');
}

function issue(level: HealthIssue['level'], filePath: string, message: string, recommendation: string): HealthIssue {
  return { level, area: 'Output Health', path: filePath, message, recommendation };
}
