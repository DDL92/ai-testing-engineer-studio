import fs = require('fs');
import path = require('path');
import { SiteIntelligenceRecord, SiteSummary } from './types';

const siteIntelligencePath = path.join(process.cwd(), 'data', 'site-intelligence', 'site-intelligence.json');
const outputDir = path.join(process.cwd(), 'output', 'site-intelligence');

export function loadSiteIntelligence(): SiteIntelligenceRecord[] {
  const raw = fs.readFileSync(siteIntelligencePath, 'utf8').trim();
  if (!raw) return [];
  return JSON.parse(raw) as SiteIntelligenceRecord[];
}

export function findSiteIntelligence(company: string): SiteIntelligenceRecord | undefined {
  const normalized = normalize(company);
  return loadSiteIntelligence().find((record) => {
    return matchesNormalized(normalize(record.companyId), normalized)
      || matchesNormalized(normalize(record.companyName), normalized);
  });
}

export function withRequestedUrl(record: SiteIntelligenceRecord, requestedUrl?: string): SiteIntelligenceRecord {
  if (!requestedUrl || requestedUrl === record.url) return record;

  return {
    ...record,
    observations: [
      ...record.observations,
      {
        observation: 'Requested URL differs from stored local URL.',
        category: 'metadata',
        evidence: `Command requested ${requestedUrl}; local site-intelligence record stores ${record.url}. No network validation was performed.`,
        confidence: 'high',
        status: 'Not enough evidence',
        manualReviewRequired: true,
      },
    ],
  };
}

export function buildSiteSummary(records: SiteIntelligenceRecord[] = loadSiteIntelligence()): SiteSummary {
  return {
    totalCompanies: records.length,
    totalFindings: records.reduce((total, record) => total + record.findings.length, 0),
    totalUxOpportunities: records.reduce((total, record) => total + record.uxOpportunities.length, 0),
    totalAutomationOpportunities: records.reduce((total, record) => total + record.automationOpportunities.length, 0),
    categoryCounts: countBy(records.flatMap((record) => record.findings.map((finding) => finding.category))),
    records,
  };
}

export function writeSiteIntelligenceReport(record: SiteIntelligenceRecord): string {
  const outputPath = path.join(outputDir, `${record.companyId}-site-intelligence.md`);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, renderSiteIntelligenceReport(record), 'utf8');
  return outputPath;
}

export function writeSiteSummaryReports(records: SiteIntelligenceRecord[] = loadSiteIntelligence()): string[] {
  const summary = buildSiteSummary(records);
  const outputs = [
    ['qa-findings.md', renderQaFindings(records)],
    ['ux-opportunities.md', renderUxOpportunities(records)],
    ['automation-opportunities.md', renderAutomationOpportunities(records)],
    ['audit-recommendations.md', renderAuditRecommendations(records)],
    ['site-summary.md', renderSiteSummary(summary)],
  ] as const;

  fs.mkdirSync(outputDir, { recursive: true });

  return outputs.map(([fileName, content]) => {
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, content, 'utf8');
    return outputPath;
  });
}

