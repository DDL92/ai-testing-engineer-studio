import { collectEvidencePro } from './evidenceProRules';

collectEvidencePro().then((report) => {
  console.log('Performance metrics generated: output/evidence-pro/performance-metrics.md');
  console.log(`DOMContentLoaded: ${report.performance.domContentLoadedMs ?? 'Not available'} ms`);
}).catch(fail);

function fail(error: unknown): void {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
