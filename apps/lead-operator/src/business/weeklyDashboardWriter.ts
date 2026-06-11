import fs = require('fs');
import path = require('path');
import { generatedDir } from '../config/paths';
import type { WeeklyExecutiveDashboard } from './weeklyDashboardService';

export function writeWeeklyDashboardMarkdown(dashboard: WeeklyExecutiveDashboard): string {
  fs.mkdirSync(generatedDir, { recursive: true });
  const filePath = path.join(generatedDir, 'weekly-executive-dashboard.md');
  fs.writeFileSync(filePath, `${formatWeeklyDashboard(dashboard).trim()}\n`, 'utf8');
  return path.relative(process.cwd(), filePath);
}

export function formatWeeklyDashboard(dashboard: WeeklyExecutiveDashboard): string {
  return `# Weekly Executive Dashboard

Reporting period: ${dashboard.reportingPeriod.startDate} to ${dashboard.reportingPeriod.endDate} (${dashboard.reportingPeriod.days} days)

## Executive Summary

- Overall business status: ${dashboard.executiveSummary.overallBusinessStatus}
- Main bottleneck: ${dashboard.executiveSummary.mainBottleneck}
- Biggest opportunity: ${dashboard.executiveSummary.biggestOpportunity}
- Recommended focus for next week: ${dashboard.executiveSummary.recommendedFocus}

## Lead Activity

- New leads this week: ${dashboard.leadActivity.newLeadsThisPeriod}
- Hot leads: ${dashboard.leadActivity.hotLeads}
- Warm leads: ${dashboard.leadActivity.warmLeads}
- Low/ignored leads: ${dashboard.leadActivity.lowAndIgnoredLeads}
- Leads needing enrichment: ${dashboard.leadActivity.leadsNeedingEnrichment}
- Leads ready for audit: ${dashboard.leadActivity.leadsReadyForAudit}
- Leads with audit completed: ${dashboard.leadActivity.leadsWithAuditCompleted}
- Leads with proposal ready: ${dashboard.leadActivity.leadsWithProposalReady}
- Leads contacted: ${dashboard.leadActivity.leadsContacted}
- Leads needing follow-up: ${dashboard.leadActivity.leadsNeedingFollowUp}

## Outreach Activity

- Outreach sent this period: ${dashboard.outreachActivity.outreachSentThisPeriod}
- Follow-ups due: ${dashboard.outreachActivity.followUpsDue}
- Stale leads with no action in 7+ days: ${dashboard.outreachActivity.staleLeads}
- Leads waiting for reply: ${dashboard.outreachActivity.leadsWaitingForReply}

### Outreach By Channel

${formatRecord(dashboard.outreachActivity.outreachByChannel)}

## QA Audit Activity

- Audits completed this period: ${dashboard.qaAuditActivity.auditsCompletedThisPeriod}
- Audit-based proposals generated: ${dashboard.qaAuditActivity.auditBasedProposalsGenerated}
- Leads blocked because no website: ${dashboard.qaAuditActivity.leadsBlockedNoWebsite}
- Leads where audit is recommended next: ${dashboard.qaAuditActivity.auditRecommendedNext}

## Revenue Progress

- Current projected MRR: $${dashboard.revenueProgress.currentProjectedMrr}
- One-time revenue this month: $${dashboard.revenueProgress.oneTimeRevenueThisMonth}
- Progress to $3,000/month: ${dashboard.revenueProgress.progressTo3000}%
- Progress to $5,000/month: ${dashboard.revenueProgress.progressTo5000}%
- Clients needed at $500/month: ${dashboard.revenueProgress.clientsNeededAt500}
- Clients needed at $1,000/month: ${dashboard.revenueProgress.clientsNeededAt1000}
- Clients needed at $1,500/month: ${dashboard.revenueProgress.clientsNeededAt1500}

## Conversion Metrics

- Won leads: ${dashboard.conversionMetrics.wonLeads}
- Lost leads: ${dashboard.conversionMetrics.lostLeads}
- Ignored leads: ${dashboard.conversionMetrics.ignoredLeads}
- Contacted to won rate: ${dashboard.conversionMetrics.contactedToWonRate}
- Proposal sent to won rate: ${dashboard.conversionMetrics.proposalSentToWonRate}
- Audit completed to proposal sent rate: ${dashboard.conversionMetrics.auditCompletedToProposalSentRate}
- Sample size note: ${dashboard.conversionMetrics.sampleSizeNote}

## Lost Reasons

${formatRecord(dashboard.lostReasons.breakdown)}

- Top avoidable reason: ${dashboard.lostReasons.topAvoidableReason}
- Recommendation: ${dashboard.lostReasons.recommendation}

## Pipeline Value

- Estimated hot pipeline value: $${dashboard.pipelineValue.estimatedHotPipelineValue}
- Estimated warm pipeline value: $${dashboard.pipelineValue.estimatedWarmPipelineValue}

### Top 10 Highest-Value Leads

${dashboard.pipelineValue.topHighestValueLeads.length ? dashboard.pipelineValue.topHighestValueLeads.map((lead) => `- ${lead.companyName}: ${lead.suggestedOffer}, estimated $${lead.estimatedValue}. ${lead.command}`).join('\n') : '- None.'}

## Next 10 Highest-Value Actions

${dashboard.nextHighestValueActions.length ? dashboard.nextHighestValueActions.map((action) => `${action.priority}. ${action.companyName} (${action.leadId}) - ${action.score}/${action.category}\n   Action: ${action.recommendedNextAction}\n   Expected revenue impact: $${action.expectedRevenueImpact}\n   Command: ${action.suggestedCommand}\n   Why it matters: ${action.reason}`).join('\n\n') : '- None.'}

## Action Cockpit

- Latest action cockpit path: ${dashboard.actionCockpit.path}
- Generate it: ${dashboard.actionCockpit.command}

### Top 3 Cockpit Actions

${dashboard.actionCockpit.topActions.length ? dashboard.actionCockpit.topActions.map((action) => `- ${action.companyName} (${action.leadId}): ${action.actionType}, expected $${action.expectedRevenueImpact}. Command: ${action.suggestedCommand}`).join('\n') : '- No action cockpit data yet. Run npm run actions:cockpit.'}

## Message Review Queue

- Pending review: ${dashboard.messageQueue.pendingReview}
- Approved but not sent: ${dashboard.messageQueue.approvedNotSent}
- Needs edit: ${dashboard.messageQueue.needsEdit}
- Generate queue: ${dashboard.messageQueue.command}
- Dashboard: ${dashboard.messageQueue.dashboardPath}

## Source Quality

- Best source: ${dashboard.sourceQuality.bestSource}
- Worst source: ${dashboard.sourceQuality.worstSource}
- Excellent sources: ${dashboard.sourceQuality.excellentSources}
- Low priority sources: ${dashboard.sourceQuality.lowPrioritySources}
- Generate report: ${dashboard.sourceQuality.command}
- Dashboard: ${dashboard.sourceQuality.dashboardPath}

## Weekly Operating Checklist

${dashboard.weeklyOperatingChecklist.map((item) => `- [ ] ${item}`).join('\n')}
`;
}

function formatRecord(record: Record<string, number>): string {
  const entries = Object.entries(record);
  return entries.length ? entries.map(([key, value]) => `- ${key}: ${value}`).join('\n') : '- None.';
}
