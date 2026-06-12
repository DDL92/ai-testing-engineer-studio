import path = require('path');
import { buildOutreachReviewReport, writeOutreachReviewOutputs } from './outreachReviewRules';

function main(): void {
  const report = buildOutreachReviewReport();
  const outputPaths = writeOutreachReviewOutputs(report);

  console.log('Contact Decision generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Decision: ${report.contactDecision.outcome}`);
  console.log(`Confidence: ${report.contactDecision.confidence}`);
  console.log(`Next action: ${report.contactDecision.nextAction}`);
  console.log('No outreach was sent. No contact details or findings were invented.');
  console.log('Human approval is required before external action.');
}

main();
