import fs = require('fs');
import path = require('path');
import { PainResearchRecord, PainResearchSummary } from './types';

const painResearchPath = path.join(process.cwd(), 'data', 'pain-intelligence', 'pain-research.json');
const outputDir = path.join(process.cwd(), 'output', 'pain-research');

export function loadPainResearch(): PainResearchRecord[] {
  const raw = fs.readFileSync(painResearchPath, 'utf8').trim();
  if (!raw) return [];
  return JSON.parse(raw) as PainResearchRecord[];
}

export function findPainResearch(company: string): PainResearchRecord | undefined {
  const normalized = normalize(company);
  return loadPainResearch().find((record) => {
    return matchesNormalized(normalize(record.companyId), normalized)
      || matchesNormalized(normalize(record.companyName), normalized);
  });
}

export function buildPainSummary(records: PainResearchRecord[] = loadPainResearch()): PainResearchSummary {
  return {
    totalCompanies: records.length,
    totalComplaints: records.reduce((total, record) => total + record.complaints.length, 0),
    totalRisks: records.reduce((total, record) => total + record.qaRisks.length, 0),
    totalAutomationOpportunities: records.reduce((total, record) => total + record.automationOpportunities.length, 0),
    categoryCounts: countBy(records.flatMap((record) => record.complaints.map((complaint) => complaint.category))),
    riskCounts: countBy(records.flatMap((record) => record.qaRisks.map((risk) => risk.category))),
    records,
  };
}

export function writePainResearchReport(record: PainResearchRecord): string {
  const outputPath = path.join(outputDir, `${record.companyId}-pain-research.md`);
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, renderPainResearchReport(record), 'utf8');
  return outputPath;
}

export function writePainSummaryReports(records: PainResearchRecord[] = loadPainResearch()): string[] {
  const summary = buildPainSummary(records);
  const outputs = [
    ['customer-complaints.md', renderCustomerComplaints(records)],
    ['qa-risk-map.md', renderQARiskMap(records)],
    ['solution-recommendations.md', renderSolutionRecommendations(records)],
    ['outreach-angles.md', renderOutreachAngles(records)],
    ['pain-summary.md', renderPainSummary(summary)],
  ] as const;

  fs.mkdirSync(outputDir, { recursive: true });

  return outputs.map(([fileName, content]) => {
    const outputPath = path.join(outputDir, fileName);
    fs.writeFileSync(outputPath, content, 'utf8');
    return outputPath;
  });
}

