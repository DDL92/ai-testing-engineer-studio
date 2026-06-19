import { runReleaseValidation } from './releaseRules';
const report = runReleaseValidation();
console.log(`Release validation: ${report.validationStatus}.`);
for (const result of report.validationResults) console.log(`${result.status}: ${result.command} (${result.durationMs} ms)`);
if (report.validationStatus === 'FAIL') process.exitCode = 1;
