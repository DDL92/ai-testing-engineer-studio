import path = require('path');
import { buildDailyLeadDiscoveryReport, writeDailyRankingOutputs } from './discoveryRules';

function main(): void {
  const report = buildDailyLeadDiscoveryReport();
  const outputPaths = writeDailyRankingOutputs(report);

  console.log('Daily lead ranking generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Top 5 leads: ${report.topFive.map((lead) => lead.companyName).join(', ') || 'none'}`);
  console.log('Ranking is read-only. Human approval is required before promotion, outreach, audits, proposals, or external action.');
}

main();
