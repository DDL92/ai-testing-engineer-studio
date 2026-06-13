import path = require('path');
import { buildStudioSnapshotReport, writeRebuildGuides } from './snapshotRules';

function main(): void {
  const report = buildStudioSnapshotReport();
  const outputPaths = writeRebuildGuides(report);

  console.log(`Rebuild guides generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log('Rebuild and disaster recovery documentation only.');
}

main();
