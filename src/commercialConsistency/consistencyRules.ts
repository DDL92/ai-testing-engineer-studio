import fs = require('fs');
import path = require('path');
import { runnerSequence } from '../autonomousRunner/runnerRules';
import { getRevenueSourceOfTruth } from '../revenueIntelligence/sourceOfTruth';
import {
  CommercialConsistencyDashboard,
  CommercialConsistencyReport,
  CommercialReferenceFinding,
  ConsistencyArea,
  ConsistencyScan,
  ConsistencySeverity,
  ConsistencyStatus,
} from './types';

export const commercialConsistencyOutputDir = path.join(process.cwd(), 'output', 'commercial-consistency');

const safetyRules = [
  'Commercial consistency scanning is local-only and read-only except for its own generated reports.',
  'Repair recommendations never edit, replace, delete, or regenerate source, runtime data, or historical reports.',
  'No outreach, messages, proposals, meetings, invoices, payments, revenue, or outcomes are created.',
  'Human approval is required before applying any repair recommendation.',
];

const activeCommercialKeywords = /\b(action|actionable|best lead|commercial lead|current top lead|first client|recommend|revenue target|target|today focus|top action|top lead)\b/i;
const referencePatterns = ['Appointy', 'PushPress', 'historical-top-lead', 'legacy-lead', 'top-ranked', 'top ranked', 'rank1', 'rank 1'];

export function scanCommercialReferences(): ConsistencyScan {
  return scanFiles('references', ['src'], (file) =>
    !file.includes('/commercialConsistency/')
    && !file.includes('/webLeadQualification/')
    && !file.endsWith('/types.ts'));
}

export function scanDashboardReferences(): ConsistencyScan {
  return scanFiles('dashboard', ['src/dashboard', 'dashboard'], (file) =>
    !file.endsWith('.json') && !file.endsWith('.png') && !file.endsWith('.svg'));
}

export function scanMobileReferences(): ConsistencyScan {
  return scanFiles('mobile', ['src/mobileCommandCenter'], () => true);
}

export function scanRunnerReferences(): ConsistencyScan {
  const truth = getRevenueSourceOfTruth();
  const findings: CommercialReferenceFinding[] = [];
  const scripts = runnerSequence.map((item) => item.script);
  const required = ['lead:rotation', 'dashboard:generate', 'mobile:summary', 'revenue:morning', 'revenue:today', 'revenue:summary'];
  for (const script of required) {
    if (!scripts.includes(script)) {
      findings.push(finding('runner', 'FAIL', 'src/autonomousRunner/runnerRules.ts', 1, script, `Runner does not include ${script}.`, `Add ${script} after lead rotation in the approved operating sequence.`));
    }
  }
  const revenueScripts = ['revenue:morning', 'revenue:today', 'revenue:summary'];
  const indexes = revenueScripts.map((script) => scripts.indexOf(script));
  if (indexes.some((index) => index < 0) || indexes.some((index, position) => position > 0 && index < indexes[position - 1])) {
    findings.push(finding('runner', 'FAIL', 'src/autonomousRunner/runnerRules.ts', 1, 'Revenue Mode sequence', 'Morning Brief, Today Actions, and Revenue Summary are not in the approved order.', 'Restore the approved Revenue Mode runner order.'));
  }
  return makeScan('runner', truth.actionableLead, 1, findings);
}

export function scanGeneratedOutputs(): ConsistencyScan {
  return scanFiles('outputs', [
    'output/revenue-mode',
    'output/delivery-assets',
    'output/evidence-pro',
    'output/top-lead-audit',
    'output/mobile',
    'output/dashboard',
  ], (file) =>
    !file.includes('/commercial-consistency/')
    && /\.(md|html|json)$/.test(file));
}

