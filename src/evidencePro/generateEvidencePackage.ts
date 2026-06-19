import { collectEvidencePro } from './evidenceProRules';

collectEvidencePro().then((report) => {
  console.log('Evidence package generated: output/evidence-pro/evidence-package.md');
  console.log(`Package status: ${report.status}`);
}).catch(fail);

function fail(error: unknown): void {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
