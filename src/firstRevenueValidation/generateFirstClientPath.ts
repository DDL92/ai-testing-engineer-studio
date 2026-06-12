import path = require('path');
import { buildFirstRevenueValidationReport, writeFirstRevenueValidationOutputs } from './firstRevenueValidationRules';

function main(): void {
  const report = buildFirstRevenueValidationReport();
  const outputPaths = writeFirstRevenueValidationOutputs(report);

  console.log('First Client Path generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Best first-client target: ${report.bestFirstClientTarget?.company ?? 'none'}`);
  console.log(`Next command: ${report.bestFirstClientTarget?.nextCommand ?? 'none'}`);
  console.log('No outreach was sent. No contacts, facts, findings, or revenue were invented.');
  console.log('Human approval is required before external action.');
}

main();
