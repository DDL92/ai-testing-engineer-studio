import fs = require('fs');
import path = require('path');
import { DeliveryLeadCandidate } from './deliveryLeadTypes';

interface DeliveryBatch {
  deliveryCandidates: DeliveryLeadCandidate[];
}

interface FalsePositiveLearningRow {
  query: string;
  source: string;
  buyerRole: string;
  rejectionReason: string;
  signals: string[];
  sourceCategory: string;
}

const deliveryPath = path.join(process.cwd(), 'output', 'lead-discovery', 'delivery-candidates', 'delivery-candidates.json');
const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'learning');
const summaryMdPath = path.join(outputDir, 'false-positive-summary.md');
const summaryCsvPath = path.join(outputDir, 'false-positive-summary.csv');

const seededExample: FalsePositiveLearningRow = {
  query: 'seed_training_example_flora_facebook_staffing',
  source: 'Facebook: "Looking for model types in NYC who have catering experience to work two catering events! DM ME ASAP!"',
  buyerRole: 'staffing_recruitment',
  rejectionReason: 'recruiting workers instead of purchasing catering services',
  signals: ['looking for models', 'catering experience', 'work two catering events', 'DM ME ASAP'],
  sourceCategory: 'facebook_public',
};

export function updateFalsePositiveLearning(): { filesGenerated: string[]; rows: FalsePositiveLearningRow[] } {
  const rows = dedupeRows([seededExample, ...readDeliveryFalsePositives()]);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(summaryMdPath, renderSummary(rows), 'utf8');
  fs.writeFileSync(summaryCsvPath, renderCsv(rows), 'utf8');

  return {
    filesGenerated: [summaryMdPath, summaryCsvPath].map((filePath) => path.relative(process.cwd(), filePath)),
    rows,
  };
}

function readDeliveryFalsePositives(): FalsePositiveLearningRow[] {
  if (!fs.existsSync(deliveryPath)) return [];
  const batch = JSON.parse(fs.readFileSync(deliveryPath, 'utf8')) as DeliveryBatch;
  return batch.deliveryCandidates
    .filter((candidate) => candidate.exclusionReason === 'not_buying_service')
    .map((candidate) => ({
      query: candidate.query,
      source: `${candidate.sourceName}: ${candidate.title}`,
      buyerRole: candidate.buyerRole,
      rejectionReason: candidate.exclusionReason ?? 'not_buying_service',
      signals: candidate.buyerRoleSignals,
      sourceCategory: candidate.sourceCategory,
    }));
}

function dedupeRows(rows: FalsePositiveLearningRow[]): FalsePositiveLearningRow[] {
  const seen = new Set<string>();
  const deduped: FalsePositiveLearningRow[] = [];
  for (const row of rows) {
    const key = `${row.query}|${row.source}|${row.buyerRole}|${row.rejectionReason}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(row);
  }
  return deduped.sort((left, right) => roleRank(left.buyerRole) - roleRank(right.buyerRole) || left.source.localeCompare(right.source));
}

function roleRank(role: string): number {
  if (role === 'staffing_recruitment') return 0;
  if (role === 'job_posting') return 1;
  if (role === 'employee_seeking_work') return 2;
  return 3;
}

function renderSummary(rows: FalsePositiveLearningRow[]): string {
  return `# False Positive Learning Summary

Generated: ${new Date().toISOString()}

## Totals

- False positive examples: ${rows.length}
- Staffing recruitment examples: ${rows.filter((row) => row.buyerRole === 'staffing_recruitment').length}
- Job posting examples: ${rows.filter((row) => row.buyerRole === 'job_posting').length}
- Employee seeking work examples: ${rows.filter((row) => row.buyerRole === 'employee_seeking_work').length}
- Commercial value for seeded staffing example: 0

## Buyer Role Distribution

${renderDistribution(rows.map((row) => row.buyerRole))}

## Top Rejection Reasons

${renderDistribution(rows.map((row) => row.rejectionReason))}

## Source Categories

${renderDistribution(rows.map((row) => row.sourceCategory))}

## Learning Examples

${rows.map((row, index) => `${index + 1}. ${row.source}
   - Query: ${row.query}
   - Buyer role: ${row.buyerRole}
   - Rejection reason: ${row.rejectionReason}
   - Source category: ${row.sourceCategory}
   - Signals: ${row.signals.join(', ') || 'none'}`).join('\n') || '- No false positive learning examples yet.'}

Human review remains required. No browser automation, scraping, contact extraction, outreach, emails, DMs, calls, or login actions were performed.
`;
}

function renderCsv(rows: FalsePositiveLearningRow[]): string {
  const headers = ['query', 'source', 'buyer_role', 'rejection_reason', 'signals', 'source_category'];
  const body = rows.map((row) => [
    row.query,
    row.source,
    row.buyerRole,
    row.rejectionReason,
    row.signals.join('|'),
    row.sourceCategory,
  ]);
  return `${headers.map(csvCell).join(',')}\n${body.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function renderDistribution(values: string[]): string {
  const rows = Object.entries(values.reduce<Record<string, number>>((acc, value) => {
    acc[value || 'unknown'] = (acc[value || 'unknown'] ?? 0) + 1;
    return acc;
  }, {})).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]));
  return rows.map(([value, count]) => `- ${value}: ${count}`).join('\n') || '- None.';
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function main(): void {
  const result = updateFalsePositiveLearning();
  console.log(`False positive learning generated: ${result.filesGenerated.join(', ')}`);
  console.log(`False positive examples: ${result.rows.length}`);
  console.log('Local learning only. No browser automation, scraping, contact extraction, outreach, email, DM, calls, or login was performed.');
}

if (require.main === module) main();
