import fs = require('fs');
import path = require('path');
import { buildCommercialConsistencyReport, commercialConsistencyOutputDir, renderRepairRecommendations } from './consistencyRules';
const report = buildCommercialConsistencyReport();
fs.mkdirSync(commercialConsistencyOutputDir, { recursive: true });
const outputPath = path.join(commercialConsistencyOutputDir, 'repair-recommendations.md');
fs.writeFileSync(outputPath, renderRepairRecommendations(report), 'utf8');
console.log(`Repair recommendations generated: ${report.repairRecommendations.length}. No repairs applied.`);
