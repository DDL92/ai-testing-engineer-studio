import { execFileSync } from 'child_process';
import path = require('path');
import { dailyBriefingOutputPath, generateDailyBriefing } from './generateDailyBriefing';

function main(): void {
  runLocalCommand('day:plan');
  runLocalCommand('metrics:revenue');

  const briefing = generateDailyBriefing();

  console.log(`Daily briefing generated: ${path.relative(process.cwd(), dailyBriefingOutputPath())}`);
  console.log(`Estimated MRR: $${briefing.revenueSummary.estimatedMrr.toLocaleString('en-US')}/month`);
  console.log(`Top actions: ${briefing.topActions.length}`);
  for (const action of briefing.topActions.slice(0, 3)) {
    console.log(`${action.priority}. ${action.companyName} - ${action.actionType}`);
  }
  console.log('No launchd automation, notifications, outreach, scraping, or dashboards were run.');
}

function runLocalCommand(scriptName: string): void {
  console.log(`Running npm run ${scriptName}...`);
  execFileSync('npm', ['run', scriptName], {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
}

main();
