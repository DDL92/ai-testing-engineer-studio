import fs = require('fs');
import path = require('path');
import { buildLeadRotationDecision, leadRotationOutputDir, renderRotationSummary } from './rotationRules';

function main(): void {
  const decision = buildLeadRotationDecision();
  fs.mkdirSync(leadRotationOutputDir, { recursive: true });
  const outputPath = path.join(leadRotationOutputDir, 'rotation-summary.md');
  fs.writeFileSync(outputPath, renderRotationSummary(decision), 'utf8');
  console.log(`Rotation summary generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Rotation status: ${decision.rotationStatus}`);
}

main();
