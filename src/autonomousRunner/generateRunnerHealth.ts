import path = require('path');
import { buildRunnerHealth, writeRunnerHealth } from './runnerRules';

function main(): void {
  const report = buildRunnerHealth();
  const outputs = writeRunnerHealth();
  console.log('Autonomous runner health generated:');
  for (const output of outputs) {
    console.log(`- ${path.relative(process.cwd(), output)}`);
  }
  console.log(`Runner Health: ${report.status}`);
}

main();
