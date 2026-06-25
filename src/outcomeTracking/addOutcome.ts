import path = require('path');
import { addOutcomeRecord, allowedOutcomeStatuses, ensureOutcomeStore } from './outcomeRules';
import { OutcomeRecord, OutcomeStatus } from './types';

function main(): void {
  ensureOutcomeStore();
  const args = process.argv.slice(2);

  if (!valueFor(args, '--company')) {
    console.log('Outcome store ready: data/outcomes/outcomes.json');
    console.log('No outcome added. Provide explicit manual fields to record an outcome.');
    console.log('Example: npm run outcome:add -- --company PushPress --contact "Name" --channel linkedin --date 2026-06-13 --action-type manual_dm --message-sent true --response-status sent --next-action "Wait for reply"');
    return;
  }

  const record: OutcomeRecord = {
    company: required(args, '--company'),
    contact: valueFor(args, '--contact') ?? 'Manual contact not specified',
    channel: valueFor(args, '--channel') ?? 'manual',
    date: required(args, '--date'),
    action_type: valueFor(args, '--action-type') ?? 'manual_outreach',
    message_sent: parseBoolean(valueFor(args, '--message-sent')),
    response_status: status(valueFor(args, '--response-status') ?? 'not_sent'),
    meeting_status: status(valueFor(args, '--meeting-status') ?? 'not_sent'),
    proposal_status: status(valueFor(args, '--proposal-status') ?? 'not_sent'),
    deal_status: status(valueFor(args, '--deal-status') ?? 'not_sent'),
    revenue_status: status(valueFor(args, '--revenue-status') ?? 'not_sent'),
    amount: Number(valueFor(args, '--amount') ?? 0),
    notes: valueFor(args, '--notes') ?? '',
    next_action: valueFor(args, '--next-action') ?? '',
    follow_up_date: valueFor(args, '--follow-up-date'),
    contact_role: valueFor(args, '--contact-role'),
    message_type: valueFor(args, '--message-type'),
  };

  const records = addOutcomeRecord(record);
  console.log(`Outcome added to ${path.relative(process.cwd(), 'data/outcomes/outcomes.json')}`);
  console.log(`Total outcomes: ${records.length}`);
  console.log('Manual local record only. No outreach, email, meeting, proposal, invoice, payment, reply, or revenue was created.');
}

function required(args: string[], flag: string): string {
  const value = valueFor(args, flag);
  if (!value) throw new Error(`Missing required argument: ${flag}`);
  return value;
}

function valueFor(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function status(value: string): OutcomeStatus {
  if (allowedOutcomeStatuses.includes(value as OutcomeStatus)) return value as OutcomeStatus;
  throw new Error(`Invalid status "${value}". Allowed statuses: ${allowedOutcomeStatuses.join(', ')}`);
}

function parseBoolean(value: string | undefined): boolean {
  return value === 'true' || value === 'yes' || value === '1';
}

main();
