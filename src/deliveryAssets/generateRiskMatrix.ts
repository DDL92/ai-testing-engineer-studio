import { buildDeliveryAssetsReport, writeDeliveryAssetsOutputs } from './assetRules';

const report = buildDeliveryAssetsReport();
writeDeliveryAssetsOutputs(report);
console.log('Risk matrix generated: output/delivery-assets/risk-matrix.md');
console.log(`Risk areas: ${report.risks.length}`);
