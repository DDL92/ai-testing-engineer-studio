import fs = require('fs');
import path = require('path');
import { buildClientAuditReport } from '../clientAuditReports/clientAuditReportRules';
import { ApprovedFirstOffer } from '../opportunityEngine/types';
import {
  EngagementOption,
  ProposalBusinessContext,
  ProposalPackage,
  ProposalPortfolio,
  ProposalScope,
  ProposalTarget,
} from './types';
import { generateProposalPdf } from './pdfProposalGenerator';

const targetsPath = path.join(process.cwd(), 'data', 'proposals', 'proposals.json');
const outputDir = path.join(process.cwd(), 'output', 'proposals');

const approvedOffers: ApprovedFirstOffer[] = [
  'QA Audit ($199-$500)',
  'Playwright Starter Pack ($900-$1500)',
  'QA Automation Retainer ($1500-$3000/month)',
];

const disclaimer = [
  'This proposal is based on publicly observable information and collected evidence.',
  'Potential opportunities are observations only.',
  'No bugs, vulnerabilities, incidents, outages, or customer-impact statements should be inferred unless independently validated.',
];

export function loadProposalTargets(): ProposalTarget[] {
  return readJson<ProposalTarget[]>(targetsPath, []);
}

export function buildProposal(company: string): ProposalPackage {
  const target = findTarget(company);
  if (!target) {
    throw new Error(`Company not found in data/proposals/proposals.json: ${company}`);
  }

  const clientAudit = buildClientAuditReport(target.companyName);
  const unified = clientAudit.sourceReport;
  const artifacts = artifactPaths(unified.companyId);

  if (!approvedOffers.includes(clientAudit.recommendedService)) {
    throw new Error(`Unapproved pricing option detected for ${clientAudit.companyName}: ${clientAudit.recommendedService}`);
  }

  return {
    companyId: unified.companyId,
    companyName: unified.companyName,
    generatedAt: new Date().toISOString(),
    preparedBy: 'AI Testing Engineer Studio',
    preparedFor: 'Manual Review',
    opportunityScore: unified.opportunityScore,
    evidenceReadiness: unified.evidenceReadiness,
    recommendedEngagement: clientAudit.recommendedService,
    recommendedNextAction: clientAudit.recommendedNextAction,
    businessContext: buildBusinessContext(clientAudit),
    scopeOfWork: buildScopeOfWork(clientAudit),
    engagementOptions: buildEngagementOptions(clientAudit.recommendedService),
    retainerPath: ['QA Audit', 'Starter Pack', 'Retainer'],
    clientSuccessCriteria: [
      'Clear Visibility into public QA risk and automation opportunities',
      'Reduced Release Risk through agreed smoke and regression coverage',
      'Improved Confidence before client-facing releases',
      'Repeatable QA Process supported by evidence and reporting',
    ],
    approvalChecklist: [
      'Evidence Reviewed',
      'Pricing Reviewed',
      'Scope Reviewed',
      'Proposal Reviewed',
      'Daniel Approval Required',
    ],
    disclaimer,
    sourceAuditReport: clientAudit,
    artifacts,
  };
}

export function buildProposalPortfolio(): ProposalPortfolio {
  const proposals = loadProposalTargets()
    .filter((target) => target.status === 'active')
    .map((target) => buildProposal(target.companyName));
  const ranked = [...proposals].sort(sortProposalPriority);

  return {
    generatedAt: new Date().toISOString(),
    proposals,
    bestProposalCandidate: ranked[0],
    bestAuditCandidate: ranked.find((proposal) => proposal.recommendedEngagement === 'QA Audit ($199-$500)') ?? ranked[0],
    bestStarterPackCandidate: ranked.find((proposal) => proposal.recommendedEngagement === 'Playwright Starter Pack ($900-$1500)') ?? ranked[0],
    bestRetainerCandidate: [...proposals].sort(sortRetainerPriority)[0],
    researchNeeded: proposals.filter((proposal) => proposal.sourceAuditReport.sourceReport.researchNeeded),
  };
}

