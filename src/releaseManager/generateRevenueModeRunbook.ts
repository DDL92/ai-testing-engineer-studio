import { buildStudioReleaseReport, renderRevenueModeRunbook, writeDocument } from './releaseRules';
const report = buildStudioReleaseReport();
writeDocument('revenue-mode-runbook.md', renderRevenueModeRunbook(report), true);
console.log('Revenue Mode runbook generated.');
