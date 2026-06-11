import fs = require('fs');
import path = require('path');
import { ContactReviewRecord } from '../contactReview/types';
import { Lead } from '../leads/types';
import {
  buildCommercialModeReport,
  filterCommercialContactReviews,
  filterCommercialLeads,
  getDemoLeadReasons,
  isCommercialLead,
  isDemoLead,
  renderCommercialModeSummary,
  renderDemoIsolationReport,
} from './commercialModeRules';

export {
  buildCommercialModeReport,
  filterCommercialContactReviews,
  filterCommercialLeads,
  getDemoLeadReasons,
  isCommercialLead,
  isDemoLead,
};

const outputDir = path.join(process.cwd(), 'output', 'commercial-mode');

function main(): void {
  const generatedAt = new Date().toISOString();
  const leads = readJson<Lead[]>(path.join('data', 'leads.json'), []);
  const contactReviews = readJson<ContactReviewRecord[]>(path.join('data', 'contact-reviews.json'), []);
  const report = buildCommercialModeReport({ generatedAt, leads, contactReviews });

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'demo-isolation-report.md'), renderDemoIsolationReport(report), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'commercial-mode-summary.md'), renderCommercialModeSummary(report), 'utf8');

  console.log(`Demo isolation report generated: ${relative(path.join(outputDir, 'demo-isolation-report.md'))}`);
  console.log(`Commercial mode summary generated: ${relative(path.join(outputDir, 'commercial-mode-summary.md'))}`);
  console.log(`Total leads: ${report.summary.totalLeads}`);
  console.log(`Commercial leads: ${report.summary.commercialLeads.length}`);
  console.log(`Demo leads: ${report.summary.demoLeads.length}`);
  console.log(`Top commercial opportunity: ${report.topCommercialOpportunities[0]?.lead.companyName ?? 'none'}`);
  console.log('No APIs, scraping, browsing, CRM, outreach automation, payments, credentials, or external databases were used.');
  console.log('Human approval remains required before external action.');
}

function readJson<T>(relativePath: string, fallback: T): T {
  const absolutePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) return fallback;
  const raw = fs.readFileSync(absolutePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function relative(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}

if (require.main === module) {
  main();
}
