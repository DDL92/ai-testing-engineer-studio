import path = require('path');
import { buildFirstRevenueValidationReport, writeFirstRevenueValidationOutputs } from './firstRevenueValidationRules';

function main(): void {
  const report = buildFirstRevenueValidationReport();
  const outputPaths = writeFirstRevenueValidationOutputs(report);

  console.log('First Revenue Validation Pack generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Booked MRR: $${report.revenue.bookedMrr.toLocaleString('en-US')}`);
  console.log(`Best first-client target: ${report.bestFirstClientTarget?.company ?? 'none'}`);
  console.log(`Release score: ${report.release.releaseScore.overall}/100`);
  console.log('No invented revenue, contacts, audit findings, outreach sends, payments, or external actions were created.');
  console.log('Human approval is required before external action.');
}

main();
