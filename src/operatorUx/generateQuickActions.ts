import path = require('path');
import { buildOperatorUxSummary, writeQuickActions } from './uxRules';

function main(): void {
  const summary = buildOperatorUxSummary();
  const outputPaths = writeQuickActions(summary);

  console.log(`Quick actions generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Quick actions: ${summary.quickActions.length}`);
  console.log('Commands are suggestions only and no external actions were run.');
}

main();
