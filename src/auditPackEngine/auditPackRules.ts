import fs = require('fs');
import path = require('path');
import { loadLighthouseReport } from '../lighthouseEvidence/lighthouseRules';
import { buildOpportunity } from '../opportunityEngine/opportunityEngineRules';
import {
  AuditPack,
  AuditPackRisk,
  AuditSourceFile,
  AuditPackTarget,
  AuditPortfolio,
  AuditScopeOption,
  ObservedOpportunityGroup,
  PlaywrightSuiteRecommendation,
} from './types';

const targetsPath = path.join(process.cwd(), 'data', 'audit-packs', 'audit-packs.json');
const outputDir = path.join(process.cwd(), 'output', 'audit-packs');

export function loadAuditPackTargets(): AuditPackTarget[] {
  return readJson<AuditPackTarget[]>(targetsPath, []);
}

export function buildAuditPack(company: string): AuditPack {
  const target = findTarget(company);
  if (!target) {
    throw new Error(`Company not found in data/audit-packs/audit-packs.json: ${company}`);
  }

  const opportunity = buildOpportunity(target.companyName);
  const potentialRisks = buildPotentialRisks(opportunity);

  return {
    companyId: target.companyId,
    companyName: target.companyName,
    opportunityScore: opportunity.confidenceScore,
    confidence: confidenceLabel(opportunity.confidenceScore),
    recommendedFirstService: opportunity.bestFirstOffer,
    opportunity,
    sourceFiles: buildSourceFiles(opportunity),
    potentialRisks,
    observedOpportunities: buildObservedOpportunities(opportunity),
    playwrightOpportunities: buildPlaywrightOpportunities(opportunity),
    recommendedAuditScopes: buildAuditScopes(opportunity),
    upgradePath: buildUpgradePath(opportunity.confidenceScore),
    discoveryQuestions: buildDiscoveryQuestions(opportunity),
    approvalChecklist: approvalChecklist(),
    safetyNotes: safetyNotes(),
  };
}

export function buildAuditPortfolio(): AuditPortfolio {
  const packs = loadAuditPackTargets()
    .filter((target) => target.status === 'active')
    .map((target) => buildAuditPack(target.companyName));
  const sorted = [...packs].sort((left, right) => right.opportunityScore - left.opportunityScore || left.companyName.localeCompare(right.companyName));
  const retainerSorted = [...packs].sort((left, right) => retainerScore(right) - retainerScore(left) || left.companyName.localeCompare(right.companyName));

  return {
    generatedAt: new Date().toISOString(),
    packs,
    highestOpportunityCompanies: sorted,
    bestFirstClient: sorted[0],
    bestRetainerCandidate: retainerSorted[0],
    bestAuditCandidate: sorted.find((pack) => pack.recommendedFirstService === 'QA Audit ($199-$500)') ?? sorted[0],
    lowestConfidenceCompany: [...packs].sort((left, right) => left.opportunityScore - right.opportunityScore || left.companyName.localeCompare(right.companyName))[0],
    researchNeeded: packs.filter((pack) => pack.opportunity.researchRequired),
  };
}

export function writeAuditPack(pack: AuditPack): string {
  const outputPath = path.join(outputDir, `${pack.companyId}-audit-pack.md`);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, renderAuditPack(pack), 'utf8');
  return outputPath;
}

export function writeAuditPortfolio(portfolio: AuditPortfolio): string[] {
  const outputs = [
    ['audit-portfolio.md', renderAuditPortfolio(portfolio)],
    ['audit-priorities.md', renderAuditPriorities(portfolio)],
    ['audit-delivery-roadmap.md', renderAuditDeliveryRoadmap(portfolio)],
    ['retainer-opportunities.md', renderRetainerOpportunities(portfolio)],
  ] as const;

  fs.mkdirSync(outputDir, { recursive: true });

  return outputs.map(([fileName, content]) => {
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, content, 'utf8');
    return outputPath;
  });
}

