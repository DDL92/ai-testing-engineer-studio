import { buildCurrentClientConversion, convertActionableLeadToClient, writeClientConversionOutputs } from './conversionRules';

function main(): void {
  const result = buildCurrentClientConversion() ?? convertActionableLeadToClient();
  writeClientConversionOutputs(result);
  console.log('Client record generated: output/client-conversion/client-record.md');
  console.log(`Client: ${result.record.clientName}`);
  console.log(`Status: ${result.record.status}`);
}

main();
