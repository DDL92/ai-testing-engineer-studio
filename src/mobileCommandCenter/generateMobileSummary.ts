import path = require('path');
import { buildMobileCommandCenterSummary, writeSprint82MobileSummary } from './mobileRules';

function main(): void {
  const summary = buildMobileCommandCenterSummary();
  const outputPath = writeSprint82MobileSummary(summary);

  console.log(`Mobile summary generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Best Lead: ${summary.topLead}`);
  console.log(`Best Action: ${summary.bestAction}`);
  console.log(`Revenue Health: ${summary.revenueHealth}`);
  console.log('Summary is read-only. No outreach, emails, LinkedIn messages, proposals, invoices, payments, outcomes, revenue, or external actions were performed.');
}

main();
