import path = require('path');
import { buildDailyLeadDiscoveryReport, writeDailyDiscoveryOutputs } from './discoveryRules';

function main(): void {
  const report = buildDailyLeadDiscoveryReport();
  const outputPaths = writeDailyDiscoveryOutputs(report);

  console.log('Daily lead discovery generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`New leads today: ${report.newLeadsToday.length}`);
  console.log(`Top new lead: ${report.topNewLead?.companyName ?? 'none'}`);
  console.log('Local approved sources only. No scraping, APIs, outreach, email, CRM, or external action was performed.');
}

main();