export function scanSourceOfTruthUsage(): ConsistencyScan {
  const truth = getRevenueSourceOfTruth();
  const requiredConsumers = [
    'src/dashboard/dashboardDataBuilder.ts',
    'src/mobileCommandCenter/mobileRules.ts',
    'src/autonomousRunner/runnerRules.ts',
    'src/revenueMode/revenueModeRules.ts',
    'src/topLeadAudit/topLeadAuditRules.ts',
  ];
  const findings: CommercialReferenceFinding[] = [];
  for (const relativePath of requiredConsumers) {
    const body = read(relativePath);
    if (!body.includes('getRevenueSourceOfTruth') && !body.includes('buildLeadRotationDecision')) {
      findings.push(finding('sources', 'FAIL', relativePath, 1, 'Missing approved authority', 'Commercial consumer does not import Revenue Intelligence source-of-truth or Lead Rotation.', 'Consume getRevenueSourceOfTruth() or buildLeadRotationDecision() instead of a parallel lead authority.'));
    }
  }
  if (truth.actionableLead === 'No actionable lead') {
    findings.push(finding('sources', 'FAIL', 'src/revenueIntelligence/sourceOfTruth.ts', 1, truth.actionableLead, 'No single actionable lead is available.', 'Refresh qualification, evidence, and lead rotation before commercial operation.'));
  }
  if (truth.topLead !== truth.actionableLead) {
    findings.push(finding('sources', 'FAIL', 'src/revenueIntelligence/sourceOfTruth.ts', 1, truth.topLead, 'Commercial topLead alias does not resolve to actionableLead.', 'Keep topRankedLead informational and bind commercial topLead to actionableLead.'));
  }
  return makeScan('sources', truth.actionableLead, requiredConsumers.length, findings);
}

export function buildCommercialConsistencyReport(): CommercialConsistencyReport {
  const truth = getRevenueSourceOfTruth();
  const scans = [
    scanCommercialReferences(),
    scanDashboardReferences(),
    scanMobileReferences(),
    scanRunnerReferences(),
    scanGeneratedOutputs(),
    scanSourceOfTruthUsage(),
  ];
  const findings = scans.flatMap((scan) => scan.findings);
  const repairRecommendations = [...new Set(findings.map((item) => item.recommendation))];
  const conflictingReferences = findings.filter((item) => item.severity === 'FAIL').length;
  const legacyReferences = findings.filter((item) => item.severity === 'WARNING').length;
  const hardcodedCommercialReferences = findings.filter((item) => item.severity === 'FAIL' && item.area === 'references').length;
  const sourceScan = scans.find((scan) => scan.area === 'sources');

  return {
    generatedAt: new Date().toISOString(),
    status: statusFor(findings),
    actionableLead: truth.actionableLead,
    topRankedLead: truth.topRankedLead,
    sourceOfTruthStatus: sourceScan?.status ?? 'FAIL',
    scans,
    legacyReferences,
    conflictingReferences,
    hardcodedCommercialReferences,
    repairRecommendations,
    safetyRules,
  };
}

export function buildCommercialConsistencyDashboard(report = buildCommercialConsistencyReport()): CommercialConsistencyDashboard {
  return {
    commercialConsistencyStatus: report.status,
    legacyReferences: report.legacyReferences,
    sourceOfTruthStatus: report.sourceOfTruthStatus,
    conflictingReferences: report.conflictingReferences,
    repairRecommendations: report.repairRecommendations.length,
  };
}

export function writeConsistencyOutputs(report = buildCommercialConsistencyReport()): string[] {
  fs.mkdirSync(commercialConsistencyOutputDir, { recursive: true });
  const outputs = [
    ['reference-scan.md', renderScan(report.scans[0], 'Commercial Reference Scan')],
    ['dashboard-scan.md', renderScan(report.scans[1], 'Dashboard Consistency Scan')],
    ['mobile-scan.md', renderScan(report.scans[2], 'Mobile Consistency Scan')],
    ['runner-scan.md', renderScan(report.scans[3], 'Runner Consistency Scan')],
    ['outputs-scan.md', renderScan(report.scans[4], 'Generated Output Consistency Scan')],
    ['source-usage.md', renderScan(report.scans[5], 'Source Of Truth Usage')],
    ['consistency-report.md', renderConsistencyReport(report)],
    ['repair-recommendations.md', renderRepairRecommendations(report)],
    ['consistency-summary.md', renderConsistencySummary(report)],
  ] as const;
  return outputs.map(([fileName, body]) => {
    const outputPath = path.join(commercialConsistencyOutputDir, fileName);
    fs.writeFileSync(outputPath, body, 'utf8');
    return outputPath;
  });
}

