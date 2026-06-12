import path = require('path');
import { buildChannelProfile, writeChannelResearch } from './channelResearchRules';

function main(): void {
  const company = parseArg(process.argv.slice(2), '--company');

  if (!company) {
    exitWithError('Missing required --company argument. Example: npm run lead:channels -- --company PushPress');
  }

  const profile = buildChannelProfile(company);
  const outputPath = writeChannelResearch(profile);

  console.log(`Channel research generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Company: ${profile.companyName}`);
  console.log(`Channels recorded: ${profile.channels.length}`);
  console.log(`Recommended order: ${profile.recommendedOrder.map((item) => item.channel).join(', ') || 'none'}`);
  console.log('No outreach was sent. No browser automation, scraping, APIs, CRM, credentials, or external databases were used.');
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
