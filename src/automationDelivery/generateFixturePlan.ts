import { buildAutomationDeliveryReport, writeAutomationDeliveryOutputs } from './automationRules';

function main(): void {
  const report = buildAutomationDeliveryReport();
  writeAutomationDeliveryOutputs(report);
  console.log('Fixture plan generated: output/automation-delivery/fixture-plan.md');
  console.log(`Recommended fixtures: ${report.fixtures.length}`);
}

main();
