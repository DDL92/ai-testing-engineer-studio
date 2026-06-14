import { collectFlowEvidence } from './evidenceRules';

async function main(): Promise<void> {
  const report = await collectFlowEvidence();
  console.log('Flow evidence generated: output/evidence/flow-evidence.md');
  console.log(`Company: ${report.target.companyName}`);
  console.log(`Candidate public flows: ${report.flows.length}`);
  console.log(`Evidence Status: ${report.evidenceStatus}`);
  console.log('Candidate public flow observation only. No private, authenticated, checkout, payment, or account action was performed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