export function writeSingleScan(area: ConsistencyArea): string {
  const report = buildCommercialConsistencyReport();
  const index = ['references', 'dashboard', 'mobile', 'runner', 'outputs', 'sources'].indexOf(area);
  const names = ['reference-scan.md', 'dashboard-scan.md', 'mobile-scan.md', 'runner-scan.md', 'outputs-scan.md', 'source-usage.md'];
  const titles = ['Commercial Reference Scan', 'Dashboard Consistency Scan', 'Mobile Consistency Scan', 'Runner Consistency Scan', 'Generated Output Consistency Scan', 'Source Of Truth Usage'];
  fs.mkdirSync(commercialConsistencyOutputDir, { recursive: true });
  const outputPath = path.join(commercialConsistencyOutputDir, names[index]);
  fs.writeFileSync(outputPath, renderScan(report.scans[index], titles[index]), 'utf8');
  return outputPath;
}

export function renderScan(scan: ConsistencyScan, title: string): string {
  return [
    `# ${title}`,
    '',
    `- Status: ${scan.status}`,
    `- Actionable Lead: ${scan.actionableLead}`,
    `- Scanned Files: ${scan.scannedFiles}`,
    `- Findings: ${scan.findings.length}`,
    '',
    '| Severity | File | Line | Reference | Detail | Recommendation |',
    '| --- | --- | ---: | --- | --- | --- |',
    ...(scan.findings.length > 0
      ? scan.findings.map((item) => `| ${item.severity} | ${item.file} | ${item.line} | ${clean(item.reference)} | ${clean(item.detail)} | ${clean(item.recommendation)} |`)
      : ['| INFO | n/a | 0 | none | No conflicting commercial references detected. | Keep the approved source-of-truth boundary. |']),
    '',
    ...safetyRules.map((rule) => `- ${rule}`),
    '',
  ].join('\n');
}

export function renderConsistencyReport(report: CommercialConsistencyReport): string {
  return [
    '# Commercial Consistency Report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `- Status: ${report.status}`,
    `- Actionable Lead: ${report.actionableLead}`,
    `- Informational Top Ranked Lead: ${report.topRankedLead}`,
    `- Source Of Truth Status: ${report.sourceOfTruthStatus}`,
    `- Legacy References: ${report.legacyReferences}`,
    `- Conflicting References: ${report.conflictingReferences}`,
    `- Hardcoded Commercial References: ${report.hardcodedCommercialReferences}`,
    '',
    '## Scan Status',
    ...report.scans.map((scan) => `- ${scan.area}: ${scan.status} (${scan.findings.length} finding(s))`),
    '',
    '## Approved Path',
    'Revenue Intelligence -> Lead Rotation -> Actionable Lead',
    '',
    ...safetyRules.map((rule) => `- ${rule}`),
    '',
  ].join('\n');
}

export function renderRepairRecommendations(report: CommercialConsistencyReport): string {
  return [
    '# Commercial Consistency Repair Recommendations',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    ...(report.repairRecommendations.length > 0
      ? report.repairRecommendations.map((item, index) => `${index + 1}. ${item}`)
      : ['1. No repair is currently recommended.']),
    '',
    'Recommendations only. No files or data were modified by this report.',
    '',
  ].join('\n');
}

export function renderConsistencySummary(report: CommercialConsistencyReport): string {
  return [
    '# Commercial Consistency Summary',
    '',
    `- Status: ${report.status}`,
    `- Actionable Lead: ${report.actionableLead}`,
    `- Source Of Truth Status: ${report.sourceOfTruthStatus}`,
    `- Legacy References: ${report.legacyReferences}`,
    `- Conflicting References: ${report.conflictingReferences}`,
    `- Repair Recommendations: ${report.repairRecommendations.length}`,
    '',
  ].join('\n');
}

