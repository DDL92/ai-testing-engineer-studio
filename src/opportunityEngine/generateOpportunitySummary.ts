import path = require('path');
import { buildOpportunitySummary, writeOpportunitySummary } from './opportunityEngineRules';

function main(): void {
  const summary = buildOpportunitySummary();
  const outputPaths = writeOpportunitySummary(summary);

  console.log(`Opportunity summary generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Companies: ${summary.reports.length}`);
  console.log(`Top opportunity: ${summary.commercialPriorities[0]?.companyName ?? 'none'}`);
  console.log('No outreach was sent. Human approval is required before any external action.');
}

main();
