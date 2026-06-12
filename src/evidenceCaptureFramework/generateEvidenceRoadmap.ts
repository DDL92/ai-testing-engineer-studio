import path = require('path');
import { buildEvidenceRoadmap, writeEvidenceRoadmap } from './evidenceCaptureRules';

function main(): void {
  const roadmap = buildEvidenceRoadmap();
  const outputPaths = writeEvidenceRoadmap(roadmap);

  console.log(`Evidence roadmap generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Recommended next sprint: ${roadmap.recommendedNextSprint}`);
  console.log('Architecture only. No Playwright, Lighthouse, browser automation, scans, screenshots, APIs, credentials, external databases, or evidence collection were used.');
}

main();
