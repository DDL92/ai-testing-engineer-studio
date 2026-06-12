import path = require('path');
import { buildOsStabilizationReport, writeSystemAuditOutputs } from './stabilizationRules';

function main(): void {
  const report = buildOsStabilizationReport();
  const outputPaths = writeSystemAuditOutputs(report);

  console.log('Studio OS system audit generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Readiness score: ${report.readinessScore.score}/100`);
  console.log(`Critical issues: ${report.criticalIssues.length}`);
  console.log(`Warnings: ${report.warnings.length}`);
  console.log('Audit only. No business data was modified.');
  console.log('No APIs, CRM, outreach automation, sending, payments, credentials, or external databases were used.');
}

main();
