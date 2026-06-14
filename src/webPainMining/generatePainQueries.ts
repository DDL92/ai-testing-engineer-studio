import path = require('path');
import { buildPainMiningReport, writePainQueryOutputs } from './painMiningRules';

function main(): void {
  const report = buildPainMiningReport();
  const outputPaths = writePainQueryOutputs(report);

  console.log('Pain mining search queries generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Status: ${report.status}`);
  console.log('No unsafe scraping, invented complaints, or outreach actions were performed.');
}

main();
