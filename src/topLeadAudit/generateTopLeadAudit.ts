import path = require('path');
import { buildTopLeadAuditPackage, writeTopLeadAuditOutput } from './topLeadAuditRules';

function main(): void {
  const audit = buildTopLeadAuditPackage();
  const outputPaths = writeTopLeadAuditOutput();

  console.log('Top lead audit generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Company: ${audit.companyName}`);
  console.log('Audit package is local-only and review-only. No external action was performed.');
}

main();
