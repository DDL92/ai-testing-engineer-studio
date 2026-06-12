import path = require('path');
import { buildOpportunity, writeOpportunityReport } from './opportunityEngineRules';

function main(): void {
  const company = parseArg(process.argv.slice(2), '--company');

  if (!company) {
    exitWithError('Missing required --company argument. Example: npm run opportunity:generate -- --company PushPress');
  }

  const report = buildOpportunity(company);
  const outputPath = writeOpportunityReport(report);

  console.log(`Opportunity generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Company: ${report.companyName}`);
  console.log(`Confidence Score: ${report.confidenceScore}/100`);
  console.log(`Best first offer: ${report.bestFirstOffer}`);
  console.log('No outreach was sent. No contacts, findings, metrics, complaints, bugs, or vulnerabilities were invented.');
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
