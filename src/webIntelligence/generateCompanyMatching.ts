import path = require('path');
import { buildWebIntelligenceReport, writeWebIntelligenceReports } from './intelligenceRules';

function main(): void {
  const report = buildWebIntelligenceReport();
  const outputPaths = writeWebIntelligenceReports(report);
  const outputPath = outputPaths.find((item) => item.endsWith('company-matching.md'));
  console.log(`Company matching generated: ${outputPath ? path.relative(process.cwd(), outputPath) : 'not found'}`);
  console.log(`Companies analyzed: ${report.companySummaries.length}`);
}

main();
