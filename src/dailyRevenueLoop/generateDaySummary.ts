import path = require('path');
import {
  buildDailyRevenueSummary,
  loadDailyRevenueLoopInput,
  writeDailySummaryOutput,
} from './dailyLoopRules';

function main(): void {
  const input = loadDailyRevenueLoopInput();
  const summary = buildDailyRevenueSummary(input);
  const outputPath = writeDailySummaryOutput(summary);

  console.log(`Daily revenue summary generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Contacts tracked: ${summary.metrics.contactsAdded}`);
  console.log(`Outreach records tracked: ${summary.metrics.outreachTracked}`);
  console.log('Summary reads local files only. No conversations, meetings, revenue, or client interest were invented.');
}

main();
