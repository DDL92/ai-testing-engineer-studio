import fs = require('fs');
import path = require('path');
import { SourceOfTruthHealth } from './types';

const authorities = [
  ['Revenue Intelligence', 'src/revenueIntelligence/sourceOfTruth.ts', 'module'],
  ['Lead Qualification', 'data/web-discovery/normalized-leads.json', 'json'],
  ['Outcome Learning', 'data/revenue-learning/outcomes.json', 'json'],
  ['Adaptive Revenue', 'src/adaptiveRevenue/adaptiveRules.ts', 'module'],
  ['Client Records', 'data/clients/client-records.json', 'json'],
] as const;

export function scanSourceOfTruthHealth(): SourceOfTruthHealth {
  const results = authorities.map(([authority, filePath, type]) => {
    const absolute = path.join(process.cwd(), filePath);
    if (!fs.existsSync(absolute)) {
      return { authority, path: filePath, status: 'Missing' as const, detail: 'Authority path does not exist.' };
    }
    if (type === 'json') {
      try {
        JSON.parse(fs.readFileSync(absolute, 'utf8'));
      } catch {
        return { authority, path: filePath, status: 'Inconsistent' as const, detail: 'Authority JSON is invalid.' };
      }
    }
    return { authority, path: filePath, status: 'Healthy' as const, detail: 'Authority exists and is readable.' };
  });
  const issues = results
    .filter((item) => item.status !== 'Healthy')
    .map((item) => ({
      level: item.status === 'Missing' ? 'FAIL' as const : 'WARNING' as const,
      area: 'Source Of Truth Health',
      path: item.path,
      message: `${item.authority}: ${item.detail}`,
      recommendation: 'Review the authority path and restore only from a verified local backup.',
    }));

  return {
    status: issues.some((item) => item.level === 'FAIL') ? 'FAIL' : issues.length > 0 ? 'WARNING' : 'PASS',
    checkedItems: results.length,
    healthyItems: results.filter((item) => item.status === 'Healthy').length,
    issues,
    authorities: results,
  };
}
