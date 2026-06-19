import { buildDeliveryAssetsReport, writeDeliveryAssetsOutputs } from './assetRules';

const report = buildDeliveryAssetsReport();
writeDeliveryAssetsOutputs(report);
console.log('Onboarding checklist generated: output/delivery-assets/onboarding-checklist.md');
