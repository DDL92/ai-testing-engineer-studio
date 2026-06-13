import path = require('path');
import { buildHardeningReport, writeHardeningReport } from './hardeningRules';

function main(): void {
  const report = buildHardeningReport();
  const outputPaths = writeHardeningReport(report);

  console.log(`Studio hardening report generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Overall status: ${report.overallStatus}`);
  console.log(`Critical issues: ${report.criticalIssues.length}`);
  console.log(`Warnings: ${report.warnings.length}`);
  console.log('Local readiness audit only. No outreach, emails, proposals, invoices, payments, replies, or revenue were created.');
}

main();
