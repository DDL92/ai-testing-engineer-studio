import path = require('path');
import { buildLeadQualificationReport, writeQualificationOutput } from './normalizationRules';

function main(): void {
  const report = buildLeadQualificationReport();
  const outputPaths = writeQualificationOutput(report);
  console.log('Lead qualification generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Best qualified lead: ${report.topQualifiedLeads[0]?.normalizedName ?? 'none'}`);
}

main();
