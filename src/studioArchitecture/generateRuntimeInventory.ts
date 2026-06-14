import path = require('path');
import { buildArchitectureAudit, writeArchitectureReports } from './architectureRules';

function main(): void {
  const audit = buildArchitectureAudit();
  const outputPaths = writeArchitectureReports(audit);
  const outputPath = outputPaths.find((item) => item.endsWith('runtime-inventory.md'));

  console.log(`Runtime inventory generated: ${outputPath ? path.relative(process.cwd(), outputPath) : 'not found'}`);
  console.log(`Runtime files inventoried: ${audit.runtimeInventory.totalFiles}`);
  console.log(`Duplicate data candidates: ${audit.runtimeInventory.duplicateDataCandidates.length}`);
}

main();