export function renderSiteIntelligenceReport(record: SiteIntelligenceRecord): string {
  return `# Site Intelligence: ${record.companyName}

## Company

${bullets([
    `Name: ${record.companyName}`,
    `URL: ${record.url}`,
    `Industry: ${record.industry}`,
    `Score: ${record.score}/10`,
    `Screenshot Capture: ${record.screenshotCapture}`,
  ])}

## Evidence Scope

${bullets([
    'Source scope: local site-intelligence records, existing approved lead data, channel research, and pain intelligence only.',
    'No browser automation, scraping, security scanning, credential use, login, private data, or outreach sending was performed.',
    'Status: Not enough evidence for live page behavior unless a local observation explicitly records it.',
    'Manual Review Required: Yes for any public website claim beyond stored local data.',
  ])}

## Observations

${record.observations.map(renderObservation).join('\n\n')}

## QA Findings

${record.findings.map(renderFinding).join('\n\n')}

## UX Opportunities

${record.uxOpportunities.map(renderUxOpportunity).join('\n\n')}

## Automation Opportunities

${record.automationOpportunities.map(renderAutomationOpportunity).join('\n\n')}

## Audit Recommendations

${record.auditRecommendations.map(renderAuditRecommendation).join('\n\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderQaFindings(records: SiteIntelligenceRecord[]): string {
  return `# Website QA Findings

These are potential QA findings from local evidence only. They are not confirmed bugs, outages, vulnerabilities, or security issues.

${records.map((record) => `## ${record.companyName}

${record.findings.map(renderFinding).join('\n\n')}`).join('\n\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderUxOpportunities(records: SiteIntelligenceRecord[]): string {
  return `# UX Opportunities

${records.map((record) => `## ${record.companyName}

${record.uxOpportunities.map(renderUxOpportunity).join('\n\n')}`).join('\n\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderAutomationOpportunities(records: SiteIntelligenceRecord[]): string {
  return `# Automation Opportunities

${records.map((record) => `## ${record.companyName}

${record.automationOpportunities.map(renderAutomationOpportunity).join('\n\n')}`).join('\n\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderAuditRecommendations(records: SiteIntelligenceRecord[]): string {
  return `# Audit Recommendations

${records.map((record) => `## ${record.companyName}

${record.auditRecommendations.map(renderAuditRecommendation).join('\n\n')}`).join('\n\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderSiteSummary(summary: SiteSummary): string {
  return `# Site Intelligence Summary

## Totals

${bullets([
    `Companies: ${summary.totalCompanies}`,
    `Potential findings: ${summary.totalFindings}`,
    `UX opportunities: ${summary.totalUxOpportunities}`,
    `Automation opportunities: ${summary.totalAutomationOpportunities}`,
  ])}

## Finding Categories

${renderCounts(summary.categoryCounts)}

## Screenshot Capture

- Screenshot Capture: Not Available
- Reason: No existing site-intelligence screenshot infrastructure was used or added in this sprint.

## Recommended Next Action

- Manually review one public website flow before turning any potential finding into a client-facing claim or Playwright implementation plan.

## Safety Notes

${bullets(safetyNotes())}
`;
}

function renderObservation(observation: SiteIntelligenceRecord['observations'][number]): string {
  return `### Observation

${bullets([
    `Observation: ${observation.observation}`,
    `Category: ${observation.category}`,
    `Evidence: ${observation.evidence}`,
    `Confidence: ${observation.confidence}`,
    `Status: ${observation.status}`,
    `Manual Review Required: ${observation.manualReviewRequired ? 'Yes' : 'No'}`,
  ])}`;
}

function renderFinding(finding: SiteIntelligenceRecord['findings'][number]): string {
  return `### ${finding.riskType}

${bullets([
    `Finding: ${finding.finding}`,
    `Category: ${finding.category}`,
    `Evidence: ${finding.evidence}`,
    `Confidence: ${finding.confidence}`,
    `Recommendation: ${finding.recommendation}`,
  ])}`;
}

function renderUxOpportunity(opportunity: SiteIntelligenceRecord['uxOpportunities'][number]): string {
  return `### UX Opportunity

${bullets([
    `Opportunity: ${opportunity.opportunity}`,
    `Category: ${opportunity.category}`,
    `Evidence: ${opportunity.evidence}`,
    `Confidence: ${opportunity.confidence}`,
    `Recommendation: ${opportunity.recommendation}`,
  ])}`;
}

function renderAutomationOpportunity(opportunity: SiteIntelligenceRecord['automationOpportunities'][number]): string {
  return `### Playwright Opportunity

${bullets([
    `Observation: ${opportunity.observation}`,
    `Playwright Opportunity: ${opportunity.opportunity}`,
    'Coverage:',
  ])}
${opportunity.coverage.map((item) => `  - ${item}`).join('\n')}`;
}

function renderAuditRecommendation(recommendation: SiteIntelligenceRecord['auditRecommendations'][number]): string {
  return `### Recommended QA Audit

${bullets([
    `Focus: ${recommendation.focus}`,
    'Review:',
  ])}
${recommendation.review.map((item) => `  - ${item}`).join('\n')}`;
}

function safetyNotes(): string[] {
  return [
    'This is website QA intelligence, not penetration testing, vulnerability scanning, or security testing.',
    'Do not claim confirmed bugs, outages, vulnerabilities, exploits, breaches, production failures, or security issues.',
    'No browser automation, scraping behind login, credentials, private data, login, or outreach sending is used.',
    'Do not invent bugs, complaints, vulnerabilities, incidents, or customer findings.',
    'Human approval is required before using any finding, audit recommendation, or outreach intelligence externally.',
  ];
}

function renderCounts(counts: Record<string, number>): string {
  const entries = Object.entries(counts).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  if (entries.length === 0) return '- None recorded.';
  return bullets(entries.map(([key, count]) => `${key}: ${count}`));
}

function countBy(values: string[]): Record<string, number> {
  return values.reduce<Record<string, number>>((counts, value) => {
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function bullets(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function matchesNormalized(left: string, right: string): boolean {
  return left === right || left.includes(right) || right.includes(left);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}
