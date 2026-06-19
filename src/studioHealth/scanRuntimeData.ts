import crypto = require('crypto');
import fs = require('fs');
import path = require('path');
import { HealthIssue, RuntimeHealth } from './types';

const roots = ['data', 'output', 'dashboard'];
const oversizedBytes = 5 * 1024 * 1024;

export function scanRuntimeHealth(): RuntimeHealth {
  const files = roots.flatMap(listFiles);
  const issues: HealthIssue[] = [];
  const hashes = new Map<string, string[]>();
  let generatedFiles = 0;
  let cacheFiles = 0;
  let temporaryFiles = 0;
  let emptyFiles = 0;
  let oversizedFiles = 0;
  let invalidJsonFiles = 0;

  for (const filePath of files) {
    const relative = repoPath(filePath);
    const stat = fs.statSync(filePath);
    if (relative.startsWith('output/') || relative.startsWith('dashboard/')) generatedFiles += 1;
    if (relative.includes('/.state/') || relative.endsWith('state.json') || relative.includes('last-run.json') || relative === 'dashboard/dashboard.json') cacheFiles += 1;
    if (relative.includes('/tmp/') || relative.endsWith('.tmp') || relative.endsWith('.log')) temporaryFiles += 1;

    if (stat.size === 0) {
      emptyFiles += 1;
      issues.push(issue('WARNING', relative, 'Empty runtime file detected.', 'Review whether the file is a valid placeholder or needs regeneration.'));
    }
    if (stat.size > oversizedBytes) {
      oversizedFiles += 1;
      issues.push(issue('WARNING', relative, `Oversized runtime file: ${formatBytes(stat.size)}.`, 'Review for archive, compression, or exclusion from routine scans.'));
    }
    if (relative.endsWith('.json') && stat.size > 0) {
      try {
        JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch {
        invalidJsonFiles += 1;
        issues.push(issue('FAIL', relative, 'JSON data is corrupted or incomplete.', 'Restore from a reviewed backup or regenerate from the documented source.'));
      }
    }
    if (stat.size > 0 && stat.size <= oversizedBytes && isMeaningfulDuplicateCandidate(relative, filePath)) {
      const hash = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
      hashes.set(hash, [...(hashes.get(hash) ?? []), relative]);
    }
  }

  const duplicateGroups = [...hashes.values()].filter((group) => group.length > 1);
  for (const group of duplicateGroups.slice(0, 40)) {
    issues.push(issue('WARNING', group.join(', '), 'Files have identical content.', 'Review duplicate outputs before archiving; do not delete automatically.'));
  }

  return {
    status: invalidJsonFiles > 0 ? 'FAIL'
      : emptyFiles > 0 || oversizedFiles > 0 || duplicateGroups.length > 0 ? 'WARNING' : 'PASS',
    runtimeFiles: files.length,
    generatedFiles,
    cacheFiles,
    temporaryFiles,
    duplicateFiles: duplicateGroups.reduce((sum, group) => sum + group.length, 0),
    emptyFiles,
    oversizedFiles,
    invalidJsonFiles,
    issues,
  };
}

function listFiles(root: string): string[] {
  const absolute = path.join(process.cwd(), root);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(absolute, entry.name);
    return entry.isDirectory() ? listDirectory(child) : [child];
  });
}

function listDirectory(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const child = path.join(directory, entry.name);
    return entry.isDirectory() ? listDirectory(child) : [child];
  });
}

function repoPath(filePath: string): string {
  return path.relative(process.cwd(), filePath).split(path.sep).join('/');
}

function issue(level: HealthIssue['level'], filePath: string, message: string, recommendation: string): HealthIssue {
  return { level, area: 'Runtime Health', path: filePath, message, recommendation };
}

function formatBytes(value: number): string {
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function isMeaningfulDuplicateCandidate(relativePath: string, filePath: string): boolean {
  if (relativePath.endsWith('/.gitkeep') || relativePath === '.gitkeep') return false;
  if (relativePath.endsWith('.json')) {
    const content = fs.readFileSync(filePath, 'utf8').trim();
    if (content === '[]' || content === '{}') return false;
  }
  return true;
}
