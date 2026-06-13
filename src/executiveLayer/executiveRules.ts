import fs = require('fs');
import path = require('path');
import { buildClientAuditReport } from '../clientAuditReports/clientAuditReportRules';
import { buildProposalPortfolio } from '../proposalEngine/proposalRules';
import { buildRevenueActivationReport } from '../revenueActivation/revenueRules';
import { buildUnifiedAudit, buildUnifiedAuditPortfolio } from '../unifiedAuditGenerator/unifiedAuditRules';
import { UnifiedOpportunity } from '../unifiedAuditGenerator/types';
import {
  BusinessRiskLevel,
  ExecutiveBusinessRisk,
  ExecutiveCompanyReport,
  ExecutivePortfolio,
  ExecutiveRoadmapItem,
  ExecutiveSeverity,
  ExecutiveState,
} from './types';

const outputRoot = path.join(process.cwd(), 'output', 'executive');
const executiveStatePath = path.join(process.cwd(), 'data', 'executive', 'executive-state.json');
const portfolioCompanies = ['PushPress', 'TeamUp', 'Glofox'];

const safetyRules = [
  'Executive reports use local Studio outputs only.',
  'All risks are potential or possible unless independently validated.',
  'Do not invent revenue, customers, conversions, bugs, outages, incidents, vulnerabilities, lost sales, churn, complaints, or quotes.',
  'Human approval is required before external use.',
  'These reports do not send outreach, emails, proposals, invoices, or payments.',
];

export function loadExecutiveState(): ExecutiveState {
  const fallback: ExecutiveState = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    audience: ['CEO', 'Founder', 'Product Director', 'Operations Director', 'Gym Software Executive'],
    approvedEngagements: [
      'QA Audit ($199-$500)',
      'Playwright Starter Pack ($900-$1500)',
      'QA Automation Retainer ($1500-$3000/month)',
    ],
    notes: [
      'Translate QA findings into business language.',
      'Use potential, possible, may indicate, and could increase risk when uncertainty exists.',
    ],
  };

  return readJson<ExecutiveState>(executiveStatePath, fallback);
}

export function buildExecutiveCompanyReport(company: string): ExecutiveCompanyReport {
  loadExecutiveState();
  const unified = buildUnifiedAudit(company);
  const clientAudit = buildClientAuditReport(company);
  const proposalPortfolio = buildProposalPortfolio();
  const revenueActivation = buildRevenueActivationReport();
  const activation = revenueActivation.pipeline.find((item) => item.companyId === unified.companyId);
  const proposal = proposalPortfolio.proposals.find((item) => item.companyId === unified.companyId);
  const topBusinessRisks = buildBusinessRisks(unified.potentialQaOpportunities, unified.lighthouseEvidence, unified.playwrightEvidence);
  const businessRiskScore = calculateBusinessRiskScore(topBusinessRisks, unified.lighthouseEvidence?.performance ?? null);
  const releaseConfidenceScore = calculateReleaseConfidenceScore(
    unified.evidenceReadiness,
    unified.playwrightEvidence ? 100 : 0,
    averageDefined([
      scoreToHundred(unified.lighthouseEvidence?.performance ?? null),
      scoreToHundred(unified.lighthouseEvidence?.accessibility ?? null),
      scoreToHundred(unified.lighthouseEvidence?.bestPractices ?? null),
    ]),
    unified.confidence,
  );
  const commercialPotentialScore = calculateCommercialPotentialScore(
    unified.opportunityScore,
    unified.evidenceReadiness,
    proposal ? 100 : 0,
    activation?.contactReadiness ?? 0,
  );
  const executiveScore = Math.round(
    commercialPotentialScore * 0.35
    + releaseConfidenceScore * 0.35
    + businessRiskScore * 0.30,
  );

  return {
    companyId: unified.companyId,
    companyName: unified.companyName,
    generatedAt: new Date().toISOString(),
    executiveScore,
    releaseConfidence: releaseConfidenceScore,
    businessRiskLevel: riskLevel(businessRiskScore),
    recommendedEngagement: clientAudit.recommendedService,
    scores: {
      executiveScore,
      businessRiskScore,
      releaseConfidenceScore,
      commercialPotentialScore,
      formulas: scoringFormulas(),
    },
    topBusinessRisks,
    topPriorities: topBusinessRisks.slice(0, 5),
    roadmap: buildRoadmap(),
    executiveRecommendation: clientAudit.recommendedService,
    summary: buildExecutiveSummary(unified.companyName, executiveScore, riskLevel(businessRiskScore), clientAudit.recommendedService),
    safetyRules,
  };
}

