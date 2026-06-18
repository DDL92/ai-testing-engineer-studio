import path = require('path');
import { buildDeliveryRouterReport, writeDeliveryRouterOutputs } from './routerRules';

function main(): void {
  const report = buildDeliveryRouterReport();
  const outputPaths = writeDeliveryRouterOutputs(report);
  console.log('Delivery plan generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Client: ${report.client.clientName}`);
  console.log(`Package: ${report.client.selectedPackage}`);
  console.log(`Delivery readiness: ${report.readiness}`);
  console.log('Preparation only. No client work, repository changes, invoices, payments, or external actions were performed.');
}

main();
