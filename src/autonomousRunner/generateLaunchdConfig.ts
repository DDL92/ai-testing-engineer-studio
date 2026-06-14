import path = require('path');
import { writeLaunchdConfig } from './runnerRules';

function main(): void {
  const outputs = writeLaunchdConfig();
  console.log('Autonomous runner launchd files generated:');
  for (const output of outputs) {
    console.log(`- ${path.relative(process.cwd(), output)}`);
  }
  console.log('Instructions only. launchd was not installed or loaded.');
}

main();