export function buildExecutivePortfolio(): ExecutivePortfolio {
  const unifiedPortfolio = buildUnifiedAuditPortfolio();
  const reports = portfolioCompanies.map((company) => buildExecutiveCompanyReport(company));
  const ranked = [...reports].sort((left, right) => right.executiveScore - left.executiveScore || left.companyName.localeCompare(right.companyName));

  return {
    generatedAt: unifiedPortfolio.generatedAt,
    reports,
    topExecutivePriority: ranked[0],
    businessRiskPortfolio: reports.flatMap((report) => report.topBusinessRisks.map((risk) => ({
      ...risk,
      area: `${report.companyName}: ${risk.area}`,
    }))).sort(sortRisks).slice(0, 10).map((risk, index) => ({ ...risk, priority: index + 1 })),
    executiveReadiness: buildExecutiveReadiness(reports),
    safetyRules,
  };
}

export function writeExecutiveCompanySummary(report: ExecutiveCompanyReport): string {
  fs.mkdirSync(outputRoot, { recursive: true });
  const outputPath = path.join(outputRoot, `${report.companyId}-executive-summary.md`);
  fs.writeFileSync(outputPath, renderExecutiveCompanySummary(report), 'utf8');
  return outputPath;
}

export function writeExecutivePortfolioOutputs(portfolio: ExecutivePortfolio): string[] {
  fs.mkdirSync(outputRoot, { recursive: true });

  const companyOutputs = portfolio.reports.map((report) => ({
    fileName: `${report.companyId}-executive-summary.md`,
    body: renderExecutiveCompanySummary(report),
  }));
  const outputs = [
    ...companyOutputs,
    { fileName: 'business-risk.md', body: renderBusinessRisk(portfolio) },
    { fileName: 'executive-priorities.md', body: renderExecutivePriorities(portfolio) },
    { fileName: 'executive-roadmap.md', body: renderExecutiveRoadmap(portfolio) },
    { fileName: 'executive-portfolio.md', body: renderExecutivePortfolio(portfolio) },
    { fileName: 'executive-readiness.md', body: renderExecutiveReadiness(portfolio) },
  ];

  for (const output of outputs) {
    fs.writeFileSync(path.join(outputRoot, output.fileName), output.body, 'utf8');
  }

  return outputs.map((output) => path.join(outputRoot, output.fileName));
}

export function renderExecutiveCompanySummary(report: ExecutiveCompanyReport): string {
  return [
    '# Executive Summary',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Snapshot',
    renderList([
      `Company: ${report.companyName}`,
      `Executive Score: ${report.executiveScore}/100`,
      `Release Confidence: ${report.releaseConfidence}/100`,
      `Business Risk Level: ${report.businessRiskLevel}`,
      `Recommended Engagement: ${report.recommendedEngagement}`,
    ]),
    '',
    '## What Matters',
    report.summary,
    '',
    '# Top Business Risks',
    renderRiskBlocks(report.topBusinessRisks),
    '',
    '# Top 5 Priorities',
    renderPriorityTable(report.topPriorities),
    '',
    '# 90 Day Roadmap',
    renderRoadmap(report.roadmap),
    '',
    '# Executive Recommendation',
    '',
    report.executiveRecommendation,
    '',
    '## Scoring',
    renderScoring(report),
    '',
    '## Safety Rules',
    renderList(report.safetyRules),
    '',
  ].join('\n');
}

export function renderBusinessRisk(portfolio: ExecutivePortfolio): string {
  return [
    '# Business Risk',
    '',
    `Generated: ${portfolio.generatedAt}`,
    '',
    renderRiskBlocks(portfolio.businessRiskPortfolio),
    '',
    '## Safety Rules',
    renderList(portfolio.safetyRules),
    '',
  ].join('\n');
}

export function renderExecutivePriorities(portfolio: ExecutivePortfolio): string {
  return [
    '# Executive Priorities',
    '',
    `Generated: ${portfolio.generatedAt}`,
    '',
    renderPriorityTable(portfolio.businessRiskPortfolio.slice(0, 10)),
    '',
    '## Rule',
    renderList(['Priorities are ranked by business impact first, then technical importance.']),
    '',
  ].join('\n');
}

