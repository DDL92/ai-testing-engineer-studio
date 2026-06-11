import fs = require('fs');
import path = require('path');
import { approvalQueueDir, generatedDir } from '../config/paths';
import { estimateSuggestedOfferValue } from '../revenue/offers';
import { recommendNextAction, NextActionRecommendation } from './nextActionEngine';
import { Lead, OutreachRecord } from '../types/lead';

export interface LeadReviewContext {
  lead: Lead;
  outreachHistory: OutreachRecord[];
  auditReports: string[];
  proposalDrafts: string[];
  missingFields: string[];
  redFlags: string[];
  recommendation: NextActionRecommendation;
}

export function buildLeadReviewContext(lead: Lead, allOutreachHistory: OutreachRecord[]): LeadReviewContext {
  const outreachHistory = allOutreachHistory
    .filter((record) => record.leadId === lead.id)
    .sort((a, b) => a.sentAt.localeCompare(b.sentAt));
  const auditReports = findAuditReports(lead.id);
  const proposalDrafts = findProposalDrafts(lead.id);
  const missingFields = findMissingFields(lead);
  const redFlags = findRedFlags(lead);
  const recommendation = recommendNextAction({
    lead,
    outreachHistory,
    artifacts: { auditReports, proposalDrafts },
  });

  return {
    lead,
    outreachHistory,
    auditReports,
    proposalDrafts,
    missingFields,
    redFlags,
    recommendation,
  };
}

export function writeLeadReview(context: LeadReviewContext): string {
  fs.mkdirSync(generatedDir, { recursive: true });
  const filePath = path.join(generatedDir, `lead-${context.lead.id}-review.md`);
  fs.writeFileSync(filePath, `${formatLeadReview(context).trim()}\n`, 'utf8');
  return path.relative(process.cwd(), filePath);
}

export function formatLeadReview(context: LeadReviewContext): string {
  const lead = context.lead;
  return `# Lead Review: ${lead.companyName}

## Lead Snapshot

- Lead ID: ${lead.id}
- Company name: ${lead.companyName}
- Website: ${lead.website || 'Missing'}
- Source: ${lead.source}
- Source URL: ${lead.sourceUrl || 'Not provided'}
- Status: ${lead.status}
- Score: ${lead.score}/100
- Score category: ${lead.scoreBreakdown.category}
- Suggested offer: ${lead.suggestedOffer || 'Not set'}
- Last contacted date: ${lead.lastContactedAt || 'Not contacted'}
- Next follow-up date: ${lead.nextFollowUpAt || 'Not scheduled'}

## Qualification

- QA fit reason: ${lead.qaFitReason || 'Not documented'}
- Detected pain point: ${lead.detectedPainPoint || 'Not documented'}
- Tech stack hints: ${lead.techStackHints.length ? lead.techStackHints.join(', ') : 'None'}

### Score Breakdown

${formatList([...lead.scoreBreakdown.positive, ...lead.scoreBreakdown.negative])}

### Risks / Red Flags

${formatList(context.redFlags)}

## Contact Details

- Contact name: ${lead.contactName || 'Missing'}
- Contact role: ${lead.contactRole || 'Missing'}
- Contact email: ${lead.contactEmail || 'Missing'}
- LinkedIn URL: ${lead.linkedinUrl || 'Missing'}

## Outreach History

${context.outreachHistory.length ? context.outreachHistory.map((record) => `- ${record.sentAt}: ${record.channel}, ${record.messageType}, next follow-up ${record.nextFollowUpAt}. Note: ${record.note || 'None'}`).join('\n') : '- No outreach recorded.'}

## Audit Status

${context.auditReports.length ? context.auditReports.map((file) => `- ${file}`).join('\n') : '- No lead-specific audit reports found.'}

## Proposal Status

${context.proposalDrafts.length ? context.proposalDrafts.map((file) => `- ${file}`).join('\n') : '- No proposal drafts found.'}

## Missing Information

${formatList(context.missingFields)}

## Recommended Next Action

- Action: ${context.recommendation.action}
- Reason: ${context.recommendation.reason}
- Blocked reason: ${context.recommendation.blockedReason || 'Not blocked'}
- Recommended next status: ${recommendedStatus(context.recommendation.action)}
- Suggested command to run next: ${context.recommendation.command}

## Revenue Recommendation

- Suggested offer: ${lead.suggestedOffer || 'Not set'}
- Suggested amount: $${estimateSuggestedOfferValue(lead.suggestedOffer)}
- Conversion readiness: ${conversionReadiness(context)}
- Close recommendation: ${closeRecommendation(context)}
- Suggested conversion command: ${conversionCommand(lead)}
- Suggested close command: ${closeCommand(lead)}

## Suggested Commands

- npm run lead:review -- --id ${lead.id}
- ${context.recommendation.command}
- ${conversionCommand(lead)}
- ${closeCommand(lead)}
- npm run lead:pipeline
- npm run lead:daily

## Suggested Message

${context.recommendation.suggestedMessage || 'No message suggested for this action.'}

## Notes

${lead.notes || 'No notes recorded.'}
`;
}

