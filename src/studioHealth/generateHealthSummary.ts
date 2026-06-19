import { buildStudioHealthReport, writeStudioHealthReports } from './healthRules';

const report = buildStudioHealthReport();
writeStudioHealthReports(report);
console.log('Studio health reports generated: output/studio-health/');
console.log(`Health Score: ${report.score}/100`);
console.log(`Doctor Status: ${report.doctorStatus}`);
