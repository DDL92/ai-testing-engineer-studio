import { buildStudioReleaseReport, renderReleaseNotes, renderV1Release, writeDocument } from './releaseRules';
const report = buildStudioReleaseReport();
writeDocument('release-notes.md', renderReleaseNotes(report));
writeDocument('v1-release.md', renderV1Release(report));
console.log(`Release notes generated for Studio ${report.version}.`);