export function renderAuditPack(pack: AuditPack): string {
  return `# QA Audit Pack: ${pack.companyName}

## Executive Summary

${bullets([
    `Company: ${pack.companyName}`,
    `Opportunity Score: ${pack.opportunityScore}/100`,
    `Confidence: ${pack.confidence}`,
    `Recommended First Service: ${pack.recommendedFirstService}`,
    `Research Required: ${pack.opportunity.researchRequired ? 'Yes' : 'No'}`,
  ])}

## Source Intelligence

${bullets(pack.sourceFiles.map((sourceFile) => `${sourceFile.label}: ${sourceFile.available ? 'Available' : 'Missing'} - ${sourceFile.path}`))}

## Potential QA Risks

${pack.potentialRisks.map(renderRisk).join('\n\n')}

## Observed Opportunities

${pack.observedOpportunities.map(renderOpportunityGroup).join('\n\n')}

## Playwright Opportunities

${pack.playwrightOpportunities.map(renderPlaywrightSuite).join('\n\n')}

## Recommended Audit Scope

${pack.recommendedAuditScopes.map(renderAuditScope).join('\n\n')}

## Recommended First Offer

- ${pack.recommendedFirstService}

## Upgrade Path

${pack.upgradePath.map((step, index) => `${index + 1}. ${step}`).join('\n')}

## Discovery Call Questions

${pack.discoveryQuestions.map((question, index) => `${index + 1}. ${question}`).join('\n')}

## Approval Checklist

${pack.approvalChecklist.map((item) => `- [ ] ${item}`).join('\n')}

## Safety Notes

${bullets(pack.safetyNotes)}
`;
}

