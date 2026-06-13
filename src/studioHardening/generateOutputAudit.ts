import path = require('path');
import { buildHardeningReport, writeOutputAudit } from './hardeningRules';

function main(): void {
  const report = buildHardeningReport();
  const outputPaths = writeOutputAudit(report);
  const missing = report.outputAudit.filter((item) => item.status === 'Missing').length;

  console.log(`Output audit generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Missing outputs: ${missing}`);
  console.log(`Stale outputs: ${report.staleReports.length}`);
  console.log('Output audit only. No files were sent externally.');
}

main();
