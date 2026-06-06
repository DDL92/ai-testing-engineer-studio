import { getLeads, isDue, safeText, todayIso, writeMarkdown } from './operatorUtils';

function suggestedFollowUp(status: string, name: string, service: string): string {
  if (status === 'Proposal Sent') return `Hi ${name}, checking whether the ${service} proposal scope matches what you had in mind. I can reduce the first milestone if you want to start smaller.`;
  if (status === 'Interested' || status === 'Replied') return `Hi ${name}, quick follow-up. If useful, I can turn the scope into a fixed ${service} proposal with deliverables, timeline, and price range.`;
  return `Hi ${name}, quick follow-up. The smallest useful first step would be a focused ${service}. No large commitment required upfront.`;
}

export function generateFollowUpsDue(): void {
  const due = getLeads().filter((lead) => isDue(lead.next_follow_up_date));
  const sections = due.flatMap((lead) => {
    const name = safeText(lead.lead_name);
    const status = safeText(lead.status);
    const service = safeText(lead.service_fit);
    return [
      `## ${name} - ${safeText(lead.company)}`,
      '',
      'REVIEW BEFORE SENDING',
      '',
      `- Status: ${status}`,
      `- Last contact date: ${safeText(lead.last_contact_date)}`,
      `- Service fit: ${service}`,
      `- Due date: ${safeText(lead.next_follow_up_date)}`,
      '',
      '### Suggested Follow-Up',
      '',
      suggestedFollowUp(status, name, service),
      '',
      `Next status recommendation: ${status === 'Proposal Sent' ? 'Interested or Won/Lost based on reply' : 'Replied or Follow Up Later'}`,
      ''
    ];
  });

  const content = ['# Follow-Ups Due', '', `Generated: ${todayIso()}`, '', ...sections].join('\n');
  writeMarkdown('generated/follow-ups-due.md', content);
  writeMarkdown('approval-queue/follow-ups-ready-to-send.md', content);
}

if (require.main === module) generateFollowUpsDue();

