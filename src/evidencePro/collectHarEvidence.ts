import { collectEvidencePro } from './evidenceProRules';

collectEvidencePro(process.argv.includes('--force')).then((report) => {
  console.log('HAR evidence generated: output/evidence-pro/har-evidence.md');
  console.log(`Requests observed: ${report.har.requestCount}`);
}).catch(fail);

function fail(error: unknown): void {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
