import path = require('path');
import { buildOutreachReviewReport, writeOutreachReviewOutputs } from './outreachReviewRules';

function main(): void {
  const report = buildOutreachReviewReport();
  const outputPaths = writeOutreachReviewOutputs(report);

  console.log('Outreach Execution Review generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Contact decision: ${report.contactDecision.outcome}`);
  console.log(`Send readiness: ${report.readyPercentage}% ready / ${report.notReadyPercentage}% not ready`);
  console.log('No outreach was sent. No contacts, findings, metrics, revenue, or company facts were invented.');
  console.log('Human approval is required before external action.');
}

main();
