import path = require('path');
import { buildAdaptiveRevenueReport, writeAdaptiveOfferScoresOutput } from './adaptiveRules';

function main(): void {
  const report = buildAdaptiveRevenueReport();
  const outputPaths = writeAdaptiveOfferScoresOutput(report);

  console.log('Adaptive offer scores generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Best performing offer: ${report.bestPerformingOffer}`);
}

main();
