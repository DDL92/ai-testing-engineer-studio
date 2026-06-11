import fs = require('fs');
import path = require('path');
import { Client } from '../clientReports/types';
import { buildRenewalClientRecord, buildRenewalTrackerDocuments, source } from './renewalRules';
import { RenewalClientRecord, RenewalClientSources, RenewalSource } from './types';

const clientsPath = path.join(process.cwd(), 'data', 'clients.json');
const outputRoot = path.join(process.cwd(), 'output', 'renewals');

function main(): void {
  const clients = readClients();
  const records = clients.map((client) => buildRenewalClientRecord(client, detectSources(client.id)));
  const documents = buildRenewalTrackerDocuments(records);

  fs.mkdirSync(outputRoot, { recursive: true });
  for (const document of documents) {
    fs.writeFileSync(path.join(outputRoot, document.fileName), document.body, 'utf8');
  }

  console.log(`Renewal tracker generated: ${path.relative(process.cwd(), outputRoot)}`);
  for (const document of documents) {
    console.log(`- ${path.relative(process.cwd(), path.join(outputRoot, document.fileName))}`);
  }
  console.log(`Clients reviewed: ${records.length}`);
  console.log('No revenue, satisfaction, defects, business outcomes, or retention probability were invented.');
  console.log('No APIs, scraping, browser automation, outreach, scheduling, CRM, payment, invoice, credential, client-system, or external database actions were used.');
  console.log('Human approval is required before any renewal or expansion action.');
}

function readClients(): Client[] {
  if (!fs.existsSync(clientsPath)) return [];
  const raw = fs.readFileSync(clientsPath, 'utf8').trim();
  if (!raw) return [];
  return JSON.parse(raw) as Client[];
}

function detectSources(clientId: string): RenewalClientSources {
  return {
    deliveryPlan: localSource('Delivery plan', path.join('output', 'client-delivery', clientId, 'delivery-plan.md')),
    evidenceLog: localSource('Evidence log', path.join('output', 'client-delivery', clientId, 'evidence-log.md')),
    qaChecklist: localSource('QA checklist', path.join('output', 'client-delivery', clientId, 'qa-checklist.md')),
    weeklyDeliverySummary: localSource('Weekly delivery summary', path.join('output', 'client-delivery', clientId, 'weekly-delivery-summary.md')),
    executiveSummary: localSource('Executive summary', path.join('output', 'client-reporting', clientId, 'executive-summary.md')),
    weeklyReport: localSource('Weekly report', path.join('output', 'client-reporting', clientId, 'weekly-report.md')),
    monthlyReport: localSource('Monthly report', path.join('output', 'client-reporting', clientId, 'monthly-report.md')),
    valueDelivered: localSource('Value delivered', path.join('output', 'client-reporting', clientId, 'value-delivered.md')),
    renewalSignal: localSource('Renewal signal', path.join('output', 'client-reporting', clientId, 'renewal-signal.md')),
    clientUpdateDraft: localSource('Client update draft', path.join('output', 'client-reporting', clientId, 'client-update-draft.md')),
    legacyClientReport: localSource('Client report', path.join('output', 'client-reports', `${clientId}-report.md`)),
  };
}

function localSource(label: string, relativePath: string): RenewalSource {
  const absolutePath = path.join(process.cwd(), relativePath);
  const exists = fs.existsSync(absolutePath);
  return source(label, relativePath, exists, exists ? fs.readFileSync(absolutePath, 'utf8') : undefined);
}

main();
