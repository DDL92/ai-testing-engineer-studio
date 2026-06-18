import { buildCurrentClientConversion, convertActionableLeadToClient, writeClientConversionOutputs } from './conversionRules';

function main(): void {
  const result = buildCurrentClientConversion() ?? convertActionableLeadToClient();
  writeClientConversionOutputs(result);
  console.log('Package selection generated: output/client-conversion/package-selection.md');
  console.log(`Client: ${result.record.clientName}`);
  console.log(`Selected package: ${result.record.selectedPackage}`);
}

main();
