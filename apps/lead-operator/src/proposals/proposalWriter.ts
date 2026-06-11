import fs = require('fs');
import path = require('path');
import { approvalQueueDir } from '../config/paths';
import { buildProposalMarkdown } from './templates';
import { Lead } from '../types/lead';

export function writeProposalDrafts(leads: Lead[]): string[] {
  fs.mkdirSync(approvalQueueDir, { recursive: true });
  const eligibleStatuses: Lead['status'][] = ['new', 'scored', 'approved', 'replied', 'audit_offered', 'audit_completed'];
  const eligible = leads.filter((lead) => (
    lead.scoreBreakdown.category === 'hot' || lead.scoreBreakdown.category === 'warm'
  ) && eligibleStatuses.includes(lead.status));
  return eligible.map((lead) => {
    const filePath = path.join(approvalQueueDir, `lead-${lead.id}-proposal.md`);
    fs.writeFileSync(filePath, `${buildProposalMarkdown(lead).trim()}\n`, 'utf8');
    return path.relative(process.cwd(), filePath);
  });
}
