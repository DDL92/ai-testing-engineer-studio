import { runLighthouseEvidence } from './lighthouseRules';

async function main(): Promise<void> {
  const company = parseArg(process.argv.slice(2), '--company');
  const url = parseArg(process.argv.slice(2), '--url');

  if (!company) {
    exitWithError('Missing required --company argument. Example: npm run evidence:lighthouse -- --company PushPress -- --url https://www.pushpress.com');
  }

  if (!url) {
    exitWithError('Missing required --url argument. Example: npm run evidence:lighthouse -- --company PushPress -- --url https://www.pushpress.com');
  }

  const report = await runLighthouseEvidence(company, url);

  console.log(`Lighthouse evidence generated: ${report.markdownReportPath}`);
  console.log(`Company: ${report.companyName}`);
  console.log(`Performance: ${scoreLabel(report.scores.performance)}`);
  console.log(`Accessibility: ${scoreLabel(report.scores.accessibility)}`);
  console.log(`Best Practices: ${scoreLabel(report.scores.bestPractices)}`);
  console.log(`SEO: ${scoreLabel(report.scores.seo)}`);
  console.log('Public homepage Lighthouse evidence only. No login, account creation, payments, form submission, crawling, scraping, credentials, vulnerability scanning, or penetration testing were used.');
}

function parseArg(args: string[], name: string): string | undefined {
  const flagIndex = args.indexOf(name);
  if (flagIndex >= 0) return args[flagIndex + 1];

  const value = args.find((arg) => arg.startsWith(`${name}=`));
  if (value) return value.slice(name.length + 1);

  return undefined;
}

function scoreLabel(score: number | null): string {
  if (score === null) return 'Not Available';
  return `${Math.round(score * 100)}/100`;
}

function exitWithError(message: string): never {
  console.error(message);
  process.exit(1);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
