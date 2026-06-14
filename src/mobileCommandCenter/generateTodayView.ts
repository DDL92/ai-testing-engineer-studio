import path = require('path');
import { buildMobileCommandCenterSummary, writeMobileTodayView } from './mobileRules';

function main(): void {
  const summary = buildMobileCommandCenterSummary();
  const outputPath = writeMobileTodayView(summary);

  console.log(`Mobile today view generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Top Lead: ${summary.topLead}`);
  console.log(`Top Action: ${summary.topAction}`);
  console.log('Read-only mobile visibility. No outreach, emails, LinkedIn messages, meetings, invoices, payments, outcomes, or revenue were created.');
}

main();
