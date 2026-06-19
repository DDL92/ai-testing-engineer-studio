import { collectEvidencePro } from './evidenceProRules';

collectEvidencePro().then((report) => {
  console.log('Dependency signals generated: output/evidence-pro/dependency-signals.md');
  console.log(`Third-party hosts observed: ${report.dependencies.length}`);
}).catch(fail);

function fail(error: unknown): void {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
