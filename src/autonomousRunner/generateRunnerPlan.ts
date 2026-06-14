import path = require('path');
import { writeRunnerPlan } from './runnerRules';

function main(): void {
  const outputs = writeRunnerPlan();
  console.log('Autonomous runner plan generated:');
  for (const output of outputs) {
    console.log(`- ${path.relative(process.cwd(), output)}`);
  }
  console.log('Read-only runner plan. No launchd installation or external business action was performed.');
}

main();
