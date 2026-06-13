import path = require('path');
import { buildOutcomeSummary, loadOutcomes, writeOutcomeDashboardOutputs } from './outcomeRules';

function main(): void {
  const records = loadOutcomes();
  const summary = buildOutcomeSummary(records);
  const outputPaths = writeOutcomeDashboardOutputs(summary);

  console.log(`Outcome dashboard generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(summary.hasOutcomes ? `Messages sent: ${summary.messagesSent}; replies: ${summary.replies}; reply rate: ${summary.replyRate}` : 'No outcomes recorded yet.');
  console.log('Outcome dashboard is local-only. No messages, meetings, proposals, invoices, payments, replies, or revenue were created.');
}

main();
