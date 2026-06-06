import { getLeads, recommendedAngle, safeText, scoreLead, nextActionForLead, writeMarkdown } from './operatorUtils';

export function qualifyLeads(): void {
  const leads = getLeads()
    .map((lead) => ({ lead, score: scoreLead(lead) }))
    .sort((a, b) => b.score - a.score);

  const content = [
    '# Qualified Leads',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    ...leads.flatMap(({ lead, score }) => [
      `## ${safeText(lead.lead_name)} - ${safeText(lead.company)}`,
      '',
      `- Platform: ${safeText(lead.platform)}`,
      `- Role: ${safeText(lead.role)}`,
      `- Company type: ${safeText(lead.company_type)}`,
      `- Pain point: ${safeText(lead.pain_point)}`,
      `- Score: ${score}/10`,
      `- Recommended service: ${safeText(lead.service_fit)}`,
      `- Suggested message angle: ${recommendedAngle(lead)}`,
      `- Next action: ${nextActionForLead(lead, score)}`,
      ''
    ])
  ].join('\n');

  writeMarkdown('generated/qualified-leads.md', content);
}

if (require.main === module) qualifyLeads();

