import fs = require('fs');
import path = require('path');
import { buildClientReport } from './clientReportRules';
import { Client, ClientReport, ClientReportSection } from './types';

const clientsPath = path.join(process.cwd(), 'data', 'clients.json');
const outputDir = path.join(process.cwd(), 'output', 'client-reports');

function main(): void {
  const id = parseClientId(process.argv.slice(2));

  if (!id) {
    exitWithError('Missing required --id client_id argument. Example: npm run client:report -- --id demo-retainer-client');
  }

  const client = readClients().find((candidate) => candidate.id === id);
  if (!client) {
    exitWithError(`Client not found: ${id}. Check data/clients.json for available demo client ids.`);
  }

  const report = buildClientReport(client);
  const outputPath = path.join(outputDir, `${client.id}-report.md`);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, renderClientReport(report), 'utf8');

  console.log(`Client report generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Client: ${client.companyName}`);
  console.log('No email or message was sent. Human approval is required before sharing.');
}

function readClients(): Client[] {
  if (!fs.existsSync(clientsPath)) return [];
  const raw = fs.readFileSync(clientsPath, 'utf8').trim();
  if (!raw) return [];
  return JSON.parse(raw) as Client[];
}

function parseClientId(args: string[]): string | undefined {
  const idFlagIndex = args.indexOf('--id');
  if (idFlagIndex >= 0) return args[idFlagIndex + 1];

  const idValue = args.find((arg) => arg.startsWith('--id='));
  if (idValue) return idValue.slice('--id='.length);

  return undefined;
}

function renderClientReport(report: ClientReport): string {
  return `# Client Report: ${report.companyName}

${renderSection(getSection(report, 'Executive Summary'))}
${renderSection(getSection(report, 'Work Completed'))}
${renderSection(getSection(report, 'Current QA Coverage'))}
${renderSection(getSection(report, 'Key Risks / Open Items'))}
${renderSection(getSection(report, 'Automation Opportunities'))}
${renderSection(getSection(report, 'Recommended Next Steps'))}
${renderSection(getSection(report, 'Retainer Value Summary'))}
${renderSection(getSection(report, 'Next-Week Focus'))}
${renderSection(getSection(report, 'Manual Review Note'))}
`;
}

function renderSection(section: ClientReportSection): string {
  return `## ${section.title}

${section.body.map((line) => `- ${line}`).join('\n')}
`;
}

function getSection(report: ClientReport, title: string): ClientReportSection {
  const section = report.sections.find((candidate) => candidate.title === title);
  if (!section) {
    return {
      title,
      body: ['Section was not generated. Review client report rules.'],
    };
  }

  return section;
}

function exitWithError(message: string): never {
  console.error(message);
  process.exit(1);
}

main();
