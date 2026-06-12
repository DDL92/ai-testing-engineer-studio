import path = require('path');
import { buildChannelPlan, writeChannelPlan } from './channelResearchRules';

function main(): void {
  const plan = buildChannelPlan();
  const outputPath = writeChannelPlan(plan);

  console.log(`Channel plan generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Today items: ${plan.today.length}`);
  console.log(`Top company: ${plan.today[0]?.companyName ?? 'none'}`);
  console.log('No outreach was sent. Human approval is required before any channel action.');
}

main();
