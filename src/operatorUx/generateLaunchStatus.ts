import path = require('path');
import { buildOperatorUxSummary, writeLaunchStatus } from './uxRules';

function main(): void {
  const summary = buildOperatorUxSummary();
  const outputPaths = writeLaunchStatus(summary);

  console.log(`Launch status generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Top lead: ${summary.topLead}`);
  console.log(`Top action: ${summary.topAction}`);
  console.log('Usability summary only. No outreach, emails, meetings, invoices, payments, revenue, or outcomes were created.');
}

main();
