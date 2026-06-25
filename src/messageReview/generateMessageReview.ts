import path = require('path');
import { buildMessageReview, writeMessageReview } from './messageRules';
import { buildRevenueIntelligenceReport } from '../revenueIntelligence/revenueIntelligenceRules';
import { selectedContactReadyLead } from '../contactAwareRotation/rotationRules';

function main(): void {
  const company = readCompanyArg();
  const report = buildMessageReview(company);
  const outputPaths = writeMessageReview(report);

  console.log(`Message review generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Company: ${report.companyName}`);
  console.log(`GO / NO GO: ${report.goNoGo}`);
  console.log('Manual review only. No messages, emails, meetings, proposals, invoices, payments, replies, interest, or revenue were created.');
}

function readCompanyArg(): string {
  const args = process.argv.slice(2);
  const companyFlagIndex = args.indexOf('--company');
  const company = companyFlagIndex >= 0 ? args[companyFlagIndex + 1] : undefined;

  const report = buildRevenueIntelligenceReport();
  return company || selectedContactReadyLead()?.companyName || report.actionableLead?.companyName || report.topLead?.companyName || 'No unified top lead';
}

main();
