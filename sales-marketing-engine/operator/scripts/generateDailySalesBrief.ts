import { formatCurrency, getLeads, isDue, parseMoney, safeText, scoreLead, todayIso, writeMarkdown } from './operatorUtils';

export function generateDailySalesBrief(): void {
  const leads = getLeads();
  const scored = leads.map((lead) => ({ lead, score: scoreLead(lead) })).sort((a, b) => b.score - a.score);
  const highPriority = scored.filter((item) => item.score >= 8);
  const followUpsDue = leads.filter((lead) => isDue(lead.next_follow_up_date));
  const best3 = scored.slice(0, 3);
  const pipelineValue = leads.reduce((sum, lead) => sum + parseMoney(lead.estimated_value), 0);
  const serviceCounts = leads.reduce<Record<string, number>>((acc, lead) => {
    const service = safeText(lead.service_fit);
    acc[service] = (acc[service] ?? 0) + 1;
    return acc;
  }, {});
  const bestService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Playwright QA Automation Audit';

  const content = [
    '# Daily Sales Brief',
    '',
    `Today: ${todayIso()}`,
    '',
    `- Total leads: ${leads.length}`,
    `- High priority leads: ${highPriority.length}`,
    `- Follow-ups due: ${followUpsDue.length}`,
    `- Best service to pitch today: ${bestService}`,
    `- Estimated pipeline value: ${formatCurrency(pipelineValue)}`,
    '',
    '## Best 3 Leads To Contact Today',
    '',
    ...best3.flatMap(({ lead, score }) => [
      `### ${safeText(lead.lead_name)} - ${safeText(lead.company)}`,
      `- Score: ${score}/10`,
      `- Service: ${safeText(lead.service_fit)}`,
      `- Pain: ${safeText(lead.pain_point)}`,
      `- Action: Send/review personalized outreach.`,
      ''
    ]),
    '## Recommended Daily Actions',
    '',
    '1. Review approval queue before sending anything.',
    '2. Send messages to the top 3 qualified leads.',
    '3. Complete follow-ups due today.',
    '4. Prepare one proposal from the proposal queue.',
    '5. Publish or schedule one reviewed content item manually.',
    '',
    '## 30-Minute Workflow',
    '',
    '- 5 min: CRM and follow-up review.',
    '- 10 min: lead research and qualification.',
    '- 10 min: message/proposal review.',
    '- 3 min: follow-up review.',
    '- 2 min: update CRM.'
  ].join('\n');

  writeMarkdown('generated/daily-sales-brief.md', content);
  writeMarkdown('generated/today-priorities.md', content);
}

if (require.main === module) generateDailySalesBrief();

