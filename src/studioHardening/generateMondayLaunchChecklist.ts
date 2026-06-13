import path = require('path');
import { buildHardeningReport, writeMondayChecklist } from './hardeningRules';

function main(): void {
  const report = buildHardeningReport();
  const outputPaths = writeMondayChecklist(report);

  console.log(`Monday launch checklist generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log('Decision: SEND / WAIT / REWRITE requires Daniel approval.');
  console.log('No automated outreach was sent.');
}

main();
