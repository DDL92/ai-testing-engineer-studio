import path = require('path');
import { buildOutcomeLearningAnalysis, writeLeadPerformanceOutput } from './learningRules';

function main(): void {
  const analysis = buildOutcomeLearningAnalysis();
  const outputPaths = writeLeadPerformanceOutput(analysis);

  console.log('Lead performance generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Lead segments: ${analysis.byLead.length}`);
}

main();
