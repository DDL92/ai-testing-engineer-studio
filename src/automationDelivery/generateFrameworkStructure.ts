import { buildAutomationDeliveryReport, writeAutomationDeliveryOutputs } from './automationRules';

function main(): void {
  const report = buildAutomationDeliveryReport();
  writeAutomationDeliveryOutputs(report);
  console.log('Framework structure generated: output/automation-delivery/framework-structure.md');
  console.log(`Recommended framework assets: ${report.frameworkStructure.length}`);
}

main();
