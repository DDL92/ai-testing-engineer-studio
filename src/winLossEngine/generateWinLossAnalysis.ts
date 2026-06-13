import path = require('path');
import { buildWinLossReport, writeWinLossAnalysis } from './winLossRules';

function main(): void {
  const report = buildWinLossReport();
  const outputPaths = writeWinLossAnalysis(report);

  console.log(`Win/loss analysis generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(report.hasEnoughData ? `Win rate: ${report.metrics.closeRate}` : report.insufficientDataMessage);
  console.log('Local analysis only. No outreach, replies, meetings, revenue, clients, or outcomes were created.');
}

main();
