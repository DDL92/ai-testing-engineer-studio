import path = require('path');
import { executeRunnerSequence, writeRunnerSummary } from './runnerRules';

function main(): void {
  if (process.argv.includes('--test')) {
    const lastRun = executeRunnerSequence('test');
    console.log('Autonomous runner test completed.');
    console.log(`Status: ${lastRun.success ? 'Success' : 'Needs Review'}`);
    console.log(`Commands executed: ${lastRun.commandsExecuted.length}`);
    console.log('Reports generated:');
    console.log('- output/autonomous-runner/runner-summary.md');
    console.log('- output/autonomous-runner/runner-health.md');
    console.log('No launchd installation, outreach, email, CRM, meeting, invoice, payment, revenue, or client activity was performed.');
    return;
  }

  const outputs = writeRunnerSummary();
  console.log('Autonomous runner summary generated:');
  for (const output of outputs) {
    console.log(`- ${path.relative(process.cwd(), output)}`);
  }
}

main();
