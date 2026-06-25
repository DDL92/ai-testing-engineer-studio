import fs = require('fs');
import path = require('path');
import { LeadRecord, LeadScoreBreakdown, LeadSourceType, LeadVertical } from './types';

interface DailyLead {
  id: string;
  vertical: LeadVertical;
  nameOrHandle: string;
  sourceUrl: string;
  sourceType: LeadSourceType;
  location: string;
  intentSummary: string;
  requestedService: string;
  dateSignal: string | null;
  budgetSignal: string | null;
  urgency: 'low' | 'medium' | 'high';
  score: number;
  scoreBreakdown: LeadScoreBreakdown;
  salesAngle: string;
  suggestedFirstMessage: string;
  riskFlags: string[];
  status: LeadRecord['status'] | 'needs_review';
  createdAt: string;
  updatedAt: string;
  rawSignalId?: string;
  contactHint?: string | null;
  sourceName?: string;
}

const normalizedPath = path.join(process.cwd(), 'output', 'lead-discovery', 'normalized-leads.json');
const samplePath = path.join(process.cwd(), 'data', 'lead-discovery', 'sample-leads.json');
const dailyDir = path.join(process.cwd(), 'output', 'lead-discovery', 'daily');

const outputPaths = {
  summaryMarkdown: path.join(dailyDir, 'lead-pack-summary.md'),
  summaryCsv: path.join(dailyDir, 'lead-pack-summary.csv'),
  topLeads: path.join(dailyDir, 'top-leads.md'),
  reviewNeeded: path.join(dailyDir, 'review-needed.md'),
  deliveryReady: path.join(dailyDir, 'delivery-ready-pack.md'),
};

export interface DailyLeadPackResult {
  generatedAt: string;
  sourcePath: string;
  totalLeads: number;
  includedLeads: number;
  reviewCount: number;
  topVerticals: Array<{ vertical: LeadVertical; count: number }>;
  filesGenerated: string[];
}

export function generateDailyLeadPack(now = new Date()): DailyLeadPackResult {
  const generatedAt = now.toISOString();
  const { leads, sourcePath } = readLeadSource();
  const sorted = [...leads].sort((left, right) => right.score - left.score);
  const included = sorted.filter((lead) => lead.status === 'needs_review' || lead.status === 'qualified');
  const grouped = groupByVertical(included);

  fs.mkdirSync(dailyDir, { recursive: true });
  fs.writeFileSync(outputPaths.summaryMarkdown, renderSummaryMarkdown(included, grouped, generatedAt, sourcePath), 'utf8');
  fs.writeFileSync(outputPaths.summaryCsv, renderSummaryCsv(included), 'utf8');
  fs.writeFileSync(outputPaths.topLeads, renderTopLeads(sorted.slice(0, 10), generatedAt), 'utf8');
  fs.writeFileSync(outputPaths.reviewNeeded, renderReviewNeeded(sorted, generatedAt), 'utf8');
  fs.writeFileSync(outputPaths.deliveryReady, renderDeliveryReady(included, generatedAt), 'utf8');

  return {
    generatedAt,
    sourcePath,
    totalLeads: leads.length,
    includedLeads: included.length,
    reviewCount: sorted.filter(needsReview).length,
    topVerticals: topVerticals(grouped),
    filesGenerated: Object.values(outputPaths).map((filePath) => path.relative(process.cwd(), filePath)),
  };
}

function readLeadSource(): { leads: DailyLead[]; sourcePath: string } {
  if (fs.existsSync(normalizedPath)) {
    return {
      leads: JSON.parse(fs.readFileSync(normalizedPath, 'utf8')) as DailyLead[],
      sourcePath: normalizedPath,
    };
  }
  return {
    leads: (JSON.parse(fs.readFileSync(samplePath, 'utf8')) as LeadRecord[]).map((lead) => ({
      ...lead,
      status: lead.status === 'needs_human_review' ? 'needs_review' : lead.status,
    })),
    sourcePath: samplePath,
  };
}

function renderSummaryMarkdown(
  leads: DailyLead[],
  grouped: Record<LeadVertical, DailyLead[]>,
  generatedAt: string,
  sourcePath: string,
): string {
  const rows = leads.map((lead) => (
    `| ${cell(lead.nameOrHandle)} | ${cell(lead.location)} | ${cell(lead.intentSummary)} | ${cell(lead.budgetSignal ?? 'Not supplied')} | ${cell(lead.dateSignal ?? 'Not supplied')} | ${cell(lead.requestedService)} | ${cell(contactValue(lead))} | ${cell(sourceValue(lead))} | ${lead.score.toFixed(1)} | ${cell(scoreReason(lead))} | ${cell(lead.salesAngle)} | ${cell(lead.suggestedFirstMessage)} |`
  ));

  return `# Daily Lead Pack Summary

Generated: ${generatedAt}

Source data: ${path.relative(process.cwd(), sourcePath)}

## Counts

- Total source leads: ${leads.length}
- Included leads: ${leads.length}
- Human review required: ${leads.filter(needsReview).length}
- Automation boundary: No scraping, network calls, outreach, email, DM, or form submission was performed.

## Leads by Vertical

${Object.entries(grouped).map(([vertical, items]) => `- ${vertical}: ${items.length}`).join('\n')}

## Main Summary

| Name / handle | Country / location | Interest | Estimated budget | Approximate dates | Service type | Email / profile / contact | Source | Score | Score reason | Sales angle | Suggested message |
| --- | --- | --- | --- | --- | --- | --- | --- | ---: | --- | --- | --- |
${rows.join('\n')}
`;
}

