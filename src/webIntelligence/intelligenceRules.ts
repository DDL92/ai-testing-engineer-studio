import fs = require('fs');
import path = require('path');
import { aggregateCompanyEvidence } from './companyEvidenceAggregator';
import { average, confidenceLevel, scorePainConfidence } from './confidenceScorer';
import { resolveDuplicates } from './duplicateResolver';
import { validateEvidence } from './evidenceValidator';
import {
  EvidenceInput,
  EvidenceValidationResult,
  IntelligenceReadiness,
  PainConfidenceResult,
  WebIntelligenceReport,
} from './types';
import { WebLeadCandidate } from '../webLeadDiscovery/types';
import { PainSignal } from '../webPainMining/types';

export const webIntelligenceOutputDir = path.join(process.cwd(), 'output', 'web-intelligence');

const webLeadsPath = path.join(process.cwd(), 'data', 'web-discovery', 'discovered-web-leads.json');
const painSignalsPath = path.join(process.cwd(), 'data', 'web-pain-mining', 'pain-signals.json');

export function buildWebIntelligenceReport(): WebIntelligenceReport {
  const evidence = loadEvidenceInputs().map(validateEvidence);
  const acceptedEvidence = evidence.filter((item) => item.decision === 'accepted');
  const suspiciousEvidence = evidence.filter((item) => item.decision === 'suspicious');
  const rejectedEvidence = evidence.filter((item) => item.decision === 'rejected');
  const companySummaries = aggregateCompanyEvidence(evidence);
  const duplicateResolution = resolveDuplicates(evidence);
  const painConfidence = buildPainConfidence(evidence);
  const readiness = buildReadiness(evidence, painConfidence, duplicateResolution.duplicateGroups.length);

  return {
    generatedAt: new Date().toISOString(),
    evidence,
    acceptedEvidence,
    suspiciousEvidence,
    rejectedEvidence,
    companySummaries,
    duplicateResolution,
    painConfidence,
    readiness,
  };
}

export function writeWebIntelligenceReports(report = buildWebIntelligenceReport()): string[] {
  fs.mkdirSync(webIntelligenceOutputDir, { recursive: true });

  const reports = [
    ['company-matching.md', renderCompanyMatching(report)],
    ['evidence-validation.md', renderEvidenceValidation(report)],
    ['confidence-scores.md', renderConfidenceScores(report)],
    ['duplicate-resolution.md', renderDuplicateResolution(report)],
    ['false-positive-analysis.md', renderFalsePositiveAnalysis(report)],
    ['quality-report.md', renderQualityReport(report)],
    ['company-evidence-summary.md', renderCompanyEvidenceSummary(report)],
    ['intelligence-readiness.md', renderIntelligenceReadiness(report)],
  ] as const;

  return reports.map(([fileName, content]) => {
    const outputPath = path.join(webIntelligenceOutputDir, fileName);
    fs.writeFileSync(outputPath, content, 'utf8');
    return outputPath;
  });
}

function loadEvidenceInputs(): EvidenceInput[] {
  const leads = readJson<WebLeadCandidate[]>(webLeadsPath, []);
  const painSignals = readJson<PainSignal[]>(painSignalsPath, []);

  return [
    ...leads.map((lead): EvidenceInput => ({
      companyName: lead.companyName || lead.name,
      sourceUrl: lead.sourceUrl || lead.website || lead.source,
      sourceTitle: lead.sourceTitle || lead.name,
      observedText: [lead.snippet, lead.notes, ...(lead.evidence ?? [])].join(' '),
      sourceType: 'lead',
      raw: lead,
    })),
    ...painSignals.map((signal): EvidenceInput => ({
      companyName: signal.companyName || signal.company,
      sourceUrl: signal.sourceUrl || signal.url || signal.source,
      sourceTitle: signal.sourceTitle || signal.companyName,
      observedText: signal.observedText || signal.signal || signal.cautiousSummary,
      sourceType: 'pain',
      raw: signal,
    })),
  ];
}

function buildPainConfidence(evidence: EvidenceValidationResult[]): PainConfidenceResult[] {
  const pairs = new Set(
    evidence
      .filter((item) => item.sourceType === 'pain')
      .map((item) => {
        const raw = item.raw as PainSignal;
        return `${item.canonicalCompany}|||${raw.category}`;
      }),
  );

  return Array.from(pairs).map((pair) => {
    const [company, category] = pair.split('|||') as [string, string];
    return scorePainConfidence(company, category, evidence);
  });
}

