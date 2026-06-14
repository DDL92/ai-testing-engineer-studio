import { collectScreenshotEvidence } from './evidenceRules';

async function main(): Promise<void> {
  const report = await collectScreenshotEvidence();
  console.log('Screenshot evidence generated: output/evidence/screenshot-evidence.md');
  console.log(`Company: ${report.target.companyName}`);
  console.log(`Screenshots captured: ${report.screenshots.filter((screenshot) => screenshot.exists).length}/${report.screenshots.length}`);
  console.log(`Evidence Status: ${report.evidenceStatus}`);
  console.log('Public-page screenshots only. No private or authenticated flows were captured.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
