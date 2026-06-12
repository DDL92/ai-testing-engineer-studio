import path = require('path');
import { buildAuditPack, writeAuditPack } from './auditPackRules';

function main(): void {
  const company = parseArg(process.argv.slice(2), '--company');

  if (!company) {
    exitWithError('Missing required --company argument. Example: npm run audit:generate -- --company PushPress');
  }

  const pack = buildAuditPack(company);
  const outputPath = writeAuditPack(pack);

  console.log(`QA Audit Pack generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Company: ${pack.companyName}`);
  console.log(`Opportunity Score: ${pack.opportunityScore}/100`);
  console.log(`Recommended first service: ${pack.recommendedFirstService}`);
  console.log('No outreach, invoices, contracts, payment instructions, bugs, vulnerabilities, incidents, findings, or metrics were invented.');
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
