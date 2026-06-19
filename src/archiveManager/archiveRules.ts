import crypto = require('crypto');
import fs = require('fs');
import path = require('path');
import {
  ArchiveArtifact,
  ArchiveClassification,
  ArchiveDashboard,
  ArchiveReport,
  ArchiveScore,
} from './types';

export const archiveOutputDir = path.join(process.cwd(), 'output', 'archive');

const scanRoots = ['output', 'dashboard', 'reports', 'samples', 'tmp', '.cache', '.playwright-cli', 'test-results'];
const activeOutputPrefixes = [
  'output/revenue-mode/',
  'output/commercial-consistency/',
  'output/dashboard/',
  'output/mobile/mobile-summary.md',
  'output/delivery-assets/',
  'output/evidence-pro/',
  'output/client-conversion/',
  'output/delivery-router/',
];

export const retentionPolicy: Record<ArchiveClassification, string> = {
  ACTIVE: 'Retain indefinitely. Regenerate through the owning command; do not edit generated reports manually.',
  PORTFOLIO: 'Retain indefinitely after privacy and public-safety review.',
  EXAMPLE: 'Retain indefinitely as clearly labeled demo, sample, tutorial, or fixture material.',
  HISTORICAL: 'Review quarterly. Keep contextual history separate from active operating surfaces.',
  TEMPORARY: 'Review monthly. Remove only after explicit human approval and confirmation that no evidence is required.',
  ARCHIVE_CANDIDATE: 'Review manually. Consider a future archive folder only after ownership and regeneration paths are confirmed.',
};

const safetyRules = [
  'Archive Manager is local-only, read-only, and recommendation-only except for its own generated reports.',
  'No file is moved, deleted, renamed, rewritten, compressed, archived, or excluded automatically.',
  'No source, runtime data, evidence, client artifact, or historical report is modified.',
  'Human approval is required before any future retention or archive action.',
];

export function buildArchiveReport(now = Date.now()): ArchiveReport {
  const filePaths = scanRoots.flatMap(walk).filter((file) => !file.startsWith('output/archive/'));
  const duplicateGroups = duplicateContentGroups(filePaths);
  const artifacts = filePaths.map((filePath) => classifyArtifact(filePath, duplicateGroups, now));
  const historical = artifacts.filter((item) => item.classification === 'HISTORICAL');
  const portfolio = artifacts.filter((item) => item.classification === 'PORTFOLIO');
  const generatedReports = artifacts.filter((item) => isGeneratedReport(item.path));
  const temporary = artifacts.filter((item) => item.classification === 'TEMPORARY');
  const examples = artifacts.filter((item) => item.classification === 'EXAMPLE');
  const archiveCandidates = artifacts.filter((item) => item.classification === 'ARCHIVE_CANDIDATE');
  const score = calculateArchiveScore(artifacts);

  return {
    generatedAt: new Date(now).toISOString(),
    artifacts,
    historical,
    portfolio,
    generatedReports,
    temporary,
    examples,
    archiveCandidates,
    reportSummary: {
      activeReports: generatedReports.filter((item) => item.classification === 'ACTIVE').length,
      historicalReports: generatedReports.filter((item) => item.classification === 'HISTORICAL').length,
      duplicateReports: generatedReports.filter((item) => item.duplicateGroup).length,
      staleReports: generatedReports.filter((item) => item.staleDays >= 30).length,
    },
    totalSizeBytes: artifacts.reduce((sum, item) => sum + item.sizeBytes, 0),
    temporarySizeBytes: temporary.reduce((sum, item) => sum + item.sizeBytes, 0),
    score,
    retentionPolicy,
    safetyRules,
  };
}

export function buildArchiveDashboard(report = buildArchiveReport()): ArchiveDashboard {
  return {
    archiveStatus: report.score.status,
    historicalArtifacts: report.historical.length,
    portfolioAssets: report.portfolio.length,
    temporaryAssets: report.temporary.length,
    retentionStatus: `${Object.keys(report.retentionPolicy).length}/6 classifications covered`,
    archiveScore: `${report.score.score}/100`,
  };
}

export function classifyArtifact(
  filePath: string,
  duplicateGroups = new Map<string, string>(),
  now = Date.now(),
): ArchiveArtifact {
  const absolute = path.join(process.cwd(), filePath);
  const stat = fs.statSync(absolute);
  const normalized = filePath.replace(/\\/g, '/');
  const staleDays = Math.max(0, Math.floor((now - stat.mtime.getTime()) / 86_400_000));
  const duplicateGroup = duplicateGroups.get(normalized);
  const classification = classificationFor(normalized, staleDays, duplicateGroup);
  const portfolio = portfolioValue(normalized, classification);
  const runtimeData = containsRuntimeData(normalized);
  const publicSafe = publicSafety(normalized, runtimeData);

  return {
    path: normalized,
    classification,
    reason: reasonFor(classification, normalized, staleDays, duplicateGroup),
    recommendation: recommendationFor(classification),
    sizeBytes: stat.size,
    modifiedAt: stat.mtime.toISOString(),
    staleDays,
    publicSafe,
    containsRuntimeData: runtimeData,
    portfolioValue: portfolio,
    ...(duplicateGroup ? { duplicateGroup } : {}),
  };
}

