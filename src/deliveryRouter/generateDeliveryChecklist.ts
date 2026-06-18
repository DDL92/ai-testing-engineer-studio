import { buildDeliveryRouterReport, writeDeliveryRouterOutputs } from './routerRules';

function main(): void {
  const report = buildDeliveryRouterReport();
  writeDeliveryRouterOutputs(report);
  console.log('Delivery checklist generated: output/delivery-router/delivery-checklist.md');
  console.log(`Client: ${report.client.clientName}`);
  console.log(`Delivery readiness: ${report.readiness}`);
}

main();