export function renderPainResearchReport(record: PainResearchRecord): string {
  return `# Pain Research: ${record.companyName}

## Evidence Status

${bullets([
    'Source scope: existing approved lead data and local Studio notes only.',
    'Status: Not enough evidence yet for verified customer complaints.',
    'Research Required: Yes.',
    'No review quotes, customer findings, incidents, vulnerabilities, or claims are generated.',
  ])}

## Complaints

${record.complaints.map(renderComplaint).join('\n\n')}

## Patterns

${bullets(record.patterns)}

## QA Risks

${record.qaRisks.map(renderRisk).join('\n\n')}

## Automation Opportunities

${record.automationOpportunities.map(renderAutomationOpportunity).join('\n\n')}

## Audit Angles

${record.auditAngles.map(renderAuditAngle).join('\n\n')}

## Outreach Angles

${record.outreachAngles.map(renderOutreachAngle).join('\n\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderCustomerComplaints(records: PainResearchRecord[]): string {
  return `# Customer Complaint Signals

These are not verified public review findings. They are local lead-data signals that require manual public research before being used externally.

${records.map((record) => `## ${record.companyName}

${record.complaints.map(renderComplaint).join('\n\n')}`).join('\n\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderQARiskMap(records: PainResearchRecord[]): string {
  return `# QA Risk Map

${records.map((record) => `## ${record.companyName}

${record.qaRisks.map(renderRisk).join('\n\n')}`).join('\n\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderSolutionRecommendations(records: PainResearchRecord[]): string {
  return `# Solution Recommendations

${records.map((record) => `## ${record.companyName}

${record.automationOpportunities.map(renderAutomationOpportunity).join('\n\n')}

### Audit Angles

${record.auditAngles.map(renderAuditAngle).join('\n\n')}`).join('\n\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderOutreachAngles(records: PainResearchRecord[]): string {
  return `# Outreach Angles

${records.map((record) => `## ${record.companyName}

${record.outreachAngles.map(renderOutreachAngle).join('\n\n')}`).join('\n\n')}

## Safety Notes

${bullets(safetyNotes())}
`;
}

export function renderPainSummary(summary: PainResearchSummary): string {
  return `# Pain Intelligence Summary

## Totals

${bullets([
    `Companies: ${summary.totalCompanies}`,
    `Complaint signals: ${summary.totalComplaints}`,
    `QA risks: ${summary.totalRisks}`,
    `Automation opportunities: ${summary.totalAutomationOpportunities}`,
  ])}

## Complaint Categories

${renderCounts(summary.categoryCounts)}

## QA Risk Categories

${renderCounts(summary.riskCounts)}

## Highest Priority Review Areas

${bullets(buildHighestPriorityAreas(summary))}

## Recommended Next Action

- Manually review public customer feedback for one selected company before using any pain angle externally. Keep claims as potential QA risks unless verified evidence exists.

## Safety Notes

${bullets(safetyNotes())}
`;
}

function renderComplaint(complaint: PainResearchRecord['complaints'][number]): string {
  return `### Complaint Signal

${bullets([
    `Complaint: ${complaint.summary}`,
    `Category: ${complaint.category}`,
    `Frequency: ${complaint.frequency}`,
    `Business Impact: ${complaint.businessImpact}`,
    `Confidence: ${complaint.confidence}`,
    `Status: ${complaint.status}`,
    `Research Required: ${complaint.researchRequired ? 'Yes' : 'No'}`,
    `Source: ${complaint.source}`,
  ])}`;
}

function renderRisk(risk: PainResearchRecord['qaRisks'][number]): string {
  return `### QA Risk

${bullets([
    `Risk: ${risk.risk}`,
    `Category: ${risk.category}`,
    `Why: ${risk.why}`,
  ])}`;
}

function renderAutomationOpportunity(opportunity: PainResearchRecord['automationOpportunities'][number]): string {
  return `### Playwright Opportunity

${bullets([
    `Opportunity: ${opportunity.title}`,
    'Coverage:',
  ])}
${opportunity.coverage.map((item) => `  - ${item}`).join('\n')}`;
}

function renderAuditAngle(angle: PainResearchRecord['auditAngles'][number]): string {
  return `### QA Audit Angle

${bullets([
    `Focus: ${angle.focus}`,
    'Review:',
  ])}
${angle.review.map((item) => `  - ${item}`).join('\n')}`;
}

function renderOutreachAngle(angle: PainResearchRecord['outreachAngles'][number]): string {
  return `### ${angle.department}

${bullets([
    `Conversation: ${angle.conversation}`,
  ])}`;
}

function buildHighestPriorityAreas(summary: PainResearchSummary): string[] {
  const riskCounts = Object.entries(summary.riskCounts).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  if (riskCounts.length === 0) return ['No risk categories recorded yet.'];

  return riskCounts.slice(0, 5).map(([risk, count]) => `${risk}: ${count} company signal${count === 1 ? '' : 's'}`);
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

function safetyNotes(): string[] {
  return [
    'This is customer pain intelligence, not a security scanner or vulnerability scanner.',
    'Local-only: no scraping, browser automation, APIs, credentials, external databases, or paid services.',
    'Do not present potential pain signals as verified customer complaints without manual evidence.',
    'Do not invent review quotes, customer findings, incidents, vulnerabilities, or platform failures.',
    'Human approval is required before using any audit angle or outreach angle externally.',
  ];
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
