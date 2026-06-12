import path = require('path');
import {
  buildOutreachExecutionReport,
  loadOutreachExecutionInput,
  writeFollowUpPlanOutput,
} from './outreachExecutionRules';

function main(): void {
  const input = loadOutreachExecutionInput();
  const report = buildOutreachExecutionReport(input);
  const outputPath = writeFollowUpPlanOutput(report);

  console.log(`Follow-up plan generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Top 5 prepared: ${report.topFive.map((item) => item.lead.companyName).join(', ') || 'none'}`);
  console.log('No follow-ups were scheduled or sent. Manual tracking is required.');
}

main();
