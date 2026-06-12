import path = require('path');
import {
  buildActionCockpitReport,
  loadActionCockpitInput,
  writeApprovalQueueOutput,
} from './actionCockpitRules';

function main(): void {
  const input = loadActionCockpitInput();
  const report = buildActionCockpitReport(input);
  const outputPath = writeApprovalQueueOutput(report);

  console.log(`Approval queue generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Approval queue items: ${report.approvalQueue.length}`);
  console.log('Never auto-approve. Human approval only.');
  console.log('No APIs, CRM, outreach automation, sending, external databases, credentials, payments, or invoices were used.');
}

main();
