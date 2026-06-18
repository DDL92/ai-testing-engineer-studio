import { buildAutomationDeliveryReport, writeAutomationDeliveryOutputs } from './automationRules';

function main(): void {
  const report = buildAutomationDeliveryReport();
  writeAutomationDeliveryOutputs(report);
  console.log('Reporting plan generated: output/automation-delivery/reporting-plan.md');
  console.log(`Reporting recommendations: ${report.reportingRecommendations.length}`);
}

main();
