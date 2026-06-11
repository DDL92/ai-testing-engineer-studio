import fs = require('fs');
import path = require('path');
import { Client } from '../clientReports/types';
import { ContactReviewRecord } from '../contactReview/types';
import { Lead } from '../leads/types';
import { buildCommercialModeSummary, filterCommercialContactReviews, renderCommercialDashboardMarkdown } from '../commercialMode/commercialModeRules';
import { buildDashboardData, renderDashboardHtml, renderDashboardMarkdown } from './dashboardRules';

const leadsPath = path.join(process.cwd(), 'data', 'leads.json');
const clientsPath = path.join(process.cwd(), 'data', 'clients.json');
const contactReviewsPath = path.join(process.cwd(), 'data', 'contact-reviews.json');
const outputDir = path.join(process.cwd(), 'output', 'dashboard');

function main(): void {
  const leads = readJson<Lead[]>(leadsPath, []);
  const clients = readJson<Client[]>(clientsPath, []);
  const contactReviews = readJson<ContactReviewRecord[]>(contactReviewsPath, []);
  const commercialSummary = buildCommercialModeSummary(leads);
  const commercialContactReviews = filterCommercialContactReviews(contactReviews, commercialSummary.commercialLeads);
  const dashboard = buildDashboardData(commercialSummary.commercialLeads, clients, commercialContactReviews);
  const markdownPath = path.join(outputDir, 'dashboard.md');
  const htmlPath = path.join(outputDir, 'dashboard.html');
  const commercialPath = path.join(outputDir, 'commercial-dashboard.md');

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(markdownPath, renderDashboardMarkdown(dashboard), 'utf8');
  fs.writeFileSync(htmlPath, renderDashboardHtml(dashboard), 'utf8');
  fs.writeFileSync(commercialPath, renderCommercialDashboardMarkdown({
    generatedAt: dashboard.generatedAt,
    totalLeads: leads.length,
    commercialLeads: commercialSummary.commercialLeads,
    demoLeads: commercialSummary.demoLeads,
    opportunities: dashboard.pipeline.topOpportunities,
    activeClients: dashboard.activeClients.length,
  }), 'utf8');

  console.log(`Dashboard generated: ${path.relative(process.cwd(), markdownPath)}`);
  console.log(`Dashboard HTML generated: ${path.relative(process.cwd(), htmlPath)}`);
  console.log(`Commercial dashboard generated: ${path.relative(process.cwd(), commercialPath)}`);
  console.log('Commercial Mode: ON');
  console.log(`Commercial leads: ${commercialSummary.commercialLeads.length}`);
  console.log(`Excluded demo leads: ${commercialSummary.demoLeads.length}`);
  console.log(`Estimated MRR: $${dashboard.revenue.estimatedMrr.toLocaleString('en-US')}`);
  console.log(`Top opportunity: ${dashboard.pipeline.topOpportunities[0]?.lead.companyName ?? 'none'}`);
  console.log('No APIs, scraping, browsing, CRM integrations, outreach automation, email, LinkedIn, payment systems, or external databases were used.');
  console.log('Human approval remains required before external action.');
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

main();
