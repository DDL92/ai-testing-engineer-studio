import { buildStudioHealthReport, writeStudioHealthReports } from './healthRules';

const report = buildStudioHealthReport();
writeStudioHealthReports(report);
console.log('Repair plan generated: output/studio-health/repair-plan.md');
console.log(`Recommendations: ${report.repairRecommendations.length}`);
