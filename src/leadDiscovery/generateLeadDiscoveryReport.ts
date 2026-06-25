import fs = require('fs');
import path = require('path');
import { LeadRecord, LeadVertical } from './types';

const inputPath = path.join(process.cwd(), 'data', 'lead-discovery', 'sample-leads.json');
const outputDir = path.join(process.cwd(), 'output', 'lead-discovery');
const markdownPath = path.join(outputDir, 'lead-discovery-report.md');
const csvPath = path.join(outputDir, 'qualified-leads.csv');

function main(): void {
  const leads = readLeads();
  const generatedAt = new Date().toISOString();
  const sorted = [...leads].sort((left, right) => right.score - left.score);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(markdownPath, renderMarkdown(sorted, generatedAt), 'utf8');
  fs.writeFileSync(csvPath, renderCsv(sorted), 'utf8');

  console.log(`Lead discovery report generated: ${path.relative(process.cwd(), markdownPath)}`);
  console.log(`Qualified leads CSV generated: ${path.relative(process.cwd(), csvPath)}`);
  console.log('Local report only. No scraping, outreach, email, DM, or form submission was performed.');
}

function readLeads(): LeadRecord[] {
  const raw = fs.readFileSync(inputPath, 'utf8');
  const parsed = JSON.parse(raw) as LeadRecord[];
  return parsed.map(validateLead);
}

function validateLead(lead: LeadRecord): LeadRecord {
  if (!lead.id || !lead.vertical || !lead.nameOrHandle) {
    throw new Error('Invalid lead record: id, vertical, and nameOrHandle are required.');
  }
  if (lead.sourceType !== 'sample_fixture') {
    throw new Error(`Sample MVP data must be fictional sample_fixture data: ${lead.id}`);
  }
  return lead;
}

function renderMarkdown(leads: LeadRecord[], generatedAt: string): string {
  const grouped = groupByVertical(leads);
  const risky = leads.filter((lead) => lead.riskFlags.length > 0);
  const averageScore = average(leads.map((lead) => lead.score));

  return `# AI Lead Discovery Studio Report

Generated: ${generatedAt}

## Summary Metrics

- Total leads: ${leads.length}
- Average score: ${averageScore.toFixed(1)}
- Leads with risk flags: ${risky.length}
- Safety: Human review required before delivery or contact.
- Automation boundary: No scraping, outreach, email, DM, or form submission was performed.

## Leads by Vertical

${Object.entries(grouped).map(([vertical, items]) => `- ${vertical}: ${items.length}`).join('\n')}

## Top 5 Leads

${leads.slice(0, 5).map((lead, index) => renderLeadSummary(lead, index + 1)).join('\n\n')}

## Leads With Risk Flags

${risky.map((lead) => `- ${lead.id} (${lead.vertical}): ${lead.riskFlags.join(', ')}`).join('\n') || '- None.'}

## Vertical Detail

${Object.entries(grouped)
    .map(([vertical, items]) => `### ${vertical}\n\n${items.map((lead) => renderLeadSummary(lead)).join('\n\n')}`)
    .join('\n\n')}
`;
}

function renderLeadSummary(lead: LeadRecord, rank?: number): string {
  const title = rank ? `### ${rank}. ${lead.nameOrHandle}` : `#### ${lead.nameOrHandle}`;
  return `${title}

- ID: ${lead.id}
- Vertical: ${lead.vertical}
- Score: ${lead.score.toFixed(1)}
- Status: ${lead.status}
- Location: ${lead.location}
- Requested service: ${lead.requestedService}
- Date signal: ${lead.dateSignal ?? 'Not supplied'}
- Budget signal: ${lead.budgetSignal ?? 'Not supplied'}
- Urgency: ${lead.urgency}
- Source: ${lead.sourceUrl}
- Intent: ${lead.intentSummary}
- Sales angle: ${lead.salesAngle}
- Suggested first message: ${lead.suggestedFirstMessage}
- Risk flags: ${lead.riskFlags.join(', ') || 'None'}`;
}

function renderCsv(leads: LeadRecord[]): string {
  const headers = [
    'id',
    'vertical',
    'nameOrHandle',
    'score',
    'urgency',
    'location',
    'requestedService',
    'dateSignal',
    'budgetSignal',
    'sourceUrl',
    'sourceType',
    'intentSummary',
    'salesAngle',
    'suggestedFirstMessage',
    'riskFlags',
    'status',
  ];
  const rows = leads.map((lead) => [
    lead.id,
    lead.vertical,
    lead.nameOrHandle,
    lead.score.toFixed(1),
    lead.urgency,
    lead.location,
    lead.requestedService,
    lead.dateSignal ?? '',
    lead.budgetSignal ?? '',
    lead.sourceUrl,
    lead.sourceType,
    lead.intentSummary,
    lead.salesAngle,
    lead.suggestedFirstMessage,
    lead.riskFlags.join('; '),
    lead.status,
  ]);
  return `${headers.join(',')}\n${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function groupByVertical(leads: LeadRecord[]): Record<LeadVertical, LeadRecord[]> {
  const groups: Record<LeadVertical, LeadRecord[]> = {
    travel_leads: [],
    catering_leads: [],
    wedding_leads: [],
    real_estate_leads: [],
    website_leads: [],
    qa_leads: [],
  } satisfies Record<LeadVertical, LeadRecord[]>;

  for (const lead of leads) groups[lead.vertical].push(lead);
  return groups;
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((total, value) => total + value, 0) / values.length;
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

if (require.main === module) main();
