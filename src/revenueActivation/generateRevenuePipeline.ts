import path = require('path');
import {
  buildRevenueActivationReport,
  writeRevenuePipelineOutputs,
} from './revenueRules';

function main(): void {
  const report = buildRevenueActivationReport();
  const outputPaths = writeRevenuePipelineOutputs(report);

  console.log('Revenue pipeline generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Top company: ${report.pipeline[0]?.companyName ?? 'none'}`);
  console.log(`Top activation score: ${report.pipeline[0]?.activationScore ?? 0}/100`);
  console.log('Pipeline values are readiness scores, not booked revenue.');
}

main();
