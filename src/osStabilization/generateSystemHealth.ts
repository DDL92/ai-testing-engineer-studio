import path = require('path');
import { buildOsStabilizationReport, writeSystemHealthOutput } from './stabilizationRules';

function main(): void {
  const report = buildOsStabilizationReport();
  const outputPath = writeSystemHealthOutput(report);

  console.log(`Studio OS system health generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Overall health: ${report.healthAreas.some((area) => area.status === 'RED') ? 'RED' : report.healthAreas.some((area) => area.status === 'YELLOW') ? 'YELLOW' : 'GREEN'}`);
  console.log(`Readiness score: ${report.readinessScore.score}/100`);
  console.log('Health check only. No business data was modified.');
}

main();
