import path = require('path');
import { buildOperatorUxSummary, writeOperatorCockpit } from './uxRules';

function main(): void {
  const summary = buildOperatorUxSummary();
  const outputPaths = writeOperatorCockpit(summary);

  console.log(`Operator cockpit generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Focus: ${summary.topLead} - ${summary.topOffer}`);
  console.log('Cockpit is read-only. No workflow or business logic was changed.');
}

main();