function renderSummaryCsv(leads: DailyLead[]): string {
  const headers = [
    'Name / handle',
    'Country / location',
    'Interest',
    'Estimated budget',
    'Approximate dates',
    'Service type',
    'Email / profile / contact',
    'Source',
    'Score',
    'Score reason',
    'Sales angle',
    'Suggested message',
  ];
  const rows = leads.map((lead) => [
    lead.nameOrHandle,
    lead.location,
    lead.intentSummary,
    lead.budgetSignal ?? 'Not supplied',
    lead.dateSignal ?? 'Not supplied',
    lead.requestedService,
    contactValue(lead),
    sourceValue(lead),
    lead.score.toFixed(1),
    scoreReason(lead),
    lead.salesAngle,
    lead.suggestedFirstMessage,
  ]);
  return `${headers.map(csvCell).join(',')}\n${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function renderTopLeads(leads: DailyLead[], generatedAt: string): string {
  return `# Top 10 Leads

Generated: ${generatedAt}

${leads.map((lead, index) => renderLeadBlock(lead, index + 1)).join('\n\n')}

Manual review required before delivery or contact. No outreach was performed.
`;
}

function renderReviewNeeded(leads: DailyLead[], generatedAt: string): string {
  const review = leads.filter(needsReview);
  return `# Review Needed

Generated: ${generatedAt}

${review.map((lead, index) => `## ${index + 1}. ${lead.nameOrHandle}

- ID: ${lead.id}
- Vertical: ${lead.vertical}
- Status: ${lead.status}
- Score: ${lead.score.toFixed(1)}
- Risk flags: ${lead.riskFlags.join(', ') || 'None'}
- Missing fields: ${missingFields(lead).join(', ') || 'None'}
- Source: ${sourceValue(lead)}
- Required action: Human must verify source context, fit, contact path, and delivery readiness.`).join('\n\n') || '- No leads require review.'}

No outreach, email, DM, or form submission was performed.
`;
}

function renderDeliveryReady(leads: DailyLead[], generatedAt: string): string {
  return `# Delivery Ready Lead Pack

Generated: ${generatedAt}

Manual review required before client delivery.

This file is a local preparation artifact. It does not authorize contacting leads, sending messages, submitting forms, or delivering client data without human review.

${leads.map((lead, index) => renderLeadBlock(lead, index + 1)).join('\n\n')}
`;
}

function renderLeadBlock(lead: DailyLead, rank: number): string {
  return `## ${rank}. ${lead.nameOrHandle}

- Vertical: ${lead.vertical}
- Location: ${lead.location}
- Interest: ${lead.intentSummary}
- Estimated budget: ${lead.budgetSignal ?? 'Not supplied'}
- Approximate dates: ${lead.dateSignal ?? 'Not supplied'}
- Service type: ${lead.requestedService}
- Contact: ${contactValue(lead)}
- Source: ${sourceValue(lead)}
- Score: ${lead.score.toFixed(1)}
- Score reason: ${scoreReason(lead)}
- Sales angle: ${lead.salesAngle}
- Suggested message: ${lead.suggestedFirstMessage}
- Risk flags: ${lead.riskFlags.join(', ') || 'None'}`;
}

function groupByVertical(leads: DailyLead[]): Record<LeadVertical, DailyLead[]> {
  const groups: Record<LeadVertical, DailyLead[]> = {
    travel_leads: [],
    catering_leads: [],
    wedding_leads: [],
    real_estate_leads: [],
    website_leads: [],
    qa_leads: [],
  };
  for (const lead of leads) groups[lead.vertical].push(lead);
  return groups;
}

function topVerticals(grouped: Record<LeadVertical, DailyLead[]>): Array<{ vertical: LeadVertical; count: number }> {
  return Object.entries(grouped)
    .map(([vertical, leads]) => ({ vertical: vertical as LeadVertical, count: leads.length }))
    .filter((item) => item.count > 0)
    .sort((left, right) => right.count - left.count || left.vertical.localeCompare(right.vertical));
}

function needsReview(lead: DailyLead): boolean {
  return lead.status === 'needs_review' || lead.status === 'needs_human_review' || lead.riskFlags.length > 0 || missingFields(lead).length > 0;
}

function missingFields(lead: DailyLead): string[] {
  const fields: string[] = [];
  if (!lead.location || lead.location === 'Unknown') fields.push('location');
  if (!lead.dateSignal) fields.push('approximate dates');
  if (!lead.budgetSignal) fields.push('estimated budget');
  if (!contactValue(lead) || contactValue(lead) === 'Not supplied') fields.push('contact');
  if (!lead.sourceUrl) fields.push('source');
  return fields;
}

function scoreReason(lead: DailyLead): string {
  const reasons = Object.entries(lead.scoreBreakdown)
    .filter(([, value]) => value > 0)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([key]) => key.replace(/[A-Z]/g, (match) => ` ${match.toLowerCase()}`));
  return reasons.join('; ') || 'No score reason recorded';
}

function contactValue(lead: DailyLead): string {
  return lead.contactHint ?? 'Not supplied';
}

function sourceValue(lead: DailyLead): string {
  return `${lead.sourceName ?? lead.sourceType}: ${lead.sourceUrl}`;
}

function cell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function main(): void {
  const result = generateDailyLeadPack();
  console.log(`Daily lead pack generated: ${result.filesGenerated.join(', ')}`);
  console.log(`Total leads: ${result.totalLeads}; included: ${result.includedLeads}; review needed: ${result.reviewCount}`);
  console.log('Local files only. No scraping, network calls, outreach, email, DM, or form submission was performed.');
}

if (require.main === module) main();
