import fs = require('fs');
import path = require('path');
import { ContactReviewRecord } from '../contactReview/types';
import { Lead } from '../leads/types';
import {
  buildOutreachOperatingReport,
  renderConsoleSummary,
  renderContactResearchChecklist,
  renderExcludedDemoLeads,
  renderFirstAuditOfferPath,
  renderRealOutreachOperatingPack,
  renderTopFiveRealOutreach,
} from './outreachOperatingRules';
import { LocalContextSource, OutreachOperatingInput } from './types';

const outputDir = path.join(process.cwd(), 'output', 'outreach-operating');

function main(): void {
  const input = buildInput();
  const report = buildOutreachOperatingReport(input);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'real-outreach-operating-pack.md'), renderRealOutreachOperatingPack(report), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'top-5-real-outreach.md'), renderTopFiveRealOutreach(report), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'contact-research-checklist.md'), renderContactResearchChecklist(report), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'first-audit-offer-path.md'), renderFirstAuditOfferPath(report), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'excluded-demo-leads.md'), renderExcludedDemoLeads(report), 'utf8');

  console.log(`Real outreach operating pack generated: ${relative(path.join(outputDir, 'real-outreach-operating-pack.md'))}`);
  console.log(`Top 5 real outreach generated: ${relative(path.join(outputDir, 'top-5-real-outreach.md'))}`);
  console.log(`Contact research checklist generated: ${relative(path.join(outputDir, 'contact-research-checklist.md'))}`);
  console.log(`First audit offer path generated: ${relative(path.join(outputDir, 'first-audit-offer-path.md'))}`);
  console.log(`Excluded demo leads generated: ${relative(path.join(outputDir, 'excluded-demo-leads.md'))}`);
  for (const line of renderConsoleSummary(report)) {
    console.log(line);
  }
  console.log('No APIs, scraping, browsing, CRM, outreach automation, email sending, LinkedIn automation, payment systems, credentials, or external databases were used.');
  console.log('No contacts or company facts were invented. Human approval remains required before external action.');
}

function buildInput(): OutreachOperatingInput {
  const generatedAt = new Date().toISOString();

  return {
    generatedAt,
    leads: readJson<Lead[]>(path.join('data', 'leads.json'), []),
    contactReviews: readJson<ContactReviewRecord[]>(path.join('data', 'contact-reviews.json'), []),
    contextSources: [
      readContextSource('Top 10 revenue opportunities', path.join('output', 'pipeline-prioritization', 'top-10-revenue-opportunities.md')),
      readContextSource('Top 5 actions', path.join('output', 'pipeline-prioritization', 'top-5-actions.md')),
      readContextSource('Opportunity tracker', path.join('output', 'pipeline', 'opportunity-tracker.md')),
      readContextSource('Client ops next actions', path.join('output', 'client-ops', 'next-actions.md')),
      readContextSource('Daily command center', path.join('output', 'operator', 'daily-command-center.md')),
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
