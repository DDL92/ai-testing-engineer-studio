import fs = require('fs');
import path = require('path');
import { getFirst50ProgressReportPath, renderFirst50ProgressLines, writeFirst50ProgressReport } from '../first50/first50Progress';
import { readLeads } from '../leads/leadStore';
import { buildOutreachQueue } from './queueRules';
import { OutreachQueue, QueueLeadItem } from './types';

const outputPath = path.join(process.cwd(), 'output', 'outreach', 'outreach-queue.md');

function main(): void {
  const leads = readLeads();
  const first50Progress = writeFirst50ProgressReport(leads);
  const queue = buildOutreachQueue(leads);
  const markdown = renderOutreachQueue(queue);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, markdown, 'utf8');

  console.log(`Outreach queue generated: ${relativePath(outputPath)}`);
  console.log(`Top priority leads: ${queue.topPriorityLeads.length}`);
  console.log(`Follow-ups needed: ${queue.followUpsNeeded.length}`);
  console.log(`First 50 progress: ${first50Progress.totalLeads} total leads`);
  console.log(`First 50 report: ${getFirst50ProgressReportPath()}`);
  console.log('No messages were sent. Human approval is required before outreach.');
}

function renderOutreachQueue(queue: OutreachQueue): string {
  return [
    '# AI Studio OS Outreach Queue',
    '',
    `Date: ${queue.date}`,
    '',
    '## Top Priority Leads',
    renderLeadItems(queue.topPriorityLeads, 'No actionable leads available.'),
    '',
    '## Follow-Ups Needed',
    renderLeadItems(queue.followUpsNeeded, 'No follow-ups are currently flagged in local lead data.'),
    '',
    '## Audit Opportunities',
    renderLeadItems(queue.auditOpportunities, 'No audit opportunities are currently flagged.'),
    '',
    '## Proposal Opportunities',
    renderLeadItems(queue.proposalOpportunities, 'No proposal opportunities are currently flagged.'),
    '',
    '## Retainer Opportunities',
    renderLeadItems(queue.retainerOpportunities, 'No retainer opportunities are currently flagged.'),
    '',
    '## First 50 Progress',
    renderFirst50Progress(queue),
    '',
    '## Recommended Manual Actions',
    renderList(queue.recommendedManualActions),
    '',
    '## Suggested Commands',
    renderList(queue.suggestedCommands),
    '',
    '## Safety Rules',
    renderList(queue.safetyRules),
    '',
  ].join('\n');
}

function renderLeadItems(items: QueueLeadItem[], emptyText: string): string {
  if (items.length === 0) return emptyText;

  return items
    .map((item, index) => {
      const lead = item.lead;
      return `${index + 1}. ${lead.companyName} — Score ${lead.score}/10 — ${lead.recommendedOffer} — ${item.outreachStatus}\n`
        + `   - Next action: ${item.nextAction}`;
    })
    .join('\n');
}

function renderFirst50Progress(queue: OutreachQueue): string {
  return [
    ...renderFirst50ProgressLines(queue.first50Progress).map((line) => `- ${line}`),
    `- Progress report: ${getFirst50ProgressReportPath()}`,
  ].join('\n');
}

function renderList(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function relativePath(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}

main();
