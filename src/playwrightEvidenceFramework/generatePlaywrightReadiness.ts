import path = require('path');
import { buildPlaywrightReadinessReport, writePlaywrightReadinessReport } from './playwrightEvidenceRules';

function main(): void {
  const report = buildPlaywrightReadinessReport();
  const outputPaths = writePlaywrightReadinessReport(report);

  console.log(`Playwright readiness report generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Readiness categories: ${report.categories.length}`);
  console.log('Planning only. No Playwright execution, browser automation, crawling, screenshots, traces, scraping, credentials, APIs, or evidence collection were used.');
}

main();
