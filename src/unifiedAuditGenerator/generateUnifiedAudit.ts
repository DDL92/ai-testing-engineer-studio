import path = require('path');
import { buildUnifiedAudit, writeUnifiedAudit } from './unifiedAuditRules';

function main(): void {
  const company = parseArg(process.argv.slice(2), '--company');

  if (!company) {
    exitWithError('Missing required --company argument. Example: npm run audit:unified -- --company PushPress');
  }

  const report = buildUnifiedAudit(company);
  const outputPath = writeUnifiedAudit(report);

  console.log(`Unified audit generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Company: ${report.companyName}`);
  console.log(`Opportunity Score: ${report.opportunityScore}/100`);
  console.log(`Evidence Readiness: ${report.evidenceReadiness}/100`);
  console.log(`Recommended First Offer: ${report.recommendedFirstOffer}`);
  console.log('Unified audit only. No proposal, contract, invoice, payment request, outreach, invented findings, vulnerabilities, incidents, outages, or metrics were generated.');
}

function parseArg(args: string[], name: string): string | undefined {
  const flagIndex = args.indexOf(name);
  if (flagIndex >= 0) return args[flagIndex + 1];

  const value = args.find((arg) => arg.startsWith(`${name}=`));
  if (value) return value.slice(name.length + 1);

  return undefined;
}

function exitWithError(message: string): never {
  console.error(message);
  process.exit(1);
}

main();