export function renderExecutiveRoadmap(portfolio: ExecutivePortfolio): string {
  return [
    '# Executive Roadmap',
    '',
    `Generated: ${portfolio.generatedAt}`,
    '',
    ...portfolio.reports.flatMap((report) => [
      `## ${report.companyName}`,
      renderRoadmap(report.roadmap),
      '',
    ]),
    '## Safety Rules',
    renderList(portfolio.safetyRules),
    '',
  ].join('\n');
}

export function renderExecutivePortfolio(portfolio: ExecutivePortfolio): string {
  return [
    '# Executive Portfolio',
    '',
    `Generated: ${portfolio.generatedAt}`,
    '',
    '## Executive Ranking',
    '| Rank | Company | Executive Score | Risk Level | Release Confidence | Recommendation |',
    '| ---: | --- | ---: | --- | ---: | --- |',
    ...[...portfolio.reports]
      .sort((left, right) => right.executiveScore - left.executiveScore || left.companyName.localeCompare(right.companyName))
      .map((report, index) => `| ${index + 1} | ${escapeTable(report.companyName)} | ${report.executiveScore}/100 | ${report.businessRiskLevel} | ${report.releaseConfidence}/100 | ${escapeTable(report.executiveRecommendation)} |`),
    '',
    '## Top Executive Priority',
    portfolio.topExecutivePriority
      ? renderList([
        `${portfolio.topExecutivePriority.companyName}: ${portfolio.topExecutivePriority.executiveRecommendation}`,
        portfolio.topExecutivePriority.summary,
      ])
      : '- None.',
    '',
    '## Safety Rules',
    renderList(portfolio.safetyRules),
    '',
  ].join('\n');
}

export function renderExecutiveReadiness(portfolio: ExecutivePortfolio): string {
  return [
    '# Executive Readiness',
    '',
    `Generated: ${portfolio.generatedAt}`,
    '',
    renderList(portfolio.executiveReadiness),
    '',
    '## Safety Rules',
    renderList(portfolio.safetyRules),
    '',
  ].join('\n');
}

function buildBusinessRisks(
  opportunities: UnifiedOpportunity[],
  lighthouse: { performance: number | null; accessibility: number | null; bestPractices: number | null } | undefined,
  playwright: { pagesReviewed: number; consoleObservations: number; observedPublicFlows: string[] } | undefined,
): ExecutiveBusinessRisk[] {
  const risks: Omit<ExecutiveBusinessRisk, 'priority'>[] = [];
  const performance = scoreToHundred(lighthouse?.performance ?? null);
  const bestPractices = scoreToHundred(lighthouse?.bestPractices ?? null);
  const accessibility = scoreToHundred(lighthouse?.accessibility ?? null);

  if (performance !== null && performance < 70) {
    risks.push({
      area: 'Homepage Performance',
      evidence: `Lighthouse Performance ${performance}/100`,
      businessImpact: 'Potential lead abandonment risk on public marketing traffic.',
      severity: performance < 50 ? 'High' : 'Medium',
      recommendedAction: 'Performance review and optimization.',
      businessImpactScore: performance < 50 ? 100 : 80,
      technicalImportanceScore: 90,
    });
  }

  if (bestPractices !== null && bestPractices < 70) {
    risks.push({
      area: 'Public Site Best Practices',
      evidence: `Lighthouse Best Practices ${bestPractices}/100`,
      businessImpact: 'May indicate trust, reliability, or browser quality gaps on the public site.',
      severity: bestPractices < 60 ? 'High' : 'Medium',
      recommendedAction: 'Review public-site quality and best-practice issues.',
      businessImpactScore: bestPractices < 60 ? 90 : 75,
      technicalImportanceScore: 80,
    });
  }

  if (accessibility !== null && accessibility < 90) {
    risks.push({
      area: 'Accessibility',
      evidence: `Lighthouse Accessibility ${accessibility}/100`,
      businessImpact: 'Could increase friction for prospects or operators using assistive technologies.',
      severity: accessibility < 75 ? 'High' : 'Medium',
      recommendedAction: 'Review accessibility gaps on high-intent public pages.',
      businessImpactScore: accessibility < 75 ? 85 : 65,
      technicalImportanceScore: 75,
    });
  }

  if (playwright) {
    risks.push({
      area: 'Critical User Journey',
      evidence: `Playwright observations reviewed ${playwright.pagesReviewed} public page(s): ${playwright.observedPublicFlows.join(', ') || 'public flows'}`,
      businessImpact: 'Potential release confidence gap for public conversion and decision journeys.',
      severity: playwright.pagesReviewed >= 3 ? 'Medium' : 'Low',
      recommendedAction: 'Implement smoke coverage for public page load, navigation, and primary CTA visibility.',
      businessImpactScore: 78,
      technicalImportanceScore: 85,
    });
  }

  for (const opportunity of opportunities.slice(0, 5)) {
    risks.push({
      area: businessAreaFromOpportunity(opportunity),
      evidence: opportunity.evidence,
      businessImpact: businessImpactFromOpportunity(opportunity),
      severity: opportunity.confidence === 'High' ? 'High' : opportunity.confidence === 'Medium' ? 'Medium' : 'Low',
      recommendedAction: actionFromOpportunity(opportunity),
      businessImpactScore: opportunity.confidence === 'High' ? 88 : opportunity.confidence === 'Medium' ? 72 : 50,
      technicalImportanceScore: opportunity.type.includes('Automation') ? 85 : opportunity.type.includes('Performance') ? 90 : 70,
    });
  }

  return risks.sort(sortRisks).slice(0, 5).map((risk, index) => ({ ...risk, priority: index + 1 }));
}

