import path = require('path');
import { buildRevenueIntelligenceReport, writeLeadExecutionPriorityOutput } from './revenueIntelligenceRules';

function main(): void {
  const report = buildRevenueIntelligenceReport();
  const outputs = writeLeadExecutionPriorityOutput(report);
  console.log('Revenue execution priority generated.');
  for (const output of outputs) console.log(`- ${path.relative(process.cwd(), output)}`);
  console.log(`Execution priority: ${report.executionPriority}`);
  console.log('No outreach, meetings, invoices, payments, outcomes, or revenue were created.');
}

main();
