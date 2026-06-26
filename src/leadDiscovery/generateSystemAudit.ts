import fs = require('fs');
import path = require('path');

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
type AuditStatus = 'PASS' | 'WATCH' | 'BLOCKED';

interface ScriptInventoryItem {
  command: string;
  purpose: string;
  safeOffline: boolean;
  tavilyConsuming: boolean;
  providerConsuming: boolean;
  recommendedUsage: string;
  riskLevel: RiskLevel;
}

interface OutputInventoryItem {
  folder: string;
  recommendation: 'keep' | 'ignore' | 'review before commit' | 'do not commit';
  reason: string;
  riskLevel: RiskLevel;
}

interface OptimizationRecommendation {
  category: 'HIGH IMPACT LOW RISK' | 'MEDIUM IMPACT LOW RISK' | 'DO NOT DO YET';
  recommendation: string;
  reason: string;
}

interface SystemAuditReport {
  generatedAt: string;
  status: AuditStatus;
  summary: {
    scriptCount: number;
    leadDiscoveryFileCount: number;
    duplicateGroups: number;
    unsafeCommandCount: number;
    generatedFileRiskCount: number;
    staleOutputCount: number;
    largeFileCount: number;
    documentationGapCount: number;
    missingGitignoreProtectionCount: number;
    dashboardCoverageStatus: string;
    testHealth: string;
    recommendedNextAction: string;
  };
  blockedCommands: string[];
  duplicatedLeadDiscoveryFiles: Array<{ group: string; files: string[] }>;
  unusedCommands: string[];
  generatedRuntimeRisks: string[];
  documentationGaps: string[];
  staleOutputs: string[];
  unsafeCommands: string[];
  missingGitignoreProtections: string[];
  largeFiles: Array<{ file: string; sizeKb: number }>;
  dashboardCoverage: string[];
  scriptInventory: ScriptInventoryItem[];
  outputInventory: OutputInventoryItem[];
  recommendations: OptimizationRecommendation[];
}

const outputDir = path.join(process.cwd(), 'output', 'system-audit');
const auditMdPath = path.join(outputDir, 'system-audit.md');
const auditJsonPath = path.join(outputDir, 'system-audit.json');
const scriptInventoryPath = path.join(outputDir, 'script-inventory.md');
const outputInventoryPath = path.join(outputDir, 'output-inventory.md');
const recommendationsPath = path.join(outputDir, 'optimization-recommendations.md');

const blockedWhileCreditsExhausted = [
  'leads:search',
  'leads:morning',
  'leads:daily',
  'leads:test-provider',
];

const expectedGitignoreProtections = [
  '.env',
  '.env.local',
  'runtime/',
  'test-results/',
  'playwright-report/',
  'tmp/test-output/',
  'output/evidence/',
  'output/lead-discovery/',
  'data/autonomous-runner/',
  'data/messages/message-drafts.json',
];

const outputFolders: OutputInventoryItem[] = [
  { folder: 'output/operator', recommendation: 'keep', reason: 'Useful local operator summaries and repo-check reports.', riskLevel: 'LOW' },
  { folder: 'output/system-audit', recommendation: 'ignore', reason: 'Generated audit reports; regenerate locally before review.', riskLevel: 'LOW' },
  { folder: 'output/lead-discovery', recommendation: 'ignore', reason: 'Generated lead discovery reports and simulations; usually not source.', riskLevel: 'MEDIUM' },
  { folder: 'output/evidence', recommendation: 'do not commit', reason: 'Generated evidence readiness and evidence state can drift during tests.', riskLevel: 'HIGH' },
  { folder: 'output/commercial', recommendation: 'review before commit', reason: 'Commercial summaries can be useful but may become stale.', riskLevel: 'MEDIUM' },
  { folder: 'runtime', recommendation: 'do not commit', reason: 'Runtime state, loop state, and cost budget are local machine state.', riskLevel: 'HIGH' },
  { folder: 'tmp/test-output', recommendation: 'do not commit', reason: 'Safe test-mode output root for validation artifacts.', riskLevel: 'LOW' },
  { folder: 'test-results', recommendation: 'do not commit', reason: 'Playwright failure artifacts are volatile and may contain screenshots.', riskLevel: 'HIGH' },
  { folder: 'playwright-report', recommendation: 'do not commit', reason: 'HTML test report is generated and can be rebuilt.', riskLevel: 'MEDIUM' },
];

