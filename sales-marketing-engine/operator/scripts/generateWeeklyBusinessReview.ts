import fs = require('fs');
import path = require('path');
import { formatCurrency, getLeads, isDue, operatorRoot, parseMoney, safeText, scoreLead, writeMarkdown } from './operatorUtils';

export function generateWeeklyBusinessReview(): void {
  const leads = getLeads();
  const pipelineValue = leads.reduce((sum, lead) => sum + parseMoney(lead.estimated_value), 0);
  const followUpsDue = leads.filter((lead) => isDue(lead.next_follow_up_date));
  const highPriority = leads.filter((lead) => scoreLead(lead) >= 8);
  const metricsPath = path.join(operatorRoot, '..', 'weekly-sales-dashboard', 'sales-metrics-tracker.csv');
  const hasMetrics = fs.existsSync(metricsPath);
  const proposalsPrepared = fs.existsSync(path.join(operatorRoot, 'generated', 'proposal-queue.md')) ? 'Review proposal queue generated this week.' : 'Run operator:proposals.';
  const aiCount = leads.filter((lead) => safeText(lead.service_fit).includes('AI Testing')).length;
  const bestOffer = aiCount > 1 ? 'AI Testing Audit' : 'Playwright QA Automation Audit';

  const content = [
    '# Weekly Business Review',
    '',
    '## Weekly Summary',
    '',
    `- Leads in CRM: ${leads.length}`,
    `- High priority leads: ${highPriority.length}`,
    `- Follow-ups due: ${followUpsDue.length}`,
    `- Pipeline estimate: ${formatCurrency(pipelineValue)}`,
    `- Sales metrics tracker found: ${hasMetrics ? 'Yes' : 'No'}`,
    '',
    '## Leads Added',
    '',
    `${leads.length} total leads are currently tracked in the operator input CRM.`,
    '',
    '## Proposals Prepared',
    '',
    proposalsPrepared,
    '',
    '## Best Offer To Focus On',
    '',
    bestOffer,
    '',
    '## Bottlenecks',
    '',
    '- If messages are prepared but not sent, reduce daily target and send only the top 3.',
    '- If replies are low, improve personalization and first-line relevance.',
    '- If proposals do not close, reduce scope instead of discounting.',
    '',
    '## Next Week Plan',
    '',
    '1. Add 25 qualified leads.',
    '2. Send 20 personalized messages/proposals manually.',
    '3. Complete all follow-ups due.',
    '4. Prepare at least two fixed-scope proposals.',
    '5. Publish three content pieces tied to audit offers.',
    '',
    '## What To Stop Doing',
    '',
    '- Stop researching leads without sending messages.',
    '- Stop pitching frameworks when the client pain is still unclear.',
    '- Stop following up after the final respectful close-the-loop message.',
    '',
    '## What To Double Down On',
    '',
    '- Playwright QA Automation Audit as the entry offer.',
    '- AI Testing Audit for AI/RAG products.',
    '- Manual approval queue before every send.'
  ].join('\n');

  writeMarkdown('generated/weekly-business-review.md', content);
}

if (require.main === module) generateWeeklyBusinessReview();

