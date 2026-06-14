import path = require('path');
import { buildLeadQualificationReport, writeQualifiedRankingOutput } from './normalizationRules';

function main(): void {
  const report = buildLeadQualificationReport();
  const outputPaths = writeQualifiedRankingOutput(report);
  console.log('Qualified web lead ranking generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Top qualified lead: ${report.topQualifiedLeads[0]?.normalizedName ?? 'none'}`);
  console.log(`Best offer: ${report.bestOffer}`);
}

main();
