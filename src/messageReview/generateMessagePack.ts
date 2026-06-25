import path = require('path');
import { buildMessageReview, writeMessagePack } from './messageRules';
import { buildRevenueIntelligenceReport } from '../revenueIntelligence/revenueIntelligenceRules';
import { readContactAwareState, selectedContactReadyLead } from '../contactAwareRotation/rotationRules';

function main(): void {
  const company = readCompanyArg();
  const report = buildMessageReview(company);
  const outputPaths = writeMessagePack(report);

  console.log(`Message pack generated: ${outputPaths.map((outputPath) => path.relative(process.cwd(), outputPath)).join(', ')}`);
  console.log(`Company: ${report.companyName}`);
  console.log(`Contact-aware status: ${readContactAwareState()?.status ?? 'NO_CONTACT_READY_LEAD'}`);
  console.log(`Drafts: ${report.drafts.length}`);
  console.log('Drafts are manual-only and human-approved. Nothing was sent.');
}

function readCompanyArg(): string {
  const args = process.argv.slice(2);
  const companyFlagIndex = args.indexOf('--company');
  const company = companyFlagIndex >= 0 ? args[companyFlagIndex + 1] : undefined;

  const report = buildRevenueIntelligenceReport();
  const selected = selectedContactReadyLead();
  return resolveMessagePackCompany(
    company,
    selected?.companyName,
    report.actionableLead?.companyName,
    report.topLead?.companyName,
  );
}

export function resolveMessagePackCompany(
  explicitCompany?: string,
  contactReadyCompany?: string,
  actionableCompany?: string,
  topRankedCompany?: string,
): string {
  return explicitCompany || contactReadyCompany || actionableCompany || topRankedCompany || 'No unified top lead';
}

if (require.main === module) main();
