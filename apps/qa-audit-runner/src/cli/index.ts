import { runAudit } from '../audit/runAudit';
import { writeAuditReports } from '../reporting/reportGenerator';
import { getCliArg } from './args';
import { validateTargetUrl } from '../utils/url';

async function main(): Promise<void> {
  const targetUrl = validateTargetUrl(getCliArg('--url'));
  const result = await runAudit(targetUrl);
  writeAuditReports(result);
  console.log(`Audit complete: reports/latest/client-report.md`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
