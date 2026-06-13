import path = require('path');
import {
  buildFinanceReport,
  loadFinanceInput,
  writeFinanceForecastOutputs,
} from './financeRules';

function main(): void {
  const report = buildFinanceReport(loadFinanceInput());
  const outputPaths = writeFinanceForecastOutputs(report);

  console.log('Finance forecast generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Current MRR: $${report.currentMrr.toLocaleString('en-US')}`);
  console.log(`Forecast scenarios: ${report.forecastScenarios.length}`);
  console.log('Forecast scenarios are planning math only, not booked revenue.');
  console.log('No payment, bank, invoice, Stripe, PayPal, or external finance system was used.');
}

main();
