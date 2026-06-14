import { buildLeadQualificationReport, writeNormalizedLeads } from './normalizationRules';

function main(): void {
  const report = buildLeadQualificationReport();
  const outputPaths = writeNormalizedLeads(report);
  console.log('Normalized web leads generated.');
  for (const outputPath of outputPaths) console.log(`- ${outputPath}`);
  console.log(`Normalized leads: ${report.normalizedLeads.length}`);
  console.log(`Duplicates removed: ${report.duplicatesRemoved}`);
}

main();
