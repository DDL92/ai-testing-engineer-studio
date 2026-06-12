import path = require('path');
import {
  findSiteIntelligence,
  withRequestedUrl,
  writeSiteIntelligenceReport,
} from './siteIntelligenceRules';

function main(): void {
  const args = process.argv.slice(2);
  const company = parseArg(args, '--company');
  const url = parseArg(args, '--url');

  if (!company) {
    exitWithError('Missing required --company argument. Example: npm run site:intelligence -- --company PushPress -- --url https://www.pushpress.com');
  }

  const record = findSiteIntelligence(company);
  if (!record) {
    exitWithError(`Company not found in data/site-intelligence/site-intelligence.json: ${company}`);
  }

  const reportRecord = withRequestedUrl(record, url);
  const outputPath = writeSiteIntelligenceReport(reportRecord);

  console.log(`Site intelligence generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Company: ${reportRecord.companyName}`);
  console.log(`URL: ${url ?? reportRecord.url}`);
  console.log(`Potential findings: ${reportRecord.findings.length}`);
  console.log('No browser automation, scraping, credentials, security scanning, vulnerability scanning, or outreach sending were used.');
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