export function writeProposal(proposal: ProposalPackage): ProposalPackage['artifacts'] {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(proposal.artifacts.markdownPath, renderProposalMarkdown(proposal), 'utf8');
  generateProposalPdf(proposal, proposal.artifacts.pdfPath);
  return proposal.artifacts;
}

export function writeProposalPortfolio(portfolio: ProposalPortfolio): string[] {
  fs.mkdirSync(outputDir, { recursive: true });
  const outputs = [
    ['proposal-summary.md', renderProposalSummary(portfolio)],
    ['proposal-priorities.md', renderProposalPriorities(portfolio)],
    ['retainer-candidates.md', renderRetainerCandidates(portfolio)],
  ] as const;

  return outputs.map(([fileName, content]) => {
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, content, 'utf8');
    return outputPath;
  });
}

export function renderProposalMarkdown(proposal: ProposalPackage): string {
  return `# ${proposal.companyName}

QA Automation Proposal

Prepared By:
AI Testing Engineer Studio

Prepared For:
Manual Review

Date:
${formatDate(proposal.generatedAt)}

## Executive Summary

${bullets([
    `Company: ${proposal.companyName}`,
    `Opportunity Score: ${proposal.opportunityScore}/100`,
    `Evidence Readiness: ${proposal.evidenceReadiness}/100`,
    `Recommended Engagement: ${proposal.recommendedEngagement}`,
    `Recommended Next Action: ${proposal.recommendedNextAction}`,
  ])}

## Business Context

${bullets([
    `Industry: ${proposal.businessContext.industry}`,
    `Product Type: ${proposal.businessContext.productType}`,
    `Observed Opportunity Areas: ${proposal.businessContext.observedOpportunityAreas.join(', ')}`,
    `Potential Risk Areas: ${proposal.businessContext.potentialRiskAreas.join(', ')}`,
  ])}

## Recommended Engagement

- ${proposal.recommendedEngagement}

## Scope of Work

### Objectives

${bullets(proposal.scopeOfWork.objectives)}

### In Scope

${bullets(proposal.scopeOfWork.inScope)}

### Out of Scope

${bullets(proposal.scopeOfWork.outOfScope)}

### Deliverables

${bullets(proposal.scopeOfWork.deliverables)}

## Engagement Options

${proposal.engagementOptions.map((option) => `### ${option.label}

${bullets([
    option.name,
    `Best For: ${option.bestFor}`,
    `Recommended: ${option.recommended ? 'Yes' : 'No'}`,
    `Deliverables: ${option.deliverables.join(', ')}`,
  ])}`).join('\n\n')}

## Retainer Path

${proposal.retainerPath.map((step, index) => `${index + 1}. ${step}`).join('\n')}

## Client Success Criteria

${bullets(proposal.clientSuccessCriteria)}

## Approval Checklist

${proposal.approvalChecklist.map((item) => `- [ ] ${item}`).join('\n')}

## Disclaimer

${bullets(proposal.disclaimer)}
`;
}

