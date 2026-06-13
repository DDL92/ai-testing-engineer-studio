import path = require('path');
import { buildLighthouseSummary, writeLighthouseSummary } from './lighthouseRules';

function main(): void {
  const summary = buildLighthouseSummary();
  const outputPaths = writeLighthouseSummary(summary);

  console.log(`Lighthouse summary generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Companies summarized: ${summary.reports.length}`);
  console.log('Summary reads local Lighthouse evidence only and does not rerun Lighthouse.');
}

main();
