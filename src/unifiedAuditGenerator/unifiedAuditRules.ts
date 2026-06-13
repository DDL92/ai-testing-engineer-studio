import fs = require('fs');
import path = require('path');
import { buildAuditPack } from '../auditPackEngine/auditPackRules';
import { AuditScopeOption } from '../auditPackEngine/types';
import { buildEvidenceReport } from '../evidenceEngine/evidenceRules';
import { listLeads } from '../leads/leadStore';
import { Lead } from '../leads/types';
import { LighthouseEvidenceReport } from '../lighthouseEvidence/types';
import { buildOpportunity } from '../opportunityEngine/opportunityEngineRules';
import { PlaywrightEvidenceReport } from '../playwrightEvidenceRunner/types';
import {
  UnifiedAuditPortfolio,
  UnifiedAuditReport,
  UnifiedAuditScope,
  UnifiedAuditTarget,
  UnifiedBusinessContext,
  UnifiedLighthouseEvidence,
  UnifiedOpportunity,
  UnifiedPlaywrightCoverage,
  UnifiedPlaywrightEvidence,
  UnifiedSourceFile,
} from './types';

const targetsPath = path.join(process.cwd(), 'data', 'unified-audits', 'unified-audits.json');
const outputDir = path.join(process.cwd(), 'output', 'unified-audits');
const playwrightReportsDir = path.join(process.cwd(), 'data', 'evidence', 'playwright', 'reports');
const lighthouseReportsDir = path.join(process.cwd(), 'data', 'evidence', 'lighthouse', 'reports');

const approvedOpportunityTypes = new Set<string>([
  'Potential QA Opportunity',
  'Potential UX Opportunity',
  'Potential Automation Opportunity',
  'Potential Accessibility Opportunity',
  'Potential Performance Opportunity',
]);

export function loadUnifiedAuditTargets(): UnifiedAuditTarget[] {
  return readJson<UnifiedAuditTarget[]>(targetsPath, []);
}

export function buildUnifiedAudit(company: string): UnifiedAuditReport {
  const target = findTarget(company);
  if (!target) {
    throw new Error(`Company not found in data/unified-audits/unified-audits.json: ${company}`);
  }

  const lead = findLead(target);
  const opportunity = buildOpportunity(target.companyName);
  const auditPack = buildAuditPack(target.companyName);
  const evidence = buildEvidenceReport(target.companyName);
  const lighthouse = loadLighthouseEvidence(target.companyId);
  const playwright = loadPlaywrightEvidence(target.companyId);
  const sourceFiles = buildSourceFiles(target.companyId);
  const confidence = confidenceLabel(Math.round((opportunity.confidenceScore + evidence.readinessScore) / 2));

  return {
    companyId: target.companyId,
    companyName: target.companyName,
    generatedAt: new Date().toISOString(),
    opportunityScore: opportunity.confidenceScore,
    evidenceReadiness: evidence.readinessScore,
    confidence,
    recommendedFirstOffer: opportunity.bestFirstOffer,
    recommendedNextAction: opportunity.recommendedNextAction,
    businessContext: buildBusinessContext(lead, opportunity),
    sourceFiles,
    lighthouseEvidence: lighthouse ? buildLighthouseEvidence(lighthouse) : undefined,
    playwrightEvidence: playwright ? buildPlaywrightEvidence(playwright) : undefined,
    potentialQaOpportunities: buildPotentialOpportunities(playwright, lighthouse, opportunity),
    recommendedPlaywrightCoverage: buildRecommendedCoverage(auditPack.playwrightOpportunities, playwright),
    auditScopes: auditPack.recommendedAuditScopes.map(toUnifiedScope),
    retainerPath: auditPack.upgradePath,
    discoveryQuestions: auditPack.discoveryQuestions.slice(0, 5),
    approvalChecklist: approvalChecklist(),
    researchNeeded: opportunity.researchRequired || evidence.gapCount > 0 || !playwright || !lighthouse,
    safetyNotes: safetyNotes(),
  };
}

export function buildUnifiedAuditPortfolio(): UnifiedAuditPortfolio {
  const reports = loadUnifiedAuditTargets()
    .filter((target) => target.status === 'active')
    .map((target) => buildUnifiedAudit(target.companyName));
  const byAudit = [...reports].sort(sortAuditCandidate);
  const byRetainer = [...reports].sort(sortRetainerCandidate);
  const byConfidence = [...reports].sort((left, right) => scoreFor(right) - scoreFor(left) || left.companyName.localeCompare(right.companyName));

  return {
    generatedAt: new Date().toISOString(),
    reports,
    bestAuditCandidate: byAudit[0],
    bestRetainerCandidate: byRetainer[0],
    bestFirstClient: byAudit.find((report) => !report.researchNeeded) ?? byAudit[0],
    highestConfidenceAudit: byConfidence[0],
    lowestConfidenceAudit: [...reports].sort((left, right) => scoreFor(left) - scoreFor(right) || left.companyName.localeCompare(right.companyName))[0],
    researchNeeded: reports.filter((report) => report.researchNeeded),
  };
}

