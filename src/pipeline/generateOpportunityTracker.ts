import fs = require('fs');
import path = require('path');
import { ContactReviewRecord } from '../contactReview/types';
import { readLeads } from '../leads/leadStore';
import { allPipelineStages, buildOpportunityTracker } from './pipelineRules';
import { OpportunityItem, OpportunityTracker, PipelineStage } from './types';

const contactReviewsPath = path.join(process.cwd(), 'data', 'contact-reviews.json');
const outputDir = path.join(process.cwd(), 'output', 'pipeline');

function main(): void {
  const leads = readLeads();
  const contactReviews = readContactReviews();
  const tracker = buildOpportunityTracker(leads, contactReviews);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'opportunity-tracker.md'), renderOpportunityTracker(tracker), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'top-opportunities.md'), renderTopOpportunities(tracker), 'utf8');
  fs.writeFileSync(path.join(outputDir, 'follow-up-needed.md'), renderFollowUps(tracker), 'utf8');

  console.log(`Opportunity tracker generated: ${path.relative(process.cwd(), outputDir)}`);
  console.log(`Total leads: ${tracker.totalLeads}`);
  console.log(`Total opportunities: ${tracker.totalOpportunities}`);
  console.log(`Top opportunity: ${tracker.topOpportunities[0]?.lead.companyName ?? 'none'}`);
  console.log(`Follow-ups needed: ${tracker.followUpsNeeded.length}`);
  console.log('No APIs, scraping, browsing, CRM integrations, outreach automation, email, LinkedIn, or payment systems were used.');
  console.log('Human approval remains required before any external action.');
}

function readContactReviews(): ContactReviewRecord[] {
  if (!fs.existsSync(contactReviewsPath)) return [];
  const raw = fs.readFileSync(contactReviewsPath, 'utf8').trim();
  if (!raw) return [];
  return JSON.parse(raw) as ContactReviewRecord[];
}

function renderOpportunityTracker(tracker: OpportunityTracker): string {
  return `# Opportunity Tracker

Generated: ${tracker.generatedAt}

## Summary

- Total Leads: ${tracker.totalLeads}
- Total Opportunities: ${tracker.totalOpportunities}
- Tier A: ${tracker.tierSummary.A}
- Tier B: ${tracker.tierSummary.B}
- Tier C: ${tracker.tierSummary.C}

## Pipeline Breakdown

${allPipelineStages().map((stage) => `- ${stage}: ${tracker.pipelineBreakdown[stage]}`).join('\n')}

## Top Opportunities

${renderOpportunityTable(tracker.topOpportunities)}

## Immediate Actions

${tracker.immediateActions.map((action) => `- ${action}`).join('\n')}

## Safety Rules

- Local-first tracker only.
- No APIs, scraping, browsing, CRM integrations, outreach automation, email sending, LinkedIn automation, payment systems, or external databases were used.
- Daniel must approve every external action manually.
`;
}

function renderTopOpportunities(tracker: OpportunityTracker): string {
  const items = tracker.topOpportunities;

  return `# Top Opportunities

${items.length === 0 ? 'No active opportunities found.' : items.map(renderTopOpportunity).join('\n\n')}

## Safety Rules

- Use this as a prioritization aid only.
- Do not send outreach, create proposals, schedule calls, create invoices, or update external systems without Daniel approval.
`;
}

function renderTopOpportunity(item: OpportunityItem, index: number): string {
  return `## ${index + 1}. ${item.lead.companyName}

- Company: ${item.lead.companyName}
- Opportunity Score: ${item.opportunityScore}
- Tier: ${item.tier}
- Offer: ${item.lead.recommendedOffer}
- Current Stage: ${item.pipelineStage}
- Reason: ${item.reason}
- Next Action: ${item.nextAction}`;
}

function renderFollowUps(tracker: OpportunityTracker): string {
  const items = tracker.followUpsNeeded;

  return `# Follow-Up Needed

${items.length === 0 ? 'No follow-ups currently required.' : items.map(renderFollowUpItem).join('\n\n')}

## Safety Rules

- Follow up manually only after reviewing context.
- Do not automate email, LinkedIn, contact forms, CRM updates, or reminders from this tracker.
`;
}

function renderFollowUpItem(item: OpportunityItem): string {
  const review = item.contactReview;

  return `## ${item.lead.companyName}

- Company: ${item.lead.companyName}
- Contact Status: ${review?.contactStatus ?? 'not-recorded'}
- Message Status: ${review?.messageStatus ?? 'not-recorded'}
- Next Follow-Up Date: ${review?.nextFollowUpDate || 'not set'}
- Recommended Action: ${item.nextAction}`;
}

function renderOpportunityTable(items: OpportunityItem[]): string {
  if (items.length === 0) return 'No active opportunities found.';

  return [
    '| Company | Score | Tier | Pipeline Stage | Offer | Next Action |',
    '| --- | ---: | --- | --- | --- | --- |',
    ...items.map((item) => `| ${escapeTable(item.lead.companyName)} | ${item.opportunityScore} | ${item.tier} | ${item.pipelineStage} | ${item.lead.recommendedOffer} | ${escapeTable(item.nextAction)} |`),
  ].join('\n');
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|');
}

main();
