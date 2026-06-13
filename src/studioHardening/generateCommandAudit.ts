import path = require('path');
import { buildHardeningReport, writeCommandAudit } from './hardeningRules';

function main(): void {
  const report = buildHardeningReport();
  const outputPaths = writeCommandAudit(report);
  const missing = report.commandAudit.filter((item) => item.status !== 'Ready').length;

  console.log(`Command audit generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Commands needing review: ${missing}`);
  console.log('Command wiring audit only. It did not run outreach or external actions.');
}

main();
