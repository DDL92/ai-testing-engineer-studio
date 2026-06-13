import path = require('path');
import { buildOperatorUxSummary, writeSystemHighlights } from './uxRules';

function main(): void {
  const summary = buildOperatorUxSummary();
  const outputPaths = writeSystemHighlights(summary);

  console.log(`System highlights generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Studio status: ${summary.studioStatus}`);
  console.log('Highlights are local summaries only.');
}

main();
