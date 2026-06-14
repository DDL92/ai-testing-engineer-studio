import path = require('path');
import { buildRevenueIntelligenceReport, writeTopLeadOutput } from './revenueIntelligenceRules';

function main(): void {
  const report = buildRevenueIntelligenceReport();
  const outputs = writeTopLeadOutput(report);
  console.log('Revenue top lead generated.');
  for (const output of outputs) console.log(`- ${path.relative(process.cwd(), output)}`);
  console.log(`Current top lead: ${report.topLead?.companyName ?? 'none'}`);
  console.log('Local-only recommendation. No outreach or client activity was created.');
}

main();