export function generateSystemAudit(now = new Date()): SystemAuditReport {
  const scripts = readPackageScripts();
  const scriptInventory = buildScriptInventory(scripts);
  const leadDiscoveryFiles = listFiles('src/leadDiscovery', '.ts');
  const duplicatedLeadDiscoveryFiles = findDuplicateLeadDiscoveryGroups(leadDiscoveryFiles);
  const unusedCommands = findCommandsWithMissingTargets(scripts);
  const generatedRuntimeRisks = findGeneratedRuntimeRisks();
  const documentationGaps = findDocumentationGaps();
  const staleOutputs = findStaleOutputs();
  const unsafeCommands = scriptInventory.filter((item) => item.riskLevel === 'HIGH').map((item) => item.command);
  const missingGitignoreProtections = findMissingGitignoreProtections();
  const largeFiles = findLargeFiles();
  const dashboardCoverage = findDashboardCoverage();
  const recommendations = buildRecommendations(documentationGaps, missingGitignoreProtections);
  const generatedFileRiskCount = outputFolders.filter((item) => item.riskLevel !== 'LOW').length + generatedRuntimeRisks.length;
  const status: AuditStatus = blockedWhileCreditsExhausted.some((command) => scripts[command])
    ? 'BLOCKED'
    : unsafeCommands.length > 0 || documentationGaps.length > 0 ? 'WATCH' : 'PASS';

  const report: SystemAuditReport = {
    generatedAt: now.toISOString(),
    status,
    summary: {
      scriptCount: Object.keys(scripts).length,
      leadDiscoveryFileCount: leadDiscoveryFiles.length,
      duplicateGroups: duplicatedLeadDiscoveryFiles.length,
      unsafeCommandCount: unsafeCommands.length,
      generatedFileRiskCount,
      staleOutputCount: staleOutputs.length,
      largeFileCount: largeFiles.length,
      documentationGapCount: documentationGaps.length,
      missingGitignoreProtectionCount: missingGitignoreProtections.length,
      dashboardCoverageStatus: dashboardCoverage.length === 0 ? 'Missing System Audit Health dashboard coverage.' : 'System Audit Health coverage detected.',
      testHealth: testHealthSummary(),
      recommendedNextAction: 'Keep Tavily commands blocked, run repo:check before commits, and use safe offline validation while credits are exhausted.',
    },
    blockedCommands: blockedWhileCreditsExhausted,
    duplicatedLeadDiscoveryFiles,
    unusedCommands,
    generatedRuntimeRisks,
    documentationGaps,
    staleOutputs,
    unsafeCommands,
    missingGitignoreProtections,
    largeFiles,
    dashboardCoverage,
    scriptInventory,
    outputInventory: outputFolders,
    recommendations,
  };

  writeReports(report);
  return report;
}

function buildScriptInventory(scripts: Record<string, string>): ScriptInventoryItem[] {
  return Object.entries(scripts)
    .filter(([command]) => command.startsWith('leads:') || ['repo:check', 'system:audit', 'test', 'typecheck'].includes(command))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([command, script]) => {
      const tavilyConsuming = command.includes('tavily') || script.toLowerCase().includes('tavily') || blockedWhileCreditsExhausted.includes(command);
      const providerConsuming = /provider|search|discover/.test(command) || /provider|runSafePublicSearch|testTavilyProvider/.test(script);
      const blocked = blockedWhileCreditsExhausted.includes(command);
      const safeOffline = !blocked && !tavilyConsuming && !providerConsuming;
      return {
        command,
        purpose: purposeFor(command),
        safeOffline,
        tavilyConsuming,
        providerConsuming,
        recommendedUsage: blocked ? 'BLOCKED while Tavily credits are exhausted.' : safeOffline ? 'Safe for offline validation.' : 'Use only with explicit human approval and budget review.',
        riskLevel: blocked || tavilyConsuming ? 'HIGH' : providerConsuming ? 'MEDIUM' : 'LOW',
      };
    });
}

