import childProcess = require('child_process');
import fs = require('fs');
import path = require('path');
import { buildArchitectureAudit } from '../studioArchitecture/architectureRules';
import { buildRevenueModeDashboard } from '../revenueMode/revenueModeRules';
import {
  ReleaseCommand,
  ReleaseCommandCategory,
  ReleaseCommandStatus,
  ReleaseDashboard,
  ReleaseValidationStatus,
  StudioReleaseReport,
  StudioVersionMetrics,
  ValidationGateResult,
} from './types';

export const releaseDocsDir = path.join(process.cwd(), 'docs', 'release');
export const operationsDocsDir = path.join(process.cwd(), 'docs', 'operations');
const validationReportPath = path.join(releaseDocsDir, 'validation-report.md');

const validationCommands = [
  'npm run studio:health',
  'npm run revenue:morning',
  'npm run dashboard:generate',
  'npm run mobile:summary',
  'npm run typecheck',
  'npm test',
];

const safetyRules = [
  'Studio v1 remains local-only and human-approved.',
  'Release Manager generates documentation and validation evidence only.',
  'No business workflow, command, data source, database, integration, or commercial rule is modified.',
  'No outreach, messages, meetings, invoices, payments, revenue, or outcomes are created.',
];

export function buildStudioReleaseReport(validationResults: ValidationGateResult[] = []): StudioReleaseReport {
  const packageJson = readPackage();
  const metrics = buildVersionMetrics(packageJson);
  const architecture = buildArchitectureAudit();
  const revenueMode = buildRevenueModeDashboard();
  const validationStatus = validationResults.length > 0
    ? validationStatusFor(validationResults)
    : readRecordedValidationStatus();
  const releaseStatus = validationStatus === 'PASS' ? 'RELEASE LOCKED' : 'REVIEW REQUIRED';

  return {
    generatedAt: new Date().toISOString(),
    releaseDate: studioLocalDate(),
    version: packageJson.version,
    releaseStatus,
    featureStatus: 'FEATURE COMPLETE',
    revenueModeStatus: revenueMode.revenueModeStatus === 'ACTIVE' ? 'REVENUE MODE READY' : 'REVIEW REQUIRED',
    testingStatus: validationStatus === 'PASS' ? 'PASS' : validationStatus,
    architectureStatus: architecture.architectureStatus,
    validationStatus,
    metrics,
    commands: buildReleaseCommandInventory(packageJson.scripts),
    validationResults,
    safetyRules,
  };
}

export function runReleaseValidation(): StudioReleaseReport {
  const results = validationCommands.map(runValidationCommand);
  const report = buildStudioReleaseReport(results);
  ensureDocs();
  fs.writeFileSync(validationReportPath, renderValidationReport(report), 'utf8');
  return report;
}

export function buildReleaseDashboard(report = buildStudioReleaseReport()): ReleaseDashboard {
  return {
    studioVersion: report.version,
    releaseStatus: report.releaseStatus,
    revenueModeStatus: report.revenueModeStatus,
    validationStatus: report.validationStatus,
  };
}

export function writeReleaseDocuments(report = buildStudioReleaseReport()): string[] {
  ensureDocs();
  const outputs = [
    [path.join(releaseDocsDir, 'v1-release.md'), renderV1Release(report)],
    [path.join(releaseDocsDir, 'release-notes.md'), renderReleaseNotes(report)],
    [path.join(releaseDocsDir, 'version-report.md'), renderVersionReport(report)],
    [path.join(releaseDocsDir, 'command-inventory.md'), renderCommandInventory(report)],
    [path.join(releaseDocsDir, 'studio-manifest.md'), renderStudioManifest(report)],
    [path.join(releaseDocsDir, 'release-summary.md'), renderReleaseSummary(report)],
    [path.join(operationsDocsDir, 'studio-operations-runbook.md'), renderOperationsRunbook(report)],
    [path.join(operationsDocsDir, 'revenue-mode-runbook.md'), renderRevenueModeRunbook(report)],
  ] as const;
  return outputs.map(([outputPath, body]) => {
    fs.writeFileSync(outputPath, body, 'utf8');
    return outputPath;
  });
}

export function writeDocument(fileName: string, body: string, operations = false): string {
  ensureDocs();
  const outputPath = path.join(operations ? operationsDocsDir : releaseDocsDir, fileName);
  fs.writeFileSync(outputPath, body, 'utf8');
  return outputPath;
}

