import path = require('path');
import {
  buildDailyRevenuePlan,
  loadDailyRevenueLoopInput,
  writeDailyPlanOutputs,
} from './dailyLoopRules';

function main(): void {
  const input = loadDailyRevenueLoopInput();
  const plan = buildDailyRevenuePlan(input);
  const outputPaths = writeDailyPlanOutputs(plan);

  console.log(`Daily revenue plan generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Active leads: ${plan.totalActiveLeads}`);
  console.log(`Top actions: ${plan.topActions.length}`);
  console.log('Planning only. No outreach, emails, proposals, invoices, payment links, calendar events, or external actions were sent.');
}

main();
