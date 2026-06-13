import path = require('path');
import { buildLeadIntelligenceReport, writeLeadNextActionOutputs } from './leadRules';

function main(): void {
  const report = buildLeadIntelligenceReport();
  const outputPaths = writeLeadNextActionOutputs(report);
  const topLead = report.leads[0];

  console.log(`Lead next actions generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Top next action: ${topLead ? `${topLead.recommendedActionType} - ${topLead.recommendedNextAction}` : 'None'}`);
  console.log('No outreach, meetings, tasks outside Studio, or messages were created.');
}

main();
