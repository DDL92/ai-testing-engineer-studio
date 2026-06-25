import fs = require('fs');
import path = require('path');
import { LeadOutcomeRecord } from './outcomeTypes';

const inputPath = path.join(process.cwd(), 'data', 'lead-discovery', 'outcomes', 'sample-outcomes.json');
const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'outcomes');
const summaryPath = path.join(outputDir, 'outcome-summary.md');
const csvPath = path.join(outputDir, 'outcome-summary.csv');

export function generateOutcomeReport(): { filesGenerated: string[]; outcomes: LeadOutcomeRecord[] } {
  const outcomes = readOutcomes();
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(summaryPath, renderSummary(outcomes), 'utf8');
  fs.writeFileSync(csvPath, renderCsv(outcomes), 'utf8');
  return { filesGenerated: [summaryPath, csvPath].map((file) => path.relative(process.cwd(), file)), outcomes };
}

function readOutcomes(): LeadOutcomeRecord[] {
  if (!fs.existsSync(inputPath)) return [];
  return JSON.parse(fs.readFileSync(inputPath, 'utf8')) as LeadOutcomeRecord[];
}

function renderSummary(outcomes: LeadOutcomeRecord[]): string {
  const estimatedValue = outcomes.reduce((sum, outcome) => sum + outcome.estimatedValue, 0);
  return `# Lead Outcome Summary

Generated: ${new Date().toISOString()}

## Totals

- Total outcomes: ${outcomes.length}
- Total estimated value: $${estimatedValue.toFixed(0)}
- Average estimated value: $${(outcomes.length ? estimatedValue / outcomes.length : 0).toFixed(0)}

## Outcomes by Status

${countList(outcomes.map((outcome) => outcome.outcomeStatus))}

## Outcomes by Client

${countList(outcomes.map((outcome) => outcome.clientName))}

## Outcomes by Source

${countList(outcomes.map((outcome) => outcome.sourceName))}

## Outcomes by Lead Type

${countList(outcomes.map((outcome) => outcome.leadType))}

## Estimated Value Summary

- Open/positive value: $${outcomes.filter((outcome) => ['interest_verified', 'meeting_booked', 'quote_sent', 'won'].includes(outcome.outcomeStatus)).reduce((sum, outcome) => sum + outcome.estimatedValue, 0).toFixed(0)}
- Lost/no-response/bad-fit value: $${outcomes.filter((outcome) => ['lost', 'bad_fit', 'already_booked', 'no_response'].includes(outcome.outcomeStatus)).reduce((sum, outcome) => sum + outcome.estimatedValue, 0).toFixed(0)}

## Learning Notes

- Track which sources produce verified interest, meetings, and quotes.
- Prioritize lead types with higher estimated value and faster response.
- Use bad-fit and no-response outcomes to tune query, quality, and verification rules.

## Manual Review Disclaimer

These are sample/local outcome records. Human review is required before using outcomes for client reporting, pricing, or delivery decisions. No outreach, contact extraction, scraping, emails, DMs, calls, or forms were performed.
`;
}

function renderCsv(outcomes: LeadOutcomeRecord[]): string {
  const headers = ['lead_id', 'client_id', 'client_name', 'status', 'estimated_value', 'source_name', 'lead_type', 'delivery_queue', 'recorded_at', 'notes'];
  const rows = outcomes.map((outcome) => [
    outcome.leadId,
    outcome.clientId,
    outcome.clientName,
    outcome.outcomeStatus,
    outcome.estimatedValue.toFixed(0),
    outcome.sourceName,
    outcome.leadType,
    outcome.deliveryQueue,
    outcome.recordedAt,
    outcome.outcomeNotes,
  ]);
  return `${headers.map(csvCell).join(',')}\n${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function countList(values: string[]): string {
  const rows = Object.entries(values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {})).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  return rows.map(([value, count]) => `- ${value}: ${count}`).join('\n') || '- None';
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function main(): void {
  const result = generateOutcomeReport();
  console.log(`Outcome report generated: ${result.filesGenerated.join(', ')}`);
  console.log(`Outcomes: ${result.outcomes.length}`);
  console.log('Local reporting only. No outreach, contact extraction, scraping, emails, DMs, calls, or forms were performed.');
}

if (require.main === module) main();
