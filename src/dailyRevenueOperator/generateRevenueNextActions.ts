import path = require('path');
import {
  buildDailyRevenueOperatorReport,
  loadDailyRevenueInput,
  writeRevenueNextActionsOutput,
} from './dailyRevenueOperatorRules';

function main(): void {
  const input = loadDailyRevenueInput();
  const report = buildDailyRevenueOperatorReport(input);
  const outputPath = writeRevenueNextActionsOutput(report);

  console.log(`Revenue next actions generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Actions: ${report.recommendedActions.length}`);
  console.log(`Top action: ${report.recommendedActions[0]?.title ?? 'none'}`);
  console.log('Next actions are local recommendations only. No guarantees and no external action.');
  console.log('Human approval is required before external action.');
}

main();
