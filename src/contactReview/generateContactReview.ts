import fs = require('fs');
import path = require('path');
import { getLeadById } from '../leads/leadStore';
import { createInitialContactReview, renderContactReviewReport } from './contactReviewRules';
import { ContactReviewRecord, ContactReviewSources } from './types';

const contactReviewsPath = path.join(process.cwd(), 'data', 'contact-reviews.json');
const outputRoot = path.join(process.cwd(), 'output', 'contact-reviews');

function main(): void {
  const id = parseArg(process.argv.slice(2), '--id');

  if (!id) {
    exitWithError('Missing required --id lead_id argument. Example: npm run contact:review -- --id pushpress');
  }

  const lead = getLeadById(id);
  if (!lead) {
    exitWithError(`Lead not found: ${id}. Check data/leads.json for the correct id.`);
  }

  const reviews = readContactReviews();
  const index = reviews.findIndex((review) => review.leadId === lead.id);
  const record = index >= 0 ? reviews[index] : createInitialContactReview(lead);

  if (index === -1) {
    reviews.push(record);
    writeContactReviews(reviews);
  }

  const sources = detectSources(lead.id);
  const outputDir = path.join(outputRoot, lead.id);
  const outputPath = path.join(outputDir, 'contact-review.md');

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, renderContactReviewReport({ record, sources }), 'utf8');

  console.log(`Contact review generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Lead: ${record.companyName}`);
  console.log(`Contact status: ${record.contactStatus}`);
  console.log(`Message status: ${record.messageStatus}`);
  console.log(`Next follow-up date: ${record.nextFollowUpDate || 'not set'}`);
  console.log(`Outreach pack detected: ${sources.outreachPackExists ? sources.outreachPackPath : 'no'}`);
  console.log(`Audit pack detected: ${sources.auditPackExists ? sources.auditPackPath : 'no'}`);
  console.log('No contact info was invented. No outreach was sent. Human approval is required before contact.');
}

function readContactReviews(): ContactReviewRecord[] {
  ensureContactReviewFile();
  const raw = fs.readFileSync(contactReviewsPath, 'utf8').trim();
  if (!raw) return [];
  return JSON.parse(raw) as ContactReviewRecord[];
}

function writeContactReviews(reviews: ContactReviewRecord[]): void {
  fs.mkdirSync(path.dirname(contactReviewsPath), { recursive: true });
  fs.writeFileSync(contactReviewsPath, `${JSON.stringify(reviews, null, 2)}\n`, 'utf8');
}

function ensureContactReviewFile(): void {
  if (fs.existsSync(contactReviewsPath)) return;
  writeContactReviews([]);
}

function detectSources(leadId: string): ContactReviewSources {
  const outreachPackPath = path.join('output', 'outreach-packs', leadId);
  const auditPackPath = path.join('output', 'audit-packs', leadId);

  return {
    outreachPackPath,
    outreachPackExists: fs.existsSync(path.join(process.cwd(), outreachPackPath)),
    auditPackPath,
    auditPackExists: fs.existsSync(path.join(process.cwd(), auditPackPath)),
  };
}

function parseArg(args: string[], name: string): string | undefined {
  const flagIndex = args.indexOf(name);
  if (flagIndex >= 0) return args[flagIndex + 1];

  const value = args.find((arg) => arg.startsWith(`${name}=`));
  if (value) return value.slice(name.length + 1);

  return undefined;
}

function exitWithError(message: string): never {
  console.error(message);
  process.exit(1);
}

main();
