import path = require('path');
import {
  buildActionCockpitReport,
  loadActionCockpitInput,
  writeActionCockpitOutputs,
} from './actionCockpitRules';

function main(): void {
  const input = loadActionCockpitInput();
  const report = buildActionCockpitReport(input);
  const outputPaths = writeActionCockpitOutputs(report);

  console.log('Action Cockpit generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`System Health: ${report.systemHealth}`);
  console.log(`Top actions: ${report.topActions.length}`);
  console.log(`Top opportunities: ${report.topOpportunities.length}`);
  console.log(`Approval queue items: ${report.approvalQueue.length}`);
  console.log(`Next recommended command: ${report.nextRecommendedCommand}`);
  console.log('Revenue source: Revenue Command Center.');
  console.log('No APIs, CRM, outreach automation, sending, external databases, credentials, payments, or invoices were used.');
  console.log('Human approval is required before external action.');
}

main();