export function renderReleaseNotes(report: StudioReleaseReport): string {
  return document('AI Testing Engineer Studio v1.0 Release Notes', report, [
    `- Studio Version: ${report.version}`,
    `- Release Date: ${report.releaseDate}`,
    `- Feature Status: ${report.featureStatus}`,
    `- Testing Status: ${report.testingStatus}`,
    `- Architecture Status: ${report.architectureStatus}`,
    `- Revenue Mode Status: ${report.revenueModeStatus}`,
    `- Release Status: ${report.releaseStatus}`,
    '',
    'Studio v1 consolidates the local-first lead, evidence, delivery, learning, health, consistency, archive, dashboard, and Revenue Mode operating layers.',
  ]);
}

export function renderV1Release(report: StudioReleaseReport): string {
  return document('AI Testing Engineer Studio v1.0', report, [
    `- ${report.featureStatus}`,
    `- ${report.revenueModeStatus}`,
    `- ${report.releaseStatus}`,
    `- Validation: ${report.validationStatus}`,
    '',
    'The v1 architecture and command surface are frozen. Future changes should be driven by observed real-world usage, recorded outcomes, defects, security requirements, or explicit operational needs.',
  ]);
}

export function renderVersionReport(report: StudioReleaseReport): string {
  const metrics = report.metrics;
  return document('Studio Version Report', report, [
    `- Studio Version: ${metrics.version}`,
    `- Commands: ${metrics.commandCount}`,
    `- Modules: ${metrics.moduleCount}`,
    `- Reports: ${metrics.reportCount}`,
    `- Test Specifications: ${metrics.testSpecCount}`,
    `- Test Cases Across Configured Projects: ${metrics.testCaseCount}`,
    `- Repository Files: ${metrics.fileCount}`,
    '',
    'Counts are generated from the current local repository and exclude node_modules, .git, Playwright HTML reports, and transient test-results.',
  ]);
}

export function renderCommandInventory(report: StudioReleaseReport): string {
  const categories: ReleaseCommandCategory[] = ['Core', 'Revenue', 'Delivery', 'Evidence', 'Health', 'Archive', 'Other'];
  return document('Studio v1 Command Inventory', report, categories.flatMap((category) => [
    `## ${category} Commands`,
    '',
    '| Command | Status | Script |',
    '| --- | --- | --- |',
    ...report.commands.filter((item) => item.category === category).map((item) => `| npm run ${item.name} | ${item.status} | ${clean(item.script)} |`),
    '',
  ]));
}

export function renderValidationReport(report: StudioReleaseReport): string {
  return document('Studio v1 Validation Report', report, [
    `- Overall Status: ${report.validationStatus}`,
    `- Release Status: ${report.releaseStatus}`,
    '',
    '| Command | Status | Exit Code | Duration | Summary |',
    '| --- | --- | ---: | ---: | --- |',
    ...report.validationResults.map((item) => `| ${item.command} | ${item.status} | ${item.exitCode ?? 'n/a'} | ${item.durationMs} ms | ${clean(item.summary)} |`),
    '',
    'PASS requires every validation command to exit successfully. Skipped tests remain visible in the npm test summary and do not become failures.',
  ]);
}

export function renderOperationsRunbook(report: StudioReleaseReport): string {
  return document('Studio Operations Runbook', report, [
    '## Morning Workflow',
    '1. Run `npm run studio:health`.',
    '2. Run `npm run revenue:morning`.',
    '3. Review the actionable lead and evidence package.',
    '',
    '## Daily Workflow',
    '1. Run the 07:00 local runner or `npm run runner:test` when explicitly approved.',
    '2. Review `npm run revenue:today` output.',
    '3. Complete external actions manually.',
    '4. Record only real outcomes.',
    '',
    '## Weekly Workflow',
    '1. Run `npm run revenue:weekly`.',
    '2. Review follow-ups, evidence freshness, delivery readiness, and system health.',
    '',
    '## Monthly Workflow',
    '1. Review finance, clients, retainers, archive candidates, and learning calibration.',
    '2. Run backup and recovery recommendations.',
    '',
    '## Backup Recommendations',
    '- Run `npm run studio:backup` and review the generated plan.',
    '- Keep private runtime data out of public repositories.',
    '',
    '## Review Recommendations',
    '- Apply no cleanup, archive, outreach, delivery, or revenue action without human approval.',
  ]);
}