function findAuditReports(leadId: string): string[] {
  const auditDir = path.join(process.cwd(), 'reports', 'leads', leadId);
  if (!fs.existsSync(auditDir)) return [];
  return ['audit-result.json', 'client-report.md', 'technical-report.md', 'screenshots/homepage.png']
    .map((file) => path.join(auditDir, file))
    .filter((file) => fs.existsSync(file))
    .map((file) => path.relative(process.cwd(), file));
}

function findProposalDrafts(leadId: string): string[] {
  if (!fs.existsSync(approvalQueueDir)) return [];
  return fs.readdirSync(approvalQueueDir)
    .filter((file) => file.includes(leadId) && file.endsWith('.md'))
    .map((file) => path.relative(process.cwd(), path.join(approvalQueueDir, file)))
    .sort();
}

function findMissingFields(lead: Lead): string[] {
  return [
    !lead.website ? 'website' : '',
    !lead.contactName ? 'contactName' : '',
    !lead.contactRole ? 'contactRole' : '',
    !lead.contactEmail ? 'contactEmail' : '',
    !lead.linkedinUrl ? 'linkedinUrl' : '',
  ].filter(Boolean);
}

function findRedFlags(lead: Lead): string[] {
  const redFlags = [...lead.scoreBreakdown.negative];
  if (lead.scoreBreakdown.category === 'ignore') redFlags.push('Lead is categorized as ignore.');
  if (lead.score < 20) redFlags.push('Score is below outreach threshold.');
  return redFlags;
}

function formatList(items: string[]): string {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- None.';
}

function recommendedStatus(action: string): string {
  if (action === 'ignore') return 'ignored';
  if (action === 'send_first_message') return 'proposal_sent after manual send';
  if (action === 'follow_up_due') return 'proposal_sent or contacted after manual follow-up';
  if (action === 'run_audit') return 'audit_completed after audit';
  return 'keep current status';
}

function conversionReadiness(context: LeadReviewContext): string {
  if (context.lead.status === 'won') return 'Already converted.';
  if (context.lead.status === 'proposal_sent' || context.lead.status === 'replied') return 'High. Lead has active commercial conversation status.';
  if (context.auditReports.length > 0 && context.proposalDrafts.length > 0) return 'Medium. Audit and proposal artifacts exist.';
  return 'Low. Continue qualification before converting.';
}

function closeRecommendation(context: LeadReviewContext): string {
  if (context.lead.status === 'lost' || context.lead.status === 'ignored') return 'Already closed.';
  if (context.redFlags.length > 0) return 'Consider closing or ignoring if red flags remain after review.';
  if (context.recommendation.action === 'ignore') return 'Close as ignored or not_fit.';
  return 'Do not close yet.';
}

function conversionCommand(lead: Lead): string {
  return `npm run lead:convert -- --id ${lead.id} --offer monthly_qa_maintenance --amount 1000 --note "Closed after audit call"`;
}

function closeCommand(lead: Lead): string {
  return `npm run lead:close -- --id ${lead.id} --result lost --reason no_response --note "No response after follow-up sequence"`;
}
