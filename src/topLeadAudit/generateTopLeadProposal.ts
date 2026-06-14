import path = require('path');
import { buildTopLeadAuditPackage, writeTopLeadProposalOutput } from './topLeadAuditRules';

function main(): void {
  const audit = buildTopLeadAuditPackage();
  const outputPaths = writeTopLeadProposalOutput();

  console.log('Top lead proposal draft generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Company: ${audit.companyName}`);
  console.log('Proposal is a draft only. Nothing was sent, invoiced, scheduled, or charged.');
}

main();
