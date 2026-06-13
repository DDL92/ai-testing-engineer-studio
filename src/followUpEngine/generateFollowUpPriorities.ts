import path = require('path');
import { buildFollowUpOperatingReport, writeFollowUpPrioritiesOutput } from './followUpRules';

function main(): void {
  const report = buildFollowUpOperatingReport();
  const outputPaths = writeFollowUpPrioritiesOutput(report);

  console.log(`Follow-up priorities generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Open opportunities: ${report.dashboard.openOpportunities}`);
  console.log('No replies, meetings, proposals, revenue, or client interest were invented.');
}

main();