function buildReadiness(evidence: EvidenceValidationResult[], painConfidence: PainConfidenceResult[], duplicateGroups: number): IntelligenceReadiness {
  const companyConfidence = average(evidence.map((item) => item.match.score));
  const evidenceConfidence = average(evidence.map((item) => item.confidenceScore));
  const painConfidenceScore = average(painConfidence.map((item) => item.confidenceScore));
  const duplicateQuality = Math.max(0, Math.min(100, 100 - duplicateGroups * 4));
  const acceptedRatio = evidence.length === 0 ? 0 : Math.round((evidence.filter((item) => item.decision === 'accepted').length / evidence.length) * 100);
  const falsePositivePenalty = evidence.length === 0 ? 100 : Math.round((evidence.filter((item) => item.decision === 'rejected').length / evidence.length) * 100);
  const rankingConfidence = Math.max(0, Math.min(100, average([companyConfidence, evidenceConfidence, acceptedRatio]) - falsePositivePenalty));
  const overall = average([companyConfidence, evidenceConfidence, painConfidenceScore, duplicateQuality, rankingConfidence]);

  return {
    companyConfidence,
    evidenceConfidence,
    painConfidence: painConfidenceScore,
    duplicateQuality,
    rankingConfidence,
    status: overall >= 75 ? 'READY' : overall >= 45 ? 'PARTIAL' : 'NOT READY',
  };
}

function renderCompanyMatching(report: WebIntelligenceReport): string {
  return [
    '# Company Matching',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Company | Domain | Match Confidence | Score | Reasons |',
    '| --- | --- | --- | ---: | --- |',
    ...report.evidence.map((item) => `| ${escapeTable(item.canonicalCompany)} | ${escapeTable(item.normalizedDomain || 'unknown')} | ${item.match.confidence} | ${item.match.score} | ${escapeTable(item.match.reasons.join('; '))} |`),
    '',
  ].join('\n');
}

function renderEvidenceValidation(report: WebIntelligenceReport): string {
  return [
    '# Evidence Validation',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Decision | Company | Source Quality | Confidence | Relevance | Source |',
    '| --- | --- | --- | ---: | ---: | --- |',
    ...report.evidence.map((item) => `| ${item.decision} | ${escapeTable(item.canonicalCompany)} | ${item.sourceQuality} | ${item.confidenceScore} | ${item.relevanceScore} | ${escapeTable(item.sourceUrl)} |`),
    '',
  ].join('\n');
}

function renderConfidenceScores(report: WebIntelligenceReport): string {
  return [
    '# Confidence Scores',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Evidence Confidence',
    '',
    ...bullets([
      `Average company confidence: ${report.readiness.companyConfidence}/100`,
      `Average evidence confidence: ${report.readiness.evidenceConfidence}/100`,
      `Average pain confidence: ${report.readiness.painConfidence}/100`,
      `Ranking confidence: ${report.readiness.rankingConfidence}/100`,
    ]),
    '',
    '## Pain Signal Confidence',
    '',
    ...renderPainRows(report.painConfidence),
    '',
  ].join('\n');
}

