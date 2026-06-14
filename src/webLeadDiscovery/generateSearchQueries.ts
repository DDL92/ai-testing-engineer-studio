import path = require('path');
import { buildWebLeadDiscoveryReport, writeSearchQueryOutputs } from './webDiscoveryRules';

function main(): void {
  const report = buildWebLeadDiscoveryReport();
  const outputPaths = writeSearchQueryOutputs(report);

  console.log('Web lead search queries generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Status: ${report.status}`);
  console.log('No web scraping, outreach, email, CRM, or external action was performed.');
}

main();
