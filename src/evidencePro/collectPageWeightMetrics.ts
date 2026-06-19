import { collectEvidencePro } from './evidenceProRules';

collectEvidencePro().then((report) => {
  console.log('Page weight metrics generated: output/evidence-pro/page-weight-metrics.md');
  console.log(`Requests observed: ${report.pageWeight.requestCount}`);
}).catch(fail);

function fail(error: unknown): void {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
