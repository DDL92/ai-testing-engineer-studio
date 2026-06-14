import path = require('path');
import { buildPainMiningReport, writePainSummaryOutputs } from './painMiningRules';

function main(): void {
  const report = buildPainMiningReport();
  const outputPaths = writePainSummaryOutputs(report);

  console.log('Pain signal analysis generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Top pain signal: ${report.topSignal ? report.topSignal.category : 'none'}`);
  console.log('Analysis uses cautious language only and requires human approval before client-facing use.');
}

main();
