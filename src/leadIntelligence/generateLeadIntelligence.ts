import path = require('path');
import { buildLeadIntelligenceReport, writeLeadIntelligenceOutputs } from './leadRules';

function main(): void {
  const report = buildLeadIntelligenceReport();
  const outputPaths = writeLeadIntelligenceOutputs(report);
  const topLead = report.leads[0];

  console.log(`Lead intelligence generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Top lead: ${topLead?.companyName ?? 'None'}`);
  console.log(`Recommended offer: ${topLead?.recommendedOffer ?? 'None'}`);
  console.log('Local intelligence only. No outreach, emails, LinkedIn messages, meetings, revenue, or client interest were created.');
}

main();
