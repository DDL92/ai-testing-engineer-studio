import path = require('path');
import {
  buildFirstAuditWorkflowReport,
  loadFirstAuditWorkflowInput,
  writeFirstAuditWorkflowOutputs,
} from './firstAuditWorkflowRules';

function main(): void {
  const input = loadFirstAuditWorkflowInput();
  const report = buildFirstAuditWorkflowReport(input);
  const outputPaths = writeFirstAuditWorkflowOutputs(report);

  console.log('First Audit Workflow generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Leads reviewed: ${report.leadsReviewed}`);
  console.log(`Clients reviewed: ${report.clientsReviewed}`);
  console.log('No payments were processed. No invoices were generated. No findings, defects, clients, or outcomes were invented.');
}

main();
