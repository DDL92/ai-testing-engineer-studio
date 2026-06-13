import path = require('path');
import {
  buildRevenueActivationReport,
  writeRevenueTargetsOutputs,
} from './revenueRules';

function main(): void {
  const report = buildRevenueActivationReport();
  const outputPaths = writeRevenueTargetsOutputs(report);

  console.log('Revenue targets generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Top target: ${report.targets.find((target) => target.status === 'Current Focus')?.title ?? report.targets[0]?.title}`);
  console.log(`Current MRR from local finance data: $${report.currentMrr.toLocaleString('en-US')}`);
  console.log('Revenue planning only. No outreach, emails, proposals, invoices, or payments were sent.');
}

main();
