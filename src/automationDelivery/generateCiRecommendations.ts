import { buildAutomationDeliveryReport, writeAutomationDeliveryOutputs } from './automationRules';

function main(): void {
  const report = buildAutomationDeliveryReport();
  writeAutomationDeliveryOutputs(report);
  console.log('CI recommendations generated: output/automation-delivery/ci-recommendations.md');
  console.log('No deployment configuration was created.');
}

main();
