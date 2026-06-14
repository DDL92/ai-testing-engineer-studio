import path = require('path');
import { buildPainMiningReport, writePainSummaryOutputs } from './painMiningRules';

function main(): void {
  const report = buildPainMiningReport();
  const outputPaths = writePainSummaryOutputs(report);

  console.log('Pain mining summary generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Recommended research action: ${report.recommendedResearchAction}`);
  console.log('No unsafe scraping, invented complaints, or outreach actions were performed.');
}

main();
