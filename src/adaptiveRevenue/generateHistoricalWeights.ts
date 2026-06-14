import path = require('path');
import { buildAdaptiveRevenueReport, writeAdaptiveWeightsOutput } from './adaptiveRules';

function main(): void {
  const report = buildAdaptiveRevenueReport();
  const outputPaths = writeAdaptiveWeightsOutput(report);

  console.log('Adaptive historical weights generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Learning influence: ${report.weights.learningWeight}%`);
  console.log('No outreach, CRM records, meetings, invoices, payments, revenue, or outcomes were created.');
}

main();