export function renderRevenueModeRunbook(report: StudioReleaseReport): string {
  return document('Revenue Mode Runbook', report, [
    '1. **07:00 Runner:** Review the scheduled local runner status.',
    '2. **Morning Brief:** Run `npm run revenue:morning`.',
    '3. **Actionable Lead:** Confirm Revenue Intelligence -> Lead Rotation -> Actionable Lead.',
    '4. **Evidence Package:** Review observed evidence and blockers.',
    '5. **Asset Bundle:** Review delivery assets for client-safe language.',
    '6. **Manual Outreach:** Daniel decides, edits, and sends outside Studio.',
    '7. **Record Outcome:** Record only what actually happened.',
    '8. **Delivery Path:** Use client conversion, delivery plan, evidence, and QA Audit assets.',
    '9. **Retainer Path:** Use retainer planning only after real delivery history exists.',
    '10. **Weekly Review:** Run `npm run revenue:weekly` and review real outcomes.',
    '',
    'No outreach, proposal, meeting, invoice, payment, or client action is automated.',
  ]);
}

export function renderStudioManifest(report: StudioReleaseReport): string {
  return document('AI Testing Engineer Studio v1 Manifest', report, [
    '## Architecture Summary',
    'Local TypeScript modules consume local JSON and generated evidence, then produce review-only Markdown, HTML, JSON, PDF, dashboard, and mobile artifacts.',
    '',
    '## Major Systems',
    '- Lead Discovery and Qualification',
    '- Revenue Intelligence and Lead Rotation',
    '- Evidence Engine and Evidence Pro',
    '- Client Conversion, Delivery Router, Automation Delivery, and Delivery Assets',
    '- Retainer Operations and Outcome Learning',
    '- Studio Health, Commercial Consistency, Archive Manager, Dashboard, and Mobile Command Center',
    '',
    '## Sources Of Truth',
    '- Commercial lead: Revenue Intelligence -> Lead Rotation -> Actionable Lead',
    '- Booked money: `data/finance/finance.json`',
    '- Outcomes: local outcome records entered from real events only',
    '- Clients: local client records',
    '',
    '## Revenue Workflow',
    'Discovery -> Qualification -> Evidence -> Rotation -> Revenue Mode -> Manual Action -> Outcome Recording',
    '',
    '## Delivery Workflow',
    'Lead -> Client Conversion -> Package -> Delivery Plan -> Evidence -> Assets -> Human Review',
    '',
    '## Learning Workflow',
    'Recorded Outcomes -> Revenue Learning -> Bounded Calibration -> Future Recommendations',
  ]);
}

export function renderReleaseSummary(report: StudioReleaseReport): string {
  return document('Studio v1 Release Summary', report, [
    '## Complete',
    '- Feature-complete local operating architecture',
    '- Revenue Mode and actionable-lead consistency',
    '- Evidence, delivery, testing, health, archive, dashboard, and mobile layers',
    '- Release documentation and validation gate',
    '',
    '## Manual',
    '- Outreach, proposal sending, meetings, invoices, payments, client access, and delivery approval',
    '- Outcome recording and archive/cleanup decisions',
    '',
    '## Known Limitations',
    '- Historical artifacts remain available and require periodic review.',
    '- External-service tests remain skipped when services are unavailable.',
    '- Revenue learning remains limited until real outcomes are recorded.',
    '',
    '## Future Improvements',
    'Only implement improvements supported by real-world usage, measured friction, defects, security requirements, or recorded commercial outcomes.',
  ]);
}

