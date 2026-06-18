import { buildAutomationDeliveryReport, writeAutomationDeliveryOutputs } from './automationRules';

function main(): void {
  const report = buildAutomationDeliveryReport();
  writeAutomationDeliveryOutputs(report);
  console.log('Automation plan generated: output/automation-delivery/automation-plan.md');
  console.log(`Client: ${report.client.clientName}`);
  console.log(`Package: ${report.package}`);
  console.log(`Status: ${report.status}`);
}

main();
