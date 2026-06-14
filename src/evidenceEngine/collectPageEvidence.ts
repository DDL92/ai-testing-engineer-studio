import { collectPageEvidence } from './evidenceRules';

async function main(): Promise<void> {
  const report = await collectPageEvidence();
  console.log('Page evidence generated: output/evidence/page-evidence.md');
  console.log(`Company: ${report.target.companyName}`);
  console.log(`Evidence Status: ${report.evidenceStatus}`);
  console.log('Public-page observation only. No private flows, outreach, invoices, payments, or client actions were performed.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
