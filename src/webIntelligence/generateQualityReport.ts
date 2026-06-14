import path = require('path');
import { buildWebIntelligenceReport, writeWebIntelligenceReports } from './intelligenceRules';

function main(): void {
  const report = buildWebIntelligenceReport();
  const outputPaths = writeWebIntelligenceReports(report);
  const outputPath = outputPaths.find((item) => item.endsWith('quality-report.md'));
  console.log(`Web intelligence quality report generated: ${outputPath ? path.relative(process.cwd(), outputPath) : 'not found'}`);
  console.log(`Readiness: ${report.readiness.status}`);
}

main();
