import path = require('path');
import {
  buildRevenueCommandCenterReport,
  loadRevenueCommandCenterInput,
  writeRevenueCommandCenterOutputs,
} from './revenueRules';

function main(): void {
  const input = loadRevenueCommandCenterInput();
  const report = buildRevenueCommandCenterReport(input);
  const outputPaths = writeRevenueCommandCenterOutputs(report);

  console.log('Revenue Command Center generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Booked MRR: $${report.bookedMrr.toLocaleString('en-US')}`);
  console.log(`Audit opportunities: ${report.auditOpportunities.length}`);
  console.log(`Retainer opportunities: ${report.retainerOpportunities.length}`);
  console.log(`Renewal opportunities: ${report.renewalOpportunities.length}`);
  console.log(`Expansion opportunities: ${report.expansionOpportunities.length}`);
  console.log('No opportunities were counted as booked revenue.');
  console.log('No APIs, scraping, browsing, CRM, outreach automation, email, LinkedIn automation, payment systems, credentials, or external databases were used.');
  console.log('Human approval is required before external action.');
}

main();
