import path = require('path');
import { buildLeadQualificationReport, writeClassificationOutput } from './normalizationRules';

function main(): void {
  const report = buildLeadQualificationReport();
  const outputPaths = writeClassificationOutput(report);
  console.log('Lead classification generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Best category: ${report.bestCategory}`);
}

main();
