import path = require('path');
import { buildMessageReview, writeMessagePack } from './messageRules';
import { buildRevenueIntelligenceReport } from '../revenueIntelligence/revenueIntelligenceRules';

function main(): void {
  const company = readCompanyArg();
  const report = buildMessageReview(company);
  const outputPaths = writeMessagePack(report);

  console.log(`Message pack generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Company: ${report.companyName}`);
  console.log(`Drafts: ${report.drafts.length}`);
  console.log('Drafts are manual-only and human-approved. Nothing was sent.');
}

function readCompanyArg(): string {
  const args = process.argv.slice(2);
  const companyFlagIndex = args.indexOf('--company');
  const company = companyFlagIndex >= 0 ? args[companyFlagIndex + 1] : undefined;

  const report = buildRevenueIntelligenceReport();
  return company || report.actionableLead?.companyName || report.topLead?.companyName || 'No unified top lead';
}

main();
