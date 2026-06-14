import path = require('path');
import { buildLeadQualificationReport, writeQaOpportunityOutput } from './normalizationRules';

function main(): void {
  const report = buildLeadQualificationReport();
  const outputPaths = writeQaOpportunityOutput(report);
  console.log('QA opportunity scores generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Highest QA opportunity: ${report.topQualifiedLeads[0]?.normalizedName ?? 'none'}`);
}

main();
