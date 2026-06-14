import childProcess = require('child_process');
import fs = require('fs');
import path = require('path');
import {
  BoundaryRule,
  DashboardPolicyResult,
  DashboardSecurityCase,
  GitignoreCheck,
  InventoryItem,
  SecurityAudit,
} from './types';

export const securityOutputDir = path.join(process.cwd(), 'output', 'security');
export const dashboardRoot = path.join(process.cwd(), 'dashboard');

export const requiredGitignorePatterns = [
  '.env',
  '.env.local',
  'runtime/',
  'output/',
  'data/contacts/',
  'data/outreach/',
  'data/outcomes/',
  'data/outcome-learning/',
  'data/finance/',
  'data/clients/',
  'data/autonomous-runner/',
  'data/dashboard/',
  '*.log',
  '.DS_Store',
  'playwright-report/',
  'test-results/',
  'coverage/',
  'node_modules/',
];

export const privateBoundaryRules: BoundaryRule[] = [
  {
    id: 'env-files',
    label: 'Environment and local secrets',
    severity: 'High',
    description: 'Local environment files can contain API keys, tokens, private URLs, or credentials.',
    exactPaths: ['.env', '.env.local'],
    fileNames: ['.env', '.env.local'],
    remediation: 'Keep only .env.example in the public repository and never commit populated env files.',
  },
  {
    id: 'private-runtime',
    label: 'Private runtime workspace',
    severity: 'High',
    description: 'runtime/ is the local-only home for private data, generated reports, logs, and dashboard state.',
    pathPrefixes: ['runtime/'],
    remediation: 'Keep runtime/ ignored and move operator-only data there before publishing a portfolio repository.',
  },
  {
    id: 'contacts-outreach',
    label: 'Contacts and outreach records',
    severity: 'High',
    description: 'Contact records, LinkedIn context, follow-up state, and outreach history must stay private.',
    pathPrefixes: [
      'data/contacts/',
      'data/outreach/',
      'data/followups/',
      'data/messages/',
      'sales-marketing-engine/crm-tracker/',
      'sales-marketing-engine/operator/input/',
      'sales-marketing-engine/operator/generated/',
      'sales-marketing-engine/operator/approval-queue/',
    ],
    remediation: 'Move real contact/outreach records to runtime/private-data and commit only sanitized examples.',
  },
  {
    id: 'clients-finance-outcomes',
    label: 'Client, finance, and outcome records',
    severity: 'High',
    description: 'Client details, payment status, finance records, win/loss records, and outcomes are private business state.',
    pathPrefixes: [
      'data/clients/',
      'data/finance/',
      'data/outcomes/',
      'data/outcome-learning/',
      'data/client-audit-reports/',
    ],
    exactPaths: ['data/clients.json', 'data/contact-reviews.json'],
    remediation: 'Move real client, finance, and outcome records to runtime/private-data and commit only samples.',
  },
  {
    id: 'lead-operational-state',
    label: 'Lead and operator state',
    severity: 'Medium',
    description: 'Lead discovery state, scoring state, source quality, and autonomous runner state are operator runtime data.',
    pathPrefixes: [
      'data/leads/',
      'data/lead-discovery/',
      'data/web-discovery/',
      'data/web-pain-mining/',
      'data/autonomous-runner/',
      'data/dashboard/',
      'data/mobile/',
      'data/daily-revenue/',
      'data/opportunities/',
      'data/proposals/',
      'data/studio/',
      'data/studio-snapshot/',
    ],
    exactPaths: ['data/leads.json', 'data/first-50-targets.json'],
    remediation: 'Keep live lead/operator state under runtime/private-data and commit sanitized sample lead packs only.',
  },
  {
    id: 'generated-output',
    label: 'Generated reports and private outputs',
    severity: 'Medium',
    description: 'Generated reports can contain private targets, findings, screenshots, client notes, and business outcomes.',
    pathPrefixes: ['output/', 'reports/'],
    remediation: 'Keep generated output ignored; publish only reviewed public portfolio screenshots or sanitized examples.',
  },
  {
    id: 'dashboard-runtime-data',
    label: 'Dashboard runtime data',
    severity: 'Medium',
    description: 'Dashboard JSON and generated dashboard files can expose local business state.',
    exactPaths: ['dashboard/dashboard.json'],
    remediation: 'Serve dashboard files locally only and keep dashboard data sanitized before portfolio publication.',
  },
];

