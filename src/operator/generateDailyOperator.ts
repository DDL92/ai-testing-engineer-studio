import fs = require('fs');
import path = require('path');
import { Client } from '../clientReports/types';
import { buildDailyCommandCenter } from './operatorRules';
import { ContactReview, Lead, OperatorInput, OperatorSource } from './types';

const outputRoot = path.join(process.cwd(), 'output', 'operator');

function main(): void {
  const input = buildInput();
  const document = buildDailyCommandCenter(input);
  fs.mkdirSync(outputRoot, { recursive: true });
  fs.writeFileSync(path.join(outputRoot, document.fileName), document.body, 'utf8');

  console.log(`Daily command center generated: ${path.relative(process.cwd(), path.join(outputRoot, document.fileName))}`);
  console.log('No APIs, scraping, browser automation, CRM, outreach automation, emails, calendars, payments, credentials, or external databases were used.');
  console.log('Human approval remains required before external action.');
}

function buildInput(): OperatorInput {
  const generatedAt = new Date().toISOString();
  return {
    generatedAt,
    today: generatedAt.slice(0, 10),
    leads: readJson<Lead[]>(path.join('data', 'leads.json'), []),
    clients: readJson<Client[]>(path.join('data', 'clients.json'), []),
    contactReviews: readJson<ContactReview[]>(path.join('data', 'contact-reviews.json'), []),
    opportunityTracker: source('Opportunity tracker', path.join('output', 'pipeline', 'opportunity-tracker.md')),
    topOpportunities: source('Top opportunities', path.join('output', 'pipeline', 'top-opportunities.md')),
    followUpNeeded: source('Follow-up needed', path.join('output', 'pipeline', 'follow-up-needed.md')),
    dashboard: source('Dashboard', path.join('output', 'dashboard', 'dashboard.md')),
    clientOps: source('Client operations center', path.join('output', 'client-ops', 'client-operations-center.md')),
    nextActions: source('Client next actions', path.join('output', 'client-ops', 'next-actions.md')),
    renewalPipeline: source('Renewal pipeline', path.join('output', 'renewals', 'renewal-pipeline.md')),
    clientHealth: source('Client health', path.join('output', 'renewals', 'client-health.md')),
    renewalRiskReport: source('Renewal risk report', path.join('output', 'renewals', 'renewal-risk-report.md')),
    expansionOpportunities: source('Expansion opportunities', path.join('output', 'renewals', 'expansion-opportunities.md')),
    renewalActions: source('Renewal actions', path.join('output', 'renewals', 'renewal-actions.md')),
  };
}

function readJson<T>(relativePath: string, fallback: T): T {
  const absolutePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) return fallback;
  const raw = fs.readFileSync(absolutePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function source(label: string, relativePath: string): OperatorSource {
  const absolutePath = path.join(process.cwd(), relativePath);
  const exists = fs.existsSync(absolutePath);
  return {
    label,
    path: relativePath,
    exists,
    content: exists ? fs.readFileSync(absolutePath, 'utf8') : '',
  };
}

main();
