import path = require('path');
import { buildDailyLeadDiscoveryReport, writeMacLeadDiscoverySetup } from './discoveryRules';

function main(): void {
  const report = buildDailyLeadDiscoveryReport();
  const outputPaths = writeMacLeadDiscoverySetup(report);

  console.log('Mac lead discovery setup guide generated.');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log('The guide explains launchd setup for 7:00 AM. Nothing was installed or scheduled automatically.');
}

main();
