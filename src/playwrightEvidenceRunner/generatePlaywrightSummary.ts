import path = require('path');
import { buildPlaywrightEvidenceSummary, writePlaywrightSummary } from './playwrightRunnerRules';

function main(): void {
  const summary = buildPlaywrightEvidenceSummary();
  const outputPaths = writePlaywrightSummary(summary);

  console.log(`Playwright summary generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Companies summarized: ${summary.reports.length}`);
  console.log('Summary reads local Playwright evidence only and does not run browser automation.');
}

main();
