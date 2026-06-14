import path = require('path');
import { buildTestingReportBundle, writeTestingReports } from './testingRules';

function main(): void {
  const bundle = buildTestingReportBundle();
  const outputPaths = writeTestingReports(bundle);
  const outputPath = outputPaths.find((item) => item.endsWith('quality-gates.md'));

  console.log(`Quality gate report generated: ${outputPath ? path.relative(process.cwd(), outputPath) : 'not found'}`);
  console.log(`Quality gate status: ${bundle.readiness.qualityGateStatus}`);

  if (bundle.readiness.qualityGateStatus === 'FAIL') process.exitCode = 1;
}

main();
