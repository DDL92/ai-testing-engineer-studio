import { buildAutomationDeliveryReport, writeAutomationDeliveryOutputs } from './automationRules';

function main(): void {
  const report = buildAutomationDeliveryReport();
  writeAutomationDeliveryOutputs(report);
  console.log('Client handoff generated: output/automation-delivery/client-handoff.md');
  console.log(`Client handoff items: ${report.clientHandoff.length}`);
  console.log('Draft only. Nothing was delivered or sent.');
}

main();
