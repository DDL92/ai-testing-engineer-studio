import { collectEvidencePro } from './evidenceProRules';

collectEvidencePro().then((report) => {
  console.log('Grouped observed signals generated: output/evidence-pro/grouped-errors.md');
  console.log(`Grouped signals: ${report.groupedSignals.length}`);
}).catch(fail);

function fail(error: unknown): void {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
