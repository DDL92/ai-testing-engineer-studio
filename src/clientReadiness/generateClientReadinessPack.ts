import path = require('path');
import {
  buildClientReadinessReport,
  loadClientReadinessInput,
  writeClientReadinessOutputs,
} from './clientReadinessRules';

function main(): void {
  const input = loadClientReadinessInput();
  const report = buildClientReadinessReport(input);
  const outputPaths = writeClientReadinessOutputs(report);

  console.log('Real Client Readiness Pack generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Commercial leads: ${report.commercialLeads}`);
  console.log(`Top 5 analyzed: ${report.topFive.length}`);
  console.log(`Top lead: ${report.topFive[0]?.lead.companyName ?? 'none'}`);
  console.log('No outreach was sent. No contacts, names, or audit findings were invented.');
  console.log('No APIs, scraping, browsing, CRM, outreach automation, email, LinkedIn automation, payments, credentials, or external databases were used.');
}

main();