function renderDuplicateResolution(report: WebIntelligenceReport): string {
  return [
    '# Duplicate Resolution',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Canonical company records: ${report.duplicateResolution.canonicalRecords.length}`,
    `Duplicate/alias groups: ${report.duplicateResolution.duplicateGroups.length}`,
    '',
    '## Canonical Records',
    '',
    ...report.duplicateResolution.canonicalRecords.map((record) => `- ${record.canonicalCompany} (${record.normalizedDomain || 'unknown domain'}): aliases ${record.aliases.map((alias) => `\`${alias}\``).join(', ') || 'none'}`),
    '',
  ].join('\n');
}

function renderFalsePositiveAnalysis(report: WebIntelligenceReport): string {
  return [
    '# False Positive Analysis',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    `Accepted evidence: ${report.acceptedEvidence.length}`,
    `Suspicious evidence: ${report.suspiciousEvidence.length}`,
    `Rejected evidence: ${report.rejectedEvidence.length}`,
    '',
    '## Rejected Evidence',
    '',
    ...renderEvidenceList(report.rejectedEvidence),
    '',
    '## Suspicious Evidence',
    '',
    ...renderEvidenceList(report.suspiciousEvidence),
    '',
    '## Accepted Evidence',
    '',
    ...renderEvidenceList(report.acceptedEvidence.slice(0, 40)),
    '',
  ].join('\n');
}

function renderQualityReport(report: WebIntelligenceReport): string {
  return [
    '# Web Intelligence Quality Report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    ...bullets([
      `Intelligence readiness: ${report.readiness.status}`,
      `Company confidence: ${report.readiness.companyConfidence}/100`,
      `Evidence confidence: ${report.readiness.evidenceConfidence}/100`,
      `Pain confidence: ${report.readiness.painConfidence}/100`,
      `Duplicate quality: ${report.readiness.duplicateQuality}/100`,
      `Ranking confidence: ${report.readiness.rankingConfidence}/100`,
      `Accepted evidence: ${report.acceptedEvidence.length}`,
      `Suspicious evidence: ${report.suspiciousEvidence.length}`,
      `Rejected evidence: ${report.rejectedEvidence.length}`,
    ]),
    '',
    '## Quality Modifiers',
    '',
    ...bullets([
      'Company confidence should modify ranking confidence.',
      'Evidence confidence should reduce weak source influence.',
      'Source diversity should increase trust only when evidence remains company-relevant.',
      'False-positive penalties should prevent directories, listicles, and unrelated articles from becoming strong evidence.',
    ]),
    '',
  ].join('\n');
}

function renderCompanyEvidenceSummary(report: WebIntelligenceReport): string {
  return [
    '# Company Evidence Summary',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Company | Domain | Evidence | Sources | Diversity | Pain Signals | Category | Avg Confidence | Company Confidence | Evidence Confidence | False Positive Risk |',
    '| --- | --- | ---: | ---: | ---: | ---: | --- | ---: | --- | --- | --- |',
    ...report.companySummaries.map((item) => `| ${escapeTable(item.company)} | ${escapeTable(item.normalizedDomain || 'unknown')} | ${item.evidenceCount} | ${item.sourceCount} | ${item.sourceDiversity} | ${item.painSignals} | ${escapeTable(item.leadCategory)} | ${item.averageConfidence} | ${item.companyConfidence} | ${item.evidenceConfidence} | ${item.falsePositiveRisk} |`),
    '',
  ].join('\n');
}

function renderIntelligenceReadiness(report: WebIntelligenceReport): string {
  return [
    '# Intelligence Readiness',
    '',
    `Generated: ${report.generatedAt}`,
    `Status: ${report.readiness.status}`,
    '',
    ...bullets([
      `Company confidence: ${report.readiness.companyConfidence}/100`,
      `Evidence confidence: ${report.readiness.evidenceConfidence}/100`,
      `Pain confidence: ${report.readiness.painConfidence}/100`,
      `Duplicate quality: ${report.readiness.duplicateQuality}/100`,
      `Ranking confidence: ${report.readiness.rankingConfidence}/100`,
    ]),
    '',
    '## Interpretation',
    '',
    ...bullets([
      'READY means web intelligence can support local prioritization after human review.',
      'PARTIAL means evidence is useful but needs manual review before promotion.',
      'NOT READY means the current evidence set is too weak or too noisy.',
    ]),
    '',
  ].join('\n');
}

function renderPainRows(items: PainConfidenceResult[]): string[] {
  if (items.length === 0) return ['- No pain signals found.'];
  return items.map((item) => `- ${item.company} / ${item.category}: ${item.confidence} (${item.confidenceScore}/100, ${item.evidenceCount} evidence item(s), ${item.sourceCount} source(s))`);
}

function renderEvidenceList(items: EvidenceValidationResult[]): string[] {
  if (items.length === 0) return ['- None.'];
  return items.map((item) => `- ${item.canonicalCompany}: ${item.sourceUrl} (${item.confidenceScore}/100; ${item.falsePositiveReasons.join('; ')})`);
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function bullets(items: string[]): string[] {
  return items.map((item) => `- ${item}`);
}

function escapeTable(value: string): string {
  return String(value ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
