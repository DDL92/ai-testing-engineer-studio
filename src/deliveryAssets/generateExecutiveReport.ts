import { buildDeliveryAssetsReport, writeDeliveryAssetsOutputs } from './assetRules';

const report = buildDeliveryAssetsReport();
writeDeliveryAssetsOutputs(report);
console.log('Client executive report generated: output/delivery-assets/client-executive-report.md');
console.log(`Client: ${report.client.clientName}`);
