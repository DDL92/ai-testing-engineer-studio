import { buildStudioReleaseReport, renderStudioManifest, writeDocument } from './releaseRules';
const report = buildStudioReleaseReport();
writeDocument('studio-manifest.md', renderStudioManifest(report));
console.log('Studio v1 manifest generated.');