export function renderProposalSummary(portfolio: ProposalPortfolio): string {
  return `# Proposal Portfolio Summary

Generated: ${portfolio.generatedAt}

## Best Proposal Candidate

${portfolio.bestProposalCandidate ? proposalBullets(portfolio.bestProposalCandidate) : '- No proposal candidate available.'}

## Best Audit Candidate

${portfolio.bestAuditCandidate ? proposalBullets(portfolio.bestAuditCandidate) : '- No audit candidate available.'}

## Best Starter Pack Candidate

${portfolio.bestStarterPackCandidate ? proposalBullets(portfolio.bestStarterPackCandidate) : '- No starter pack candidate available.'}

## Best Retainer Candidate

${portfolio.bestRetainerCandidate ? proposalBullets(portfolio.bestRetainerCandidate) : '- No retainer candidate available.'}

## Research Needed

${portfolio.researchNeeded.length > 0 ? bullets(portfolio.researchNeeded.map((proposal) => `${proposal.companyName}: ${proposal.recommendedNextAction}`)) : '- No research gaps recorded.'}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderProposalPriorities(portfolio: ProposalPortfolio): string {
  const ranked = [...portfolio.proposals].sort(sortProposalPriority);

  return `# Proposal Priorities

| Company | Opportunity Score | Evidence Readiness | Recommended Engagement | Proposal | PDF | Research Needed |
| --- | --- | --- | --- | --- | --- | --- |
${ranked.map((proposal) => `| ${proposal.companyName} | ${proposal.opportunityScore}/100 | ${proposal.evidenceReadiness}/100 | ${proposal.recommendedEngagement} | ${exists(proposal.artifacts.markdownPath)} | ${exists(proposal.artifacts.pdfPath)} | ${proposal.sourceAuditReport.sourceReport.researchNeeded ? 'Yes' : 'No'} |`).join('\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderRetainerCandidates(portfolio: ProposalPortfolio): string {
  const ranked = [...portfolio.proposals].sort(sortRetainerPriority);

  return `# Retainer Candidates

${ranked.map((proposal, index) => `## ${index + 1}. ${proposal.companyName}

${bullets([
    `Recommended Engagement: ${proposal.recommendedEngagement}`,
    `Opportunity Score: ${proposal.opportunityScore}/100`,
    `Evidence Readiness: ${proposal.evidenceReadiness}/100`,
    `Retainer Path: ${proposal.retainerPath.join(' -> ')}`,
    `Research Needed: ${proposal.sourceAuditReport.sourceReport.researchNeeded ? 'Yes' : 'No'}`,
  ])}`).join('\n\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

function buildBusinessContext(clientAudit: ReturnType<typeof buildClientAuditReport>): ProposalBusinessContext {
  const unified = clientAudit.sourceReport;
  const opportunityAreas = unified.businessContext.observedOpportunityAreas.slice(0, 8);
  const riskAreas = unique([
    ...clientAudit.potentialOpportunities.map((opportunity) => opportunity.description),
    ...unified.recommendedPlaywrightCoverage.criticalPathCoverage,
  ]).slice(0, 8);

  return {
    industry: unified.businessContext.industry,
    productType: unified.businessContext.productType,
    observedOpportunityAreas: opportunityAreas.length > 0 ? opportunityAreas : ['Manual review required'],
    potentialRiskAreas: riskAreas.length > 0 ? riskAreas : ['Manual review required'],
  };
}

function buildScopeOfWork(clientAudit: ReturnType<typeof buildClientAuditReport>): ProposalScope {
  return {
    objectives: [
      'Review public evidence and current audit signals before any engagement decision.',
      'Define a bounded QA service path using approved Studio offers only.',
      'Create a practical path from audit evidence to repeatable Playwright coverage.',
    ],
    inScope: [
      'QA Audit Report review',
      'Playwright Smoke Coverage planning',
      'Release Confidence Review',
      'Evidence Package review',
      'Automation Recommendations based on current Studio evidence',
    ],
    outOfScope: [
      'Contracts, invoices, payment requests, and proposal sending',
      'Authenticated systems, private production data, account creation, and payment submission',
      'Vulnerability scanning, penetration testing, guaranteed bug discovery, or compliance certification',
      'Any claim not supported by collected evidence and Daniel review',
    ],
    deliverables: buildDeliverables(clientAudit.recommendedService),
  };
}

function buildDeliverables(recommended: ApprovedFirstOffer): string[] {
  const base = [
    'QA Audit Report',
    'Evidence Package',
    'Automation Recommendations',
  ];

  if (recommended === 'QA Audit ($199-$500)') {
    return [...base, 'Release Confidence Review'];
  }

  if (recommended === 'Playwright Starter Pack ($900-$1500)') {
    return [...base, 'Playwright Smoke Coverage', 'Starter regression coverage recommendations'];
  }

  return [...base, 'Playwright Smoke Coverage', 'Recurring QA summary framework', 'Retainer coverage roadmap'];
}

function buildEngagementOptions(recommended: ApprovedFirstOffer): EngagementOption[] {
  return [
    {
      label: 'Option A',
      name: 'QA Audit ($199-$500)',
      bestFor: 'Validating the first evidence-backed QA opportunity before a larger engagement.',
      deliverables: ['QA Audit Report', 'Evidence Package', 'Automation Recommendations'],
      recommended: recommended === 'QA Audit ($199-$500)',
    },
    {
      label: 'Option B',
      name: 'Playwright Starter Pack ($900-$1500)',
      bestFor: 'Creating the first maintainable smoke suite for approved public or staging flows.',
      deliverables: ['Playwright Smoke Coverage', 'Release Confidence Review', 'Evidence Package'],
      recommended: recommended === 'Playwright Starter Pack ($900-$1500)',
    },
    {
      label: 'Option C',
      name: 'QA Automation Retainer ($1500-$3000/month)',
      bestFor: 'Maintaining and extending QA automation after audit and starter coverage value are validated.',
      deliverables: ['Repeatable QA Process', 'Automation Recommendations', 'Recurring evidence review'],
      recommended: recommended === 'QA Automation Retainer ($1500-$3000/month)',
    },
  ];
}

function artifactPaths(companyId: string): ProposalPackage['artifacts'] {
  return {
    markdownPath: path.join(outputDir, `${companyId}-proposal.md`),
    pdfPath: path.join(outputDir, `${companyId}-proposal.pdf`),
  };
}

function findTarget(company: string): ProposalTarget | undefined {
  const normalized = normalize(company);
  return loadProposalTargets().find((target) => matchesNormalized(normalize(target.companyId), normalized) || matchesNormalized(normalize(target.companyName), normalized));
}

function sortProposalPriority(left: ProposalPackage, right: ProposalPackage): number {
  return scoreFor(right) - scoreFor(left)
    || Number(left.sourceAuditReport.sourceReport.researchNeeded) - Number(right.sourceAuditReport.sourceReport.researchNeeded)
    || left.companyName.localeCompare(right.companyName);
}

function sortRetainerPriority(left: ProposalPackage, right: ProposalPackage): number {
  const leftScore = scoreFor(left) + (left.recommendedEngagement === 'QA Automation Retainer ($1500-$3000/month)' ? 10 : 0);
  const rightScore = scoreFor(right) + (right.recommendedEngagement === 'QA Automation Retainer ($1500-$3000/month)' ? 10 : 0);
  return rightScore - leftScore || left.companyName.localeCompare(right.companyName);
}

function scoreFor(proposal: ProposalPackage): number {
  return Math.round((proposal.opportunityScore + proposal.evidenceReadiness) / 2);
}

function proposalBullets(proposal: ProposalPackage): string {
  return bullets([
    `Company: ${proposal.companyName}`,
    `Opportunity Score: ${proposal.opportunityScore}/100`,
    `Evidence Readiness: ${proposal.evidenceReadiness}/100`,
    `Recommended Engagement: ${proposal.recommendedEngagement}`,
    `Research Needed: ${proposal.sourceAuditReport.sourceReport.researchNeeded ? 'Yes' : 'No'}`,
    `Recommended Next Action: ${proposal.recommendedNextAction}`,
  ]);
}

function exists(filePath: string): string {
  return fs.existsSync(filePath) ? 'Generated' : 'Missing';
}

function safetyNotes(): string[] {
  return [
    'Proposal and SOW package only. This is not a contract, invoice, payment request, sending tool, email tool, or outreach tool.',
    'Use approved pricing only.',
    'Potential opportunities are observations only.',
    'Do not invent findings, bugs, vulnerabilities, incidents, outages, customer quotes, or metrics.',
    'Daniel approval is required before external use.',
  ];
}

function formatDate(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
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
