import path = require('path');
import { buildProposal, writeProposal } from './proposalRules';

function main(): void {
  const args = process.argv.slice(2);
  const company = parseArg(args, '--company') ?? parseArg(args, '--id');

  if (!company) {
    exitWithError('Missing required --company argument. Example: npm run sow:generate -- --company PushPress');
  }

  const proposal = buildProposal(company);
  const artifacts = writeProposal(proposal);

  console.log(`Proposal generated: ${path.relative(process.cwd(), artifacts.markdownPath)}, ${path.relative(process.cwd(), artifacts.pdfPath)}`);
  console.log(`Company: ${proposal.companyName}`);
  console.log(`Recommended engagement: ${proposal.recommendedEngagement}`);
  console.log('Reviewable proposal and SOW package only. No contract, invoice, payment request, email, outreach, sending, invented findings, vulnerabilities, incidents, outages, or metrics were generated.');
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
