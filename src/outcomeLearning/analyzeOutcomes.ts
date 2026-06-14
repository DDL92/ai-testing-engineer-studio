import path = require('path');
import { buildOutcomeLearningAnalysis, writeLearningAnalysisOutputs } from './learningRules';

function main(): void {
  const analysis = buildOutcomeLearningAnalysis();
  const outputPaths = writeLearningAnalysisOutputs(analysis);

  console.log('Outcome learning analysis generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Outcomes recorded: ${analysis.totalOutcomes}`);
  console.log('Analysis uses manual local outcomes only. No external actions were performed.');
}

main();