export function calculateArchiveScore(artifacts: ArchiveArtifact[]): ArchiveScore {
  const count = Math.max(artifacts.length, 1);
  const historical = artifacts.filter((item) => item.classification === 'HISTORICAL').length;
  const portfolio = artifacts.filter((item) => item.classification === 'PORTFOLIO');
  const temporary = artifacts.filter((item) => item.classification === 'TEMPORARY');
  const archiveCandidates = artifacts.filter((item) => item.classification === 'ARCHIVE_CANDIDATE').length;
  const classified = artifacts.filter((item) => retentionPolicy[item.classification]).length;
  const operationalCleanliness = bounded(100 - Math.round(((historical + archiveCandidates) / count) * 100));
  const historicalManagement = historical === 0 ? 100 : 75;
  const portfolioManagement = portfolio.length === 0 ? 70 : Math.round(portfolio.filter((item) => item.publicSafe !== 'NO').length / portfolio.length * 100);
  const temporaryManagement = temporary.length === 0 ? 100 : bounded(100 - Math.min(50, temporary.length));
  const retentionCoverage = Math.round(classified / count * 100);
  const score = Math.round(
    operationalCleanliness * 0.25
    + historicalManagement * 0.2
    + portfolioManagement * 0.2
    + temporaryManagement * 0.15
    + retentionCoverage * 0.2,
  );
  return {
    score,
    status: score >= 85 ? 'HEALTHY' : score >= 65 ? 'WATCH' : 'AT RISK',
    operationalCleanliness,
    historicalManagement,
    portfolioManagement,
    temporaryManagement,
    retentionCoverage,
  };
}

export function writeArchiveOutputs(report = buildArchiveReport()): string[] {
  fs.mkdirSync(archiveOutputDir, { recursive: true });
  const outputs = [
    ['historical-artifacts.md', renderArtifactReport('Historical Artifacts', report.historical, report)],
    ['portfolio-artifacts.md', renderPortfolioArtifacts(report)],
    ['generated-reports.md', renderGeneratedReports(report)],
    ['temporary-artifacts.md', renderTemporaryArtifacts(report)],
    ['example-artifacts.md', renderArtifactReport('Example Artifacts', report.examples, report)],
    ['archive-plan.md', renderArchivePlan(report)],
    ['portfolio-plan.md', renderPortfolioPlan(report)],
    ['retention-policy.md', renderRetentionPolicy(report)],
    ['archive-summary.md', renderArchiveSummary(report)],
    ['archive-readiness.md', renderArchiveReadiness(report)],
  ] as const;
  return outputs.map(([fileName, body]) => {
    const outputPath = path.join(archiveOutputDir, fileName);
    fs.writeFileSync(outputPath, body, 'utf8');
    return outputPath;
  });
}

export function renderArtifactReport(title: string, artifacts: ArchiveArtifact[], report: ArchiveReport): string {
  return document(title, report, [
    '| File | Classification | Reason | Recommendation |',
    '| --- | --- | --- | --- |',
    ...rowsOrEmpty(artifacts, (item) => `| ${item.path} | ${item.classification} | ${clean(item.reason)} | ${clean(item.recommendation)} |`),
  ]);
}

export function renderPortfolioArtifacts(report: ArchiveReport): string {
  return document('Portfolio Artifacts', report, [
    '| File | Portfolio Value | Public Safe | Contains Runtime Data | Recommendation |',
    '| --- | --- | --- | --- | --- |',
    ...rowsOrEmpty(report.portfolio, (item) => `| ${item.path} | ${item.portfolioValue} | ${item.publicSafe} | ${item.containsRuntimeData ? 'YES' : 'NO'} | ${clean(item.recommendation)} |`),
  ]);
}

export function renderGeneratedReports(report: ArchiveReport): string {
  return document('Generated Reports Inventory', report, [
    `- Active Reports: ${report.reportSummary.activeReports}`,
    `- Historical Reports: ${report.reportSummary.historicalReports}`,
    `- Duplicate Reports: ${report.reportSummary.duplicateReports}`,
    `- Stale Reports: ${report.reportSummary.staleReports}`,
    '',
    '| File | Classification | Age | Duplicate |',
    '| --- | --- | ---: | --- |',
    ...rowsOrEmpty(report.generatedReports, (item) => `| ${item.path} | ${item.classification} | ${item.staleDays} days | ${item.duplicateGroup ?? 'No'} |`),
  ]);
}

