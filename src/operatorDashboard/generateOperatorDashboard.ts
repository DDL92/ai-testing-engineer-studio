import path = require('path');
import {
  buildOperatorDashboardReport,
  loadOperatorDashboardInput,
  writeOperatorDashboardOutputs,
} from './operatorDashboardRules';

function main(): void {
  const input = loadOperatorDashboardInput();
  const report = buildOperatorDashboardReport(input);
  const outputPaths = writeOperatorDashboardOutputs(report);

  console.log('Operator OS Dashboard generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`System Health: ${report.executiveSummary.systemHealth}`);
  console.log(`Booked MRR: $${report.executiveSummary.bookedMrr.toLocaleString('en-US')}`);
  console.log(`Top opportunity: ${report.executiveSummary.topOpportunity}`);
  console.log(`Approval items: ${report.executiveSummary.approvalItems}`);
  console.log(`Next recommended command: ${report.nextRecommendedCommand}`);
  console.log('Primary dashboard generated from local reports only. No APIs, CRM, outreach automation, sending, credentials, payments, invoices, or external databases were used.');
  console.log('Human approval is required before external action.');
}

main();
