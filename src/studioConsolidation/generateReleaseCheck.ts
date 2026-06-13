import path = require('path');
import {
  buildStudioConsolidationReport,
  writeReleaseCheckOutputs,
} from './studioRules';

function main(): void {
  const report = buildStudioConsolidationReport();
  const outputPaths = writeReleaseCheckOutputs(report);

  console.log('Studio release check generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Critical issues: ${report.releaseReadiness.criticalIssues.length}`);
  console.log(`Warnings: ${report.releaseReadiness.warnings.length}`);
  console.log(`Ready for audit sales: ${report.releaseReadiness.readyForAuditSales}`);
  console.log('Release check used local evidence only and did not invent revenue.');
}

main();
