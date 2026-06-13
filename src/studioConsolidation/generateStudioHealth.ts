import path = require('path');
import {
  buildStudioConsolidationReport,
  writeStudioHealthOutputs,
} from './studioRules';

function main(): void {
  const report = buildStudioConsolidationReport();
  const outputPaths = writeStudioHealthOutputs(report);

  console.log('Studio health generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Modules healthy: ${report.modules.filter((module) => module.status === 'Healthy').length}/${report.modules.length}`);
  console.log(`Commands present: ${report.commands.filter((command) => command.status === 'Present').length}/${report.commands.length}`);
  console.log('Local-only health check. No sending, invoices, payments, or external actions were performed.');
}

main();
