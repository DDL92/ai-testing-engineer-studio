import path = require('path');
import { buildAdaptiveRevenueReport, writeAdaptiveRecommendationsOutput } from './adaptiveRules';

function main(): void {
  const report = buildAdaptiveRevenueReport();
  const outputPaths = writeAdaptiveRecommendationsOutput(report);

  console.log('Adaptive recommendations generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Recommendation: ${report.adaptiveRecommendation}`);
  console.log('Adaptive recommendations are local-only and require human approval before external action.');
}

main();
