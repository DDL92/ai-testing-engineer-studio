import { buildStudioHealthReport, writeStudioHealthReports } from './healthRules';

const report = buildStudioHealthReport();
writeStudioHealthReports(report);
console.log('Cleanup plan generated: output/studio-health/cleanup-plan.md');
console.log('No files were deleted or moved.');
