import path = require('path');
import { buildWinLossReport, writeOpportunityInsights } from './winLossRules';

function main(): void {
  const report = buildWinLossReport();
  const outputPaths = writeOpportunityInsights(report);

  console.log(`Opportunity insights generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(report.hasEnoughData ? report.recommendations.mostPromisingNextTargetProfile : report.insufficientDataMessage);
  console.log('Evidence-based local insights only. No revenue, clients, or outcomes were invented.');
}

main();
