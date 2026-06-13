import path = require('path');
import {
  buildStudioConsolidationReport,
  writeStudioSummaryOutputs,
} from './studioRules';

function main(): void {
  const report = buildStudioConsolidationReport();
  const outputPaths = writeStudioSummaryOutputs(report);

  console.log('Studio summary generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Daily operation readiness: ${report.dailyOperation.canRunDaily}`);
  console.log(`Current MRR from local finance data: $${report.revenueReadiness.currentMrr.toLocaleString('en-US')}`);
  console.log('Summary is review-only. Human approval is required before external action.');
}

main();
