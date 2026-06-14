import path = require('path');
import { buildLeadRotationDecision, writeLeadRotationReports } from './rotationRules';

function main(): void {
  const decision = buildLeadRotationDecision();
  const outputPaths = writeLeadRotationReports(decision);

  console.log('Lead rotation generated.');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Top ranked lead: ${decision.topRankedLead?.companyName ?? 'none'}`);
  console.log(`Actionable lead: ${decision.actionableLead?.companyName ?? 'none'}`);
  console.log(`Rotation status: ${decision.rotationStatus}`);
}

main();
