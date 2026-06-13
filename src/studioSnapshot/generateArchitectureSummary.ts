import path = require('path');
import { buildStudioSnapshotReport, writeArchitectureSummary } from './snapshotRules';

function main(): void {
  const report = buildStudioSnapshotReport();
  const outputPaths = writeArchitectureSummary(report);

  console.log(`Architecture summary generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Modules documented: ${report.majorModules.length}`);
  console.log('Architecture documentation only. No external actions were performed.');
}

main();
