import path = require('path');
import {
  buildWeeklyRevenueReview,
  loadDailyRevenueLoopInput,
  writeWeeklyReviewOutput,
} from './dailyLoopRules';

function main(): void {
  const input = loadDailyRevenueLoopInput();
  const review = buildWeeklyRevenueReview(input);
  const outputPath = writeWeeklyReviewOutput(review);

  console.log(`Weekly revenue review generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Top opportunities: ${review.topOpportunities.length}`);
  console.log(`Research gaps: ${review.researchGaps.length}`);
  console.log(`Evidence gaps: ${review.evidenceGaps.length}`);
  console.log('Weekly review is local planning only. It does not send outreach, proposals, invoices, payment links, or external actions.');
}

main();
