import path = require('path');
import { buildFollowUpOperatingReport, writeFollowUpReviewOutput } from './followUpRules';

function main(): void {
  const report = buildFollowUpOperatingReport();
  const outputPaths = writeFollowUpReviewOutput(report);

  console.log(`Follow-up review generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Biggest opportunity: ${report.review.biggestOpportunity}`);
  console.log('Review only. No sending actions, meetings, invoices, payments, revenue claims, or outcome changes were made.');
}

main();
