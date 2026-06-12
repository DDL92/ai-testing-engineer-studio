import path = require('path');
import {
  buildDailyRevenueOperatorReport,
  loadDailyRevenueInput,
  writeDailyRevenueOperatorOutputs,
} from './dailyRevenueOperatorRules';

function main(): void {
  const input = loadDailyRevenueInput();
  const report = buildDailyRevenueOperatorReport(input);
  const outputPaths = writeDailyRevenueOperatorOutputs(report);

  console.log('Daily Revenue Operator generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Booked MRR: $${report.snapshot.bookedMrr.toLocaleString('en-US')}`);
  console.log(`Projected MRR: $${report.snapshot.projectedMrr.min.toLocaleString('en-US')}-$${report.snapshot.projectedMrr.max.toLocaleString('en-US')}/month`);
  console.log(`Top revenue opportunities: ${report.topRevenueOpportunities.length}`);
  console.log(`Revenue risks: ${report.revenueRisks.length}`);
  console.log('Revenue Command Center is the source of truth for booked MRR.');
  console.log('No APIs, scraping, browsing, CRM, outreach automation, external databases, credentials, payments, or sending were used.');
  console.log('Human approval is required before external action.');
}

main();
