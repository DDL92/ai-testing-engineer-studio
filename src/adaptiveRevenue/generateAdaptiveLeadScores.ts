import path = require('path');
import { buildAdaptiveRevenueReport, writeAdaptiveLeadScoresOutput } from './adaptiveRules';

function main(): void {
  const report = buildAdaptiveRevenueReport();
  const outputPaths = writeAdaptiveLeadScoresOutput(report);

  console.log('Adaptive lead scores generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Top adaptive lead: ${report.leadScores[0]?.companyName ?? 'none'}`);
  console.log('Scores use local outcomes only. No external action was performed.');
}

main();
