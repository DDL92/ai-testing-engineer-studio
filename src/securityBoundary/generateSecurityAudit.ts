import path = require('path');
import { buildSecurityAudit, writeSecurityAuditReports } from './securityRules';

function main(): void {
  const audit = buildSecurityAudit();
  const outputPaths = writeSecurityAuditReports(audit);

  console.log('Security audit generated:');
  for (const outputPath of outputPaths) {
    console.log(`- ${path.relative(process.cwd(), outputPath)}`);
  }
  console.log(`Tracked private/runtime candidates: ${audit.trackedPrivatePaths.length}`);
  console.log('No files were deleted or removed from git.');
}

main();
