import path = require('path');
import { buildWinLossReport, writePatternAnalysis } from './winLossRules';

function main(): void {
  const report = buildWinLossReport();
  const outputPaths = writePatternAnalysis(report);

  console.log(`Pattern analysis generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(report.hasEnoughData ? `Reply patterns: ${report.replyPatterns.length}` : report.insufficientDataMessage);
  console.log('Only local supported patterns were reported. No outcomes were invented.');
}

main();
