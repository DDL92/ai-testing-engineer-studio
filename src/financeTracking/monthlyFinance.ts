import path = require('path');
import {
  buildFinanceReport,
  loadFinanceInput,
  writeMonthlyFinanceOutputs,
} from './financeRules';

function main(): void {
  const report = buildFinanceReport(loadFinanceInput());
  const outputPaths = writeMonthlyFinanceOutputs(report);

  console.log('Monthly finance generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Current MRR: $${report.currentMrr.toLocaleString('en-US')}`);
  console.log(`Projected monthly revenue: $${report.projectedMonthlyRevenue.toLocaleString('en-US')}`);
  console.log('Booked revenue was counted only from data/finance/finance.json.');
  console.log('No payments, invoices, payment links, banks, or external systems were used.');
}

main();
