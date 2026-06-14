import path = require('path');
import { buildWebIntelligenceReport, writeWebIntelligenceReports } from './intelligenceRules';

function main(): void {
  const report = buildWebIntelligenceReport();
  const outputPaths = writeWebIntelligenceReports(report);
  const outputPath = outputPaths.find((item) => item.endsWith('evidence-validation.md'));
  console.log(`Evidence validation generated: ${outputPath ? path.relative(process.cwd(), outputPath) : 'not found'}`);
  console.log(`Accepted: ${report.acceptedEvidence.length}, suspicious: ${report.suspiciousEvidence.length}, rejected: ${report.rejectedEvidence.length}`);
}

main();
