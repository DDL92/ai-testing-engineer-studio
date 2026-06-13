import path = require('path');
import { buildOutcomeSummary, loadOutcomes, writeOutcomeReviewOutputs } from './outcomeRules';

function main(): void {
  const records = loadOutcomes();
  const summary = buildOutcomeSummary(records);
  const outputPaths = writeOutcomeReviewOutputs(summary, records);

  console.log(`Outcome review generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(summary.hasOutcomes ? `Wins: ${summary.wins}; losses: ${summary.losses}` : 'No outcomes recorded yet.');
  console.log('Review only. No replies, meetings, revenue, client interest, or outcomes were invented.');
}

main();
