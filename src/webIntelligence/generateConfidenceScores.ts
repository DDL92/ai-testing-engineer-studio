import path = require('path');
import { buildWebIntelligenceReport, writeWebIntelligenceReports } from './intelligenceRules';

function main(): void {
  const report = buildWebIntelligenceReport();
  const outputPaths = writeWebIntelligenceReports(report);
  const outputPath = outputPaths.find((item) => item.endsWith('confidence-scores.md'));
  console.log(`Confidence scores generated: ${outputPath ? path.relative(process.cwd(), outputPath) : 'not found'}`);
  console.log(`Evidence confidence: ${report.readiness.evidenceConfidence}/100`);
}

main();
