import { buildDeliveryAssetsReport, writeDeliveryAssetsOutputs } from './assetRules';

const report = buildDeliveryAssetsReport();
writeDeliveryAssetsOutputs(report);
console.log('Delivery assets summary generated: output/delivery-assets/delivery-assets-summary.md');
console.log(`Status: ${report.status}`);
