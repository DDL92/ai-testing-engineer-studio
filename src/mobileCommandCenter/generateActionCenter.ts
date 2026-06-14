import path = require('path');
import { buildMobileCommandCenterSummary, writeMobileActionCenter } from './mobileRules';

function main(): void {
  const summary = buildMobileCommandCenterSummary();
  const outputPath = writeMobileActionCenter(summary);

  console.log(`Mobile action center generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Priority #1: ${summary.topAction}`);
  console.log('Action center is limited to three manual priorities. No outreach or external action was performed.');
}

main();