export function writeUnifiedAudit(report: UnifiedAuditReport): string {
  const outputPath = path.join(outputDir, `${report.companyId}-unified-audit.md`);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, renderUnifiedAudit(report), 'utf8');
  return outputPath;
}

export function writeUnifiedAuditSummary(portfolio: UnifiedAuditPortfolio): string[] {
  fs.mkdirSync(outputDir, { recursive: true });
  const outputs = [
    ['audit-summary.md', renderAuditSummary(portfolio)],
    ['audit-priorities.md', renderAuditPriorities(portfolio)],
    ['audit-comparison.md', renderAuditComparison(portfolio)],
    ['audit-readiness.md', renderAuditReadiness(portfolio)],
  ] as const;

  return outputs.map(([fileName, content]) => {
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, content, 'utf8');
    return outputPath;
  });
}

export function renderUnifiedAudit(report: UnifiedAuditReport): string {
  return `# Unified QA Audit: ${report.companyName}

## Executive Summary

${bullets([
    `Company: ${report.companyName}`,
    `Opportunity Score: ${report.opportunityScore}/100`,
    `Evidence Readiness: ${report.evidenceReadiness}/100`,
    `Recommended First Offer: ${report.recommendedFirstOffer}`,
    `Recommended Next Action: ${report.recommendedNextAction}`,
  ])}

## Business Context

${bullets([
    `Industry: ${report.businessContext.industry}`,
    `Product Type: ${report.businessContext.productType}`,
    `Observed Opportunity Areas: ${report.businessContext.observedOpportunityAreas.join(', ')}`,
  ])}

## Source Evidence

${bullets(report.sourceFiles.map((sourceFile) => `${sourceFile.label}: ${sourceFile.available ? 'Available' : 'Missing'} - ${sourceFile.path}`))}

## Lighthouse Evidence

${renderLighthouseEvidence(report.lighthouseEvidence)}

## Playwright Evidence

${renderPlaywrightEvidence(report.playwrightEvidence)}

## Potential QA Opportunities

${renderPotentialOpportunities(report.potentialQaOpportunities)}

## Recommended Playwright Coverage

### Smoke Suite

${bullets(report.recommendedPlaywrightCoverage.smokeSuite)}

### Regression Suite

${bullets(report.recommendedPlaywrightCoverage.regressionSuite)}

### Critical Path Coverage

${bullets(report.recommendedPlaywrightCoverage.criticalPathCoverage)}

## Audit Scope Recommendation

${report.auditScopes.map(renderAuditScope).join('\n\n')}

## Recommended Offer

- ${report.recommendedFirstOffer}

## Retainer Path

${report.retainerPath.map((step, index) => `${index + 1}. ${step}`).join('\n')}

## Discovery Call Questions

${report.discoveryQuestions.map((question, index) => `${index + 1}. ${question}`).join('\n')}

## Approval Checklist

${report.approvalChecklist.map((item) => `- [ ] ${item}`).join('\n')}

## Safety Notes

${bullets(report.safetyNotes)}
`;
}

