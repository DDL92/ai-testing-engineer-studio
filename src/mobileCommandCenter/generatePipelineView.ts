import path = require('path');
import { buildMobileCommandCenterSummary, writeMobilePipelineView } from './mobileRules';

function main(): void {
  const summary = buildMobileCommandCenterSummary();
  const outputPath = writeMobilePipelineView(summary);

  console.log(`Mobile pipeline view generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Open Opportunities: ${summary.openOpportunities}`);
  console.log(`Follow Ups Waiting: ${summary.followUpsWaiting}`);
  console.log('Pipeline view uses local outcome, follow-up, and lead data only. No client activity was invented.');
}

main();
