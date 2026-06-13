import path = require('path');
import { buildStudioSnapshotReport, writeRecoveryCheck } from './snapshotRules';

function main(): void {
  const report = buildStudioSnapshotReport();
  const outputPaths = writeRecoveryCheck(report);

  console.log(`Recovery check generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Recovery status: ${report.recoveryStatus}`);
  console.log('Recovery check only. No outreach, finance, or outcome records were modified.');
}

main();
