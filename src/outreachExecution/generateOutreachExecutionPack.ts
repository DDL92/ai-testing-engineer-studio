import path = require('path');
import {
  buildOutreachExecutionReport,
  loadOutreachExecutionInput,
  writeOutreachExecutionOutputs,
} from './outreachExecutionRules';

function main(): void {
  const input = loadOutreachExecutionInput();
  const report = buildOutreachExecutionReport(input);
  const outputPaths = writeOutreachExecutionOutputs(report);

  console.log('Real Outreach Execution Pack generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Top 5 prepared: ${report.topFive.map((item) => item.lead.companyName).join(', ') || 'none'}`);
  console.log('No outreach was sent. No contacts, findings, metrics, company facts, or outcomes were invented.');
  console.log('No APIs, scraping, browsing, CRM, email sending, LinkedIn automation, outreach automation, payments, credentials, or external databases were used.');
}

main();
