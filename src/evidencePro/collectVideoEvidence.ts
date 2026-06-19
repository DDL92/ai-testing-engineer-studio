import { collectEvidencePro } from './evidenceProRules';

collectEvidencePro().then((report) => {
  console.log('Video evidence generated: output/evidence-pro/video-evidence.md');
  console.log(`Video status: ${report.video.path ? 'CAPTURED' : 'NOT AVAILABLE'}`);
}).catch(fail);

function fail(error: unknown): void {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
