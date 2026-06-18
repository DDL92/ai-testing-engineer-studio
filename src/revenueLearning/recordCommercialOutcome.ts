import {
  buildRevenueLearningReport,
  recordCommercialOutcome,
  writeRevenueLearningOutputs,
} from './learningRules';

const args = parseArgs(process.argv.slice(2));

if (Object.keys(args).length === 0) {
  const report = buildRevenueLearningReport();
  writeRevenueLearningOutputs(report);
  console.log('Commercial outcome workflow generated without changing production records.');
  console.log('Example: Setmore -> LinkedIn -> QA Audit -> replied (not persisted)');
  console.log(`Outcomes recorded: ${report.outcomes.length}`);
} else {
  const record = recordCommercialOutcome({
    lead: required(args.lead, 'lead'),
    industry: required(args.industry, 'industry'),
    leadCategory: args.category,
    channel: required(args.channel, 'channel'),
    offer: required(args.offer, 'offer'),
    pricePoint: args.price ? Number(args.price) : null,
    messageType: args.messageType,
    outcome: required(args.outcome, 'outcome'),
    date: args.date ?? new Date().toISOString().slice(0, 10),
    notes: args.notes,
  });
  writeRevenueLearningOutputs();
  console.log(`Commercial outcome recorded locally: ${record.lead} -> ${record.outcome}`);
}

function parseArgs(values: string[]): Record<string, string> {
  const parsed: Record<string, string> = {};
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index]?.match(/^--(.+)$/)?.[1];
    const value = values[index + 1];
    if (key && value && !value.startsWith('--')) {
      parsed[key] = value;
      index += 1;
    }
  }
  return parsed;
}

function required(value: string | undefined, name: string): string {
  if (!value?.trim()) throw new Error(`Missing required --${name} value.`);
  return value.trim();
}
