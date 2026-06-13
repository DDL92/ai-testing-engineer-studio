import path = require('path');
import { buildClientDeliveryInput, writeWeeklyReport } from './clientRules';

function main(): void {
  const client = parseArg(process.argv.slice(2), '--client') ?? parseArg(process.argv.slice(2), '--id');
  if (!client) exitWithError('Missing required --client argument. Example: npm run client:weekly-report -- --client pushpress');

  const input = buildClientDeliveryInput(client);
  const outputPath = writeWeeklyReport(input);

  console.log(`Weekly client report generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Client: ${input.client.clientName}`);
  console.log('Review-only weekly report. No report, email, invoice, payment request, or external action was sent.');
}

function parseArg(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index >= 0) return args[index + 1];
  const value = args.find((arg) => arg.startsWith(`${name}=`));
  return value ? value.slice(name.length + 1) : undefined;
}

function exitWithError(message: string): never {
  console.error(message);
  process.exit(1);
}

main();
