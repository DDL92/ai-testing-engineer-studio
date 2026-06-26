import childProcess = require('child_process');
import fs = require('fs');
import path = require('path');

type CheckStatus = 'pass' | 'warn' | 'fail';

interface RepoCheckItem {
  name: string;
  status: CheckStatus;
  detail: string;
  files: string[];
}

interface RepoCheckReport {
  generatedAt: string;
  status: CheckStatus;
  hardFailure: boolean;
  checks: RepoCheckItem[];
  protectedGeneratedPaths: string[];
}

const outputDir = path.join(process.cwd(), 'output', 'operator');
const markdownPath = path.join(outputDir, 'repo-check.md');
const jsonPath = path.join(outputDir, 'repo-check.json');

const protectedGeneratedPrefixes = [
  'runtime/',
  'test-results/',
  'playwright-report/',
  'tmp/test-output/',
  'data/autonomous-runner/',
  'data/messages/message-drafts.json',
  'output/evidence/',
  'output/lead-discovery/',
  'output/autonomous-runner/',
  'output/messages/',
];

const requiredScripts = [
  'repo:check',
  'system:audit',
  'leads:operator',
  'leads:simulate',
  'leads:regression',
  'leads:review-simulate',
  'leads:dashboard',
  'test',
  'typecheck',
];

const requiredDocs = [
  'README.md',
  '.gitignore',
  '.env.example',
  'package.json',
  'playwright.config.ts',
];

const tavilySecretPatterns = [
  /tvly-[A-Za-z0-9_-]{10,}/,
  /TAVILY_API_KEY\s*=\s*(?!\s*(your|example|placeholder|changeme|xxx|<|\$|""|''|$))[^#\s'"]{8,}/i,
];

export function runRepoCheck(now = new Date()): RepoCheckReport {
  const checks = [
    checkTrackedEnvFiles(),
    checkTavilySecrets(),
    checkGeneratedStagingRisk(),
    checkRequiredScripts(),
    checkRequiredDocs(),
  ];
  const hardFailure = checks.some((check) => check.name === 'No Tavily key string in tracked files' && check.status === 'fail');
  const status: CheckStatus = hardFailure ? 'fail' : checks.some((check) => check.status === 'warn') ? 'warn' : 'pass';
  const report: RepoCheckReport = {
    generatedAt: now.toISOString(),
    status,
    hardFailure,
    checks,
    protectedGeneratedPaths: protectedGeneratedPrefixes,
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(markdownPath, renderMarkdown(report), 'utf8');
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return report;
}

function checkTrackedEnvFiles(): RepoCheckItem {
  const tracked = gitLines(['ls-files', '.env', '.env.local', '.env.*'])
    .filter((file) => !file.endsWith('.env.example') && path.basename(file) !== '.env.example');
  return {
    name: 'Private env files are not tracked',
    status: tracked.length > 0 ? 'warn' : 'pass',
    detail: tracked.length > 0 ? 'Private env file paths are tracked and should be removed from git.' : '.env and .env.local are not tracked.',
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
  if (stagedDiff && tavilySecretPatterns.some((pattern) => pattern.test(stagedDiff))) findings.add('staged diff');

  const files = [...findings].sort();
  return {
    name: 'No Tavily key string in tracked files',
    status: files.length > 0 ? 'fail' : 'pass',
    detail: files.length > 0 ? 'Potential Tavily secret string found.' : 'No Tavily key pattern found in tracked files or staged diff.',
    files,
  };
}

function checkGeneratedStagingRisk(): RepoCheckItem {
  const staged = gitLines(['diff', '--cached', '--name-only']).filter(isProtectedGeneratedPath);
  const modified = gitLines(['status', '--porcelain'])
    .map((line) => line.slice(3).trim())
    .map((file) => file.includes(' -> ') ? file.split(' -> ').at(-1) ?? file : file)
    .filter(isProtectedGeneratedPath);
  const files = [...new Set([...staged, ...modified])].sort();
  return {
    name: 'Generated/runtime files are not staged',
    status: files.length > 0 ? 'warn' : 'pass',
    detail: files.length > 0 ? 'Generated or runtime files are staged or modified; review before commit.' : 'Protected generated/runtime paths are clean.',
    files,
  };
}

function checkRequiredScripts(): RepoCheckItem {
  const scripts = readPackageScripts();
  const missing = requiredScripts.filter((script) => !scripts[script]);
  return {
    name: 'Required package scripts exist',
    status: missing.length > 0 ? 'warn' : 'pass',
    detail: missing.length > 0 ? 'Required scripts are missing.' : 'Required scripts are available.',
    files: missing.map((script) => `package.json scripts.${script}`),
  };
}

function checkRequiredDocs(): RepoCheckItem {
  const missing = requiredDocs.filter((file) => !fs.existsSync(path.join(process.cwd(), file)));
  return {
    name: 'Required docs and config exist',
    status: missing.length > 0 ? 'warn' : 'pass',
    detail: missing.length > 0 ? 'Required docs/config files are missing.' : 'Required docs/config files exist.',
    files: missing,
  };
}

function readPackageScripts(): Record<string, string> {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8');
    return (JSON.parse(raw) as { scripts?: Record<string, string> }).scripts ?? {};
  } catch {
    return {};
  }
}

function isProtectedGeneratedPath(file: string): boolean {
  return protectedGeneratedPrefixes.some((prefix) => file === prefix.replace(/\/$/, '') || file.startsWith(prefix));
}

function shouldSkipContentScan(file: string): boolean {
  return file.startsWith('node_modules/')
    || file === 'package-lock.json'
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
    `Hard Failure: ${report.hardFailure ? 'Yes' : 'No'}`,
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
    ...report.protectedGeneratedPaths.map((pattern) => `- ${pattern}`),
    '',
    '## Exit Policy',
    '',
    '- Fails hard only when a Tavily secret pattern is found.',
    '- Generated/runtime changes are warnings so the operator can review intentional local artifacts.',
    '',
  ].join('\n');
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

if (require.main === module) {
  const report = runRepoCheck();
  console.log(`Repo check ${report.status.toUpperCase()}`);
  console.log(`- ${path.relative(process.cwd(), markdownPath)}`);
  console.log(`- ${path.relative(process.cwd(), jsonPath)}`);
  if (report.hardFailure) process.exitCode = 1;
}
