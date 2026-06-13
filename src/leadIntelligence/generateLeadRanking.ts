import path = require('path');
import { buildLeadIntelligenceReport, writeLeadRankingOutputs } from './leadRules';

function main(): void {
  const report = buildLeadIntelligenceReport();
  const outputPaths = writeLeadRankingOutputs(report);

  console.log(`Lead ranking generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Ranked leads: ${report.leads.length}`);
  console.log('Ranking uses local evidence only and does not assume conversion.');
}

main();
