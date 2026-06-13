import fs = require('fs');
import path = require('path');
import {
  buildUnifiedAudit,
  buildUnifiedAuditPortfolio,
} from '../unifiedAuditGenerator/unifiedAuditRules';
import { UnifiedAuditReport } from '../unifiedAuditGenerator/types';
import { renderClientAuditHtml } from './htmlGenerator';
import { generateClientAuditPdf } from './pdfGenerator';
import {
  ClientAuditPortfolio,
  ClientAuditReport,
  ClientAuditReportTarget,
} from './types';

const targetsPath = path.join(process.cwd(), 'data', 'client-audit-reports', 'reports.json');
const outputDir = path.join(process.cwd(), 'output', 'client-audit-reports');

const disclaimer = [
  'This report is based on publicly observable information and collected evidence.',
  'Potential opportunities are observations only.',
  'No bugs, vulnerabilities, incidents, outages, or customer-impact statements should be inferred unless independently validated.',
];

export function loadClientAuditReportTargets(): ClientAuditReportTarget[] {
  return readJson<ClientAuditReportTarget[]>(targetsPath, []);
}

export function buildClientAuditReport(company: string): ClientAuditReport {
  const target = findTarget(company);
  if (!target) {
    throw new Error(`Company not found in data/client-audit-reports/reports.json: ${company}`);
  }

  return buildClientAuditReportFromUnified(buildUnifiedAudit(target.companyName));
}

export function buildClientAuditPortfolio(): ClientAuditPortfolio {
  const unifiedPortfolio = buildUnifiedAuditPortfolio();
  const reports = unifiedPortfolio.reports.map(buildClientAuditReportFromUnified);
  const ranked = [...reports].sort(sortReportPriority);

  return {
    generatedAt: new Date().toISOString(),
    reports,
    bestAuditCandidate: ranked[0],
    bestRetainerCandidate: [...reports].sort(sortRetainerPriority)[0],
    highestConfidenceReport: ranked[0],
    lowestConfidenceReport: [...reports].sort((left, right) => scoreFor(left) - scoreFor(right) || left.companyName.localeCompare(right.companyName))[0],
    researchNeeded: reports.filter((report) => report.sourceReport.researchNeeded),
  };
}

export function writeClientAuditReport(report: ClientAuditReport): ClientAuditReport['artifacts'] {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(report.artifacts.markdownPath, renderClientAuditMarkdown(report), 'utf8');
  fs.writeFileSync(report.artifacts.htmlPath, renderClientAuditHtml(report), 'utf8');
  generateClientAuditPdf(report, report.artifacts.pdfPath);
  return report.artifacts;
}

export function writeClientAuditPortfolio(portfolio: ClientAuditPortfolio): string[] {
  fs.mkdirSync(outputDir, { recursive: true });
  const outputs = [
    ['portfolio-summary.md', renderPortfolioSummary(portfolio)],
    ['report-readiness.md', renderReportReadiness(portfolio)],
  ] as const;

  return outputs.map(([fileName, content]) => {
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, content, 'utf8');
    return outputPath;
  });
}

export function renderClientAuditMarkdown(report: ClientAuditReport): string {
  return `# ${report.companyName}

QA Audit Report

Generated Date: ${formatDate(report.generatedAt)}

Prepared By:
AI Testing Engineer Studio

Prepared For:
Manual Review

## Executive Summary

${bullets([
    `Company: ${report.companyName}`,
    `Opportunity Score: ${report.opportunityScore}/100`,
    `Evidence Readiness: ${report.evidenceReadiness}/100`,
    `Recommended Service: ${report.recommendedService}`,
    `Recommended Next Action: ${report.recommendedNextAction}`,
  ])}

## Lighthouse Evidence

${bullets([
    `Performance: ${scoreLabel(report.lighthouseEvidence?.performance ?? null)}`,
    `Accessibility: ${scoreLabel(report.lighthouseEvidence?.accessibility ?? null)}`,
    `Best Practices: ${scoreLabel(report.lighthouseEvidence?.bestPractices ?? null)}`,
    `SEO: ${scoreLabel(report.lighthouseEvidence?.seo ?? null)}`,
  ])}

## Playwright Evidence

${bullets([
    `Pages Reviewed: ${report.playwrightEvidence?.pagesReviewed ?? 'Not Available'}`,
    `Screenshots Captured: ${report.playwrightEvidence?.screenshotsCaptured ?? 'Not Available'}`,
    `Console Observations: ${report.playwrightEvidence?.consoleObservations ?? 'Not Available'}`,
    `Observed Public Flows: ${report.playwrightEvidence?.observedPublicFlows.join(', ') ?? 'Not Available'}`,
  ])}

## Potential Opportunities

${report.potentialOpportunities.map((opportunity) => bullets([
    `Type: ${opportunity.type}`,
    `Description: ${opportunity.description}`,
    `Evidence: ${opportunity.evidence}`,
    `Confidence: ${opportunity.confidence}`,
  ])).join('\n\n')}

## Recommended Coverage

### Smoke Coverage

${bullets(report.recommendedCoverage.smokeSuite)}

### Regression Coverage

${bullets(report.recommendedCoverage.regressionSuite)}

### Critical Path Coverage

${bullets(report.recommendedCoverage.criticalPathCoverage)}

## Recommended Engagement

- ${report.recommendedService}

## Upgrade Path

${report.upgradePath.map((step, index) => `${index + 1}. ${step}`).join('\n')}

## Discovery Call Questions

${report.discoveryQuestions.map((question, index) => `${index + 1}. ${question}`).join('\n')}

## Disclaimer

${bullets(report.disclaimer)}
`;
}

