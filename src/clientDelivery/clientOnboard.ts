import path = require('path');
import { buildClientDeliveryInput, writeClientOnboarding } from './clientRules';

function main(): void {
  const client = parseArg(process.argv.slice(2), '--client') ?? parseArg(process.argv.slice(2), '--id');
  if (!client) exitWithError('Missing required --client argument. Example: npm run client:onboard -- --client pushpress');

  const input = buildClientDeliveryInput(client);
  const outputPath = writeClientOnboarding(input);

  console.log(`Client onboarding generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Client: ${input.client.clientName}`);
  console.log('Review-only onboarding. No emails, reports, invoices, contracts, payments, or external actions were sent.');
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
