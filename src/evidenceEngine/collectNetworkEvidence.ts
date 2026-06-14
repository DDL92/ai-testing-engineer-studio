import { collectNetworkEvidence } from './evidenceRules';

async function main(): Promise<void> {
  const report = await collectNetworkEvidence();
  console.log('Network evidence generated: output/evidence/network-evidence.md');
  console.log(`Company: ${report.target.companyName}`);
  console.log(`Observed network signals: ${report.signals.length}`);
  console.log(`Evidence Status: ${report.evidenceStatus}`);
  console.log('Observed network signals only. No bugs, outages, vulnerabilities, revenue impact, or customer impact were claimed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
