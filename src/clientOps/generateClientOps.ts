import fs = require('fs');
import path = require('path');
import { Client } from '../clientReports/types';
import { ContactReviewRecord } from '../contactReview/types';
import { Lead } from '../leads/types';
import { buildClientOpsCenter, renderClientOperationsCenter, renderClientReadiness } from './clientOpsRules';

const leadsPath = path.join(process.cwd(), 'data', 'leads.json');
const clientsPath = path.join(process.cwd(), 'data', 'clients.json');
const contactReviewsPath = path.join(process.cwd(), 'data', 'contact-reviews.json');
const outputDir = path.join(process.cwd(), 'output', 'client-ops');

function main(): void {
  const center = buildClientOpsCenter({
    leads: readJson<Lead[]>(leadsPath, []),
    clients: readJson<Client[]>(clientsPath, []),
    contactReviews: readJson<ContactReviewRecord[]>(contactReviewsPath, []),
    pipelineMarkdownExists: exists(path.join('output', 'pipeline', 'opportunity-tracker.md')),
    topOpportunitiesMarkdownExists: exists(path.join('output', 'pipeline', 'top-opportunities.md')),
  });

  const opsPath = path.join(outputDir, 'client-operations-center.md');
  const readinessPath = path.join(outputDir, 'client-readiness.md');

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(opsPath, renderClientOperationsCenter(center), 'utf8');
  fs.writeFileSync(readinessPath, renderClientReadiness(center), 'utf8');

  console.log(`Client operations center generated: ${path.relative(process.cwd(), opsPath)}`);
  console.log(`Client readiness generated: ${path.relative(process.cwd(), readinessPath)}`);
  console.log(`Top priority: ${center.actions[0]?.company ?? 'none'}`);
  console.log('No APIs, scraping, browsing, CRM integrations, outreach automation, email, LinkedIn, payments, invoices, external databases, or credentials were used.');
  console.log('Human approval remains required before external action.');
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function exists(relativePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

main();
