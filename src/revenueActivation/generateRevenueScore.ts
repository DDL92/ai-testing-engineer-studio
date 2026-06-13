import path = require('path');
import {
  buildRevenueActivationReport,
  writeRevenueScoreOutputs,
} from './revenueRules';

function main(): void {
  const report = buildRevenueActivationReport();
  const outputPaths = writeRevenueScoreOutputs(report);

  console.log('Revenue score generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Companies scored: ${report.pipeline.length}`);
  console.log(`Top revenue target: ${report.pipeline[0]?.companyName ?? 'none'}`);
  console.log('Scores use local Studio data only and do not invent client interest.');
}

main();
