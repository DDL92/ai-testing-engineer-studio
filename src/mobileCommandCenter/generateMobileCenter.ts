import path = require('path');
import {
  buildMobileCommandCenterReport,
  loadMobileCommandCenterInput,
  writeMobileCommandCenterOutputs,
} from './mobileCommandCenterRules';

function main(): void {
  const input = loadMobileCommandCenterInput();
  const report = buildMobileCommandCenterReport(input);
  const outputPaths = writeMobileCommandCenterOutputs(report);

  console.log('Mobile Command Center generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`System Health: ${report.systemHealth}`);
  console.log(`Top actions: ${report.topActions.length}`);
  console.log(`Top opportunities: ${report.topOpportunities.length}`);
  console.log(`Booked MRR: $${report.revenueSnapshot.bookedMrr.toLocaleString('en-US')}`);
  console.log(`Manual follow-ups: ${report.followUpQueue.length}`);
  console.log('Local-only Markdown generation. No APIs, no outreach automation, no CRM, no external databases, no credentials, and no sending.');
  console.log('Human approval is required before external action.');
}

main();
