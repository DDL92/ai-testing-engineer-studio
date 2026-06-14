import path = require('path');
import { buildOutcomeLearningAnalysis, writeOfferPerformanceOutput } from './learningRules';

function main(): void {
  const analysis = buildOutcomeLearningAnalysis();
  const outputPaths = writeOfferPerformanceOutput(analysis);

  console.log('Offer performance generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Top performing offer: ${analysis.topPerformingOffer}`);
}

main();
