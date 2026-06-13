import path = require('path');
import { buildFollowUpOperatingReport, writeDailyFollowUpPlanOutput } from './followUpRules';

function main(): void {
  const report = buildFollowUpOperatingReport();
  const outputPaths = writeDailyFollowUpPlanOutput(report);

  console.log(`Daily follow-up plan generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Today follow-ups: ${report.dailyPlan.length}`);
  console.log('Manual review only. Nothing was sent or scheduled.');
}

main();
