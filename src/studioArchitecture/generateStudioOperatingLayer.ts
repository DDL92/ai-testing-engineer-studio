import path = require('path');
import { buildArchitectureAudit, writeArchitectureReports } from './architectureRules';

function main(): void {
  const audit = buildArchitectureAudit();
  const outputPaths = writeArchitectureReports(audit);
  const outputPath = outputPaths.find((item) => item.endsWith('operating-layer.md'));

  console.log(`Studio operating layer generated: ${outputPath ? path.relative(process.cwd(), outputPath) : 'not found'}`);
  console.log('Daily, weekly, and monthly loops documented.');
}

main();
