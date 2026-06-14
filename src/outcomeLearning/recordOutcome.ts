import {
  allowedLearningOutcomes,
  buildOutcomeLearningAnalysis,
  ensureOutcomeLearningStore,
  recordOutcomeLearning,
} from './learningRules';
import { LearningOutcomeType } from './types';

function main(): void {
  ensureOutcomeLearningStore();
  const args = parseArgs(process.argv.slice(2));

  if (!args.outcome) {
    const analysis = buildOutcomeLearningAnalysis();
    console.log('Outcome learning store ready.');
    console.log(`Outcomes recorded: ${analysis.totalOutcomes}`);
    console.log('No outcome was recorded because no manual --outcome was provided.');
    console.log(`Allowed outcomes: ${allowedLearningOutcomes.join(', ')}`);
    console.log('Example: npm run learning:record -- --lead "Appointy" --offer "QA Automation Retainer ($1500-$3000/month)" --category "Scheduling SaaS" --channel linkedin --outcome SENT --notes "Manual message sent outside Studio"');
    console.log('No outreach, emails, CRM records, meetings, invoices, payments, revenue, replies, wins, losses, or client interest were created.');
    return;
  }

  const outcome = normalizeOutcomeArg(args.outcome);
  const record = recordOutcomeLearning({
    lead: args.lead ?? 'Unknown',
    offer: args.offer ?? 'Unknown',
    category: args.category ?? 'Unknown',
    channel: args.channel ?? 'Unknown',
    outcome,
    date: args.date ?? new Date().toISOString().slice(0, 10),
    notes: args.notes ?? '',
  });

  console.log('Manual outcome recorded.');
  console.log(`Lead: ${record.lead}`);
  console.log(`Outcome: ${record.outcome}`);
  console.log(`Channel: ${record.channel}`);
  console.log('Local learning only. No outreach, emails, CRM records, meetings, invoices, payments, revenue, or client activity were created.');
}

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const value = args[index + 1] && !args[index + 1].startsWith('--') ? args[index + 1] : 'true';
    result[key] = value;
    if (value !== 'true') index += 1;
  }
  return result;
}

function normalizeOutcomeArg(value: string): LearningOutcomeType {
  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (!allowedLearningOutcomes.includes(normalized as LearningOutcomeType)) {
    throw new Error(`Invalid outcome "${value}". Allowed: ${allowedLearningOutcomes.join(', ')}`);
  }
  return normalized as LearningOutcomeType;
}

main();
