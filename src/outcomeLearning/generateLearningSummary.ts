import path = require('path');
import { buildOutcomeLearningAnalysis, writeLearningSummaryOutput } from './learningRules';

function main(): void {
  const analysis = buildOutcomeLearningAnalysis();
  const outputPaths = writeLearningSummaryOutput(analysis);

  console.log('Outcome learning summary generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Reply rate: ${analysis.hasOutcomes ? `${analysis.overall.replyRate}%` : 'No outcomes recorded yet.'}`);
  console.log('Summary is local-only and does not infer outcomes.');
}

main();
