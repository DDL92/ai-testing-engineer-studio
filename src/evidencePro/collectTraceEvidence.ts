import { collectEvidencePro } from './evidenceProRules';

collectEvidencePro().then((report) => {
  console.log('Trace evidence generated: output/evidence-pro/trace-evidence.md');
  console.log(`Trace status: ${report.trace.path ? 'CAPTURED' : 'NOT AVAILABLE'}`);
}).catch(fail);

function fail(error: unknown): void {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
