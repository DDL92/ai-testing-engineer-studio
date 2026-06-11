import fs = require('fs');
import path = require('path');
import { Client } from '../clientReports/types';
import { ContactReviewRecord } from '../contactReview/types';
import { Lead } from '../leads/types';
import { buildRevenueVisibilityData, renderRevenueVisibilityMarkdown } from './dashboardRules';

const leadsPath = path.join(process.cwd(), 'data', 'leads.json');
const clientsPath = path.join(process.cwd(), 'data', 'clients.json');
const contactReviewsPath = path.join(process.cwd(), 'data', 'contact-reviews.json');
const outputDir = path.join(process.cwd(), 'output', 'dashboard');

function main(): void {
  const leads = readJson<Lead[]>(leadsPath, []);
  const clients = readJson<Client[]>(clientsPath, []);
  const contactReviews = readJson<ContactReviewRecord[]>(contactReviewsPath, []);
  const revenueVisibility = buildRevenueVisibilityData(leads, clients, contactReviews);
  const outputPath = path.join(outputDir, 'revenue-visibility.md');

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, renderRevenueVisibilityMarkdown(revenueVisibility), 'utf8');

  console.log(`Revenue visibility generated: ${path.relative(process.cwd(), outputPath)}`);
  console.log(`Estimated MRR: $${revenueVisibility.estimatedMrr.toLocaleString('en-US')}`);
  console.log(`Active clients: ${revenueVisibility.activeClients.length}`);
  console.log('No APIs, scraping, browsing, CRM integrations, invoices, payment systems, or external databases were used.');
  console.log('Opportunity revenue is estimated only and requires human approval before action.');
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

main();
