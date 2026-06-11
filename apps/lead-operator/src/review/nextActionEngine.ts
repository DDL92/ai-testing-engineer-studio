import { Lead, OutreachRecord } from '../types/lead';

export type NextActionId =
  | 'enrich_contact'
  | 'run_audit'
  | 'generate_proposal'
  | 'send_first_message'
  | 'follow_up_due'
  | 'wait_for_reply'
  | 'mark_won'
  | 'mark_lost'
  | 'ignore'
  | 'no_action_needed';

export interface LeadArtifacts {
  auditReports: string[];
  proposalDrafts: string[];
}

export interface NextActionRecommendation {
  action: NextActionId;
  reason: string;
  command: string;
  suggestedMessage: string;
  blockedReason: string;
}

export function recommendNextAction(input: {
  lead: Lead;
  outreachHistory: OutreachRecord[];
  artifacts: LeadArtifacts;
  now?: string;
}): NextActionRecommendation {
  const now = input.now ?? new Date().toISOString();
  const lead = input.lead;
  const leadOutreach = input.outreachHistory.filter((record) => record.leadId === lead.id);
  const hasContactInfo = Boolean(lead.contactEmail || lead.linkedinUrl);
  const hasAudit = input.artifacts.auditReports.length > 0;
  const hasProposal = input.artifacts.proposalDrafts.length > 0;
  const isHotOrWarm = lead.scoreBreakdown.category === 'hot' || lead.scoreBreakdown.category === 'warm';
  const hasRedFlags = lead.scoreBreakdown.category === 'ignore' || lead.scoreBreakdown.negative.length > 0 && lead.score < 20;

  if (['won', 'lost', 'ignored'].includes(lead.status)) {
    return recommendation('no_action_needed', `Lead is already ${lead.status}.`, `npm run lead:review -- --id ${lead.id}`, '', '');
  }

  if (lead.status === 'replied') {
    return recommendation('mark_won', 'Lead replied. Review commercial fit and convert if the client agreed to an offer.', `npm run lead:convert -- --id ${lead.id} --offer monthly_qa_maintenance --amount 1000 --note "Closed after reply"`, '', '');
  }

  if (!lead.website) {
    return hasRedFlags
      ? recommendation('ignore', 'Lead has no website and low-quality/red-flag signals.', `npm run lead:update -- --id ${lead.id} --status ignored --note "No usable website or fit"`, '', 'Missing website and weak qualification.')
      : recommendation('enrich_contact', 'Lead is missing a website, so the fit cannot be validated yet.', `npm run lead:enrich -- --id ${lead.id} --website "https://example.com" --note "Added website after manual research"`, '', 'Missing website.');
  }

  if (!hasContactInfo) {
    return recommendation('enrich_contact', 'Lead needs a safe manual contact path before outreach.', `npm run lead:enrich -- --id ${lead.id} --email "founder@example.com" --note "Found on public company website"`, '', 'Missing email or LinkedIn URL.');
  }

  if (hasRedFlags) {
    return recommendation('ignore', 'Lead has low quality or red-flag scoring signals.', `npm run lead:update -- --id ${lead.id} --status ignored --note "Low fit after review"`, '', 'Low score or red flags.');
  }

  if (leadOutreach.length > 0 && lead.nextFollowUpAt && lead.nextFollowUpAt <= now) {
    return recommendation('follow_up_due', 'Manual outreach was sent and the next follow-up date is due or overdue.', 'npm run lead:followups:due', followUpMessage(lead), '');
  }

  if (isHotOrWarm && !hasAudit) {
    return recommendation('run_audit', 'Hot/warm lead has a website and contact path, but no lead-specific audit report exists yet.', `npm run lead:audit -- --id ${lead.id}`, '', '');
  }

  if (hasAudit && !hasAuditBasedProposal(input.artifacts.proposalDrafts, lead.id)) {
    return recommendation('generate_proposal', 'Audit exists, but no audit-based proposal draft was found.', `npm run lead:audit -- --id ${lead.id}`, '', '');
  }

  if (hasProposal && leadOutreach.length === 0) {
    return recommendation('send_first_message', 'Proposal draft exists and no outreach has been recorded yet.', `npm run lead:sent -- --id ${lead.id} --channel linkedin --note "Sent first message"`, firstMessage(lead), '');
  }

  if (leadOutreach.length > 0) {
    return recommendation('wait_for_reply', 'Outreach is recorded and the next follow-up is not due yet.', `npm run lead:review -- --id ${lead.id}`, '', '');
  }

  return recommendation('no_action_needed', 'No immediate action is available from the current data.', `npm run lead:review -- --id ${lead.id}`, '', '');
}

function recommendation(action: NextActionId, reason: string, command: string, suggestedMessage: string, blockedReason: string): NextActionRecommendation {
  return { action, reason, command, suggestedMessage, blockedReason };
}

function hasAuditBasedProposal(files: string[], leadId: string): boolean {
  return files.some((file) => file.includes(`lead-${leadId}-audit-based-proposal.md`));
}

function firstMessage(lead: Lead): string {
  return `Hi ${lead.contactName || 'there'}, I reviewed ${lead.companyName} and it looks like a possible fit for a focused Playwright QA audit. I can share a short report with public-page QA signals, automation opportunities, and practical next steps.`;
}

function followUpMessage(lead: Lead): string {
  return `Hi ${lead.contactName || 'there'}, quick follow-up. If QA automation is still relevant, I can keep the next step lightweight with a focused Playwright audit and a short action plan.`;
}
