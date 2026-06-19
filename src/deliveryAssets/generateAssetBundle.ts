import { buildDeliveryAssetsReport, writeDeliveryAssetsOutputs } from './assetRules';

const report = buildDeliveryAssetsReport();
writeDeliveryAssetsOutputs(report);
console.log('Delivery asset bundle generated: output/delivery-assets/asset-bundle.md');
console.log(`Bundle status: ${report.status}`);
