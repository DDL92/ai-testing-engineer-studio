import path = require('path');
import { buildTopLeadAuditPackage, writeTopLeadEvidenceOutput } from './topLeadAuditRules';

function main(): void {
  const audit = buildTopLeadAuditPackage();
  const outputPaths = writeTopLeadEvidenceOutput();

  console.log('Top lead evidence generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Company: ${audit.companyName}`);
  console.log('Local preparation only. No outreach, browsing automation, emails, CRM records, invoices, payments, outcomes, or revenue were created.');
}

main();
