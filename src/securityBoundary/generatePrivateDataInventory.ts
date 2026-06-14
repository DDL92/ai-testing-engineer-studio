import path = require('path');
import { buildSecurityAudit, writeSecurityAuditReports } from './securityRules';

function main(): void {
  const audit = buildSecurityAudit();
  const outputPaths = writeSecurityAuditReports(audit);
  const inventoryPath = outputPaths.find((outputPath) => outputPath.endsWith('private-data-inventory.md'));

  console.log(`Private data inventory generated: ${inventoryPath ? path.relative(process.cwd(), inventoryPath) : 'not found'}`);
  console.log(`Inventory items: ${audit.inventory.length}`);
  console.log(`Tracked candidates: ${audit.trackedPrivatePaths.length}`);
}

main();
