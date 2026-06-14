import path = require('path');
import { buildArchitectureAudit, writeArchitectureReports } from './architectureRules';

function main(): void {
  const audit = buildArchitectureAudit();
  const outputPaths = writeArchitectureReports(audit);
  const outputPath = outputPaths.find((item) => item.endsWith('command-inventory.md'));

  console.log(`Command inventory generated: ${outputPath ? path.relative(process.cwd(), outputPath) : 'not found'}`);
  console.log(`Duplicate command groups: ${audit.commandInventory.duplicateCommandGroups.length}`);
  console.log(`Legacy commands: ${audit.commandInventory.legacyCommands.length}`);
}

main();