function buildVersionMetrics(packageJson: ReturnType<typeof readPackage>): StudioVersionMetrics {
  const testSpecPaths = walk('playwright-framework/tests').filter((file) => file.endsWith('.spec.ts'));
  const testDefinitions = testSpecPaths.reduce((sum, file) => {
    const body = read(file);
    return sum + (body.match(/\btest(?:\.skip)?\s*\(/g)?.length ?? 0);
  }, 0);
  const projectCount = configuredPlaywrightProjects();
  const recordedTestCount = latestRecordedTestCount();
  return {
    version: packageJson.version,
    commandCount: Object.keys(packageJson.scripts).length,
    moduleCount: directories('src').length,
    reportCount: walk('output').length,
    testSpecCount: testSpecPaths.length,
    testCaseCount: recordedTestCount ?? testDefinitions * projectCount,
    fileCount: repositoryFiles().length,
  };
}

function latestRecordedTestCount(): number | null {
  const body = read('docs/release/validation-report.md');
  const match = body.match(/(\d+) skipped\s+(\d+) passed/);
  return match ? Number(match[1]) + Number(match[2]) : null;
}

function buildReleaseCommandInventory(scripts: Record<string, string>): ReleaseCommand[] {
  return Object.entries(scripts).map(([name, script]) => ({
    name,
    script,
    category: commandCategory(name),
    status: commandStatus(name),
  }));
}

function commandCategory(name: string): ReleaseCommandCategory {
  if (/^(studio|runner|dashboard|mobile|consistency|release):/.test(name)) return 'Core';
  if (/^(revenue|lead|followup|outcome|learning|adaptive|winloss|finance):/.test(name)) return 'Revenue';
  if (/^(client|delivery|automation|assets|retainer|renewal):/.test(name)) return 'Delivery';
  if (/^(evidence|audit|intelligence):/.test(name)) return 'Evidence';
  if (/^(testing|security|architecture|system|os):/.test(name)) return 'Health';
  if (/^archive:/.test(name)) return 'Archive';
  return 'Other';
}

function commandStatus(name: string): ReleaseCommandStatus {
  if (/^(operator|mac|os|ux):/.test(name) || name.includes(':legacy')) return 'LEGACY';
  if (/summary|portfolio|review|priorities|readiness|center/.test(name) && !/^(release|revenue|archive):/.test(name)) return 'DEPRECATED CANDIDATE';
  return 'ACTIVE';
}

function runValidationCommand(command: string): ValidationGateResult {
  const started = Date.now();
  const [executable, ...args] = command.split(' ');
  const result = childProcess.spawnSync(executable, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: process.env,
    shell: false,
  });
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim();
  const summary = validationSummary(command, output);
  return {
    command,
    status: result.status === 0 ? 'PASS' : 'FAIL',
    exitCode: result.status,
    durationMs: Date.now() - started,
    summary,
  };
}

function validationSummary(command: string, output: string): string {
  if (command === 'npm test') {
    const match = output.match(/(\d+ skipped\s+\d+ passed[^\n]*)/);
    return match?.[1] ?? tail(output);
  }
  if (command === 'npm run typecheck') return output.includes('tsc --noEmit') ? 'TypeScript compilation completed.' : tail(output);
  return tail(output);
}

function validationStatusFor(results: ValidationGateResult[]): ReleaseValidationStatus {
  return results.every((item) => item.status === 'PASS') ? 'PASS' : 'FAIL';
}

function readRecordedValidationStatus(): ReleaseValidationStatus {
  const body = read('docs/release/validation-report.md');
  const match = body.match(/- Overall Status: (PASS|WARNING|FAIL)/);
  return (match?.[1] as ReleaseValidationStatus | undefined) ?? 'NOT RUN';
}

function readPackage(): { version: string; scripts: Record<string, string> } {
  const raw = JSON.parse(read('package.json')) as { version?: string; scripts?: Record<string, string> };
  return { version: raw.version ?? '0.0.0', scripts: raw.scripts ?? {} };
}

function studioLocalDate(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Costa_Rica',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function configuredPlaywrightProjects(): number {
  const body = read('playwright.config.ts');
  return Math.max(body.match(/\bname:\s*['"][^'"]+['"]/g)?.length ?? 1, 1);
}

function repositoryFiles(): string[] {
  return walk('.').filter((file) =>
    !file.startsWith('node_modules/')
    && !file.startsWith('.git/')
    && !file.startsWith('test-results/')
    && !file.startsWith('playwright-report/'));
}

function directories(root: string): string[] {
  const absolute = path.join(process.cwd(), root);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

function walk(root: string): string[] {
  const absolute = path.resolve(process.cwd(), root);
  if (!fs.existsSync(absolute)) return [];
  if (fs.statSync(absolute).isFile()) return [path.relative(process.cwd(), absolute).replace(/\\/g, '/')];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === 'node_modules' || entry.name === '.git') return [];
    const child = path.join(absolute, entry.name);
    return entry.isDirectory() ? walk(path.relative(process.cwd(), child)) : [path.relative(process.cwd(), child).replace(/\\/g, '/')];
  });
}

function read(relativePath: string): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
  } catch {
    return '';
  }
}

function ensureDocs(): void {
  fs.mkdirSync(releaseDocsDir, { recursive: true });
  fs.mkdirSync(operationsDocsDir, { recursive: true });
}

function document(title: string, report: StudioReleaseReport, lines: string[]): string {
  return [
    `# ${title}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    ...lines,
    '',
    '## Stability Boundary',
    ...report.safetyRules.map((item) => `- ${item}`),
    '',
  ].join('\n');
}

function tail(value: string): string {
  return value.split(/\r?\n/).filter(Boolean).slice(-3).join(' | ') || 'Command completed without console output.';
}

function clean(value: string): string {
  return value.replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
}