function scanFiles(area: ConsistencyArea, roots: string[], include: (file: string) => boolean): ConsistencyScan {
  const truth = getRevenueSourceOfTruth();
  const files = roots.flatMap(walk).filter(include);
  const findings = files.flatMap((file) => scanText(file, read(file), area, truth.actionableLead, truth.topRankedLead));
  return makeScan(area, truth.actionableLead, files.length, findings);
}

export function scanText(
  file: string,
  content: string,
  area: ConsistencyArea,
  actionableLead: string,
  topRankedLead: string,
): CommercialReferenceFinding[] {
  const findings: CommercialReferenceFinding[] = [];
  const legacyNames = [...new Set([topRankedLead, ...referencePatterns])].filter((name) => name && name !== actionableLead && !name.startsWith('No '));
  content.split(/\r?\n/).forEach((line, index) => {
    for (const reference of legacyNames) {
      if (!line.toLowerCase().includes(reference.toLowerCase())) continue;
      const activeConflict = activeCommercialKeywords.test(line) && isActiveCommercialFile(file) && !isContextualReference(line);
      const severity: ConsistencySeverity = activeConflict ? 'FAIL' : 'WARNING';
      findings.push(finding(
        area,
        severity,
        file,
        index + 1,
        reference,
        activeConflict
          ? `Active commercial rendering references ${reference} instead of actionable lead ${actionableLead}.`
          : `Historical, portfolio, example, or discovery reference to ${reference} remains visible.`,
        activeConflict
          ? `Replace the active rendering input with Revenue Intelligence actionable lead (${actionableLead}).`
          : 'Keep this reference contextual, label it historical/portfolio-only, or archive it after human review.',
      ));
      break;
    }
  });
  return findings;
}

function isActiveCommercialFile(file: string): boolean {
  return file.startsWith('src/dashboard/')
    || file.startsWith('src/mobileCommandCenter/')
    || file.startsWith('src/autonomousRunner/')
    || file.startsWith('src/revenueMode/')
    || file === 'dashboard/app.js'
    || file === 'dashboard/index.html'
    || file === 'dashboard/dashboard.json'
    || file === 'output/mobile/mobile-summary.md'
    || file.startsWith('output/dashboard/')
    || file.includes('revenue-mode')
    || file === 'data/dashboard/dashboard.json';
}

function isContextualReference(line: string): boolean {
  return /\b(topWebLead|bestQualifiedLead|topQualifiedLead|topQualifiedLeads|topRankedLead|evidenceBlockers|discovered|discovery|qualified ranking|informational|portfolio|example|alias|canonical|sourceLead|proposalReady|retainerCandidates|href)\b/i.test(line);
}

function makeScan(area: ConsistencyArea, actionableLead: string, scannedFiles: number, findings: CommercialReferenceFinding[]): ConsistencyScan {
  return { area, actionableLead, scannedFiles, findings, status: statusFor(findings) };
}

function statusFor(findings: CommercialReferenceFinding[]): ConsistencyStatus {
  if (findings.some((item) => item.severity === 'FAIL')) return 'FAIL';
  if (findings.some((item) => item.severity === 'WARNING')) return 'WARNING';
  return 'PASS';
}

function finding(area: ConsistencyArea, severity: ConsistencySeverity, file: string, line: number, reference: string, detail: string, recommendation: string): CommercialReferenceFinding {
  return { area, severity, file, line, reference, detail, recommendation };
}

function walk(root: string): string[] {
  const absolute = path.join(process.cwd(), root);
  if (!fs.existsSync(absolute)) return [];
  if (fs.statSync(absolute).isFile()) return [root];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(root, entry.name);
    if (entry.name === 'node_modules' || entry.name === '.git') return [];
    return entry.isDirectory() ? walk(relative) : [relative];
  });
}

function read(relativePath: string): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
  } catch {
    return '';
  }
}

function clean(value: string): string {
  return value.replace(/\|/g, '/').replace(/\s+/g, ' ').trim();
}
