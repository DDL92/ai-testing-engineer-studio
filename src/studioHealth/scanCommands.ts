import fs = require('fs');
import path = require('path');
import { buildCommandInventory } from '../studioArchitecture/architectureRules';
import { CommandHealth, HealthIssue } from './types';

export function scanCommandHealth(): CommandHealth {
  const packagePath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8')) as { scripts?: Record<string, string> };
  const scripts = packageJson.scripts ?? {};
  const inventory = buildCommandInventory();
  const issues: HealthIssue[] = [];
  let brokenCommands = 0;

  for (const [name, script] of Object.entries(scripts)) {
    const entryPoint = extractEntryPoint(script);
    if (entryPoint && !fs.existsSync(path.join(process.cwd(), entryPoint))) {
      brokenCommands += 1;
      issues.push({
        level: 'FAIL',
        area: 'Command Health',
        path: `package.json#scripts.${name}`,
        message: `Command entry point is missing: ${entryPoint}`,
        recommendation: `Review or repair npm run ${name}; do not remove it automatically.`,
      });
    }
  }

  for (const group of inventory.duplicateCommandGroups) {
    issues.push({
      level: 'WARNING',
      area: 'Command Health',
      path: group.commands.map((command) => command.name).join(', '),
      message: group.reason,
      recommendation: 'Review whether these commands should share one official command alias.',
    });
  }

  const status = brokenCommands > 0 ? 'FAIL'
    : inventory.duplicateCommandGroups.length > 0 || inventory.candidateDeprecations.length > 0 ? 'WARNING' : 'PASS';

  return {
    status,
    totalCommands: inventory.totalCommands,
    healthyCommands: inventory.totalCommands - brokenCommands,
    brokenCommands,
    deprecatedCommands: inventory.legacyCommands.length + inventory.candidateDeprecations.length,
    duplicateCommands: inventory.duplicateCommandGroups.reduce((sum, group) => sum + group.commands.length, 0),
    issues,
  };
}

function extractEntryPoint(script: string): string | null {
  const tokens = script.match(/(?:^|\s)((?:src|scripts|playwright-framework)\/[^\s"'|&;]+?\.(?:ts|js|mjs|cjs))(?=\s|$)/);
  return tokens?.[1] ?? null;
}
