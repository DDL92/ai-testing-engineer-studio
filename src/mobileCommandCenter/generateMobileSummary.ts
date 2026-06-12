import path = require('path');
import {
  buildMobileCommandCenterReport,
  loadMobileCommandCenterInput,
  writeMobileSummaryOutput,
} from './mobileCommandCenterRules';

function main(): void {
  const input = loadMobileCommandCenterInput();
  const report = buildMobileCommandCenterReport(input);
  const outputPath = writeMobileSummaryOutput(report);

  console.log(`Mobile summary generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`System Health: ${report.systemHealth}`);
  console.log(`First action: ${report.topActions[0]?.title ?? 'none'}`);
  console.log(`Booked MRR: $${report.revenueSnapshot.bookedMrr.toLocaleString('en-US')}`);
  console.log('Summary only. No APIs, no outreach automation, no CRM, no external databases, no credentials, and no sending.');
  console.log('Human approval is required before external action.');
}

main();
