import path = require('path');
import { buildSecurityAudit, writeSecurityAuditReports } from './securityRules';

function main(): void {
  const audit = buildSecurityAudit();
  const outputPaths = writeSecurityAuditReports(audit);
  const planPath = outputPaths.find((outputPath) => outputPath.endsWith('public-portfolio-plan.md'));

  console.log(`Public portfolio plan generated: ${planPath ? path.relative(process.cwd(), planPath) : 'not found'}`);
  console.log('Public repo boundary documented. Review the remediation plan before publishing.');
}

main();
