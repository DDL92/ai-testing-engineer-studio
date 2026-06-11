import fs = require('fs');
import path = require('path');
import type { ActionCockpit } from './actions/actionTypes';
import type { MessageReviewQueue } from './messages/messageReviewTypes';
import type { SourceQualityReport } from './sources/sourceTypes';
import { generatedDir } from './config/paths';
import { readActionCockpit, readClosedLeads, readConversions, readMessageReviewQueue, readOutreachHistory, readSourceQualityReport, writeDailySummary } from './storage/jsonStore';
import { DailySummary, Lead, Opportunity } from './types/lead';
import { allLeadStatuses, analyzePipeline } from './pipeline/pipelineAnalyzer';

export function generateDailySummary(input: {
  sourcesChecked: number;
  opportunities: Opportunity[];
  leads: Lead[];
  proposalFiles: string[];
  warnings: string[];
}): DailySummary {
  const hot = input.leads.filter((lead) => lead.scoreBreakdown.category === 'hot');
  const warm = input.leads.filter((lead) => lead.scoreBreakdown.category === 'warm');
  const ignored = input.leads.filter((lead) => lead.scoreBreakdown.category === 'ignore');
  const hotNeedingApproval = hot.filter((lead) => lead.status === 'scored' || lead.status === 'new');
  const warmWorthReviewing = warm.filter((lead) => lead.status === 'scored' || lead.status === 'new');
  const auditCompletedNoProposal = input.leads.filter((lead) => lead.status === 'audit_completed');
  const contactedNeedingFollowUp = input.leads.filter((lead) => lead.status === 'contacted' && isDue(lead.nextFollowUpAt));
  const missingInfo = input.leads.filter((lead) => !lead.website || (!lead.contactEmail && !lead.linkedinUrl));
  const pipeline = analyzePipeline(input.leads, new Date().toISOString(), readOutreachHistory(), readConversions(), readClosedLeads());
  const topLeads = [...hot, ...warm].sort((a, b) => b.score - a.score).slice(0, 5);
  const recommendedActions = pipeline.topLeadsToReview
    .slice(0, 5)
    .map((review) => `${review.companyName}: ${review.recommendedAction}. Run: ${review.command}`);

  const summary: DailySummary = {
    generatedAt: new Date().toISOString(),
    sourcesChecked: input.sourcesChecked,
    opportunitiesFound: input.opportunities.length,
    hotLeads: hot.length,
    warmLeads: warm.length,
    ignoredLeads: ignored.length,
    hotLeadsNeedingApproval: hotNeedingApproval.map(formatLeadSummary),
    warmLeadsWorthReviewing: warmWorthReviewing.map(formatLeadSummary),
    auditCompletedNoProposal: auditCompletedNoProposal.map(formatLeadSummary),
    contactedNeedingFollowUp: contactedNeedingFollowUp.map(formatLeadSummary),
    missingWebsiteOrContactInfo: missingInfo.map(formatLeadSummary),
    topRecommendedActions: recommendedActions.length ? recommendedActions : topLeads.map((lead) => `${lead.companyName}: ${lead.nextAction}`),
    suggestedMessagesReadyForApproval: input.proposalFiles,
    warnings: input.warnings,
    nextSteps: [
      'Review approval-queue proposal and follow-up drafts before sending anything.',
      'Enrich missing contact details manually from public, appropriate sources.',
      'Run QA audits for hot/warm audit-ready leads.',
      'Mark manually sent outreach with lead:sent so follow-up cadence stays visible.',
    ],
  };

  writeDailySummary(summary);
  writeDailySummaryMarkdown(summary, input.leads, pipeline);
  return summary;
}

