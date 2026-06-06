import { getLeads, recommendedAngle, safeText, scoreLead, writeMarkdown } from './operatorUtils';

export function generateMessagesToSend(): void {
  const leads = getLeads()
    .map((lead) => ({ lead, score: scoreLead(lead) }))
    .filter((item) => item.score >= 8)
    .sort((a, b) => b.score - a.score);

  const sections = leads.flatMap(({ lead, score }) => {
    const name = safeText(lead.lead_name);
    const company = safeText(lead.company);
    const service = safeText(lead.service_fit);
    const pain = safeText(lead.pain_point);
    const angle = recommendedAngle(lead);

    return [
      `## ${name} - ${company}`,
      '',
      'REVIEW BEFORE SENDING',
      '',
      `- Score: ${score}/10`,
      `- Service angle: ${service}`,
      `- Pain point: ${pain}`,
      `- Message angle: ${angle}`,
      '',
      '### LinkedIn Connection Request',
      '',
      `Hi ${name}, I work on QA automation and AI Testing for teams dealing with ${pain.toLowerCase()}. I saw ${company} and wanted to connect.`,
      '',
      '### First Message',
      '',
      `Thanks for connecting, ${name}. Based on ${company}'s likely need around ${pain.toLowerCase()}, a focused ${service} could identify the fastest QA wins. Would it be useful if I send the audit outline?`,
      '',
      '### Short Email Version',
      '',
      `Subject: ${service} for ${company}`,
      '',
      `Hi ${name},`,
      '',
      `I noticed ${company} may be dealing with ${pain.toLowerCase()}. I help teams with ${angle.toLowerCase()}`,
      '',
      'Would it be useful if I sent a short outline?',
      '',
      'Best,',
      'Daniel',
      '',
      '### CTA',
      '',
      'Would it be useful if I send the audit outline?',
      ''
    ];
  });

  const content = ['# Messages To Send', '', 'Every message below requires manual review and personalization before sending.', '', ...sections].join('\n');
  writeMarkdown('generated/messages-to-send.md', content);
  writeMarkdown('approval-queue/messages-ready-to-send.md', content);
}

if (require.main === module) generateMessagesToSend();

