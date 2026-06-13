import path = require('path');
import { buildLeadIntelligenceReport, writeLeadOpportunityOutputs } from './leadRules';

function main(): void {
  const report = buildLeadIntelligenceReport();
  const outputPaths = writeLeadOpportunityOutputs(report);

  console.log(`Lead opportunities generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Strongest candidate: ${report.opportunities.strongestCandidate?.companyName ?? 'None'}`);
  console.log('Opportunity analysis is cautious and local-only. No revenue was invented.');
}

main();