function purposeFor(command: string): string {
  if (command === 'system:audit') return 'Generate offline system audit and optimization reports.';
  if (command === 'repo:check') return 'Check repo cleanliness, secrets, generated-file risk, scripts, and docs.';
  if (command === 'leads:simulate') return 'Run local fixture simulation.';
  if (command === 'leads:regression') return 'Run local golden-dataset regression suite.';
  if (command === 'leads:review-simulate') return 'Run local review decision simulation.';
  if (command === 'leads:dashboard') return 'Generate local lead discovery dashboard.';
  if (command === 'leads:operator') return 'Generate local daily operator brief.';
  if (command === 'test') return 'Run local regression and Playwright tests in test mode.';
  if (command === 'typecheck') return 'Run TypeScript compiler validation.';
  if (blockedWhileCreditsExhausted.includes(command)) return 'External/provider path blocked while Tavily credits are exhausted.';
  return command.replace(/^leads:/, '').replace(/[:-]/g, ' ');
}

function findDuplicateLeadDiscoveryGroups(files: string[]): Array<{ group: string; files: string[] }> {
  const groups = new Map<string, string[]>();
  for (const file of files) {
    const base = path.basename(file, '.ts')
      .replace(/^(generate|run|update|build|prepare|promote|validate|print)/, '')
      .replace(/(Report|Summary|Simulation|Suite|Pack|Queue|Plan|Provider|Candidates?)$/i, '')
      .toLowerCase();
    if (base.length < 5) continue;
    const existing = groups.get(base) ?? [];
    existing.push(file);
    groups.set(base, existing);
  }
  return [...groups.entries()]
    .filter(([, groupFiles]) => groupFiles.length > 1)
    .map(([group, groupFiles]) => ({ group, files: groupFiles.sort() }));
}

function findCommandsWithMissingTargets(scripts: Record<string, string>): string[] {
  return Object.entries(scripts)
    .filter(([, script]) => script.includes('src/leadDiscovery/'))
    .filter(([, script]) => {
      const match = script.match(/src\/leadDiscovery\/[A-Za-z0-9_-]+\.ts/);
      return match ? !fs.existsSync(path.join(process.cwd(), match[0])) : false;
    })
    .map(([command]) => command);
}

function findGeneratedRuntimeRisks(): string[] {
  return outputFolders
    .filter((item) => item.riskLevel === 'HIGH')
    .filter((item) => fs.existsSync(path.join(process.cwd(), item.folder)))
    .map((item) => `${item.folder}: ${item.reason}`);
}

function findDocumentationGaps(): string[] {
  const readme = safeRead('README.md');
  const gaps: string[] = [];
  if (!readme.includes('System Audit + Repo Check')) gaps.push('README is missing System Audit + Repo Check section.');
  if (!readme.includes('npm run system:audit')) gaps.push('README does not document npm run system:audit.');
  if (!readme.includes('npm run repo:check')) gaps.push('README does not document npm run repo:check.');
  if (!readme.includes('Generated files policy')) gaps.push('README generated files policy is missing or hard to find.');
  return gaps;
}

function findStaleOutputs(): string[] {
  const stale: string[] = [];
  const now = Date.now();
  for (const item of outputFolders) {
    const folderPath = path.join(process.cwd(), item.folder);
    if (!fs.existsSync(folderPath)) continue;
    const stats = fs.statSync(folderPath);
    const ageDays = (now - stats.mtimeMs) / (24 * 60 * 60 * 1000);
    if (ageDays > 14) stale.push(`${item.folder}: ${ageDays.toFixed(0)} days old`);
  }
  return stale;
}

function findMissingGitignoreProtections(): string[] {
  const gitignore = safeRead('.gitignore');
  return expectedGitignoreProtections.filter((pattern) => !gitignore.includes(pattern));
}

function findLargeFiles(): Array<{ file: string; sizeKb: number }> {
  return gitLines(['ls-files'])
    .map((file) => ({ file, sizeKb: fileSizeKb(file) }))
    .filter((item) => item.sizeKb >= 512)
    .sort((left, right) => right.sizeKb - left.sizeKb)
    .slice(0, 25);
}

function findDashboardCoverage(): string[] {
  const dashboard = safeRead('src/leadDiscovery/generateClientDashboard.ts');
  const coverage: string[] = [];
  if (dashboard.includes('System Audit Health')) coverage.push('Lead discovery dashboard renders System Audit Health section.');
  if (dashboard.includes('repo-check.json')) coverage.push('Lead discovery dashboard reads repo-check status.');
  if (dashboard.includes('system-audit.json')) coverage.push('Lead discovery dashboard reads system audit status.');
  return coverage;
}

