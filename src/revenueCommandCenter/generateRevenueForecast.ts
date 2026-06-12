import path = require('path');
import {
  buildRevenueCommandCenterReport,
  loadRevenueCommandCenterInput,
  writeRevenueForecastOutput,
} from './revenueRules';

function main(): void {
  const input = loadRevenueCommandCenterInput();
  const report = buildRevenueCommandCenterReport(input);
  const outputPath = writeRevenueForecastOutput(report);

  console.log(`MRR forecast generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Booked MRR: $${report.bookedMrr.toLocaleString('en-US')}`);
  console.log(`Retainer opportunities used for speculative scenarios: ${report.retainerOpportunities.length}`);
  console.log('Speculative forecast rows are not booked revenue.');
  console.log('No APIs, scraping, browsing, CRM, outreach automation, payment systems, credentials, or external databases were used.');
}

main();
