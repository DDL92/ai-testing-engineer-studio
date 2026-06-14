import path = require('path');
import { buildMobileCommandCenterSummary, writeMobileRevenueView } from './mobileRules';

function main(): void {
  const summary = buildMobileCommandCenterSummary();
  const outputPath = writeMobileRevenueView(summary);

  console.log(`Mobile revenue view generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Current MRR: $${summary.currentMrr.toLocaleString('en-US')}`);
  console.log(`Revenue Status: ${summary.revenueStatus}`);
  console.log('Read-only revenue visibility. No revenue was estimated, created, or claimed.');
}

main();
