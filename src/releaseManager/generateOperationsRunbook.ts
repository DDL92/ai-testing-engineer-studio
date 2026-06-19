import { buildStudioReleaseReport, renderOperationsRunbook, writeDocument } from './releaseRules';
const report = buildStudioReleaseReport();
writeDocument('studio-operations-runbook.md', renderOperationsRunbook(report), true);
console.log('Studio operations runbook generated.');
