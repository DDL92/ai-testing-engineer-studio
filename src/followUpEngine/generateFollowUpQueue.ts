import path = require('path');
import { buildFollowUpOperatingReport, writeFollowUpQueueOutput } from './followUpRules';

function main(): void {
  const report = buildFollowUpOperatingReport();
  const outputPaths = writeFollowUpQueueOutput(report);

  console.log(`Follow-up queue generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Queue items: ${report.queue.length}`);
  console.log(`Next best action: ${report.dashboard.nextBestAction}`);
  console.log('Local planning only. No messages, emails, meetings, invoices, payments, revenue, or outcomes were created.');
}

main();