function writeDailySummaryMarkdown(summary: DailySummary, leads: Lead[], pipeline: ReturnType<typeof analyzePipeline>): void {
  fs.mkdirSync(generatedDir, { recursive: true });
  const topLeads = leads.filter((lead) => lead.scoreBreakdown.category === 'hot' || lead.scoreBreakdown.category === 'warm').sort((a, b) => b.score - a.score).slice(0, 5);
  const hotNeedingApproval = topLeadsForStatus(leads, ['new', 'scored'], 'hot');
  const warmWorthReviewing = topLeadsForStatus(leads, ['new', 'scored'], 'warm');
  const auditCompleted = leads.filter((lead) => lead.status === 'audit_completed');
  const contactedDue = leads.filter((lead) => lead.status === 'contacted' && isDue(lead.nextFollowUpAt));
  const missingInfo = leads.filter((lead) => !lead.website || (!lead.contactEmail && !lead.linkedinUrl));
  const cockpit = readActionCockpit<Partial<ActionCockpit>>({});
  const messageQueue = readMessageReviewQueue<Partial<MessageReviewQueue>>({});
  const sourceQuality = readSourceQualityReport<Partial<SourceQualityReport>>({});
  const content = `# Daily Lead Summary

Generated: ${summary.generatedAt}

## Snapshot

- Sources checked: ${summary.sourcesChecked}
- Opportunities found: ${summary.opportunitiesFound}
- Hot leads: ${summary.hotLeads}
- Warm leads: ${summary.warmLeads}
- Ignored leads: ${summary.ignoredLeads}
- Follow-ups due today/overdue: ${pipeline.needingFollowUp.length}
- Leads needing contact enrichment: ${pipeline.needsContactEnrichment.length}
- Audit-ready leads: ${pipeline.readyForAudit.length}
- Proposal-ready leads: ${pipeline.auditCompletedNoProposalSent.length}
- Stale active leads: ${pipeline.staleLeads.length}
- Projected MRR: $${pipeline.revenuePipeline.projectedMonthlyRecurringRevenue}
- Progress to $3,000/month: ${pipeline.revenuePipeline.progressTo3000}%
- Progress to $5,000/month: ${pipeline.revenuePipeline.progressTo5000}%

## Pipeline Snapshot

${allLeadStatuses.map((status) => `- ${status}: ${pipeline.countByStatus[status]}`).join('\n')}

## Top 5 Recommended Actions

${summary.topRecommendedActions.length ? summary.topRecommendedActions.map((action) => `- ${action}`).join('\n') : '- No hot or warm leads ready today.'}

## Action Cockpit

- Latest action cockpit path: sales-marketing-engine/operator/generated/action-cockpit.md
- Action cockpit JSON: data/leads/action-cockpit.json
- Generate it: npm run actions:cockpit

### Top 3 Cockpit Actions

${formatCockpitActions(cockpit)}

## Message Review Queue

- Pending review: ${messageQueue.summary?.pending_review ?? 0}
- Approved but not sent: ${messageQueue.summary?.approved ?? 0}
- Needs edit: ${messageQueue.summary?.needs_edit ?? 0}
- Generate queue: npm run message:queue
- Dashboard: http://localhost:4173/message-queue

## Source Quality

- Best source: ${sourceQuality.summary?.bestSource ?? 'Not generated.'}
- Worst source: ${sourceQuality.summary?.worstSource ?? 'Not generated.'}
- Excellent sources: ${sourceQuality.summary?.excellentSources ?? 0}
- Low priority sources: ${sourceQuality.summary?.lowPrioritySources ?? 0}
- Generate report: npm run sources:report
- Dashboard: http://localhost:4173/sources

## Top 5 Leads To Review Today

${pipeline.topLeadsToReview.length ? pipeline.topLeadsToReview.slice(0, 5).map((review, index) => `${index + 1}. ${review.leadId} - ${review.companyName} - ${review.category} - ${review.recommendedAction}\n   Command: ${review.command}\n   Reason: ${review.reason}`).join('\n\n') : '- None.'}

## Blocked Leads

${pipeline.blockedLeads.length ? pipeline.blockedLeads.slice(0, 5).map((review) => `- ${review.leadId} - ${review.companyName}: ${review.blockedReason}. Command: ${review.command}`).join('\n') : '- None.'}

## Revenue Summary Snapshot

- Projected monthly recurring revenue: $${pipeline.revenuePipeline.projectedMonthlyRecurringRevenue}
- Hot pipeline estimate: $${pipeline.revenuePipeline.hotPipelineValue}
- Warm pipeline estimate: $${pipeline.revenuePipeline.warmPipelineValue}
- Won leads: ${pipeline.wonCount}
- Lost/ignored leads: ${pipeline.lostCount}

## Best Revenue Opportunities Today

${pipeline.highestProjectedValueLeads.length ? pipeline.highestProjectedValueLeads.slice(0, 5).map((lead) => `- ${lead.companyName}: ${lead.suggestedOffer}, estimated $${lead.estimatedValue}. Review: ${lead.reviewCommand}`).join('\n') : '- None.'}

## Leads To Close Or Ignore

${pipeline.blockedLeads.length ? pipeline.blockedLeads.slice(0, 5).map((review) => `- ${review.companyName}: ${review.blockedReason}. Close: npm run lead:close -- --id ${review.leadId} --result ignored --reason bad_contact_info --note "Blocked after review"`).join('\n') : '- None.'}

## Suggested Messages Ready For Approval

${summary.suggestedMessagesReadyForApproval.length ? summary.suggestedMessagesReadyForApproval.map((file) => `- ${file}`).join('\n') : '- No proposal drafts generated today.'}

## Top Leads

${topLeads.length ? topLeads.map((lead) => `- ${lead.companyName}: ${lead.score}/100, ${lead.suggestedOffer}, ${lead.website || 'website not provided'}`).join('\n') : '- None.'}

## Hot Leads Needing Approval

${hotNeedingApproval.length ? hotNeedingApproval.map(formatLeadCommand).join('\n') : '- None.'}

## Warm Leads Worth Reviewing

${warmWorthReviewing.length ? warmWorthReviewing.map(formatLeadCommand).join('\n') : '- None.'}

## Audit Completed But Proposal Not Sent

${auditCompleted.length ? auditCompleted.map(formatLeadCommand).join('\n') : '- None.'}

## Contacted And Needing Follow-Up

${contactedDue.length ? contactedDue.map(formatLeadCommand).join('\n') : '- None.'}

## Follow-Ups Due Today

${pipeline.needingFollowUp.length ? pipeline.needingFollowUp.map(formatFollowUpCommand).join('\n') : '- None.'}

## Missing Website Or Contact Info

${missingInfo.length ? missingInfo.map(formatLeadCommand).join('\n') : '- None.'}

## Audit-Ready Leads

${pipeline.readyForAudit.length ? pipeline.readyForAudit.map(formatLeadCommand).join('\n') : '- None.'}

## Proposal-Ready Leads

${pipeline.auditCompletedNoProposalSent.length ? pipeline.auditCompletedNoProposalSent.map(formatSentCommand).join('\n') : '- None.'}

## Stale Leads With No Action In 7+ Days

${pipeline.staleLeads.length ? pipeline.staleLeads.map(formatLeadCommand).join('\n') : '- None.'}

## Useful Next Commands

- npm run lead:enrich -- --id <leadId> --email "founder@example.com"
- npm run lead:review -- --id <leadId>
- npm run lead:audit -- --id <leadId>
- npm run lead:sent -- --id <leadId> --channel linkedin --note "Sent first DM"
- npm run lead:followups:due
- npm run lead:pipeline
- npm run lead:convert -- --id <leadId> --offer monthly_qa_maintenance --amount 1000 --note "Closed after audit call"
- npm run lead:close -- --id <leadId> --result lost --reason no_response --note "No response after follow-up sequence"
- npm run revenue:summary
- npm run actions:cockpit
- npm run message:queue
- npm run sources:report
- npm run lead:proposal -- --id <leadId>
- npm run lead:auto

## Weekly Dashboard

- Latest weekly dashboard path: sales-marketing-engine/operator/generated/weekly-executive-dashboard.md
- Generate it: npm run business:weekly

## Warnings / Errors

${summary.warnings.length ? summary.warnings.map((warning) => `- ${warning}`).join('\n') : '- None.'}

## Next Steps

${summary.nextSteps.map((step) => `- ${step}`).join('\n')}
`;

  fs.writeFileSync(path.join(generatedDir, 'daily-lead-summary.md'), `${content.trim()}\n`, 'utf8');
}