const allowedDashboardExtensions = new Map<string, string>([
  ['.html', 'text/html; charset=utf-8'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
]);

const blockedDashboardPrefixes = [
  'data/',
  'output/',
  'src/',
  'node_modules/',
];

const blockedDashboardExactPaths = [
  '.env',
  '.env.local',
  'package.json',
  'package-lock.json',
];

export function buildSecurityAudit(): SecurityAudit {
  const generatedAt = new Date().toISOString();
  const repoRoot = process.cwd();
  const trackedPaths = new Set(listTrackedFiles());
  const files = listRepoFiles(repoRoot);
  const inventory = files.flatMap((filePath) => classifyFile(repoRoot, filePath, trackedPaths));
  const trackedPrivatePaths = inventory.filter((item) => item.tracked);
  const gitignoreChecks = checkGitignore();
  const remediationCommands = buildRemediationCommands(trackedPrivatePaths);

  return {
    generatedAt,
    repoRoot,
    inventory,
    gitignoreChecks,
    trackedPrivatePaths,
    remediationCommands,
  };
}

export function writeSecurityAuditReports(audit: SecurityAudit): string[] {
  fs.mkdirSync(securityOutputDir, { recursive: true });

  const reports = [
    ['security-audit.md', renderSecurityAudit(audit)],
    ['private-data-inventory.md', renderPrivateDataInventory(audit)],
    ['public-portfolio-plan.md', renderPublicPortfolioPlan(audit)],
    ['security-remediation-plan.md', renderSecurityRemediationPlan(audit)],
  ] as const;

  return reports.map(([fileName, content]) => {
    const outputPath = path.join(securityOutputDir, fileName);
    fs.writeFileSync(outputPath, content, 'utf8');
    return outputPath;
  });
}

export function writeDashboardSecurityCheck(): { outputPath: string; cases: DashboardSecurityCase[]; passed: boolean } {
  const cases = runDashboardSecurityCases();
  const passed = cases.every((item) => item.expectedAllowed === item.actualAllowed);
  const outputPath = path.join(securityOutputDir, 'dashboard-server-security-check.md');

  fs.mkdirSync(securityOutputDir, { recursive: true });
  fs.writeFileSync(outputPath, renderDashboardSecurityCheck(cases, passed), 'utf8');

  return { outputPath, cases, passed };
}

export function runDashboardSecurityCases(root = dashboardRoot): DashboardSecurityCase[] {
  const cases = [
    { label: 'dashboard/index.html can be served', requestPath: '/dashboard/index.html', expectedAllowed: true },
    { label: 'dashboard/app.js can be served', requestPath: '/dashboard/app.js', expectedAllowed: true },
    { label: 'dashboard/styles.css can be served', requestPath: '/dashboard/styles.css', expectedAllowed: true },
    { label: '.env.local cannot be served', requestPath: '/.env.local', expectedAllowed: false },
    { label: 'package.json cannot be served', requestPath: '/package.json', expectedAllowed: false },
    { label: 'data/contacts/contacts.json cannot be served', requestPath: '/data/contacts/contacts.json', expectedAllowed: false },
    { label: 'output/dashboard/dashboard.json cannot be served directly', requestPath: '/output/dashboard/dashboard.json', expectedAllowed: false },
    { label: 'path traversal is blocked', requestPath: '/dashboard/../package.json', expectedAllowed: false },
    { label: 'unknown file types are blocked', requestPath: '/dashboard/notes.md', expectedAllowed: false },
  ];

  return cases.map((item) => {
    const result = resolveDashboardAsset(root, item.requestPath);
    return {
      ...item,
      actualAllowed: result.allowed,
      status: result.status,
      reason: result.reason,
    };
  });
}

export function resolveDashboardAsset(root: string, requestPath: string): DashboardPolicyResult {
  const normalizedRoot = path.resolve(root);
  const decodedPath = safeDecodePath(requestPath);
  if (!decodedPath) return deny(400, 'Invalid URL encoding.');

  const withoutQuery = decodedPath.split('?')[0] ?? decodedPath;
  const normalizedRequest = withoutQuery === '/' ? '/dashboard/index.html' : withoutQuery;
  const relativeRequest = normalizedRequest.replace(/^\/+/, '');

  if (relativeRequest.includes('\0')) return deny(400, 'Null bytes are not allowed.');
  if (relativeRequest.split('/').includes('..')) return deny(403, 'Path traversal is blocked.');
  if (relativeRequest.split('/').some((segment) => segment.startsWith('.'))) return deny(403, 'Dotfiles and dot-directories are blocked.');
  if (blockedDashboardExactPaths.includes(relativeRequest)) return deny(403, 'Repo root private files are blocked.');
  if (blockedDashboardPrefixes.some((prefix) => relativeRequest.startsWith(prefix))) return deny(403, 'Repo data, output, source, and dependency paths are blocked.');
  if (!relativeRequest.startsWith('dashboard/')) return deny(403, 'Only files under dashboard/ may be served.');

  const dashboardRelative = relativeRequest.slice('dashboard/'.length);
  if (!dashboardRelative) return deny(403, 'Dashboard file path is required.');

  const extension = path.extname(dashboardRelative).toLowerCase();
  const contentType = allowedDashboardExtensions.get(extension);
  if (!contentType) return deny(403, `File extension ${extension || '(none)'} is not allowed.`);

  const resolved = path.resolve(normalizedRoot, dashboardRelative);
  if (resolved !== normalizedRoot && !resolved.startsWith(`${normalizedRoot}${path.sep}`)) {
    return deny(403, 'Resolved path is outside dashboard/.');
  }

  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
    return deny(404, 'Dashboard file does not exist.');
  }

  return {
    allowed: true,
    status: 200,
    reason: 'Allowed dashboard asset.',
    filePath: resolved,
    contentType,
  };
}

