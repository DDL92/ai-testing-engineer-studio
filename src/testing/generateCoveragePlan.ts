import path = require('path');
import { buildTestingReportBundle, writeTestingReports } from './testingRules';

function main(): void {
  const bundle = buildTestingReportBundle();
  const outputPaths = writeTestingReports(bundle);
  const outputPath = outputPaths.find((item) => item.endsWith('coverage-plan.md'));

  console.log(`Coverage plan generated: ${outputPath ? path.relative(process.cwd(), outputPath) : 'not found'}`);
  console.log(`Required categories covered: ${bundle.readiness.coverageStatus}`);
}

main();
