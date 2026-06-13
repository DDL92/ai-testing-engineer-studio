import path = require('path');
import {
  buildRevenueActivationReport,
  writeRevenueFocusOutputs,
} from './revenueRules';

function main(): void {
  const report = buildRevenueActivationReport();
  const outputPaths = writeRevenueFocusOutputs(report);

  console.log('Revenue focus generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Priority 1: ${report.focusActions[0]?.title ?? 'none'} - ${report.focusActions[0]?.companyName ?? 'none'}`);
  console.log('30-minute focus is planning only. Human approval is required before external action.');
}

main();