function deny(status: number, reason: string): DashboardPolicyResult {
  return { allowed: false, status, reason };
}

function safeDecodePath(requestPath: string): string | undefined {
  try {
    return decodeURIComponent(requestPath);
  } catch {
    return undefined;
  }
}

function classifyFile(repoRoot: string, filePath: string, trackedPaths: Set<string>): InventoryItem[] {
  const relativePath = toRepoPath(path.relative(repoRoot, filePath));
  return privateBoundaryRules
    .filter((rule) => matchesRule(rule, relativePath))
    .map((rule) => {
      const stat = fs.statSync(filePath);
      return {
        path: relativePath,
        ruleId: rule.id,
        label: rule.label,
        severity: rule.severity,
        tracked: trackedPaths.has(relativePath),
        sizeBytes: stat.size,
        recommendedAction: rule.remediation,
      };
    });
}

function matchesRule(rule: BoundaryRule, relativePath: string): boolean {
  if (rule.exactPaths?.includes(relativePath)) return true;
  if (rule.fileNames?.includes(path.basename(relativePath))) return true;
  return Boolean(rule.pathPrefixes?.some((prefix) => relativePath.startsWith(prefix)));
}

function listRepoFiles(root: string): string[] {
  const ignoredDirectories = new Set(['.git', 'node_modules', 'playwright-report', 'test-results', 'coverage']);
  if (!fs.existsSync(root)) return [];

  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      if (ignoredDirectories.has(entry.name)) return [];
      return listRepoFiles(fullPath);
    }
    if (entry.isFile()) return [fullPath];
    return [];
  });
}