function buildRecommendations(documentationGaps: string[], missingGitignoreProtections: string[]): OptimizationRecommendation[] {
  return [
    {
      category: 'HIGH IMPACT LOW RISK',
      recommendation: 'Keep Tavily-consuming commands explicitly blocked while credits are exhausted.',
      reason: 'Prevents accidental paid provider usage and keeps the workflow local-first.',
    },
    {
      category: 'HIGH IMPACT LOW RISK',
      recommendation: 'Run repo:check before every commit.',
      reason: 'Catches secret risk and generated-file drift before it reaches git.',
    },
    {
      category: 'MEDIUM IMPACT LOW RISK',
      recommendation: 'Group npm scripts by category in README or a generated command inventory.',
      reason: 'The script list is large; category grouping improves live operation without changing business logic.',
    },
    {
      category: 'MEDIUM IMPACT LOW RISK',
      recommendation: documentationGaps.length > 0 ? 'Close README gaps for system audit and generated file policy.' : 'Keep README audit docs concise and current.',
      reason: 'The operator needs a short path for safe validation and commit hygiene.',
    },
    {
      category: 'MEDIUM IMPACT LOW RISK',
      recommendation: missingGitignoreProtections.length > 0 ? 'Add missing volatile paths to .gitignore.' : 'Maintain current .gitignore protections for generated paths.',
      reason: 'Generated outputs and runtime files should not become routine source changes.',
    },
    {
      category: 'DO NOT DO YET',
      recommendation: 'Do not add new providers, browser automation, or scraping flows.',
      reason: 'The system is waiting on Tavily credits or Flora feedback; extra integration surface increases cost and maintenance risk.',
    },
    {
      category: 'DO NOT DO YET',
      recommendation: 'Do not build a larger UI before first paid pilot validation.',
      reason: 'Dashboard additions should stay operational and evidence-driven until revenue is validated.',
    },
  ];
}

function testHealthSummary(): string {
  const regression = safeRead('tmp/test-output/output/lead-discovery/regression/regression-results.json')
    || safeRead('output/lead-discovery/regression/regression-results.json');
  if (!regression) return 'No recent regression output found. Run npm run leads:regression.';
  try {
    const parsed = JSON.parse(regression) as { metrics?: { failed?: number; passRate?: number } };
    return `Regression ${parsed.metrics?.failed === 0 ? 'passing' : 'needs review'}; pass rate ${(((parsed.metrics?.passRate ?? 0) * 100)).toFixed(1)}%.`;
  } catch {
    return 'Regression output exists but could not be parsed.';
  }
}

