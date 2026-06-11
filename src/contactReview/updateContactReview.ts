import fs = require('fs');
import path = require('path');
import { getLeadById } from '../leads/leadStore';
import { applyContactReviewUpdate, createInitialContactReview, mapStatusUpdate, parseContactReviewChannel } from './contactReviewRules';
import { ContactReviewRecord, ContactReviewUpdateInput } from './types';

const contactReviewsPath = path.join(process.cwd(), 'data', 'contact-reviews.json');

function main(): void {
  const args = process.argv.slice(2);
  const id = parseArg(args, '--id');

  if (!id) {
    exitWithError('Missing required --id lead_id argument. Example: npm run contact:update -- --id pushpress --status prepared');
  }

  const lead = getLeadById(id);
  if (!lead) {
    exitWithError(`Lead not found: ${id}. Check data/leads.json for the correct id.`);
  }

  const reviews = readContactReviews();
  const index = reviews.findIndex((review) => review.leadId === lead.id);
  const existing = index >= 0 ? reviews[index] : createInitialContactReview(lead);
  const update = parseUpdate(args);
  const updated = applyContactReviewUpdate(existing, update);

  if (index >= 0) {
    reviews[index] = updated;
  } else {
    reviews.push(updated);
  }

  writeContactReviews(reviews);

  console.log(`Contact review updated for ${updated.companyName}`);
  console.log(`Contact status: ${updated.contactStatus}`);
  console.log(`Message status: ${updated.messageStatus}`);
  console.log(`Channel: ${updated.channel}`);
  console.log(`Next follow-up date: ${updated.nextFollowUpDate || 'not set'}`);
  console.log('Local data updated only. No outreach was sent, no APIs were called, and no contact data was invented.');
}

function parseUpdate(args: string[]): ContactReviewUpdateInput {
  const update: ContactReviewUpdateInput = {};
  const status = parseArg(args, '--status');
  const channel = parseArg(args, '--channel');
  const contactName = parseArg(args, '--contactName');
  const contactRole = parseArg(args, '--contactRole');
  const contactUrl = parseArg(args, '--contactUrl');
  const lastContactedAt = parseArg(args, '--lastContactedAt');
  const nextFollowUpDate = parseArg(args, '--nextFollowUpDate');
  const notes = parseArg(args, '--notes');

  if (status) Object.assign(update, mapStatusUpdate(status));
  if (channel) update.channel = parseContactReviewChannel(channel);
  if (contactName !== undefined) update.contactName = contactName;
  if (contactRole !== undefined) update.contactRole = contactRole;
  if (contactUrl !== undefined) update.contactUrl = contactUrl;
  if (lastContactedAt !== undefined) update.lastContactedAt = lastContactedAt;
  if (nextFollowUpDate !== undefined) update.nextFollowUpDate = nextFollowUpDate;
  if (notes !== undefined) update.notes = notes;

  if (Object.keys(update).length === 0) {
    exitWithError('No update fields provided. Pass --status, --channel, --contactName, --contactRole, --contactUrl, --lastContactedAt, --nextFollowUpDate, or --notes.');
  }

  return update;
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
