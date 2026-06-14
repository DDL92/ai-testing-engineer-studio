import path = require('path');
import { buildArchitectureAudit, writeArchitectureReports } from './architectureRules';

function main(): void {
  const audit = buildArchitectureAudit();
  const outputPaths = writeArchitectureReports(audit);

  console.log('Architecture audit generated:');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Commands audited: ${audit.commandInventory.totalCommands}`);
  console.log(`Runtime files inventoried: ${audit.runtimeInventory.totalFiles}`);
}

main();
