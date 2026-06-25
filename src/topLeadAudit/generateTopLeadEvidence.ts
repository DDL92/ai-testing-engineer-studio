import path = require('path');
import { buildTopLeadAuditPackage, writeTopLeadEvidenceOutput } from './topLeadAuditRules';
import { collectEvidencePro } from '../evidencePro/evidenceProRules';

async function main(): Promise<void> {
  const evidence = await collectEvidencePro();
  const audit = buildTopLeadAuditPackage();
  const outputPaths = writeTopLeadEvidenceOutput();

  console.log('Top lead evidence generated.');
  console.log(`Evidence package company: ${evidence.target.companyName}`);
  console.log(`Evidence package status: ${evidence.status}`);
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Company: ${audit.companyName}`);
  console.log('Local preparation only. No outreach, browsing automation, emails, CRM records, invoices, payments, outcomes, or revenue were created.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