function buildRoadmap(): ExecutiveRoadmapItem[] {
  return [
    {
      month: 'Month 1',
      engagement: 'QA Audit',
      businessOutcome: 'Create executive visibility into the highest-risk public journeys and evidence-backed priorities.',
      executiveDecision: 'Approve a narrow audit scope before larger automation work.',
    },
    {
      month: 'Month 2',
      engagement: 'Playwright Starter Pack',
      businessOutcome: 'Turn the highest-priority journeys into repeatable smoke coverage for release confidence.',
      executiveDecision: 'Approve starter coverage only for the journeys validated in Month 1.',
    },
    {
      month: 'Month 3',
      engagement: 'QA Automation Retainer',
      businessOutcome: 'Maintain and extend coverage around release risk, public conversion paths, and recurring quality checks.',
      executiveDecision: 'Move to retainer only if the audit and starter pack show clear operating value.',
    },
  ];
}

function calculateBusinessRiskScore(risks: ExecutiveBusinessRisk[], performance: number | null): number {
  const topRisk = risks[0]?.businessImpactScore ?? 40;
  const performanceScore = scoreToHundred(performance);
  const performancePenalty = performanceScore === null ? 0 : Math.max(0, 70 - performanceScore) * 0.5;
  return clamp(Math.round(topRisk * 0.8 + performancePenalty));
}

function calculateReleaseConfidenceScore(evidenceReadiness: number, playwrightPresence: number, lighthouseAverage: number, confidence: string): number {
  const confidenceScore = confidence === 'High' ? 100 : confidence === 'Medium' ? 75 : 50;
  return clamp(Math.round(evidenceReadiness * 0.4 + playwrightPresence * 0.25 + lighthouseAverage * 0.2 + confidenceScore * 0.15));
}

function calculateCommercialPotentialScore(opportunityScore: number, evidenceReadiness: number, proposalReadiness: number, contactReadiness: number): number {
  return clamp(Math.round(opportunityScore * 0.45 + evidenceReadiness * 0.25 + proposalReadiness * 0.2 + contactReadiness * 0.1));
}

