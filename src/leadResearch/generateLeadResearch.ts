import path = require('path');
import {
  buildContactCoverage,
  findCompanyContactRecord,
  writeContactResearchReport,
} from './leadResearchRules';

function main(): void {
  const company = parseArg(process.argv.slice(2), '--company');

  if (!company) {
    exitWithError('Missing required --company argument. Example: npm run lead:research -- --company PushPress');
  }

  const record = findCompanyContactRecord(company);
  if (!record) {
    exitWithError(`Company not found in data/contacts/contacts.json: ${company}`);
  }

  const coverage = buildContactCoverage(record);
  const outputPath = writeContactResearchReport(coverage);

  console.log(`Contact research generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Company: ${record.companyName}`);
  console.log(`Contacts: ${record.contacts.length}`);
  console.log(`Missing gaps: ${coverage.missingDepartments.join(', ') || 'none'}`);
  console.log('No contacts were invented. No scraping, APIs, CRM, credentials, or outreach sending were used.');
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
