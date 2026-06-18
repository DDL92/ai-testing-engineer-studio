import { buildCurrentClientConversion, convertActionableLeadToClient, writeClientConversionOutputs } from './conversionRules';

function main(): void {
  const result = buildCurrentClientConversion() ?? convertActionableLeadToClient();
  writeClientConversionOutputs(result);
  console.log('Client status generated: output/client-conversion/client-status.md');
  console.log(`Client: ${result.record.clientName}`);
  console.log(`Status: ${result.record.status}`);
}

main();
