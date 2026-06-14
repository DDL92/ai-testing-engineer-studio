import path = require('path');
import { buildRevenueIntelligenceReport, writeRevenueDecisionOutput } from './revenueIntelligenceRules';

function main(): void {
  const report = buildRevenueIntelligenceReport();
  const outputs = writeRevenueDecisionOutput(report);
  console.log('Revenue decision generated.');
  for (const output of outputs) console.log(`- ${path.relative(process.cwd(), output)}`);
  console.log(`Decision: ${report.decision.status}`);
  console.log('Decision is manual-review only. Nothing was sent or created externally.');
}

main();
