import { buildAutomationDeliveryReport, writeAutomationDeliveryOutputs } from './automationRules';

function main(): void {
  const report = buildAutomationDeliveryReport();
  writeAutomationDeliveryOutputs(report);
  console.log('Critical flows generated: output/automation-delivery/critical-flows.md');
  console.log(`Critical flows: ${report.criticalFlows.length}`);
}

main();
