import fs = require('fs');
import path = require('path');
import { Client } from '../clientReports/types';
import { buildClientDeliveryDocuments } from './clientDeliveryRules';
import { ClientDeliveryInput, LocalDeliverySource } from './types';

const clientsPath = path.join(process.cwd(), 'data', 'clients.json');
const outputRoot = path.join(process.cwd(), 'output', 'client-delivery');

function main(): void {
  const id = parseId(process.argv.slice(2));

  if (!id) {
    exitWithError('Missing required --id client_id argument. Example: npm run client:delivery -- --id demo-retainer-client');
  }

  const client = readClients().find((candidate) => candidate.id === id);
  if (!client) {
    exitWithError(`Client not found: ${id}. Check data/clients.json for available client ids.`);
  }

  const input: ClientDeliveryInput = {
    client,
    sources: detectSources(client.id),
  };
  const documents = buildClientDeliveryDocuments(input);
  const outputDir = path.join(outputRoot, client.id);

  fs.mkdirSync(outputDir, { recursive: true });
  for (const document of documents) {
    fs.writeFileSync(path.join(outputDir, document.fileName), document.body, 'utf8');
  }

  console.log(`Client delivery generated: ${path.relative(process.cwd(), outputDir)}`);
  for (const document of documents) {
    console.log(`- ${path.relative(process.cwd(), path.join(outputDir, document.fileName))}`);
  }
  console.log(`Client: ${client.companyName}`);
  console.log('No APIs, browser automation, external services, credentials, or client systems were used.');
  console.log('Human approval is required before client communication or delivery action.');
}

function readClients(): Client[] {
  if (!fs.existsSync(clientsPath)) return [];
  const raw = fs.readFileSync(clientsPath, 'utf8').trim();
  if (!raw) return [];
  return JSON.parse(raw) as Client[];
}

function detectSources(clientId: string): LocalDeliverySource[] {
  return [
    source('Client workflow directory', path.join('output', 'client-workflows', clientId)),
    source('Client report', path.join('output', 'client-reports', `${clientId}-report.md`)),
  ];
}

function source(label: string, relativePath: string): LocalDeliverySource {
  return {
    label,
    path: relativePath,
    exists: fs.existsSync(path.join(process.cwd(), relativePath)),
  };
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
