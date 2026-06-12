import path = require('path');
import { buildPlaywrightEvidencePlan, writePlaywrightEvidencePlan } from './playwrightEvidenceRules';

function main(): void {
  const plan = buildPlaywrightEvidencePlan();
  const outputPaths = writePlaywrightEvidencePlan(plan);

  console.log(`Playwright evidence plan generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Targets: ${plan.targets.length}`);
  console.log('Planning only. No Playwright execution, browser automation, crawling, screenshots, traces, scraping, credentials, APIs, or evidence collection were used.');
}

main();