function topLeadsForStatus(leads: Lead[], statuses: Lead['status'][], category: Lead['scoreBreakdown']['category']): Lead[] {
  return leads.filter((lead) => lead.scoreBreakdown.category === category && statuses.includes(lead.status));
}

function formatLeadCommand(lead: Lead): string {
  return `- ${lead.companyName}: ${lead.status}, ${lead.score}/100. Audit command: npm run lead:audit -- --id ${lead.id}`;
}

function formatFollowUpCommand(lead: Lead): string {
  return `- ${lead.companyName}: due ${lead.nextFollowUpAt}. Generate draft: npm run lead:followups:due`;
}

function formatSentCommand(lead: Lead): string {
  return `- ${lead.companyName}: ${lead.status}, ${lead.score}/100. Mark sent: npm run lead:sent -- --id ${lead.id} --channel linkedin --note "Sent audit summary"`;
}

function formatLeadSummary(lead: Lead): string {
  return `${lead.id}: ${lead.companyName} (${lead.status}, ${lead.score}/100)`;
}

function formatCockpitActions(cockpit: Partial<ActionCockpit>): string {
  return cockpit.topActions?.length
    ? cockpit.topActions.slice(0, 3).map((action) => `- ${action.companyName}: ${action.actionType}, expected $${action.expectedRevenueImpact}. Command: ${action.suggestedCommand}`).join('\n')
    : '- No action cockpit data yet. Run npm run actions:cockpit.';
}

function isDue(dateValue: string): boolean {
  return Boolean(dateValue && dateValue <= new Date().toISOString());
}
