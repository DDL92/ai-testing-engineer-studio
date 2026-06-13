import path = require('path');
import { buildClientAuditReport, writeClientAuditReport } from './clientAuditReportRules';

function main(): void {
  const company = parseArg(process.argv.slice(2), '--company');

  if (!company) {
    exitWithError('Missing required --company argument. Example: npm run audit:pdf -- --company PushPress');
  }

  const report = buildClientAuditReport(company);
  const artifacts = writeClientAuditReport(report);

  console.log(`Client audit report generated: ${path.relative(process.cwd(), artifacts.markdownPath)}, ${path.relative(process.cwd(), artifacts.htmlPath)}, ${path.relative(process.cwd(), artifacts.pdfPath)}`);
  console.log(`Company: ${report.companyName}`);
  console.log(`Recommended Service: ${report.recommendedService}`);
  console.log('Client audit report only. No proposal, contract, invoice, payment request, outreach, invented findings, vulnerabilities, incidents, outages, or metrics were generated.');
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
