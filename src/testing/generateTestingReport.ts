import path = require('path');
import { buildTestingReportBundle, writeTestingReports } from './testingRules';

function main(): void {
  const bundle = buildTestingReportBundle();
  const outputPaths = writeTestingReports(bundle);

  console.log('Testing reports generated:');
  for (const outputPath of outputPaths) console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Skipped tests audited: ${bundle.readiness.skippedTests}`);
}

main();
