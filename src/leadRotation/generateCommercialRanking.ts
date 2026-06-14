import fs = require('fs');
import path = require('path');
import { buildLeadRotationDecision, leadRotationOutputDir, renderCommercialRanking } from './rotationRules';

function main(): void {
  const decision = buildLeadRotationDecision();
  fs.mkdirSync(leadRotationOutputDir, { recursive: true });
  const outputPath = path.join(leadRotationOutputDir, 'commercial-ranking.md');
  fs.writeFileSync(outputPath, renderCommercialRanking(decision), 'utf8');
  console.log(`Commercial ranking generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Actionable lead: ${decision.actionableLead?.companyName ?? 'none'}`);
}

main();
