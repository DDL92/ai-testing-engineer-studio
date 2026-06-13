import path = require('path');
import { buildStudioSnapshotReport, writeStudioSnapshotOutputs } from './snapshotRules';

function main(): void {
  const report = buildStudioSnapshotReport();
  const outputPaths = writeStudioSnapshotOutputs(report);

  console.log(`Studio snapshot generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Project: ${report.projectName}`);
  console.log(`Version: ${report.currentVersion}`);
  console.log(`Recovery status: ${report.recoveryStatus}`);
  console.log('Read-only snapshot only. No outreach, financial records, or outcome records were modified.');
}

main();