export function renderTemporaryArtifacts(report: ArchiveReport): string {
  return document('Temporary Artifacts', report, [
    `- Temporary Count: ${report.temporary.length}`,
    `- Storage Size: ${formatBytes(report.temporarySizeBytes)}`,
    '- Retention Recommendation: review monthly; retain traces, videos, and screenshots when required as evidence.',
    '',
    '| File | Size | Reason | Recommendation |',
    '| --- | ---: | --- | --- |',
    ...rowsOrEmpty(report.temporary, (item) => `| ${item.path} | ${formatBytes(item.sizeBytes)} | ${clean(item.reason)} | ${clean(item.recommendation)} |`),
  ]);
}

export function renderArchivePlan(report: ArchiveReport): string {
  return document('Archive Plan', report, [
    `- Historical artifacts to label later: ${report.historical.length}`,
    `- Archive candidates requiring manual review: ${report.archiveCandidates.length}`,
    `- Temporary artifacts requiring monthly review: ${report.temporary.length}`,
    '',
    '1. Mark historical reports in a future metadata manifest.',
    '2. Create historical folders only after explicit approval.',
    '3. Keep active operating outputs at their current paths.',
    '4. Separate examples and portfolio assets through labels before any move.',
    '5. Retain evidence packages until their business and portfolio value is reviewed.',
  ]);
}

export function renderPortfolioPlan(report: ArchiveReport): string {
  return document('Portfolio Plan', report, [
    `- Portfolio assets identified: ${report.portfolio.length}`,
    `- Public-safe candidates: ${report.portfolio.filter((item) => item.publicSafe === 'YES').length}`,
    `- Review-required candidates: ${report.portfolio.filter((item) => item.publicSafe === 'REVIEW').length}`,
    `- Private/runtime candidates: ${report.portfolio.filter((item) => item.publicSafe === 'NO').length}`,
    '',
    'Use only human-reviewed, sanitized assets for public portfolio publication.',
  ]);
}

export function renderRetentionPolicy(report: ArchiveReport): string {
  return document('Retention Policy', report, [
    '| Classification | Policy |',
    '| --- | --- |',
    ...Object.entries(report.retentionPolicy).map(([classification, policy]) => `| ${classification} | ${policy} |`),
  ]);
}

export function renderArchiveSummary(report: ArchiveReport): string {
  return document('Archive Summary', report, [
    `- Total Artifacts: ${report.artifacts.length}`,
    `- Total Size: ${formatBytes(report.totalSizeBytes)}`,
    `- Active: ${count(report, 'ACTIVE')}`,
    `- Historical: ${report.historical.length}`,
    `- Portfolio: ${report.portfolio.length}`,
    `- Example: ${report.examples.length}`,
    `- Temporary: ${report.temporary.length}`,
    `- Archive Candidates: ${report.archiveCandidates.length}`,
    `- Archive Status: ${report.score.status}`,
    `- Archive Score: ${report.score.score}/100`,
  ]);
}

export function renderArchiveReadiness(report: ArchiveReport): string {
  return document('Archive Readiness', report, [
    `- Archive Score: ${report.score.score}/100`,
    `- Status: ${report.score.status}`,
    `- Operational Cleanliness: ${report.score.operationalCleanliness}/100`,
    `- Historical Management: ${report.score.historicalManagement}/100`,
    `- Portfolio Management: ${report.score.portfolioManagement}/100`,
    `- Temporary Management: ${report.score.temporaryManagement}/100`,
    `- Retention Coverage: ${report.score.retentionCoverage}/100`,
  ]);
}

function classificationFor(file: string, staleDays: number, duplicateGroup?: string): ArchiveClassification {
  if (isTemporary(file)) return 'TEMPORARY';
  if (isExample(file)) return 'EXAMPLE';
  if (isActive(file)) return 'ACTIVE';
  if (isPortfolio(file)) return 'PORTFOLIO';
  if (isHistorical(file, staleDays)) return 'HISTORICAL';
  if (duplicateGroup || staleDays >= 14) return 'ARCHIVE_CANDIDATE';
  return 'ACTIVE';
}

function isActive(file: string): boolean {
  return activeOutputPrefixes.some((prefix) => file === prefix || file.startsWith(prefix))
    || ['dashboard/index.html', 'dashboard/app.js', 'dashboard/styles.css', 'dashboard/manifest.json'].includes(file);
}

function isPortfolio(file: string): boolean {
  return /(^|\/)(screenshots|videos|traces|har|client-audit-reports|unified-audits|proposals|executive|portfolio)(\/|$)/i.test(file)
    || /evidence-package|asset-bundle|client-executive-report|sample-dashboard/i.test(file);
}

