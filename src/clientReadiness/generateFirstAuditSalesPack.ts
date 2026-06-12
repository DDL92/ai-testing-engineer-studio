import path = require('path');
import {
  buildClientReadinessReport,
  loadClientReadinessInput,
  writeFirstAuditSalesPack,
} from './clientReadinessRules';

function main(): void {
  const input = loadClientReadinessInput();
  const report = buildClientReadinessReport(input);
  const outputPath = writeFirstAuditSalesPack(report);

  console.log(`First audit sales pack generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Top 5 analyzed: ${report.topFive.length}`);
  console.log('QA Audit pricing: $199-$500');
  console.log('Upgrade path: QA Audit -> Playwright Starter Pack -> QA Automation Retainer');
  console.log('No outreach was sent. No contacts, names, or audit findings were invented.');
}

main();
