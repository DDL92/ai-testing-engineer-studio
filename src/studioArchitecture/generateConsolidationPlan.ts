import path = require('path');
import { buildArchitectureAudit, writeArchitectureReports } from './architectureRules';

function main(): void {
  const audit = buildArchitectureAudit();
  const outputPaths = writeArchitectureReports(audit);
  const outputPath = outputPaths.find((item) => item.endsWith('consolidation-plan.md'));

  console.log(`Consolidation plan generated: ${outputPath ? path.relative(process.cwd(), outputPath) : 'not found'}`);
  console.log(`Candidate deprecations: ${audit.commandInventory.candidateDeprecations.length}`);
}

main();
