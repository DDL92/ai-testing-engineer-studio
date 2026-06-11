import fs = require('fs');
import path = require('path');
import type { ActionCockpit } from '../actions/actionTypes';
import type { MessageReviewQueue } from '../messages/messageReviewTypes';
import type { SourceQualityReport } from '../sources/sourceTypes';
import { generatedDir } from '../config/paths';
import { readActionCockpit, readMessageReviewQueue, readSourceQualityReport } from '../storage/jsonStore';
import { allLeadCategories, allLeadStatuses, PipelineSummary } from './pipelineAnalyzer';

export function writePipelineSummary(summary: PipelineSummary): string {
  fs.mkdirSync(generatedDir, { recursive: true });
  const filePath = path.join(generatedDir, 'pipeline-summary.md');
  fs.writeFileSync(filePath, `${formatPipelineSummary(summary).trim()}\n`, 'utf8');
  return path.relative(process.cwd(), filePath);
}

export function formatPipelineSummary(summary: PipelineSummary): string {
  const cockpit = readActionCockpit<Partial<ActionCockpit>>({});
  const messageQueue = readMessageReviewQueue<Partial<MessageReviewQueue>>({});
  const sourceQuality = readSourceQualityReport<Partial<SourceQualityReport>>({});
  return `# Lead Pipeline Summary

Generated: ${summary.generatedAt}

## Count By Status

${allLeadStatuses.map((status) => `- ${status}: ${summary.countByStatus[status]}`).join('\n')}

## Count By Category

${allLeadCategories.map((category) => `- ${category}: ${summary.countByCategory[category]}`).join('\n')}

## Leads Needing Contact Enrichment

${summary.needsContactEnrichment.length ? summary.needsContactEnrichment.map(formatLead).join('\n') : '- None.'}

## Leads Ready For Audit

${summary.readyForAudit.length ? summary.readyForAudit.map(formatAuditLead).join('\n') : '- None.'}

## Audit Completed But No Proposal Sent

${summary.auditCompletedNoProposalSent.length ? summary.auditCompletedNoProposalSent.map(formatSentLead).join('\n') : '- None.'}

## Leads Needing Follow-Up

${summary.needingFollowUp.length ? summary.needingFollowUp.map(formatFollowUpLead).join('\n') : '- None.'}

## Revenue Pipeline

- Projected MRR: $${summary.revenuePipeline.projectedMonthlyRecurringRevenue}
- MRR progress to $3,000/month: ${summary.revenuePipeline.progressTo3000}%
- MRR progress to $5,000/month: ${summary.revenuePipeline.progressTo5000}%
- Hot pipeline estimate: $${summary.revenuePipeline.hotPipelineValue}
- Warm pipeline estimate: $${summary.revenuePipeline.warmPipelineValue}
- Won leads: ${summary.wonCount}
- Lost/ignored leads: ${summary.lostCount}

## Highest Projected Value Leads

${summary.highestProjectedValueLeads.length ? summary.highestProjectedValueLeads.map((lead) => `- ${lead.companyName}: ${lead.suggestedOffer}, estimated $${lead.estimatedValue}. Review: ${lead.reviewCommand}`).join('\n') : '- None.'}

## Lost Reason Breakdown

${Object.keys(summary.lostReasonBreakdown).length ? Object.entries(summary.lostReasonBreakdown).map(([reason, count]) => `- ${reason}: ${count}`).join('\n') : '- None.'}

## Conversion-Ready Leads

${summary.conversionReadyLeads.length ? summary.conversionReadyLeads.map((lead) => `- ${lead.companyName}: ${lead.status}. Convert: npm run lead:convert -- --id ${lead.id} --offer monthly_qa_maintenance --amount 1000 --note "Closed after audit call"`).join('\n') : '- None.'}

## Top 10 Leads To Review Today

${summary.topLeadsToReview.length ? summary.topLeadsToReview.map((review) => `- ${review.leadId} - ${review.companyName} - ${review.category} - ${review.recommendedAction}. Review: ${review.command}`).join('\n') : '- None.'}

## Blocked Leads

${summary.blockedLeads.length ? summary.blockedLeads.map((review) => `- ${review.leadId} - ${review.companyName}: ${review.blockedReason}. Review: ${review.command}`).join('\n') : '- None.'}

## Top 10 Next Actions

${summary.topNextActions.length ? summary.topNextActions.map((action) => `- ${action}`).join('\n') : '- No immediate actions.'}

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

## Weekly Dashboard

- Latest weekly dashboard path: sales-marketing-engine/operator/generated/weekly-executive-dashboard.md
- Generate it: npm run business:weekly
`;
}

function formatLead(lead: PipelineSummary['needsContactEnrichment'][number]): string {
  return `- ${lead.companyName}: ${lead.status}, ${lead.score}/100. Enrich: npm run lead:enrich -- --id ${lead.id} --email "founder@example.com"`;
}

function formatAuditLead(lead: PipelineSummary['readyForAudit'][number]): string {
  return `- ${lead.companyName}: ${lead.score}/100. Audit: npm run lead:audit -- --id ${lead.id}`;
}

function formatSentLead(lead: PipelineSummary['auditCompletedNoProposalSent'][number]): string {
  return `- ${lead.companyName}: ${lead.score}/100. Mark sent: npm run lead:sent -- --id ${lead.id} --channel linkedin --note "Sent audit summary"`;
}

function formatFollowUpLead(lead: PipelineSummary['needingFollowUp'][number]): string {
  return `- ${lead.companyName}: due ${lead.nextFollowUpAt}. Drafts: npm run lead:followups:due`;
}

function formatCockpitActions(cockpit: Partial<ActionCockpit>): string {
  return cockpit.topActions?.length
    ? cockpit.topActions.slice(0, 3).map((action) => `- ${action.companyName}: ${action.actionType}, expected $${action.expectedRevenueImpact}. Command: ${action.suggestedCommand}`).join('\n')
    : '- No action cockpit data yet. Run npm run actions:cockpit.';
}
