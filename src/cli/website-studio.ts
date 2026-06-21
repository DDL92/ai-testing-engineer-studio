import fs = require('fs');
import path = require('path');
import {
  importWebsiteCandidates,
  readWebsiteLeads,
  validateCandidate,
} from '../websiteStudio/leadAdapter';
import { writeWebsiteLeadPack } from '../websiteStudio/leadPack';
import { buildWebsiteRanking, writeWebsiteRanking } from '../websiteStudio/rankingWorkflow';
import { WebsiteCandidateInput } from '../websiteStudio/types';

const command = process.argv[2];
const args = process.argv.slice(3);

void main();

async function main(): Promise<void> {
  if (command === 'import') return importLeads(args);
  if (command === 'rank') return rankLeads();
  if (command === 'pack') return generatePack(args);
  fail('Usage: website-studio.ts <import|rank|pack>');
}

async function importLeads(commandArgs: string[]): Promise<void> {
  const inputPath = readFlag(commandArgs, '--input');
  const dryRun = commandArgs.includes('--dry-run');
  const force = commandArgs.includes('--force');
  if (!inputPath) fail('Missing required --input <json-file>.');

  const parsed = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), inputPath), 'utf8')) as unknown;
  if (!Array.isArray(parsed)) fail('Input must be a JSON array.');

  const candidates: WebsiteCandidateInput[] = [];
  let invalid = 0;
  let duplicateInputs = 0;

  for (const [index, value] of parsed.entries()) {
    const validation = validateCandidate(value);
    if (!validation.candidate) {
      invalid += 1;
      console.error(`Invalid record ${index + 1}: ${validation.errors.join('; ')}`);
      continue;
    }
    if (candidates.some((candidate) => candidate.id === validation.candidate?.id)) {
      duplicateInputs += 1;
      continue;
    }
    candidates.push(validation.candidate);
  }

  const result = await importWebsiteCandidates(candidates, { dryRun, force });
  result.counts.invalid += invalid;
  result.counts.skipped += duplicateInputs;
  console.log(`Website lead import${dryRun ? ' dry run' : ''} complete.`);
  console.log(`Added: ${result.counts.added}`);
  console.log(`Updated: ${result.counts.updated}`);
  console.log(`Skipped: ${result.counts.skipped}`);
  console.log(`Invalid: ${result.counts.invalid}`);
}

function rankLeads(): void {
  const ranked = buildWebsiteRanking();
  const { jsonPath, markdownPath } = writeWebsiteRanking(ranked);
  console.log(`Website lead ranking generated: ${path.relative(process.cwd(), jsonPath)}, ${path.relative(process.cwd(), markdownPath)}`);
  console.log(`Ranked leads: ${ranked.length}`);
  for (const lead of ranked.slice(0, 3)) {
    console.log(`${lead.rank}. ${lead.business} — ${lead.score}/100 — ${lead.decision}`);
  }
}

function generatePack(commandArgs: string[]): void {
  const id = readFlag(commandArgs, '--id');
  if (!id) fail('Missing required --id <lead-id>.');
  const record = readWebsiteLeads().find((lead) => lead.lead.id === id);
  if (!record) fail(`Website lead not found: ${id}`);

  const outputs = writeWebsiteLeadPack(record);
  console.log(`Website lead pack generated: ${path.relative(process.cwd(), outputs.jsonPath)}, ${path.relative(process.cwd(), outputs.markdownPath)}`);
  console.log(`Lead: ${record.lead.companyName}`);
  console.log(`Score: ${record.analysis.score}/100`);
  console.log(`Decision: ${record.analysis.decision}`);
  console.log(`Primary offer: ${record.analysis.primaryOffer.name} (${record.analysis.primaryOffer.priceRange})`);
  console.log('No outreach was generated or sent. Manual review is required.');
}

function readFlag(commandArgs: string[], flag: string): string | undefined {
  const index = commandArgs.indexOf(flag);
  if (index >= 0) return commandArgs[index + 1];
  const inline = commandArgs.find((argument) => argument.startsWith(`${flag}=`));
  return inline?.slice(flag.length + 1);
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}
