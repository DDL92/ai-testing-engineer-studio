import path = require('path');
import {
  convertActionableLeadToClient,
  isAllowedClientStatus,
  isSupportedClientPackage,
  writeClientConversionOutputs,
} from './conversionRules';
import { ClientConversionStatus, ClientPackage } from './types';

function main(): void {
  const selectedPackage = argumentValue('--package') ?? 'qa-audit';
  const status = argumentValue('--status') ?? 'delivery-prep';
  if (!isSupportedClientPackage(selectedPackage)) throw new Error(`Invalid package: ${selectedPackage}`);
  if (!isAllowedClientStatus(status)) throw new Error(`Invalid client status: ${status}`);

  const result = convertActionableLeadToClient(selectedPackage as ClientPackage, status as ClientConversionStatus);
  const outputPaths = writeClientConversionOutputs(result);
  console.log('Client conversion generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Client: ${result.record.clientName}`);
  console.log(`Package: ${result.record.selectedPackage}`);
  console.log(`Status: ${result.record.status}`);
  console.log('Local preparation only. No contract, invoice, payment, outreach, meeting, or delivery action was created.');
}

function argumentValue(flag: string): string | undefined {
  const args = process.argv.slice(2);
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

main();