export function renderAuditPortfolio(portfolio: AuditPortfolio): string {
  return `# QA Audit Portfolio

Generated: ${portfolio.generatedAt}

## Highest Opportunity Companies

${numbered(portfolio.highestOpportunityCompanies.map((pack) => `${pack.companyName} - ${pack.opportunityScore}/100 - ${pack.recommendedFirstService}`))}

## Best First Client

${portfolio.bestFirstClient ? bullets([
    `Company: ${portfolio.bestFirstClient.companyName}`,
    `Score: ${portfolio.bestFirstClient.opportunityScore}/100`,
    `Reason: Highest current opportunity score with a client-ready QA Audit starting point.`,
    `Recommended Next Action: Review approval checklist before using externally.`,
  ]) : '- No audit packs available.'}

## Best Retainer Candidate

${portfolio.bestRetainerCandidate ? bullets([
    `Company: ${portfolio.bestRetainerCandidate.companyName}`,
    `Score: ${retainerScore(portfolio.bestRetainerCandidate)}`,
    `Reason: Strongest combination of opportunity score, contact readiness, and retainer path readiness.`,
  ]) : '- No retainer candidate available.'}

## Best Audit Candidate

${portfolio.bestAuditCandidate ? bullets([
    `Company: ${portfolio.bestAuditCandidate.companyName}`,
    `Offer: ${portfolio.bestAuditCandidate.recommendedFirstService}`,
    `Scope: ${portfolio.bestAuditCandidate.recommendedAuditScopes[0]?.size ?? 'Small Audit'}`,
  ]) : '- No audit candidate available.'}

## Lowest Confidence Company

${portfolio.lowestConfidenceCompany ? bullets([
    `Company: ${portfolio.lowestConfidenceCompany.companyName}`,
    `Score: ${portfolio.lowestConfidenceCompany.opportunityScore}/100`,
    `Research Required: ${portfolio.lowestConfidenceCompany.opportunity.researchRequired ? 'Yes' : 'No'}`,
  ]) : '- No low-confidence company available.'}

## Research Needed

${portfolio.researchNeeded.length > 0 ? bullets(portfolio.researchNeeded.map((pack) => `${pack.companyName}: ${pack.opportunity.recommendedNextAction}`)) : '- No research gaps recorded.'}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderAuditPriorities(portfolio: AuditPortfolio): string {
  return `# Audit Priorities

| Company | Score | Recommended First Service | Confidence | Recommended Scope |
| --- | --- | --- | --- | --- |
${portfolio.highestOpportunityCompanies.map((pack) => `| ${pack.companyName} | ${pack.opportunityScore}/100 | ${pack.recommendedFirstService} | ${pack.confidence} | ${pack.recommendedAuditScopes[0]?.focusAreas.join('; ') ?? 'Manual review required'} |`).join('\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderAuditDeliveryRoadmap(portfolio: AuditPortfolio): string {
  return `# Audit Delivery Roadmap

${portfolio.highestOpportunityCompanies.map((pack, index) => `## ${index + 1}. ${pack.companyName}

${bullets([
    `Start: ${pack.recommendedFirstService}`,
    `Scope: ${pack.recommendedAuditScopes[0]?.size ?? 'Small Audit'}`,
    `Deliverables: ${pack.recommendedAuditScopes[0]?.expectedDeliverables.join('; ') ?? 'Manual review summary'}`,
    `Upgrade Path: ${pack.upgradePath.join(' -> ')}`,
    `Approval: Daniel approval required before client use.`,
  ])}`).join('\n\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderRetainerOpportunities(portfolio: AuditPortfolio): string {
  const ranked = [...portfolio.packs].sort((left, right) => retainerScore(right) - retainerScore(left) || left.companyName.localeCompare(right.companyName));

  return `# Retainer Opportunities

${ranked.map((pack, index) => `## ${index + 1}. ${pack.companyName}

${bullets([
    `Score: ${retainerScore(pack)}`,
    `Reason: ${retainerReason(pack)}`,
    `Recommended Next Action: ${pack.opportunity.recommendedNextAction}`,
  ])}`).join('\n\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

function buildPotentialRisks(opportunity: AuditPack['opportunity']): AuditPackRisk[] {
  const confidence = confidenceLabel(opportunity.confidenceScore);

  return [
    {
      type: 'Potential QA Risk',
      risk: opportunity.bestAuditAngle.angle,
      evidence: `Derived from Opportunity Engine audit angle in output/opportunities/${opportunity.companyId}-opportunity.md.`,
      confidence,
      recommendation: 'Validate the workflow manually before presenting it as a client-facing finding.',
    },
    {
      type: 'Potential Test Coverage Gap',
      risk: opportunity.bestAutomationOpportunity.title,
      evidence: `Derived from Opportunity Engine automation coverage: ${opportunity.bestAutomationOpportunity.coverage.join(', ')}.`,
      confidence,
      recommendation: 'Use a QA Audit to confirm public flow availability and define Playwright coverage.',
    },
    {
      type: 'Potential Release Risk',
      risk: `${opportunity.opportunityCategory} release confidence opportunity`,
      evidence: `Opportunity category ${opportunity.opportunityCategory} and confidence score ${opportunity.confidenceScore}/100 are recorded locally.`,
      confidence,
      recommendation: 'Review release-sensitive flows and confirm risk with Daniel before outreach or proposal use.',
    },
    ...buildLighthousePotentialRisks(opportunity.companyId),
  ];
}

function buildSourceFiles(opportunity: AuditPack['opportunity']): AuditSourceFile[] {
  const files = [
    ['Opportunity Engine', `output/opportunities/${opportunity.companyId}-opportunity.md`],
    ['Contact Research', `output/contact-research/${opportunity.companyId}-contact-research.md`],
    ['Channel Research', `output/channel-research/${opportunity.companyId}.md`],
    ['Pain Intelligence', `output/pain-research/${opportunity.companyId}-pain-research.md`],
    ['Site Intelligence', `output/site-intelligence/${opportunity.companyId}-site-intelligence.md`],
    ['Lighthouse Evidence', `output/lighthouse/${opportunity.companyId}-lighthouse.md`],
  ] as const;

  return files.map(([label, relativePath]) => ({
    label,
    path: relativePath,
    available: fs.existsSync(path.join(process.cwd(), relativePath)),
  }));
}

function buildLighthousePotentialRisks(companyId: string): AuditPackRisk[] {
  const report = loadLighthouseReport(companyId);
  if (!report) return [];

  return report.opportunities.map((opportunity) => ({
    type: opportunity.type,
    risk: opportunity.description,
    evidence: `${opportunity.evidence} Source: ${report.markdownReportPath}.`,
    confidence: opportunity.confidence,
    recommendation: 'Validate with manual review before presenting externally; frame as a potential quality opportunity, not a confirmed issue.',
  }));
}

function buildObservedOpportunities(opportunity: AuditPack['opportunity']): ObservedOpportunityGroup[] {
  const text = [
    opportunity.bestAuditAngle.angle,
    opportunity.bestAutomationOpportunity.title,
    ...opportunity.bestAutomationOpportunity.coverage,
    opportunity.opportunityCategory,
  ].join(' ').toLowerCase();

  return [
    opportunityGroup('Booking Opportunities', text, ['booking', 'scheduling'], opportunity),
    opportunityGroup('Onboarding Opportunities', text, ['onboarding', 'signup'], opportunity),
    opportunityGroup('Payment Opportunities', text, ['checkout', 'payment'], opportunity),
    opportunityGroup('Release Confidence Opportunities', text, ['release', 'regression'], opportunity),
    opportunityGroup('Mobile Opportunities', text, ['mobile'], opportunity),
    {
      title: 'Automation Opportunities',
      opportunities: [
        opportunity.bestAutomationOpportunity.title,
        ...opportunity.bestAutomationOpportunity.coverage.map((item) => `Coverage: ${item}`),
      ],
    },
  ].filter((group) => group.opportunities.length > 0);
}

function opportunityGroup(title: string, text: string, keywords: string[], opportunity: AuditPack['opportunity']): ObservedOpportunityGroup {
  if (!keywords.some((keyword) => text.includes(keyword))) {
    return { title, opportunities: [] };
  }

  return {
    title,
    opportunities: [
      `${opportunity.bestAuditAngle.angle}`,
      `Supported by local Opportunity Engine category: ${opportunity.opportunityCategory}`,
    ],
  };
}

function buildPlaywrightOpportunities(opportunity: AuditPack['opportunity']): PlaywrightSuiteRecommendation[] {
  return [
    {
      suite: 'Suggested Smoke Suite',
      focus: opportunity.bestAutomationOpportunity.title,
      coverage: opportunity.bestAutomationOpportunity.coverage,
    },
    {
      suite: 'Suggested Regression Suite',
      focus: `${opportunity.opportunityCategory} regression coverage`,
      coverage: opportunity.bestAutomationOpportunity.coverage.map((item) => `${item} regression check`),
    },
    {
      suite: 'Suggested Critical Path Coverage',
      focus: opportunity.bestAuditAngle.angle,
      coverage: opportunity.bestAuditAngle.recommendedScope,
    },
  ];
}

function buildAuditScopes(opportunity: AuditPack['opportunity']): AuditScopeOption[] {
  const baseScope = opportunity.bestAuditAngle.recommendedScope;

  return [
    {
      size: 'Small Audit',
      focusAreas: baseScope.slice(0, 3),
      expectedDeliverables: [
        'Executive QA opportunity summary',
        'Potential QA risk list',
        'Starter Playwright coverage recommendation',
        'Approval checklist',
      ],
      complexity: 'Low',
    },
    {
      size: 'Medium Audit',
      focusAreas: baseScope,
      expectedDeliverables: [
        'Executive QA opportunity summary',
        'Potential QA risk and UX opportunity map',
        'Suggested smoke and regression coverage',
        'Starter engagement recommendation',
        'Retainer path recommendation',
      ],
      complexity: 'Medium',
    },
    {
      size: 'Large Audit',
      focusAreas: [
        ...baseScope,
        'cross-browser smoke candidates',
        'reporting and evidence package readiness',
      ],
      expectedDeliverables: [
        'Executive QA opportunity summary',
        'Potential QA risk and UX opportunity map',
        'Critical path coverage model',
        'Playwright starter backlog',
        'Retainer readiness path',
        'Client-ready approval checklist',
      ],
      complexity: 'High',
    },
  ];
}

function buildUpgradePath(score: number): string[] {
  if (score < 70) {
    return [
      'QA Audit',
      'Complete missing research and validate evidence',
      'Playwright Starter Pack only if audit confirms fit',
      'QA Automation Retainer only after repeatable QA need is confirmed',
    ];
  }

  return [
    'QA Audit',
    'Playwright Starter Pack',
    'QA Automation Retainer',
  ];
}

function buildDiscoveryQuestions(opportunity: AuditPack['opportunity']): string[] {
  return [
    `Product: Which ${opportunity.opportunityCategory} workflows create the most customer friction today?`,
    `Engineering: How does the team maintain release confidence around ${opportunity.bestAuditAngle.angle}?`,
    'QA: What automated coverage exists today, and where is it unreliable or missing?',
    'Release Process: Which release paths need the most manual regression checking?',
    `Risk Areas: If Daniel reviewed ${opportunity.bestAutomationOpportunity.title}, what would make the audit useful within the first engagement?`,
  ];
}

function approvalChecklist(): string[] {
  return [
    'Confirm findings',
    'Confirm evidence',
    'Confirm contact',
    'Confirm scope',
    'Confirm pricing',
    'Daniel approval required',
  ];
}

function retainerScore(pack: AuditPack): number {
  const confidence = pack.opportunityScore;
  const contactBonus = pack.opportunity.bestContact.researchRequired ? 0 : 10;
  const retainerReadyBonus = pack.opportunityScore >= 80 ? 10 : 0;
  return confidence + contactBonus + retainerReadyBonus;
}

function retainerReason(pack: AuditPack): string {
  if (pack.opportunityScore < 70) {
    return 'Retainer path is not ready because research or contact coverage is incomplete.';
  }

  return 'Retainer path may be realistic after a paid QA Audit validates recurring workflow risk and Playwright coverage need.';
}

function confidenceLabel(score: number): 'High' | 'Medium' | 'Low' {
  if (score >= 85) return 'High';
  if (score >= 70) return 'Medium';
  return 'Low';
}

function renderRisk(risk: AuditPackRisk): string {
  return `### ${risk.type}

${bullets([
    `Risk: ${risk.risk}`,
    `Evidence: ${risk.evidence}`,
    `Confidence: ${risk.confidence}`,
    `Recommendation: ${risk.recommendation}`,
  ])}`;
}

function renderOpportunityGroup(group: ObservedOpportunityGroup): string {
  return `### ${group.title}

${bullets(group.opportunities)}`;
}

function renderPlaywrightSuite(suite: PlaywrightSuiteRecommendation): string {
  return `### ${suite.suite}

${bullets([
    `Focus: ${suite.focus}`,
    'Coverage:',
  ])}
${suite.coverage.map((item) => `  - ${item}`).join('\n')}`;
}

function renderAuditScope(scope: AuditScopeOption): string {
  return `### ${scope.size}

${bullets([
    `Focus Areas: ${scope.focusAreas.join(', ')}`,
    `Expected Deliverables: ${scope.expectedDeliverables.join(', ')}`,
    `Complexity: ${scope.complexity}`,
  ])}`;
}

function findTarget(company: string): AuditPackTarget | undefined {
  const normalized = normalize(company);
  return loadAuditPackTargets().find((target) => matchesNormalized(normalize(target.companyId), normalized) || matchesNormalized(normalize(target.companyName), normalized));
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function safetyNotes(): string[] {
  return [
    'QA Audit Pack only. This is not a consulting report, proposal, invoice, contract, or payment instruction.',
    'Do not invent bugs, complaints, vulnerabilities, incidents, customer feedback, findings, or metrics.',
    'Use approved pricing only: QA Audit ($199-$500), Playwright Starter Pack ($900-$1500), QA Automation Retainer ($1500-$3000/month).',
    'All outputs remain evidence-based, opportunity-based, and human-approved.',
    'Lighthouse evidence, when present, is public-homepage quality evidence only and is not vulnerability scanning.',
    'Daniel approval is required before client use.',
  ];
}

function numbered(items: string[]): string {
  if (items.length === 0) return '1. No audit packs available.';
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

function bullets(items: string[]): string {
  if (items.length === 0) return '- Not enough evidence yet.';
  return items.map((item) => `- ${item}`).join('\n');
}

function matchesNormalized(left: string, right: string): boolean {
  return left === right || left.includes(right) || right.includes(left);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}
