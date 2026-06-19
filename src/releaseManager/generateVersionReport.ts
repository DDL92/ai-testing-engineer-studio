import { buildStudioReleaseReport, renderVersionReport, writeDocument } from './releaseRules';
const report = buildStudioReleaseReport();
writeDocument('version-report.md', renderVersionReport(report));
console.log(`Version report generated: ${report.metrics.commandCount} commands, ${report.metrics.moduleCount} modules.`);
