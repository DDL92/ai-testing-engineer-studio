import path = require('path');
import { buildEvidenceCapturePlan, writeCapturePlan } from './evidenceCaptureRules';

function main(): void {
  const plan = buildEvidenceCapturePlan();
  const outputPaths = writeCapturePlan(plan);

  console.log(`Evidence capture plan generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Recommended next sprint: ${plan.recommendedNextSprint}`);
  console.log('Architecture only. No Playwright, Lighthouse, browser automation, scans, screenshots, APIs, credentials, external databases, or evidence collection were used.');
}

main();