export function renderPortfolioSummary(portfolio: ClientAuditPortfolio): string {
  return `# Client Audit Report Portfolio Summary

Generated: ${portfolio.generatedAt}

## Best Audit Candidate

${portfolio.bestAuditCandidate ? portfolioBullets(portfolio.bestAuditCandidate) : '- No audit candidate available.'}

## Best Retainer Candidate

${portfolio.bestRetainerCandidate ? portfolioBullets(portfolio.bestRetainerCandidate) : '- No retainer candidate available.'}

## Highest Confidence Report

${portfolio.highestConfidenceReport ? portfolioBullets(portfolio.highestConfidenceReport) : '- No confidence report available.'}

## Lowest Confidence Report

${portfolio.lowestConfidenceReport ? portfolioBullets(portfolio.lowestConfidenceReport) : '- No confidence report available.'}

## Research Needed

${portfolio.researchNeeded.length > 0 ? bullets(portfolio.researchNeeded.map((report) => `${report.companyName}: ${report.recommendedNextAction}`)) : '- No research gaps recorded.'}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderReportReadiness(portfolio: ClientAuditPortfolio): string {
  return `# Client Audit Report Readiness

| Company | Markdown | HTML | PDF | Recommended Service | Research Needed |
| --- | --- | --- | --- | --- | --- |
${portfolio.reports.map((report) => `| ${report.companyName} | ${exists(report.artifacts.markdownPath)} | ${exists(report.artifacts.htmlPath)} | ${exists(report.artifacts.pdfPath)} | ${report.recommendedService} | ${report.sourceReport.researchNeeded ? 'Yes' : 'No'} |`).join('\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

function buildClientAuditReportFromUnified(unified: UnifiedAuditReport): ClientAuditReport {
  const baseName = `${unified.companyId}-qa-audit-report`;

  return {
    companyId: unified.companyId,
    companyName: unified.companyName,
    generatedAt: new Date().toISOString(),
    preparedBy: 'AI Testing Engineer Studio',
    preparedFor: 'Manual Review',
    opportunityScore: unified.opportunityScore,
    evidenceReadiness: unified.evidenceReadiness,
    recommendedService: unified.recommendedFirstOffer,
    recommendedNextAction: unified.recommendedNextAction,
    lighthouseEvidence: unified.lighthouseEvidence,
    playwrightEvidence: unified.playwrightEvidence,
    potentialOpportunities: unified.potentialQaOpportunities,
    recommendedCoverage: unified.recommendedPlaywrightCoverage,
    upgradePath: unified.retainerPath,
    discoveryQuestions: unified.discoveryQuestions.slice(0, 5),
    disclaimer,
    sourceReport: unified,
    artifacts: {
      markdownPath: path.join(outputDir, `${baseName}.md`),
      htmlPath: path.join(outputDir, `${baseName}.html`),
      pdfPath: path.join(outputDir, `${baseName}.pdf`),
    },
  };
}

function findTarget(company: string): ClientAuditReportTarget | undefined {
  const normalized = normalize(company);
  return loadClientAuditReportTargets().find((target) => matchesNormalized(normalize(target.companyId), normalized) || matchesNormalized(normalize(target.companyName), normalized));
}

function sortReportPriority(left: ClientAuditReport, right: ClientAuditReport): number {
  return scoreFor(right) - scoreFor(left)
    || Number(left.sourceReport.researchNeeded) - Number(right.sourceReport.researchNeeded)
    || left.companyName.localeCompare(right.companyName);
}

function sortRetainerPriority(left: ClientAuditReport, right: ClientAuditReport): number {
  const leftScore = scoreFor(left) + (left.recommendedService === 'QA Automation Retainer ($1500-$3000/month)' ? 10 : 0);
  const rightScore = scoreFor(right) + (right.recommendedService === 'QA Automation Retainer ($1500-$3000/month)' ? 10 : 0);
  return rightScore - leftScore || left.companyName.localeCompare(right.companyName);
}

function scoreFor(report: ClientAuditReport): number {
  return Math.round((report.opportunityScore + report.evidenceReadiness) / 2);
}

function portfolioBullets(report: ClientAuditReport): string {
  return bullets([
    `Company: ${report.companyName}`,
    `Opportunity Score: ${report.opportunityScore}/100`,
    `Evidence Readiness: ${report.evidenceReadiness}/100`,
    `Recommended Service: ${report.recommendedService}`,
    `Research Needed: ${report.sourceReport.researchNeeded ? 'Yes' : 'No'}`,
    `Recommended Next Action: ${report.recommendedNextAction}`,
  ]);
}

function exists(filePath: string): string {
  return fs.existsSync(filePath) ? 'Generated' : 'Missing';
}

function safetyNotes(): string[] {
  return [
    'Client audit report only. This is not a proposal, contract, invoice, payment request, or outreach tool.',
    'Potential opportunities are observations only.',
    'Do not invent bugs, vulnerabilities, incidents, outages, complaints, customer quotes, findings, or metrics.',
    'Human approval is required before sending or external use.',
  ];
}

function formatDate(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function scoreLabel(score: number | null): string {
  if (score === null) return 'Not Available';
  return `${Math.round(score * 100)}/100`;
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function bullets(items: string[]): string {
  if (items.length === 0) return '- Not available.';
  return items.map((item) => `- ${item}`).join('\n');
}

function matchesNormalized(left: string, right: string): boolean {
  return left === right || left.includes(right) || right.includes(left);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}
