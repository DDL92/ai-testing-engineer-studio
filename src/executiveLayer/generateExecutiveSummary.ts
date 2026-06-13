import path = require('path');
import {
  buildExecutiveCompanyReport,
  writeExecutiveCompanySummary,
} from './executiveRules';

function main(): void {
  const company = readCompanyArg();
  const report = buildExecutiveCompanyReport(company);
  const outputPath = writeExecutiveCompanySummary(report);

  console.log(`Executive summary generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Company: ${report.companyName}`);
  console.log(`Executive Score: ${report.executiveScore}/100`);
  console.log(`Recommendation: ${report.executiveRecommendation}`);
  console.log('Local executive summary only. No outreach, proposals, invoices, payments, or external actions were performed.');
}

function readCompanyArg(): string {
  const args = process.argv.slice(2);
  const companyFlagIndex = args.indexOf('--company');
  const company = companyFlagIndex >= 0 ? args[companyFlagIndex + 1] : undefined;

  if (!company) {
    throw new Error('Missing required argument: --company <company>');
  }

  return company;
}

main();