function isExample(file: string): boolean {
  return file.startsWith('samples/')
    || /(^|\/)(example|examples|demo|tutorial|fixture|sample)[-_/.]/i.test(file)
    || /\.(example|sample)\.(json|md|ts)$/i.test(file);
}

function isTemporary(file: string): boolean {
  return file.startsWith('tmp/')
    || file.startsWith('.cache/')
    || file.startsWith('.playwright-cli/')
    || file.startsWith('test-results/')
    || /(^|\/)(cache|tmp)(\/|$)|\.(tmp|log)$/i.test(file);
}

function isHistorical(file: string, staleDays: number): boolean {
  return staleDays >= 30
    || /legacy|historical|previous|old-|appointy|pushpress/i.test(file)
    || /output\/(mobile\/(action-center|pipeline|today|mobile-review|mobile-priorities|mobile-queue)\.md)/i.test(file);
}

function containsRuntimeData(file: string): boolean {
  return /\.(json|har|zip|webm)$/i.test(file)
    || file.includes('/.state/')
    || file.includes('dashboard.json')
    || file.includes('mobile-summary');
}

function publicSafety(file: string, runtimeData: boolean): ArchiveArtifact['publicSafe'] {
  if (runtimeData) return 'NO';
  if (/\.(png|jpg|jpeg|pdf|html|md)$/i.test(file)) return 'REVIEW';
  return 'YES';
}

function portfolioValue(file: string, classification: ArchiveClassification): ArchiveArtifact['portfolioValue'] {
  if (classification !== 'PORTFOLIO') return 'NONE';
  if (/client-audit-reports|unified-audits|executive|evidence-package|screenshots/i.test(file)) return 'HIGH';
  if (/videos|traces|har|proposals|portfolio/i.test(file)) return 'MEDIUM';
  return 'LOW';
}

function isGeneratedReport(file: string): boolean {
  return (file.startsWith('output/') || file.startsWith('dashboard/') || file.startsWith('reports/'))
    && /\.(md|html|json|pdf)$/i.test(file);
}

function reasonFor(classification: ArchiveClassification, file: string, staleDays: number, duplicateGroup?: string): string {
  if (classification === 'ACTIVE') return 'Current operating output or required dashboard asset.';
  if (classification === 'PORTFOLIO') return 'Evidence, report, screenshot, or client-facing sample with potential portfolio value.';
  if (classification === 'EXAMPLE') return 'Clearly labeled example, demo, tutorial, sample, or fixture artifact.';
  if (classification === 'TEMPORARY') return 'Temporary, cache, browser, trace, test, or intermediate artifact.';
  if (classification === 'HISTORICAL') return `Historical or superseded context; ${staleDays} day(s) since modification.`;
  return duplicateGroup
    ? `Duplicate-content candidate in group ${duplicateGroup}.`
    : `Generated artifact is ${staleDays} day(s) old and is not part of the active operating surface.`;
}

function recommendationFor(classification: ArchiveClassification): string {
  return retentionPolicy[classification];
}

function duplicateContentGroups(files: string[]): Map<string, string> {
  const byHash = new Map<string, string[]>();
  for (const file of files) {
    const absolute = path.join(process.cwd(), file);
    const stat = fs.statSync(absolute);
    if (stat.size === 0 || stat.size > 5 * 1024 * 1024) continue;
    const hash = crypto.createHash('sha1').update(fs.readFileSync(absolute)).digest('hex');
    const group = byHash.get(hash) ?? [];
    group.push(file.replace(/\\/g, '/'));
    byHash.set(hash, group);
  }
  const result = new Map<string, string>();
  let index = 1;
  for (const filesForHash of byHash.values()) {
    if (filesForHash.length < 2) continue;
    const group = `duplicate-${index}`;
    filesForHash.forEach((file) => result.set(file, group));
    index += 1;
  }
  return result;
}

function walk(root: string): string[] {
  const absolute = path.join(process.cwd(), root);
  if (!fs.existsSync(absolute)) return [];
  if (fs.statSync(absolute).isFile()) return [root];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(root, entry.name);
    return entry.isDirectory() ? walk(relative) : [relative.replace(/\\/g, '/')];
  });
}

function document(title: string, report: ArchiveReport, lines: string[]): string {
  return [
    `# ${title}`,
    '',
    `Generated: ${report.generatedAt}`,
    '',
    ...lines,
    '',
    '## Safety',
    ...report.safetyRules.map((rule) => `- ${rule}`),
    '',
  ].join('\n');
}

function rowsOrEmpty(items: ArchiveArtifact[], render: (item: ArchiveArtifact) => string): string[] {
  return items.length > 0 ? items.map(render) : ['| None | n/a | No artifacts detected. | No action recommended. |'];
}

function count(report: ArchiveReport, classification: ArchiveClassification): number {
  return report.artifacts.filter((item) => item.classification === classification).length;
}

function bounded(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function clean(value: string): string {
  return value.replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
