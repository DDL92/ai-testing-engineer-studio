import path = require('path');
import { buildWinLossReport, writeStrategyRecommendations } from './winLossRules';

function main(): void {
  const report = buildWinLossReport();
  const outputPaths = writeStrategyRecommendations(report);

  console.log(`Strategy recommendations generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Top recommendation: ${report.recommendations.topRecommendation}`);
  console.log('Strategy support only. Human approval remains required before external action.');
}

main();
