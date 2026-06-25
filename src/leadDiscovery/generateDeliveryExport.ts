import fs = require('fs');
import path = require('path');
import { DeliveryLeadCandidate } from './deliveryLeadTypes';

interface DeliveryBatch {
  generatedAt: string;
  deliveryCandidates: DeliveryLeadCandidate[];
}

interface VerificationMessage {
  sourceUrl: string;
  suggestedMessage: string;
  approvalStatus: string;
}

const deliveryPath = path.join(process.cwd(), 'output', 'lead-discovery', 'delivery-candidates', 'delivery-candidates.json');
const verificationMessagesPath = path.join(process.cwd(), 'output', 'lead-discovery', 'verification', 'flora_and_fauna_foods_001-verification-messages.csv');
const outputDir = path.join(process.cwd(), 'output', 'lead-discovery', 'exports', 'flora-and-fauna-foods');

const paths = {
  delivery: path.join(outputDir, 'delivery-export.csv'),
  sales: path.join(outputDir, 'sales-team-sheet.csv'),
  executive: path.join(outputDir, 'executive-summary.md'),
  review: path.join(outputDir, 'review-needed.csv'),
};

export function generateDeliveryExport(): { filesGenerated: string[]; exported: number } {
  const batch = readJson<DeliveryBatch>(deliveryPath);
  const messages = readVerificationMessages();
  const messageByUrl = new Map(messages.map((message) => [message.sourceUrl, message]));
  const flora = batch.deliveryCandidates
    .filter((candidate) => candidate.clientId === 'flora_and_fauna_foods_001')
    .sort((left, right) => Number(left.excluded) - Number(right.excluded) || right.overallScore - left.overallScore);
  const active = flora.filter((candidate) => !candidate.excluded && candidate.sourceQuality !== 'low' && candidate.overallScore >= 6);
  const review = flora.filter((candidate) => candidate.excluded || candidate.sourceQuality === 'low' || candidate.overallScore < 6);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(paths.delivery, renderDeliveryCsv(active, messageByUrl), 'utf8');
  fs.writeFileSync(paths.sales, renderSalesCsv(active, messageByUrl), 'utf8');
  fs.writeFileSync(paths.executive, renderExecutive(active, review), 'utf8');
  fs.writeFileSync(paths.review, renderReviewCsv(review, messageByUrl), 'utf8');
  return { filesGenerated: Object.values(paths).map((file) => path.relative(process.cwd(), file)), exported: active.length };
}

function renderDeliveryCsv(candidates: DeliveryLeadCandidate[], messages: Map<string, VerificationMessage>): string {
  const headers = ['source', 'title', 'snippet', 'estimated_event_type', 'estimated_location', 'score', 'queue', 'source_quality', 'suggested_verification_message', 'review_status'];
  const rows = candidates.map((candidate) => rowFor(candidate, messages));
  return `${headers.map(csvCell).join(',')}\n${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function renderSalesCsv(candidates: DeliveryLeadCandidate[], messages: Map<string, VerificationMessage>): string {
  const headers = ['rank', 'source', 'title', 'event_type', 'location', 'score', 'queue', 'message', 'next_step'];
  const rows = candidates.map((candidate, index) => [
    String(index + 1),
    hostFor(candidate.url),
    candidate.title,
    candidate.estimatedEventType,
    candidate.estimatedLocation,
    candidate.overallScore.toFixed(1),
    candidate.deliveryQueue,
    messages.get(candidate.url)?.suggestedMessage ?? '',
    'Manual review required before any contact or client delivery.',
  ]);
  return `${headers.map(csvCell).join(',')}\n${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function renderReviewCsv(candidates: DeliveryLeadCandidate[], messages: Map<string, VerificationMessage>): string {
  const headers = ['source', 'title', 'score', 'queue', 'source_quality', 'excluded', 'exclusion_reason', 'review_status'];
  const rows = candidates.map((candidate) => [
    hostFor(candidate.url),
    candidate.title,
    candidate.overallScore.toFixed(1),
    candidate.deliveryQueue,
    candidate.sourceQuality,
    candidate.excluded ? 'yes' : 'no',
    candidate.exclusionReason ?? '',
    messages.get(candidate.url)?.approvalStatus ?? 'manual_review_required',
  ]);
  return `${headers.map(csvCell).join(',')}\n${rows.map((row) => row.map(csvCell).join(',')).join('\n')}\n`;
}

function renderExecutive(active: DeliveryLeadCandidate[], review: DeliveryLeadCandidate[]): string {
  return `# Flora and Fauna Foods Delivery Export Summary

Generated: ${new Date().toISOString()}

- Exported delivery candidates: ${active.length}
- Review-needed candidates: ${review.length}
- Average exported score: ${average(active.map((candidate) => candidate.overallScore)).toFixed(1)}
- Interest verification queue: ${active.filter((candidate) => candidate.deliveryQueue === 'interest_verification').length}
- Warm intent queue: ${active.filter((candidate) => candidate.deliveryQueue === 'warm_intent').length}

Manual review required before any contact or client delivery.

No contact extraction, outreach, scraping, emails, DMs, calls, or forms were performed.
`;
}

function rowFor(candidate: DeliveryLeadCandidate, messages: Map<string, VerificationMessage>): string[] {
  return [
    hostFor(candidate.url),
    candidate.title,
    candidate.snippet,
    candidate.estimatedEventType,
    candidate.estimatedLocation,
    candidate.overallScore.toFixed(1),
    candidate.deliveryQueue,
    candidate.sourceQuality,
    messages.get(candidate.url)?.suggestedMessage ?? '',
    messages.get(candidate.url)?.approvalStatus ?? 'manual_review_required',
  ];
}

function readVerificationMessages(): VerificationMessage[] {
  if (!fs.existsSync(verificationMessagesPath)) return [];
  const lines = fs.readFileSync(verificationMessagesPath, 'utf8').trim().split('\n').slice(1);
  return lines.map(parseCsvLine).map((cols) => ({
    sourceUrl: cols[3] ?? '',
    approvalStatus: cols[9] ?? 'manual_review_required',
    suggestedMessage: cols[10] ?? '',
  }));
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function hostFor(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

function average(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""').replace(/\s+/g, ' ').trim()}"`;
}

function main(): void {
  const result = generateDeliveryExport();
  console.log(`Delivery export generated: ${result.filesGenerated.join(', ')}`);
  console.log(`Flora delivery candidates exported: ${result.exported}`);
  console.log('Export only. Manual review required before any contact or client delivery.');
}

if (require.main === module) main();
