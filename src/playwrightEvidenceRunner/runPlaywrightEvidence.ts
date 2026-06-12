import path = require('path');
import { runPlaywrightEvidence } from './playwrightRunnerRules';

async function main(): Promise<void> {
  const company = parseArg(process.argv.slice(2), '--company');

  if (!company) {
    exitWithError('Missing required --company argument. Example: npm run evidence:playwright-run -- --company PushPress');
  }

  const report = await runPlaywrightEvidence(company);

  console.log(`Playwright evidence generated: ${path.join('output', 'playwright-runner', `${report.companyId}-playwright-evidence.md`)}`);
  console.log(`Company: ${report.companyName}`);
  console.log(`Pages reviewed: ${report.pagesReviewed}`);
  console.log(`Screenshots captured: ${report.screenshotsCaptured}`);
  console.log(`Console observations: ${report.consoleObservationCount}`);
  console.log('Public-page passive observations only. No forms, login, account creation, payment flows, scraping, crawling, credentials, APIs, outreach, or messages were used.');
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

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
