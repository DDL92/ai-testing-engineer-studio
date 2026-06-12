import path = require('path');
import { buildEvidenceReport, writeEvidenceReport } from './evidenceRules';

function main(): void {
  const company = parseArg(process.argv.slice(2), '--company');

  if (!company) {
    exitWithError('Missing required --company argument. Example: npm run evidence:collect -- --company PushPress');
  }

  const report = buildEvidenceReport(company);
  const outputPath = writeEvidenceReport(report);

  console.log(`Evidence report generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Company: ${report.companyName}`);
  console.log(`Evidence readiness: ${report.readinessScore}/100`);
  console.log(`Confidence: ${report.confidence}`);
  console.log(`Gap count: ${report.gapCount}`);
  console.log('No browser automation, Playwright execution, Lighthouse execution, APIs, scraping, screenshots, credentials, or invented evidence were used.');
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