function listTrackedFiles(): string[] {
  try {
    const output = childProcess.execSync('git ls-files', { cwd: process.cwd(), encoding: 'utf8' });
    return output.split('\n').map((item) => item.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function checkGitignore(): GitignoreCheck[] {
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  const lines = fs.existsSync(gitignorePath)
    ? fs.readFileSync(gitignorePath, 'utf8').split(/\r?\n/).map((line) => line.trim())
    : [];

  return requiredGitignorePatterns.map((pattern) => ({
    pattern,
    present: lines.includes(pattern),
  }));
}

function buildRemediationCommands(items: InventoryItem[]): string[] {
  const paths = Array.from(new Set(items.map((item) => item.path))).sort();
  if (paths.length === 0) return [];

  const grouped = chunk(paths, 20);
  return grouped.map((group) => `git rm --cached -- ${group.map(shellQuote).join(' ')}`);
}

function renderSecurityAudit(audit: SecurityAudit): string {
  const missingGitignore = audit.gitignoreChecks.filter((item) => !item.present);
  const highRiskTracked = audit.trackedPrivatePaths.filter((item) => item.severity === 'High');

  return [
    '# Security Audit',
    '',
    `Generated at: ${audit.generatedAt}`,
    '',
    '## Summary',
    '',
    `- Private or operational files found: ${audit.inventory.length}`,
    `- Tracked private or operational files found: ${audit.trackedPrivatePaths.length}`,
    `- High-risk tracked files found: ${highRiskTracked.length}`,
    `- Missing required .gitignore rules: ${missingGitignore.length}`,
    '',
    '## Boundary Status',
    '',
    audit.trackedPrivatePaths.length === 0
      ? '- No tracked private/runtime paths were detected by the current rules.'
      : '- Tracked private/runtime paths exist. Do not publish this repository publicly until the remediation plan is reviewed.',
    '',
    '## Required .gitignore Checks',
    '',
    ...audit.gitignoreChecks.map((item) => `- ${item.present ? '[x]' : '[ ]'} \`${item.pattern}\``),
    '',
    '## Highest Risk Tracked Paths',
    '',
    ...renderInventoryRows(highRiskTracked.slice(0, 40)),
    '',
    '## Notes',
    '',
    '- This audit does not delete files.',
    '- If a listed file is intentionally public demo data, review and move it to `samples/` with sanitized values.',
    '- If a listed file contains real business data, move it to `runtime/private-data/` or `runtime/private-output/` before publishing.',
    '',
  ].join('\n');
}

function renderPrivateDataInventory(audit: SecurityAudit): string {
  return [
    '# Private Data Inventory',
    '',
    `Generated at: ${audit.generatedAt}`,
    '',
    '## Inventory',
    '',
    ...renderInventoryRows(audit.inventory),
    '',
  ].join('\n');
}

function renderPublicPortfolioPlan(audit: SecurityAudit): string {
  return [
    '# Public Portfolio Plan',
    '',
    `Generated at: ${audit.generatedAt}`,
    '',
    '## Public Repository May Contain',
    '',
    '- Source code',
    '- Templates and docs',
    '- Sanitized sample data under `samples/`',
    '- Demo leads, demo clients, demo outcomes, and demo finance values only',
    '- Public portfolio screenshots that have been reviewed for private data',
    '',
    '## Public Repository Must Not Contain',
    '',
    '- Real contacts, outreach history, LinkedIn records, or CRM state',
    '- Client records, payment status, finance records, outcomes, or private notes',
    '- `.env`, `.env.local`, API keys, tokens, cookies, or credentials',
    '- Generated private reports under `output/` or `reports/`',
    '- Runtime dashboard data under `data/dashboard/` or `output/dashboard/`',
    '',
    '## Target Local Runtime Structure',
    '',
    '```text',
    'runtime/',
    '  private-data/',
    '  private-output/',
    '  private-logs/',
    '  private-dashboard-data/',
    'samples/',
    '  sample-leads.json',
    '  sample-clients.json',
    '  sample-outcomes.json',
    '  sample-finance.json',
    '```',
    '',
    '## Current Remediation Scope',
    '',
    `- Tracked private/runtime candidates: ${audit.trackedPrivatePaths.length}`,
    '- Review `security-remediation-plan.md` before making git index changes.',
    '',
  ].join('\n');
}

function renderSecurityRemediationPlan(audit: SecurityAudit): string {
  return [
    '# Security Remediation Plan',
    '',
    `Generated at: ${audit.generatedAt}`,
    '',
    '## Immediate Actions',
    '',
    '1. Review every tracked path in `private-data-inventory.md`.',
    '2. Move real private data into ignored `runtime/private-data/`, `runtime/private-output/`, `runtime/private-logs/`, or `runtime/private-dashboard-data/` paths.',
    '3. Replace public examples with sanitized files under `samples/`.',
    '4. Remove private paths from the git index only after confirming they are local-only data.',
    '',
    '## Suggested `git rm --cached` Commands',
    '',
    audit.remediationCommands.length > 0
      ? audit.remediationCommands.map((command) => `\`${command}\``).join('\n')
      : 'No tracked private/runtime candidates were detected.',
    '',
    '## Do Not Run Blindly',
    '',
    '- These commands remove files from future commits but keep local working-tree copies.',
    '- Review the list first because this repo may currently track demo artifacts intentionally.',
    '- Do not delete local files unless a separate manual cleanup is approved.',
    '',
  ].join('\n');
}

function renderDashboardSecurityCheck(cases: DashboardSecurityCase[], passed: boolean): string {
  return [
    '# Dashboard Mobile Server Security Check',
    '',
    `Generated at: ${new Date().toISOString()}`,
    `Status: ${passed ? 'Passed' : 'Needs attention'}`,
    '',
    '## Automated Policy Checks',
    '',
    ...cases.map((item) => `- ${item.expectedAllowed === item.actualAllowed ? '[x]' : '[ ]'} ${item.label}: ${item.actualAllowed ? 'allowed' : 'blocked'} (${item.status}, ${item.reason})`),
    '',
    '## Manual Trusted Wi-Fi Checklist',
    '',
    '- Run `npm run dashboard:mobile` only on trusted Wi-Fi.',
    '- Use the printed local network URL from a trusted device on the same network.',
    '- Stop the server with `Ctrl+C` immediately after review.',
    '- Do not expose the port through tunnels, public Wi-Fi, router port forwarding, or shared networks.',
    '',
  ].join('\n');
}

function renderInventoryRows(items: InventoryItem[]): string[] {
  if (items.length === 0) return ['- None found.'];
  return items.map((item) => `- [${item.severity}] ${item.tracked ? 'tracked' : 'untracked'} \`${item.path}\` (${item.label})`);
}

function chunk<T>(items: T[], size: number): T[][] {
  const groups: T[][] = [];
  for (let index = 0; index < items.length; index += size) groups.push(items.slice(index, index + size));
  return groups;
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

function toRepoPath(value: string): string {
  return value.split(path.sep).join('/');
}
