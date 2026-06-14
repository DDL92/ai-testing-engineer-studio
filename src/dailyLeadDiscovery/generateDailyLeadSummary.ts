import path = require('path');
import { buildDailyLeadDiscoveryReport, writeDailySummaryOutputs } from './discoveryRules';

function main(): void {
  const report = buildDailyLeadDiscoveryReport();
  const outputPaths = writeDailySummaryOutputs(report);

  console.log('Daily lead discovery summary generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Recommended next action: ${report.recommendedNextAction}`);
  console.log('Summary is local-first and review-only. No leads were contacted or promoted automatically.');
}

main();
