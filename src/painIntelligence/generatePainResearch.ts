import path = require('path');
import { findPainResearch, writePainResearchReport } from './painIntelligenceRules';

function main(): void {
  const company = parseArg(process.argv.slice(2), '--company');

  if (!company) {
    exitWithError('Missing required --company argument. Example: npm run pain:research -- --company PushPress');
  }

  const record = findPainResearch(company);
  if (!record) {
    exitWithError(`Company not found in data/pain-intelligence/pain-research.json: ${company}`);
  }

  const outputPath = writePainResearchReport(record);

  console.log(`Pain research generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Company: ${record.companyName}`);
  console.log(`Complaint signals: ${record.complaints.length}`);
  console.log(`QA risks: ${record.qaRisks.length}`);
  console.log('No scraping, APIs, credentials, external databases, vulnerability scanning, or outreach sending were used.');
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
