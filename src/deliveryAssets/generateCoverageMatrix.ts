import { buildDeliveryAssetsReport, writeDeliveryAssetsOutputs } from './assetRules';

const report = buildDeliveryAssetsReport();
writeDeliveryAssetsOutputs(report);
console.log('Coverage matrix generated: output/delivery-assets/coverage-matrix.md');
console.log(`Critical flows: ${report.coverage.length}`);
