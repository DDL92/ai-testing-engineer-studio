import fs = require('fs');
import path = require('path');
import { generatedDir } from '../config/paths';
import type { ActionCockpit, ActionRecommendation, ActionType } from './actionTypes';

export function writeActionCockpitMarkdown(cockpit: ActionCockpit): string {
  fs.mkdirSync(generatedDir, { recursive: true });
  const filePath = path.join(generatedDir, 'action-cockpit.md');
  fs.writeFileSync(filePath, `${formatActionCockpit(cockpit).trim()}\n`, 'utf8');
  return path.relative(process.cwd(), filePath);
}

export function formatActionCockpit(cockpit: ActionCockpit): string {
  return `# Action Cockpit

Generated: ${cockpit.generatedAt}

## Executive Action Summary

- Total leads reviewed: ${cockpit.summary.totalLeadsReviewed}
- Total actions: ${cockpit.summary.totalActions}
- Actionable items: ${cockpit.summary.actionableActions}
- Blocked leads: ${cockpit.summary.blockedActions}
- Total expected revenue impact: $${cockpit.summary.totalExpectedRevenueImpact}
- Highest priority action: ${cockpit.summary.highestPriorityAction}
- Main bottleneck: ${cockpit.summary.mainBottleneck}
- Best revenue opportunity: ${cockpit.summary.bestRevenueOpportunity}

## Actions by Type

${Object.entries(cockpit.actionsByType).map(([type, actions]) => formatActionGroup(type as ActionType, actions)).join('\n\n')}

## Top 10 Highest-Value Actions

${cockpit.topActions.length ? cockpit.topActions.map((action, index) => `${index + 1}. ${formatActionLine(action)}\n   Command: ${action.suggestedCommand}${action.optimizeCommand ? `\n   Optional optimize: ${action.optimizeCommand}` : ''}${action.messageQueueCommand ? `\n   Message queue: ${action.messageQueueCommand}\n   Queue reason: ${action.messageQueueReason}` : ''}\n   Reason: ${action.reason}${action.relatedReviewPath ? `\n   Review: ${action.relatedReviewPath}` : ''}${action.relatedDraftPath ? `\n   Draft: ${action.relatedDraftPath}` : ''}${action.relatedAuditPath ? `\n   Audit: ${action.relatedAuditPath}` : ''}`).join('\n\n') : '- None.'}

## Blocked Leads

${cockpit.blockedLeads.length ? cockpit.blockedLeads.map((action) => `- ${action.leadId} - ${action.companyName}: ${action.blockedReason || action.reason}. Command: ${action.suggestedCommand}`).join('\n') : '- None.'}

## Daily Operating Sequence

${cockpit.dailyOperatingSequence.map((step) => `${step.order}. ${step.title}\n   Command: ${step.command}\n   Reason: ${step.reason}`).join('\n\n')}

## Source Quality Recommendations

${cockpit.sourceRecommendations.length ? cockpit.sourceRecommendations.map((item) => `- ${item}`).join('\n') : '- Run npm run sources:report to generate source quality recommendations.'}

## Action-Specific Command Snippets

- Contact enrichment: npm run lead:enrich -- --id <leadId> --email "founder@example.com" --note "Found on public company website"
- Lead review: npm run lead:review -- --id <leadId>
- QA audit: npm run lead:audit -- --id <leadId>
- Generate proposals: npm run lead:proposal -- --id <leadId>
- Optimize first message: npm run lead:optimize -- --id <leadId> --type linkedin_dm
- Mark first message sent: npm run lead:sent -- --id <leadId> --channel linkedin --note "Sent first DM"
- Follow-ups due: npm run lead:followups:due
- Optimize follow-up: npm run lead:optimize -- --id <leadId> --type follow_up
- Convert lead: npm run lead:convert -- --id <leadId> --offer monthly_qa_maintenance --amount 1000 --note "Closed after audit call"
- Optimize closing message: npm run lead:optimize -- --id <leadId> --type closing_message
- Close or ignore lead: npm run lead:close -- --id <leadId> --result lost --reason no_response --note "No response after follow-up sequence"
- Scan message queue: npm run message:queue
- Approve draft: npm run message:review -- --file <draft-file> --status approved --note "Reviewed"
- Mark manually sent: npm run message:sent -- --file <draft-file> --channel linkedin --note "Sent manually"

## Cross-Links

- Action cockpit markdown: ${cockpit.links.markdownPath}
- Action cockpit JSON: ${cockpit.links.jsonPath}
- Daily summary: ${cockpit.links.dailySummaryPath}
- Pipeline summary: ${cockpit.links.pipelinePath}
- Revenue summary: ${cockpit.links.revenuePath}
- Weekly dashboard: ${cockpit.links.weeklyDashboardPath}
- Source quality: sales-marketing-engine/operator/generated/source-quality-report.md
`;
}

function formatActionGroup(type: ActionType, actions: ActionRecommendation[]): string {
  return `### ${type}

${actions.length ? actions.slice(0, 10).map((action) => `- ${formatActionLine(action)}. Command: ${action.suggestedCommand}${action.optimizeCommand ? `. Optional optimize: ${action.optimizeCommand}` : ''}${action.messageQueueCommand ? `. Message queue: ${action.messageQueueCommand}` : ''}`).join('\n') : '- None.'}`;
}

function formatActionLine(action: ActionRecommendation): string {
  return `${action.companyName} (${action.leadId}) - ${action.priority} - ${action.score}/${action.category} - ${action.actionType} - expected $${action.expectedRevenueImpact}`;
}
