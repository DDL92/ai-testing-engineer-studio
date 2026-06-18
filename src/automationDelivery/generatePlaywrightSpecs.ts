import { buildAutomationDeliveryReport, writeAutomationDeliveryOutputs } from './automationRules';

function main(): void {
  const report = buildAutomationDeliveryReport();
  writeAutomationDeliveryOutputs(report);
  console.log('Playwright spec recommendations generated: output/automation-delivery/playwright-specs.md');
  console.log(`Recommended specs: ${report.specs.length}`);
}

main();
