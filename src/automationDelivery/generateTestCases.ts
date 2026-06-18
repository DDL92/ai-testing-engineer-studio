import { buildAutomationDeliveryReport, writeAutomationDeliveryOutputs } from './automationRules';

function main(): void {
  const report = buildAutomationDeliveryReport();
  writeAutomationDeliveryOutputs(report);
  console.log('Test cases generated: output/automation-delivery/test-cases.md');
  console.log(`Recommended test cases: ${report.testCases.length}`);
}

main();
