import path = require('path');
import { buildReleaseCandidateReport, writeReleaseCheck } from './releaseCandidateRules';

function main(): void {
  const report = buildReleaseCandidateReport();
  const outputPath = writeReleaseCheck(report);

  console.log('AI Studio OS v1.0 release check generated.');
  console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Release score: ${report.releaseScore.overall}/100`);
  console.log(`Release recommendation: ${report.releaseScore.recommendation}`);
  console.log(`Known warnings: ${report.knownWarnings.length}`);
  console.log('No APIs, scraping, browsing, CRM, outreach automation, sending, payments, credentials, or external databases were used.');
  console.log('Human approval is required before external action.');
}

main();
