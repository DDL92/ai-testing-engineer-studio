import path = require('path');
import { writeDashboardSecurityCheck } from './securityRules';

function main(): void {
  const result = writeDashboardSecurityCheck();

  console.log(`Dashboard server security check generated: ${path.relative(process.cwd(), result.outputPath)}`);
  console.log(`Status: ${result.passed ? 'passed' : 'needs attention'}`);

  if (!result.passed) {
    process.exitCode = 1;
  }
}

main();
