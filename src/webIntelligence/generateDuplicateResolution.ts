import path = require('path');
import { buildWebIntelligenceReport, writeWebIntelligenceReports } from './intelligenceRules';

function main(): void {
  const report = buildWebIntelligenceReport();
  const outputPaths = writeWebIntelligenceReports(report);
  const outputPath = outputPaths.find((item) => item.endsWith('duplicate-resolution.md'));
  console.log(`Duplicate resolution generated: ${outputPath ? path.relative(process.cwd(), outputPath) : 'not found'}`);
  console.log(`Duplicate/alias groups: ${report.duplicateResolution.duplicateGroups.length}`);
}

main();
