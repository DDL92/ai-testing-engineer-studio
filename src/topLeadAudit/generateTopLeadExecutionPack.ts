import path = require('path');
import { buildTopLeadAuditPackage, writeTopLeadExecutionPackOutput } from './topLeadAuditRules';

function main(): void {
  const outputPaths = writeTopLeadExecutionPackOutput();
  const audit = buildTopLeadAuditPackage();

  console.log('Top lead execution pack generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Company: ${audit.companyName}`);
  console.log(`GO / NO GO: ${audit.goNoGo}`);
  console.log('Execution pack is manual-review only. No outreach, emails, meetings, invoices, payments, outcomes, or revenue were created.');
}

main();
