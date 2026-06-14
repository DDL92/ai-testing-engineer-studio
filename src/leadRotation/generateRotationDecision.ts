import fs = require('fs');
import path = require('path');
import { buildLeadRotationDecision, leadRotationOutputDir, renderRotationDecision } from './rotationRules';

function main(): void {
  const decision = buildLeadRotationDecision();
  fs.mkdirSync(leadRotationOutputDir, { recursive: true });
  const outputPath = path.join(leadRotationOutputDir, 'rotation-decision.md');
  fs.writeFileSync(outputPath, renderRotationDecision(decision), 'utf8');
  console.log(`Rotation decision generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Top ranked lead: ${decision.topRankedLead?.companyName ?? 'none'}`);
  console.log(`Actionable lead: ${decision.actionableLead?.companyName ?? 'none'}`);
}

main();
