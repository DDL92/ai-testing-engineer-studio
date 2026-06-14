import path = require('path');
import { buildWebLeadDiscoveryReport, writeWebDiscoverySummaryOutputs } from './webDiscoveryRules';

function main(): void {
  const report = buildWebLeadDiscoveryReport();
  const outputPaths = writeWebDiscoverySummaryOutputs(report);

  console.log('Web discovery summary generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Recommended research action: ${report.recommendedResearchAction}`);
  console.log('Summary is review-only and local-first.');
}

main();
