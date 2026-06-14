import { collectConsoleEvidence } from './evidenceRules';

async function main(): Promise<void> {
  const report = await collectConsoleEvidence();
  console.log('Console evidence generated: output/evidence/console-evidence.md');
  console.log(`Company: ${report.target.companyName}`);
  console.log(`Observed console signals: ${report.signals.length}`);
  console.log(`Evidence Status: ${report.evidenceStatus}`);
  console.log('Observed console signals only. No bugs, outages, vulnerabilities, revenue impact, or customer impact were claimed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
