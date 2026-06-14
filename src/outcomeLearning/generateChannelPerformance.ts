import path = require('path');
import { buildOutcomeLearningAnalysis, writeChannelPerformanceOutput } from './learningRules';

function main(): void {
  const analysis = buildOutcomeLearningAnalysis();
  const outputPaths = writeChannelPerformanceOutput(analysis);

  console.log('Channel performance generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Top performing channel: ${analysis.topPerformingChannel}`);
}

main();
