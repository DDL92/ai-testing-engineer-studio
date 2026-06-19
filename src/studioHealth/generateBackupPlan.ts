import { buildStudioHealthReport, writeStudioHealthReports } from './healthRules';

const report = buildStudioHealthReport();
writeStudioHealthReports(report);
console.log('Backup plan generated: output/studio-health/backup-plan.md');
