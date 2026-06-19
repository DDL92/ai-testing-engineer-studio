import { buildStudioReleaseReport, renderReleaseSummary, writeDocument, writeReleaseDocuments } from './releaseRules';
const report = buildStudioReleaseReport();
writeReleaseDocuments(report);
writeDocument('release-summary.md', renderReleaseSummary(report));
console.log(`Studio ${report.version} release summary generated: ${report.releaseStatus}.`);
