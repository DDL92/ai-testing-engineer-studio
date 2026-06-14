import path = require('path');
import { buildTopLeadAuditPackage, writeTopLeadExecutiveSummaryOutput } from './topLeadAuditRules';

function main(): void {
  const audit = buildTopLeadAuditPackage();
  const outputPaths = writeTopLeadExecutiveSummaryOutput();

  console.log('Top lead executive summary generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Company: ${audit.companyName}`);
  console.log('Executive summary is preparation-only. No claims of confirmed defects, revenue, or client interest were created.');
}

main();