function riskLevel(score: number): BusinessRiskLevel {
  if (score >= 70) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

function buildExecutiveSummary(companyName: string, executiveScore: number, risk: BusinessRiskLevel, recommendation: string): string {
  return `${companyName} has a ${executiveScore}/100 executive priority score with ${risk.toLowerCase()} business risk. The clearest next step is ${recommendation}, focused on turning current QA evidence into a practical business decision without assuming confirmed bugs, lost sales, or client impact.`;
}

function buildExecutiveReadiness(reports: ExecutiveCompanyReport[]): string[] {
  return reports.map((report) => `${report.companyName}: ${report.executiveRecommendation}; executive score ${report.executiveScore}/100; ${report.businessRiskLevel} risk; readable by a business owner without QA context.`);
}

function scoringFormulas(): string[] {
  return [
    'Business Risk Score = top business-impact risk score plus any low-performance penalty, capped at 100.',
    'Release Confidence Score = Evidence Readiness 40% + Playwright Evidence Presence 25% + Lighthouse Average 20% + Audit Confidence 15%.',
    'Commercial Potential Score = Opportunity Score 45% + Evidence Readiness 25% + Proposal Readiness 20% + Contact Readiness 10%.',
    'Executive Score = Commercial Potential 35% + Release Confidence 35% + Business Risk Score 30%.',
  ];
}

function renderRiskBlocks(risks: ExecutiveBusinessRisk[]): string {
  if (risks.length === 0) return '- No business risks available from local evidence.';

  return risks.map((risk) => [
    `## Priority #${risk.priority}`,
    '',
    `Area:\n${risk.area}`,
    '',
    `Evidence:\n${risk.evidence}`,
    '',
    `Business Impact:\n${risk.businessImpact}`,
    '',
    `Severity:\n${risk.severity}`,
    '',
    `Recommended Action:\n${risk.recommendedAction}`,
  ].join('\n')).join('\n\n');
}

function renderPriorityTable(priorities: ExecutiveBusinessRisk[]): string {
  if (priorities.length === 0) return '- No priorities available from local evidence.';

  return [
    '| Rank | Area | Business Impact | Severity | Recommended Action |',
    '| ---: | --- | --- | --- | --- |',
    ...priorities.map((priority, index) => `| ${index + 1} | ${escapeTable(priority.area)} | ${escapeTable(priority.businessImpact)} | ${priority.severity} | ${escapeTable(priority.recommendedAction)} |`),
  ].join('\n');
}

function renderRoadmap(roadmap: ExecutiveRoadmapItem[]): string {
  return roadmap.map((item) => [
    `## ${item.month}`,
    item.engagement,
    '',
    renderList([
      `Business outcome: ${item.businessOutcome}`,
      `Executive decision: ${item.executiveDecision}`,
    ]),
  ].join('\n')).join('\n\n');
}

function renderScoring(report: ExecutiveCompanyReport): string {
  return [
    renderList([
      `Executive Score: ${report.scores.executiveScore}/100`,
      `Business Risk Score: ${report.scores.businessRiskScore}/100`,
      `Release Confidence Score: ${report.scores.releaseConfidenceScore}/100`,
      `Commercial Potential Score: ${report.scores.commercialPotentialScore}/100`,
    ]),
    '',
    'Formulas:',
    renderList(report.scores.formulas),
  ].join('\n');
}

function businessAreaFromOpportunity(opportunity: UnifiedOpportunity): string {
  if (opportunity.type.includes('Performance')) return 'Homepage Performance';
  if (opportunity.type.includes('Automation')) return 'Release Confidence Coverage';
  if (opportunity.type.includes('Accessibility')) return 'Accessibility';
  if (opportunity.type.includes('UX')) return 'Public User Experience';
  return 'QA Risk';
}

function businessImpactFromOpportunity(opportunity: UnifiedOpportunity): string {
  if (opportunity.type.includes('Performance')) return 'Could increase risk of prospect drop-off before a lead or demo action.';
  if (opportunity.type.includes('Automation')) return 'May indicate manual release confidence risk around public journeys.';
  if (opportunity.type.includes('Accessibility')) return 'Could increase access friction for prospects or operators.';
  if (opportunity.type.includes('UX')) return 'Could increase friction in high-intent product evaluation paths.';
  return 'May indicate quality risk that should be reviewed before larger release or sales claims.';
}

function actionFromOpportunity(opportunity: UnifiedOpportunity): string {
  if (opportunity.type.includes('Performance')) return 'Performance review and optimization.';
  if (opportunity.type.includes('Automation')) return 'Implement smoke coverage.';
  if (opportunity.type.includes('Accessibility')) return 'Accessibility review on priority public pages.';
  if (opportunity.type.includes('UX')) return 'Review and simplify the public user journey.';
  return 'Review evidence and convert into a focused QA audit item.';
}

function sortRisks(left: Omit<ExecutiveBusinessRisk, 'priority'>, right: Omit<ExecutiveBusinessRisk, 'priority'>): number {
  return right.businessImpactScore - left.businessImpactScore
    || right.technicalImportanceScore - left.technicalImportanceScore
    || left.area.localeCompare(right.area);
}

function scoreToHundred(score: number | null): number | null {
  if (score === null) return null;
  return Math.round(score * 100);
}

function averageDefined(values: Array<number | null>): number {
  const defined = values.filter((value): value is number => value !== null);
  if (defined.length === 0) return 0;
  return Math.round(defined.reduce((sum, value) => sum + value, 0) / defined.length);
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function renderList(items: string[]): string {
  if (items.length === 0) return '- None.';
  return items.map((item) => `- ${item}`).join('\n');
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
