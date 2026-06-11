import fs = require('fs');
import path = require('path');
import { Client } from '../clientReports/types';
import { buildCommercialModeSummary, filterCommercialContactReviews } from '../commercialMode/commercialModeRules';
import { ContactReviewRecord } from '../contactReview/types';
import { Lead } from '../leads/types';
import {
  buildPipelinePrioritizationReport,
  renderConsoleSummary,
  renderPrioritizedPipeline,
  renderStalledOpportunities,
  renderTopFiveActions,
  renderTopRevenueOpportunities,
} from './pipelinePrioritizationRules';
import { LocalContextSource, PipelinePriorityInput } from './types';

const outputDir = path.join(process.cwd(), 'output', 'pipeline-prioritization');

function main(): void {
  const input = buildInput();
  const report = buildPipelinePrioritizationReport(input);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'top-5-actions.md'), renderTopFiveActions(report), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'prioritized-pipeline.md'), renderPrioritizedPipeline(report), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'commercial-prioritized-pipeline.md'), renderPrioritizedPipeline(report).replace('# Prioritized Pipeline', '# Commercial Prioritized Pipeline\n\nCommercial Mode: ON'), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'top-10-revenue-opportunities.md'), renderTopRevenueOpportunities(report), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'stalled-opportunities.md'), renderStalledOpportunities(report), 'utf8');

  console.log(`Top 5 actions generated: ${relative(path.join(outputDir, 'top-5-actions.md'))}`);
  console.log(`Prioritized pipeline generated: ${relative(path.join(outputDir, 'prioritized-pipeline.md'))}`);
  console.log(`Commercial prioritized pipeline generated: ${relative(path.join(outputDir, 'commercial-prioritized-pipeline.md'))}`);
  console.log(`Top revenue opportunities generated: ${relative(path.join(outputDir, 'top-10-revenue-opportunities.md'))}`);
  console.log(`Stalled opportunities generated: ${relative(path.join(outputDir, 'stalled-opportunities.md'))}`);
  for (const line of renderConsoleSummary(report)) {
    console.log(line);
  }
  console.log('No APIs, scraping, browsing, CRM, outreach automation, email, LinkedIn automation, payment systems, credentials, or external databases were used.');
  console.log('Human approval remains required before external action.');
}

function buildInput(): PipelinePriorityInput {
  const generatedAt = new Date().toISOString();
  const leads = readJson<Lead[]>(path.join('data', 'leads.json'), []);
  const contactReviews = readJson<ContactReviewRecord[]>(path.join('data', 'contact-reviews.json'), []);
  const commercialSummary = buildCommercialModeSummary(leads);

  return {
    generatedAt,
    today: generatedAt.slice(0, 10),
    leads: commercialSummary.commercialLeads,
    contactReviews: filterCommercialContactReviews(contactReviews, commercialSummary.commercialLeads),
    clients: readJson<Client[]>(path.join('data', 'clients.json'), []),
    contextSources: [
      readContextSource('Opportunity tracker', path.join('output', 'pipeline', 'opportunity-tracker.md')),
      readContextSource('Top opportunities', path.join('output', 'pipeline', 'top-opportunities.md')),
      readContextSource('Client ops next actions', path.join('output', 'client-ops', 'next-actions.md')),
      readContextSource('Daily command center', path.join('output', 'operator', 'daily-command-center.md')),
      readContextSource('Renewal client health', path.join('output', 'renewals', 'client-health.md')),
      readContextSource('Dashboard', path.join('output', 'dashboard', 'dashboard.md')),
    ],
  };
}

function readJson<T>(relativePath: string, fallback: T): T {
  const absolutePath = path.join(process.cwd(), relativePath);
  if (!fs.existsSync(absolutePath)) return fallback;
  const raw = fs.readFileSync(absolutePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}

function readContextSource(label: string, relativePath: string): LocalContextSource {
  const absolutePath = path.join(process.cwd(), relativePath);
  const exists = fs.existsSync(absolutePath);
  const content = exists ? fs.readFileSync(absolutePath, 'utf8') : '';

  return {
    label,
    path: relativePath,
    exists,
    excerpt: summarizeMarkdown(content),
  };
}

function summarizeMarkdown(content: string): string {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('|') && !line.startsWith('---'))
    .slice(0, 4)
    .join(' ');
}

function relative(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}

main();
