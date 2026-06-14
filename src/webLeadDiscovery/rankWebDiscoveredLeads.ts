import path = require('path');
import { buildWebLeadDiscoveryReport, writeWebLeadRankingOutputs } from './webDiscoveryRules';

function main(): void {
  const report = buildWebLeadDiscoveryReport();
  const outputPaths = writeWebLeadRankingOutputs(report);

  console.log('Web lead ranking generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Top web lead: ${report.topLead?.companyName ?? 'none'}`);
  console.log('Ranking uses locally recorded public-web evidence only.');
}

main();
