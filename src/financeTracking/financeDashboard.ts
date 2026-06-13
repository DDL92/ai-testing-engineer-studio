import path = require('path');
import {
  buildFinanceReport,
  loadFinanceInput,
  writeFinanceDashboardOutputs,
} from './financeRules';

function main(): void {
  const report = buildFinanceReport(loadFinanceInput());
  const outputPaths = writeFinanceDashboardOutputs(report);

  console.log('Finance dashboard generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Current MRR: $${report.currentMrr.toLocaleString('en-US')}`);
  console.log(`Target MRR progress: ${report.targetMrrProgressPercent.toFixed(1)}%`);
  console.log(`Retainer candidates: ${report.retainerCandidates.length}`);
  console.log(`Audit candidates: ${report.auditCandidates.length}`);
  console.log('Candidates and forecasts are not booked revenue.');
}

main();
