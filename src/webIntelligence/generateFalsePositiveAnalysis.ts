import path = require('path');
import { buildWebIntelligenceReport, writeWebIntelligenceReports } from './intelligenceRules';

function main(): void {
  const report = buildWebIntelligenceReport();
  const outputPaths = writeWebIntelligenceReports(report);
  const outputPath = outputPaths.find((item) => item.endsWith('false-positive-analysis.md'));
  console.log(`False-positive analysis generated: ${outputPath ? path.relative(process.cwd(), outputPath) : 'not found'}`);
  console.log(`Suspicious: ${report.suspiciousEvidence.length}, rejected: ${report.rejectedEvidence.length}`);
}

main();
