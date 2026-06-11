import fs = require('fs');
import path = require('path');
import { approvalQueueDir } from '../config/paths';
import { followUpLabel } from '../outreach/outreachCadence';
import { Lead, OutreachRecord } from '../types/lead';

export function writeFollowUpDueDrafts(leads: Lead[], outreachHistory: OutreachRecord[], now = new Date().toISOString()): string[] {
  fs.mkdirSync(approvalQueueDir, { recursive: true });
  const dueLeads = leads.filter((lead) => isDueLead(lead, now));

  return dueLeads.map((lead) => {
    const latestOutreach = outreachHistory
      .filter((record) => record.leadId === lead.id)
      .sort((a, b) => b.sentAt.localeCompare(a.sentAt))[0];
    const filePath = path.join(approvalQueueDir, `lead-${lead.id}-followup-due.md`);
    fs.writeFileSync(filePath, `${buildFollowUpDraft(lead, latestOutreach).trim()}\n`, 'utf8');
    return path.relative(process.cwd(), filePath);
  });
}

export function getDueLeads(leads: Lead[], now = new Date().toISOString()): Lead[] {
  return leads.filter((lead) => isDueLead(lead, now));
}

function isDueLead(lead: Lead, now: string): boolean {
  return Boolean(lead.nextFollowUpAt && lead.nextFollowUpAt <= now && !['won', 'lost', 'ignored'].includes(lead.status));
}

function buildFollowUpDraft(lead: Lead, latestOutreach: OutreachRecord | undefined): string {
  const label = latestOutreach ? followUpLabel(latestOutreach.sentAt, lead.nextFollowUpAt) : 'Follow-up';

  return `# Follow-Up Due: ${lead.companyName}

Human review required before sending. Nothing is sent automatically.

## Lead Details

- Lead ID: ${lead.id}
- Company: ${lead.companyName}
- Website: ${lead.website || 'Not provided'}
- Contact: ${lead.contactName || 'Not provided'}
- Role: ${lead.contactRole || 'Not provided'}
- Email: ${lead.contactEmail || 'Not provided'}
- LinkedIn: ${lead.linkedinUrl || 'Not provided'}
- Status: ${lead.status}
- Next follow-up due: ${lead.nextFollowUpAt}
- Last outreach channel: ${latestOutreach?.channel ?? 'Not recorded'}
- Last outreach note: ${latestOutreach?.note ?? 'Not recorded'}

## Suggested ${label}

Hi ${lead.contactName || 'there'}, quick follow-up.

I wanted to check whether a focused Playwright QA audit would be useful for ${lead.companyName}. The goal would be practical: identify QA risks, review public-page signals or agreed workflows, and recommend the first automation steps without overbuilding.

If now is not the right time, no problem. I can also share a short outline you can keep for later.

## Suggested Next Action

Review the lead context, personalize this message, send manually if appropriate, then run:

npm run lead:sent -- --id ${lead.id} --channel ${latestOutreach?.channel ?? 'linkedin'} --note "Sent ${label}"
`;
}
