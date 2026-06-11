import fs = require('fs');
import path = require('path');
import { readLeads } from '../leads/leadStore';
import {
  buildLeadIntakeReport,
  parseCandidateQueue,
  renderApprovedCandidates,
  renderIntakeConsoleSummary,
  renderIntakeSummary,
  renderRejectedCandidates,
} from './leadIntakeRules';
import { LeadIntakeInput } from './types';

const candidateQueuePath = path.join(process.cwd(), 'output', 'lead-discovery-automation', 'candidate-queue.md');
const outputDir = path.join(process.cwd(), 'output', 'lead-intake');

function main(): void {
  const input = buildInput();
  const report = buildLeadIntakeReport(input);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'approved-candidates.md'), renderApprovedCandidates(input, report), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'rejected-candidates.md'), renderRejectedCandidates(input, report), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'intake-summary.md'), renderIntakeSummary(input, report), 'utf8');

  console.log(`Approved candidates generated: ${relative(path.join(outputDir, 'approved-candidates.md'))}`);
  console.log(`Rejected candidates generated: ${relative(path.join(outputDir, 'rejected-candidates.md'))}`);
  console.log(`Intake summary generated: ${relative(path.join(outputDir, 'intake-summary.md'))}`);
  for (const line of renderIntakeConsoleSummary(report)) {
    console.log(line);
  }
  console.log('No leads were added. No scraping, browsing, APIs, CRM, outreach automation, credentials, or external systems were used.');
}

function buildInput(): LeadIntakeInput {
  const queueMarkdown = fs.existsSync(candidateQueuePath) ? fs.readFileSync(candidateQueuePath, 'utf8') : '';
  const existingLeads = readLeads();

  return {
    generatedAt: new Date().toISOString(),
    candidateQueuePath: path.relative(process.cwd(), candidateQueuePath),
    candidates: parseCandidateQueue(queueMarkdown, existingLeads),
    existingLeads,
  };
}

function relative(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}

main();
