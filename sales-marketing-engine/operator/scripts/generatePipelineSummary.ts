import { formatCurrency, getLeads, groupBy, parseMoney, safeText, scoreLead, writeMarkdown } from './operatorUtils';

export function generatePipelineSummary(): void {
  const leads = getLeads();
  const byStatus = groupBy(leads, 'status');
  const byService = groupBy(leads, 'service_fit');
  const totalValue = leads.reduce((sum, lead) => sum + parseMoney(lead.estimated_value), 0);
  const highPriority = leads.filter((lead) => scoreLead(lead) >= 8);

  const statusLines = Object.entries(byStatus).map(([status, items]) => `- ${status}: ${items.length}`);
  const serviceLines = Object.entries(byService).map(([service, items]) => {
    const value = items.reduce((sum, lead) => sum + parseMoney(lead.estimated_value), 0);
    return `- ${service}: ${formatCurrency(value)}`;
  });

  const content = [
    '# Pipeline Summary',
    '',
    `- Total leads: ${leads.length}`,
    `- Total pipeline value: ${formatCurrency(totalValue)}`,
    '',
    '## Leads By Status',
    '',
    ...statusLines,
    '',
    '## Pipeline Value By Service',
    '',
    ...serviceLines,
    '',
    '## High Priority Opportunities',
    '',
    ...highPriority.map((lead) => `- ${safeText(lead.lead_name)} at ${safeText(lead.company)}: ${safeText(lead.service_fit)} (${formatCurrency(parseMoney(lead.estimated_value))})`),
    '',
    '## Estimated Revenue By Close Rate',
    '',
    `- 10% close: ${formatCurrency(totalValue * 0.1)}`,
    `- 20% close: ${formatCurrency(totalValue * 0.2)}`,
    `- 30% close: ${formatCurrency(totalValue * 0.3)}`,
    '',
    '## Recommended Next Commercial Action',
    '',
    'Focus on the highest-scored leads and pitch the Playwright QA Automation Audit when the problem is unclear. Convert audit wins into framework or retainer proposals.'
  ].join('\n');

  writeMarkdown('generated/pipeline-summary.md', content);
}

if (require.main === module) generatePipelineSummary();

