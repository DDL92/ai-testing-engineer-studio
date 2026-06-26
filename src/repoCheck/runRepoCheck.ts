import childProcess = require('child_process');
import fs = require('fs');
import path = require('path');

type CheckStatus = 'pass' | 'fail';

interface RepoCheckItem {
  name: string;
  status: CheckStatus;
  detail: string;
  files: string[];
}

interface RepoCheckReport {
  generatedAt: string;
  status: CheckStatus;
  checks: RepoCheckItem[];
  protectedPatterns: string[];
}

const outputDir = path.join(process.cwd(), 'output', 'operator');
const markdownPath = path.join(outputDir, 'repo-check.md');
const jsonPath = path.join(outputDir, 'repo-check.json');

const protectedGeneratedPrefixes = [
  'runtime/',
  'tmp/test-output/',
  'data/autonomous-runner/',
  'data/messages/message-drafts.json',
  'output/autonomous-runner/',
  'output/evidence/',
  'output/lead-discovery/',
  'output/messages/',
];

const tavilySecretPatterns = [
  /tvly-[A-Za-z0-9_-]{10,}/,
  /TAVILY_API_KEY\s*=\s*(?!\s*(your|example|placeholder|changeme|xxx|<|\$|""|''|$))[^#\s'"]{8,}/i,
];

function main(): void {
  const checks = [
    checkTrackedEnvFiles(),
    checkTavilySecrets(),
    checkProtectedGeneratedChanges(),
  ];
  const report: RepoCheckReport = {
    generatedAt: new Date().toISOString(),
    status: checks.some((check) => check.status === 'fail') ? 'fail' : 'pass',
    checks,
    protectedPatterns: protectedGeneratedPrefixes,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(markdownPath, renderMarkdown(report), 'utf8');
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log(`Repo check ${report.status.toUpperCase()}`);
  console.log(`- ${path.relative(process.cwd(), markdownPath)}`);
  console.log(`- ${path.relative(process.cwd(), jsonPath)}`);

  if (report.status === 'fail') {
    for (const check of report.checks.filter((item) => item.status === 'fail')) {
      console.error(`${check.name}: ${check.detail}`);
      for (const file of check.files) console.error(`- ${file}`);
    }
    process.exitCode = 1;
  }
}

function checkTrackedEnvFiles(): RepoCheckItem {
  const tracked = gitLines(['ls-files', '.env', '.env.*'])
    .filter((file) => !file.endsWith('.env.example') && path.basename(file) !== '.env.example');

  return {
    name: 'No tracked private env files',
    status: tracked.length === 0 ? 'pass' : 'fail',
    detail: tracked.length === 0 ? '.env files are not tracked.' : 'Private env files are tracked.',
    files: tracked,
  };
}

function checkTavilySecrets(): RepoCheckItem {
  const findings = new Set<string>();
  for (const file of gitLines(['ls-files'])) {
    if (shouldSkipContentScan(file)) continue;
    const content = safeRead(file);
    if (content && tavilySecretPatterns.some((pattern) => pattern.test(content))) findings.add(file);
  }

  const stagedDiff = gitText(['diff', '--cached', '--unified=0']);
  if (stagedDiff && tavilySecretPatterns.some((pattern) => pattern.test(stagedDiff))) {
    findings.add('staged diff');
  }

  const files = [...findings].sort();
  return {
    name: 'No Tavily key present',
    status: files.length === 0 ? 'pass' : 'fail',
    detail: files.length === 0 ? 'No Tavily key pattern found in tracked files or staged diff.' : 'Potential Tavily secret pattern found.',
    files,
  };
}

function checkProtectedGeneratedChanges(): RepoCheckItem {
  const staged = gitLines(['diff', '--cached', '--name-only']).filter(isProtectedGeneratedPath);
  const modified = gitLines(['status', '--porcelain'])
    .map((line) => line.slice(3).trim())
    .map((file) => file.includes(' -> ') ? file.split(' -> ').at(-1) ?? file : file)
    .filter(isProtectedGeneratedPath);
  const files = [...new Set([...staged, ...modified])].sort();

  return {
    name: 'No protected generated files staged or modified',
    status: files.length === 0 ? 'pass' : 'fail',
    detail: files.length === 0
      ? 'Protected runtime/generated paths are clean.'
      : 'Protected runtime/generated paths have staged or working-tree changes.',
    files,
  };
}

function isProtectedGeneratedPath(file: string): boolean {
  return protectedGeneratedPrefixes.some((prefix) => file === prefix.replace(/\/$/, '') || file.startsWith(prefix));
}

function shouldSkipContentScan(file: string): boolean {
  return file.startsWith('node_modules/')
    || file.startsWith('package-lock.json')
    || /\.(png|jpg|jpeg|gif|pdf|zip|webm|har)$/i.test(file);
}

function safeRead(file: string): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), file), 'utf8');
  } catch {
    return '';
  }
}

function gitLines(args: string[]): string[] {
  return gitText(args).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function gitText(args: string[]): string {
  try {
    return childProcess.execFileSync('git', args, {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch {
    return '';
  }
}

function renderMarkdown(report: RepoCheckReport): string {
  return [
    '# Repo Check',
    '',
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status.toUpperCase()}`,
    '',
    '## Checks',
    '',
    '| Check | Status | Detail |',
    '| --- | --- | --- |',
    ...report.checks.map((check) => `| ${escapeTable(check.name)} | ${check.status.toUpperCase()} | ${escapeTable(check.detail)} |`),
    '',
    '## Findings',
    '',
    ...report.checks.flatMap((check) => [
      `### ${check.name}`,
      check.files.length > 0 ? check.files.map((file) => `- ${file}`).join('\n') : '- None',
      '',
    ]),
    '## Protected Generated Paths',
    '',
    ...report.protectedPatterns.map((pattern) => `- ${pattern}`),
    '',
  ].join('\n');
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

main();