function writeReports(report: SystemAuditReport): void {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(auditMdPath, renderAuditMarkdown(report), 'utf8');
  fs.writeFileSync(auditJsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(scriptInventoryPath, renderScriptInventory(report.scriptInventory), 'utf8');
  fs.writeFileSync(outputInventoryPath, renderOutputInventory(report.outputInventory), 'utf8');
  fs.writeFileSync(recommendationsPath, renderRecommendations(report.recommendations), 'utf8');
}

function renderAuditMarkdown(report: SystemAuditReport): string {
  return [
    '# Offline System Audit',
    '',
    `Generated: ${report.generatedAt}`,
    `Status: ${report.status}`,
    '',
    '## Summary',
    '',
    `- Package scripts: ${report.summary.scriptCount}`,
    `- Lead Discovery files: ${report.summary.leadDiscoveryFileCount}`,
    `- Duplicate file groups: ${report.summary.duplicateGroups}`,
    `- Unsafe command count: ${report.summary.unsafeCommandCount}`,
    `- Generated file risk count: ${report.summary.generatedFileRiskCount}`,
    `- Stale output count: ${report.summary.staleOutputCount}`,
    `- Large file count: ${report.summary.largeFileCount}`,
    `- Documentation gap count: ${report.summary.documentationGapCount}`,
    `- Missing .gitignore protections: ${report.summary.missingGitignoreProtectionCount}`,
    `- Dashboard coverage: ${report.summary.dashboardCoverageStatus}`,
    `- Test health: ${report.summary.testHealth}`,
    '',
    '## Blocked Commands',
    '',
    ...report.blockedCommands.map((command) => `- npm run ${command}: BLOCKED while Tavily credits are exhausted.`),
    '',
    '## Duplicated Lead Discovery Files',
    '',
    ...listOrNone(report.duplicatedLeadDiscoveryFiles.map((group) => `${group.group}: ${group.files.join(', ')}`)),
    '',
    '## Unused Or Broken Commands',
    '',
    ...listOrNone(report.unusedCommands),
    '',
    '## Generated And Runtime Risks',
    '',
    ...listOrNone(report.generatedRuntimeRisks),
    '',
    '## Documentation Gaps',
    '',
    ...listOrNone(report.documentationGaps),
    '',
    '## Stale Outputs',
    '',
    ...listOrNone(report.staleOutputs),
    '',
    '## Unsafe Commands',
    '',
    ...listOrNone(report.unsafeCommands.map((command) => `npm run ${command}`)),
    '',
    '## Missing .gitignore Protections',
    '',
    ...listOrNone(report.missingGitignoreProtections),
    '',
    '## Large Files',
    '',
    ...listOrNone(report.largeFiles.map((item) => `${item.file}: ${item.sizeKb.toFixed(0)} KB`)),
    '',
    '## Dashboard Coverage',
    '',
    ...listOrNone(report.dashboardCoverage),
    '',
    '## Recommended Next Action',
    '',
    report.summary.recommendedNextAction,
    '',
  ].join('\n');
}

function renderScriptInventory(items: ScriptInventoryItem[]): string {
  return [
    '# Script Inventory',
    '',
    '| Command | Purpose | Safe offline? | Tavily-consuming? | Provider-consuming? | Recommended usage | Risk |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...items.map((item) => `| npm run ${item.command} | ${escapeTable(item.purpose)} | ${yesNo(item.safeOffline)} | ${yesNo(item.tavilyConsuming)} | ${yesNo(item.providerConsuming)} | ${escapeTable(item.recommendedUsage)} | ${item.riskLevel} |`),
    '',
  ].join('\n');
}

function renderOutputInventory(items: OutputInventoryItem[]): string {
  return [
    '# Output Inventory',
    '',
    '| Folder | Keep/ignore recommendation | Reason | Risk |',
    '| --- | --- | --- | --- |',
    ...items.map((item) => `| ${item.folder} | ${item.recommendation} | ${escapeTable(item.reason)} | ${item.riskLevel} |`),
    '',
  ].join('\n');
}

function renderRecommendations(items: OptimizationRecommendation[]): string {
  const categories: OptimizationRecommendation['category'][] = ['HIGH IMPACT LOW RISK', 'MEDIUM IMPACT LOW RISK', 'DO NOT DO YET'];
  return [
    '# Optimization Recommendations',
    '',
    ...categories.flatMap((category) => [
      `## ${category}`,
      '',
      ...items.filter((item) => item.category === category).map((item) => `- ${item.recommendation} ${item.reason}`),
      '',
    ]),
  ].join('\n');
}

function readPackageScripts(): Record<string, string> {
  try {
    return (JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8')) as { scripts?: Record<string, string> }).scripts ?? {};
  } catch {
    return {};
  }
}

function listFiles(folder: string, extension: string): string[] {
  const root = path.join(process.cwd(), folder);
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root)
    .filter((file) => file.endsWith(extension))
    .map((file) => path.join(folder, file))
    .sort();
}

function safeRead(file: string): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), file), 'utf8');
  } catch {
    return '';
  }
}

function gitLines(args: string[]): string[] {
  try {
    return childProcessExec('git', args).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function childProcessExec(command: string, args: string[]): string {
  return require('child_process').execFileSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }) as string;
}

function fileSizeKb(file: string): number {
  try {
    return fs.statSync(path.join(process.cwd(), file)).size / 1024;
  } catch {
    return 0;
  }
}

function listOrNone(items: string[]): string[] {
  return items.length > 0 ? items.map((item) => `- ${item}`) : ['- None'];
}

function yesNo(value: boolean): string {
  return value ? 'yes' : 'no';
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

if (require.main === module) {
  const report = generateSystemAudit();
  console.log(`System audit generated: ${path.relative(process.cwd(), auditMdPath)}, ${path.relative(process.cwd(), auditJsonPath)}`);
  console.log(`Script inventory: ${path.relative(process.cwd(), scriptInventoryPath)}`);
  console.log(`Output inventory: ${path.relative(process.cwd(), outputInventoryPath)}`);
  console.log(`Optimization recommendations: ${path.relative(process.cwd(), recommendationsPath)}`);
  console.log(`Status: ${report.status}`);
}
