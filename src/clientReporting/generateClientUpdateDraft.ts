import fs = require('fs');
import path = require('path');
import { Client } from '../clientReports/types';
import { buildClientUpdateDraft } from './clientReportingRules';
import { ClientReportingInput, ClientReportingSource } from './types';

const clientsPath = path.join(process.cwd(), 'data', 'clients.json');
const outputRoot = path.join(process.cwd(), 'output', 'client-reporting');

function main(): void {
  const id = parseId(process.argv.slice(2));

  if (!id) {
    exitWithError('Missing required --id client_id argument. Example: npm run client:update-draft -- --id demo-retainer-client');
  }

  const client = readClients().find((candidate) => candidate.id === id);
  if (!client) {
    exitWithError(`Client not found: ${id}. Check data/clients.json for available client ids.`);
  }

  const input = buildInput(client);
  const document = buildClientUpdateDraft(input);
  const outputDir = path.join(outputRoot, client.id);
  const outputPath = path.join(outputDir, document.fileName);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, document.body, 'utf8');

  console.log(`Client update draft generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Client: ${client.companyName}`);
  console.log('Draft only. No email, CRM, API, scraping, browser automation, payment, or client system was used.');
  console.log('Daniel review is required before sending.');
}

function buildInput(client: Client): ClientReportingInput {
  return {
    client,
    deliveryPlan: source('Delivery plan', path.join('output', 'client-delivery', client.id, 'delivery-plan.md')),
    evidenceLog: source('Evidence log', path.join('output', 'client-delivery', client.id, 'evidence-log.md')),
    qaChecklist: source('QA checklist', path.join('output', 'client-delivery', client.id, 'qa-checklist.md')),
    weeklyDeliverySummary: source('Weekly delivery summary', path.join('output', 'client-delivery', client.id, 'weekly-delivery-summary.md')),
  };
}

function source(label: string, relativePath: string): ClientReportingSource {
  const absolutePath = path.join(process.cwd(), relativePath);
  const exists = fs.existsSync(absolutePath);

  return {
    label,
    path: relativePath,
    exists,
    content: exists ? fs.readFileSync(absolutePath, 'utf8') : undefined,
  };
}

function readClients(): Client[] {
  if (!fs.existsSync(clientsPath)) return [];
  const raw = fs.readFileSync(clientsPath, 'utf8').trim();
  if (!raw) return [];
  return JSON.parse(raw) as Client[];
}

function parseId(args: string[]): string | undefined {
  const idFlagIndex = args.indexOf('--id');
  if (idFlagIndex >= 0) return args[idFlagIndex + 1];

  const idValue = args.find((arg) => arg.startsWith('--id='));
  if (idValue) return idValue.slice('--id='.length);

  return undefined;
}

function exitWithError(message: string): never {
  console.error(message);
  process.exit(1);
}

main();
