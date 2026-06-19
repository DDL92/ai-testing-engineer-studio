import { collectEvidencePro } from './evidenceProRules';

collectEvidencePro().then((report) => {
  console.log('Executive evidence summary generated: output/evidence-pro/executive-evidence-summary.md');
  console.log(`Company: ${report.target.companyName}`);
}).catch(fail);

function fail(error: unknown): void {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
