import path = require('path');
import { buildAdaptiveRevenueReport, writeAdaptiveCategoryScoresOutput } from './adaptiveRules';

function main(): void {
  const report = buildAdaptiveRevenueReport();
  const outputPaths = writeAdaptiveCategoryScoresOutput(report);

  console.log('Adaptive category scores generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Best performing category: ${report.bestPerformingCategory}`);
}

main();
