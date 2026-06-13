import path = require('path');
import { buildStudioSnapshotReport, writeInventoryReports } from './snapshotRules';

function main(): void {
  const report = buildStudioSnapshotReport();
  const outputPaths = writeInventoryReports(report);

  console.log(`Inventory reports generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Commands inventoried: ${report.commands.length}`);
  console.log(`Data sources inventoried: ${report.dataSources.length}`);
  console.log(`Output sources inventoried: ${report.outputSources.length}`);
}

main();