export function renderAuditSummary(portfolio: UnifiedAuditPortfolio): string {
  return `# Unified Audit Summary

Generated: ${portfolio.generatedAt}

## Best Audit Candidate

${portfolio.bestAuditCandidate ? portfolioBullets(portfolio.bestAuditCandidate) : '- No audit candidates available.'}

## Best Retainer Candidate

${portfolio.bestRetainerCandidate ? portfolioBullets(portfolio.bestRetainerCandidate) : '- No retainer candidates available.'}

## Best First Client

${portfolio.bestFirstClient ? portfolioBullets(portfolio.bestFirstClient) : '- No first-client candidate available.'}

## Highest Confidence Audit

${portfolio.highestConfidenceAudit ? portfolioBullets(portfolio.highestConfidenceAudit) : '- No confidence ranking available.'}

## Lowest Confidence Audit

${portfolio.lowestConfidenceAudit ? portfolioBullets(portfolio.lowestConfidenceAudit) : '- No confidence ranking available.'}

## Research Needed

${portfolio.researchNeeded.length > 0 ? bullets(portfolio.researchNeeded.map((report) => `${report.companyName}: ${report.recommendedNextAction}`)) : '- No research gaps recorded.'}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderAuditPriorities(portfolio: UnifiedAuditPortfolio): string {
  const ranked = [...portfolio.reports].sort(sortAuditCandidate);

  return `# Unified Audit Priorities

| Company | Opportunity Score | Evidence Readiness | First Offer | Research Needed | Recommended Next Action |
| --- | --- | --- | --- | --- | --- |
${ranked.map((report) => `| ${report.companyName} | ${report.opportunityScore}/100 | ${report.evidenceReadiness}/100 | ${report.recommendedFirstOffer} | ${report.researchNeeded ? 'Yes' : 'No'} | ${report.recommendedNextAction} |`).join('\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderAuditComparison(portfolio: UnifiedAuditPortfolio): string {
  return `# Unified Audit Comparison

| Company | Confidence | Opportunity | Evidence | Lighthouse Performance | Lighthouse Accessibility | Playwright Pages | Screenshots |
| --- | --- | --- | --- | --- | --- | --- | --- |
${portfolio.reports.map((report) => `| ${report.companyName} | ${report.confidence} | ${report.opportunityScore}/100 | ${report.evidenceReadiness}/100 | ${scoreLabel(report.lighthouseEvidence?.performance ?? null)} | ${scoreLabel(report.lighthouseEvidence?.accessibility ?? null)} | ${report.playwrightEvidence?.pagesReviewed ?? 'Not Available'} | ${report.playwrightEvidence?.screenshotsCaptured ?? 'Not Available'} |`).join('\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderAuditReadiness(portfolio: UnifiedAuditPortfolio): string {
  return `# Unified Audit Readiness

| Company | Opportunity Output | Audit Pack | Evidence Output | Playwright Evidence | Lighthouse Evidence | Readiness |
| --- | --- | --- | --- | --- | --- | --- |
${portfolio.reports.map((report) => `| ${report.companyName} | ${available(report, 'Opportunity Engine')} | ${available(report, 'Audit Pack Engine')} | ${available(report, 'Evidence Engine')} | ${available(report, 'Playwright Evidence')} | ${available(report, 'Lighthouse Evidence')} | ${report.researchNeeded ? 'Needs review' : 'Ready for manual review'} |`).join('\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

function buildBusinessContext(lead: Lead | undefined, opportunity: ReturnType<typeof buildOpportunity>): UnifiedBusinessContext {
  const areas = unique([
    ...(lead?.painPoints ?? []),
    opportunity.opportunityCategory,
    opportunity.bestAuditAngle.angle,
    opportunity.bestAutomationOpportunity.title,
  ]).slice(0, 8);

  return {
    industry: lead?.industry ?? 'Not Available',
    productType: productTypeFromLead(lead, opportunity.opportunityCategory),
    observedOpportunityAreas: areas.length > 0 ? areas : ['Manual review required'],
  };
}

function buildLighthouseEvidence(report: LighthouseEvidenceReport): UnifiedLighthouseEvidence {
  return {
    performance: report.scores.performance,
    accessibility: report.scores.accessibility,
    bestPractices: report.scores.bestPractices,
    seo: report.scores.seo,
    sourcePath: report.markdownReportPath,
  };
}

function buildPlaywrightEvidence(report: PlaywrightEvidenceReport): UnifiedPlaywrightEvidence {
  return {
    pagesReviewed: report.pagesReviewed,
    screenshotsCaptured: report.screenshotsCaptured,
    consoleObservations: report.consoleObservationCount,
    observedPublicFlows: unique(report.observations.map((observation) => observation.pageType)),
    sourcePath: `output/playwright-runner/${report.companyId}-playwright-evidence.md`,
  };
}

function buildPotentialOpportunities(playwright: PlaywrightEvidenceReport | undefined, lighthouse: LighthouseEvidenceReport | undefined, opportunity: ReturnType<typeof buildOpportunity>): UnifiedOpportunity[] {
  const opportunities: UnifiedOpportunity[] = [];

  for (const observation of playwright?.observations ?? []) {
    for (const item of [...observation.qaOpportunities, ...observation.automationOpportunities]) {
      if (!approvedOpportunityTypes.has(item.type)) continue;
      opportunities.push({
        type: item.type as UnifiedOpportunity['type'],
        description: item.description,
        evidence: item.evidence,
        confidence: item.confidence,
      });
    }
  }

  for (const item of lighthouse?.opportunities ?? []) {
    if (item.type === 'Potential Performance Opportunity' || item.type === 'Potential Accessibility Opportunity') {
      opportunities.push({
        type: item.type,
        description: item.description,
        evidence: item.evidence,
        confidence: item.confidence,
      });
    }
  }

  opportunities.push({
    type: 'Potential QA Opportunity',
    description: opportunity.bestAuditAngle.angle,
    evidence: `Derived from Opportunity Engine recommended scope: ${opportunity.bestAuditAngle.recommendedScope.join('; ')}.`,
    confidence: confidenceLabel(opportunity.confidenceScore),
  });

  return uniqueBy(opportunities, (item) => `${item.type}:${item.description}:${item.evidence}`).slice(0, 12);
}

function buildRecommendedCoverage(suites: ReturnType<typeof buildAuditPack>['playwrightOpportunities'], playwright: PlaywrightEvidenceReport | undefined): UnifiedPlaywrightCoverage {
  const observedFlows = playwright?.observations.map((observation) => observation.pageType) ?? [];
  const smoke = suites.find((suite) => suite.suite === 'Suggested Smoke Suite');
  const regression = suites.find((suite) => suite.suite === 'Suggested Regression Suite');
  const critical = suites.find((suite) => suite.suite === 'Suggested Critical Path Coverage');

  return {
    smokeSuite: unique([...observedFlows, ...(smoke?.coverage ?? [])]).slice(0, 8),
    regressionSuite: unique([...(regression?.coverage ?? []), 'public navigation regression check']).slice(0, 8),
    criticalPathCoverage: unique([...(critical?.coverage ?? []), 'Homepage', 'Navigation']).slice(0, 8),
  };
}

function toUnifiedScope(scope: AuditScopeOption): UnifiedAuditScope {
  return {
    size: scope.size,
    focusAreas: scope.focusAreas,
    deliverables: scope.expectedDeliverables,
    complexity: scope.complexity,
  };
}

function buildSourceFiles(companyId: string): UnifiedSourceFile[] {
  const files = [
    ['Opportunity Engine', `output/opportunities/${companyId}-opportunity.md`],
    ['Audit Pack Engine', `output/audit-packs/${companyId}-audit-pack.md`],
    ['Evidence Engine', `output/evidence/${companyId}-evidence.md`],
    ['Playwright Evidence', `output/playwright-runner/${companyId}-playwright-evidence.md`],
    ['Lighthouse Evidence', `output/lighthouse/${companyId}-lighthouse.md`],
  ] as const;

  return files.map(([label, relativePath]) => ({
    label,
    path: relativePath,
    available: fs.existsSync(path.join(process.cwd(), relativePath)),
  }));
}

function loadPlaywrightEvidence(companyId: string): PlaywrightEvidenceReport | undefined {
  return readJson<PlaywrightEvidenceReport>(path.join(playwrightReportsDir, `${companyId}-playwright-evidence.json`), undefined);
}

function loadLighthouseEvidence(companyId: string): LighthouseEvidenceReport | undefined {
  return readJson<LighthouseEvidenceReport>(path.join(lighthouseReportsDir, `${companyId}-lighthouse-evidence.json`), undefined);
}

function renderLighthouseEvidence(evidence: UnifiedLighthouseEvidence | undefined): string {
  if (!evidence) return '- No local Lighthouse evidence is available yet.';

  return bullets([
    `Performance: ${scoreLabel(evidence.performance)}`,
    `Accessibility: ${scoreLabel(evidence.accessibility)}`,
    `Best Practices: ${scoreLabel(evidence.bestPractices)}`,
    `SEO: ${scoreLabel(evidence.seo)}`,
    `Source: ${evidence.sourcePath}`,
  ]);
}

function renderPlaywrightEvidence(evidence: UnifiedPlaywrightEvidence | undefined): string {
  if (!evidence) return '- No local Playwright evidence is available yet.';

  return bullets([
    `Pages Reviewed: ${evidence.pagesReviewed}`,
    `Screenshots Captured: ${evidence.screenshotsCaptured}`,
    `Console Observations: ${evidence.consoleObservations}`,
    `Observed Public Flows: ${evidence.observedPublicFlows.join(', ')}`,
    `Source: ${evidence.sourcePath}`,
  ]);
}

function renderPotentialOpportunities(opportunities: UnifiedOpportunity[]): string {
  if (opportunities.length === 0) return '- No potential QA opportunities recorded.';

  return opportunities.map((opportunity) => bullets([
    `Type: ${opportunity.type}`,
    `Description: ${opportunity.description}`,
    `Evidence: ${opportunity.evidence}`,
    `Confidence: ${opportunity.confidence}`,
  ])).join('\n\n');
}

function renderAuditScope(scope: UnifiedAuditScope): string {
  return `### ${scope.size}

${bullets([
    `Focus Areas: ${scope.focusAreas.join(', ')}`,
    `Deliverables: ${scope.deliverables.join(', ')}`,
    `Complexity: ${scope.complexity}`,
  ])}`;
}

function available(report: UnifiedAuditReport, label: string): string {
  return report.sourceFiles.find((sourceFile) => sourceFile.label === label)?.available ? 'Available' : 'Missing';
}

function approvalChecklist(): string[] {
  return [
    'Evidence Reviewed',
    'Findings Reviewed',
    'Contact Verified',
    'Offer Verified',
    'Daniel Approval Required',
  ];
}

function safetyNotes(): string[] {
  return [
    'Unified audit report only. This is not a proposal, contract, invoice, payment request, or outreach tool.',
    'All findings are potential opportunities unless separately verified by reviewed evidence.',
    'Do not invent bugs, vulnerabilities, incidents, outages, complaints, customer quotes, findings, or metrics.',
    'Approved offers only: QA Audit ($199-$500), Playwright Starter Pack ($900-$1500), QA Automation Retainer ($1500-$3000/month).',
    'Human approval is required before external use.',
  ];
}

function portfolioBullets(report: UnifiedAuditReport): string {
  return bullets([
    `Company: ${report.companyName}`,
    `Opportunity Score: ${report.opportunityScore}/100`,
    `Evidence Readiness: ${report.evidenceReadiness}/100`,
    `Recommended First Offer: ${report.recommendedFirstOffer}`,
    `Research Needed: ${report.researchNeeded ? 'Yes' : 'No'}`,
    `Recommended Next Action: ${report.recommendedNextAction}`,
  ]);
}

function productTypeFromLead(lead: Lead | undefined, fallback: string): string {
  if (!lead) return fallback;
  if (lead.industry.toLowerCase().includes('saas')) return 'SaaS product';
  if (lead.industry.toLowerCase().includes('software')) return 'Software product';
  return lead.industry;
}

function findTarget(company: string): UnifiedAuditTarget | undefined {
  const normalized = normalize(company);
  return loadUnifiedAuditTargets().find((target) => matchesNormalized(normalize(target.companyId), normalized) || matchesNormalized(normalize(target.companyName), normalized));
}

function findLead(target: UnifiedAuditTarget): Lead | undefined {
  const normalizedId = normalize(target.companyId);
  const normalizedName = normalize(target.companyName);
  return listLeads().find((lead) => matchesNormalized(normalize(lead.id), normalizedId) || matchesNormalized(normalize(lead.companyName), normalizedName));
}

function sortAuditCandidate(left: UnifiedAuditReport, right: UnifiedAuditReport): number {
  return scoreFor(right) - scoreFor(left)
    || Number(left.researchNeeded) - Number(right.researchNeeded)
    || left.companyName.localeCompare(right.companyName);
}

function sortRetainerCandidate(left: UnifiedAuditReport, right: UnifiedAuditReport): number {
  const leftScore = scoreFor(left) + (left.recommendedFirstOffer === 'QA Automation Retainer ($1500-$3000/month)' ? 10 : 0);
  const rightScore = scoreFor(right) + (right.recommendedFirstOffer === 'QA Automation Retainer ($1500-$3000/month)' ? 10 : 0);
  return rightScore - leftScore || left.companyName.localeCompare(right.companyName);
}

function scoreFor(report: UnifiedAuditReport): number {
  return Math.round((report.opportunityScore + report.evidenceReadiness) / 2);
}

function confidenceLabel(score: number): 'High' | 'Medium' | 'Low' {
  if (score >= 85) return 'High';
  if (score >= 70) return 'Medium';
  return 'Low';
}

function scoreLabel(score: number | null): string {
  if (score === null) return 'Not Available';
  return `${Math.round(score * 100)}/100`;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function uniqueBy<T>(values: T[], keyFor: (value: T) => string): T[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = keyFor(value);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function readJson<T>(filePath: string, fallback: T): T;
function readJson<T>(filePath: string, fallback: undefined): T | undefined;
function readJson<T>(filePath: string, fallback: T | undefined): T | undefined {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function bullets(items: string[]): string {
  if (items.length === 0) return '- Not enough evidence yet.';
  return items.map((item) => `- ${item}`).join('\n');
}

function matchesNormalized(left: string, right: string): boolean {
  return left === right || left.includes(right) || right.includes(left);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '');
}
