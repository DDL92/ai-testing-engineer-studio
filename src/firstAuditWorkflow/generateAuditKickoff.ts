import path = require('path');
import {
  buildFirstAuditWorkflowReport,
  loadFirstAuditWorkflowInput,
  writeAuditKickoffOutput,
} from './firstAuditWorkflowRules';

function main(): void {
  const input = loadFirstAuditWorkflowInput();
  const report = buildFirstAuditWorkflowReport(input);
  const outputPath = writeAuditKickoffOutput(report);

  console.log(`Audit kickoff plan generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log('Kickoff remains manual and requires scope, approval, and payment/invoice status review outside this workflow.');
}

main();
