import { buildOpportunityTracker } from '../pipeline/pipelineRules';
import { OpportunityItem } from '../pipeline/types';
import { ClientOpsAction, ClientOpsCenter, ClientOpsInput, ClientReadinessGroups } from './types';

export function buildClientOpsCenter(input: ClientOpsInput): ClientOpsCenter {
  const tracker = buildOpportunityTracker(input.leads, input.contactReviews);
  const opportunities = tracker.opportunities;
  const actions = tracker.topOpportunities.slice(0, 10).map(toClientOpsAction);

  return {
    generatedAt: new Date().toISOString(),
    commercialMode: {
      enabled: true,
      totalLeads: input.commercialMode?.totalLeads ?? input.leads.length,
      commercialLeads: input.commercialMode?.commercialLeads ?? input.leads.length,
      excludedDemoLeads: input.commercialMode?.excludedDemoLeads ?? 0,
    },
    opportunities,
    clients: input.clients,
    actions,
    readiness: buildReadinessGroups(opportunities),
    pipelineMarkdownExists: input.pipelineMarkdownExists,
    topOpportunitiesMarkdownExists: input.topOpportunitiesMarkdownExists,
  };
}

export function renderClientOperationsCenter(center: ClientOpsCenter): string {
  return `# Client Operations Center

Generated: ${center.generatedAt}

## Commercial Mode

- Commercial Mode status: ${center.commercialMode.enabled ? 'ON' : 'OFF'}
- Commercial leads: ${center.commercialMode.commercialLeads}
- Excluded demo leads: ${center.commercialMode.excludedDemoLeads}
- Commercial opportunities: ${activeOpportunities(center.opportunities).length}
- Commercial next actions: ${center.actions.length}

## Executive Summary

- Active clients: ${center.clients.filter((client) => client.status === 'active').length}
- Active opportunities: ${activeOpportunities(center.opportunities).length}
- Follow-ups needing manual review: ${center.opportunities.filter((item) => item.pipelineStage === 'FOLLOW_UP').length}
- Client-ready opportunities: ${center.opportunities.filter((item) => item.pipelineStage === 'CLIENT_READY').length}
- Pipeline report detected: ${center.pipelineMarkdownExists ? 'yes' : 'no'}
- Top opportunities report detected: ${center.topOpportunitiesMarkdownExists ? 'yes' : 'no'}

## Today's Operating Priorities

${renderActions(center.actions.slice(0, 5))}

## Pipeline Health

${renderPipelineHealth(center.opportunities)}

## Opportunities Closest To Revenue

${renderOpportunityList(closestToRevenue(center.opportunities), 'No close-to-revenue opportunities found.')}

## Follow-Ups

${renderOpportunityList(center.opportunities.filter((item) => item.pipelineStage === 'FOLLOW_UP'), 'No follow-ups currently required.')}

## Client Prep Needed

${renderOpportunityList(center.readiness.readyForClientPrep, 'No opportunities currently need client prep.')}

## Delivery Prep Needed

${renderOpportunityList(center.opportunities.filter((item) => item.pipelineStage === 'CLIENT_READY'), 'No opportunities currently need delivery prep.')}

## Reporting Needed

${renderClientReporting(center)}

## Risks / Blockers

${renderRisks(center)}

## Recommended Commands

${recommendedCommands(center).map((command) => `- ${command}`).join('\n')}

## Manual Approval Rules

- Daniel approves every outreach, follow-up, proposal, call, client report, invoice, and delivery action.
- Do not send emails, LinkedIn messages, contact-form messages, proposals, reports, or invoices from this command.
- Do not scrape, browse, call APIs, use credentials, connect CRMs, connect payment systems, or use external databases.
- Treat all recommendations as local planning output until manually reviewed.
`;
}

export function renderNextActions(center: ClientOpsCenter): string {
  return `# Client Next Actions

Generated: ${center.generatedAt}

Commercial Mode: ${center.commercialMode.enabled ? 'ON' : 'OFF'}
Commercial next actions: ${center.actions.length}

${center.actions.length === 0 ? 'No client next actions found.' : center.actions.map(renderAction).join('\n\n')}

## Manual Approval Rules

- Review every recommended command before running it.
- Running a command may generate local files only; external communication still requires Daniel approval.
- No outreach, CRM, payments, invoices, scraping, browsing, APIs, or credentials are used here.
`;
}

export function renderClientReadiness(center: ClientOpsCenter): string {
  return `# Client Readiness

Generated: ${center.generatedAt}

## Ready For Outreach

${renderOpportunityList(center.readiness.readyForOutreach, 'No opportunities are currently ready for outreach review.')}

## Ready For Audit

${renderOpportunityList(center.readiness.readyForAudit, 'No opportunities are currently ready for audit review.')}

## Ready For SOW

${renderOpportunityList(center.readiness.readyForSow, 'No opportunities are currently ready for SOW review.')}

## Ready For Client Prep

${renderOpportunityList(center.readiness.readyForClientPrep, 'No opportunities are currently ready for client prep.')}

## Needs Research

${renderOpportunityList(center.readiness.needsResearch, 'No high-priority opportunities currently need research.')}

## Should Pause

${renderPauseList(center.readiness.shouldPause)}

## Manual Approval Rules

- Pause decisions require Daniel review.
- Outreach, calls, SOWs, onboarding, and reports remain manual and approval-gated.
`;
}

function toClientOpsAction(item: OpportunityItem): ClientOpsAction {
  return {
    company: item.lead.companyName,
    currentStage: item.pipelineStage,
    opportunityScore: item.opportunityScore,
    recommendedNextAction: actionText(item),
    reason: item.reason,
    command: commandForItem(item),
    manualApprovalNote: 'Human approval required before external action. This recommendation only points to local commands.',
  };
}

function actionText(item: OpportunityItem): string {
  if (item.pipelineStage === 'FOLLOW_UP') return 'Review contact follow-up context and decide whether to send manually.';
  if (item.pipelineStage === 'SOW_READY') return 'Review proposal / SOW and pricing manually.';
  if (item.pipelineStage === 'OUTREACH_READY') return 'Review outreach pack and create or update contact review.';
  if (item.pipelineStage === 'AUDIT_READY') return 'Review audit pack and decide whether to generate outreach or SOW.';
  if (item.pipelineStage === 'RESEARCH_READY') return 'Generate lead pack or audit pack from the research context.';
  if (item.pipelineStage === 'NEW_LEAD' && item.tier === 'A') return 'Generate research pack for this Tier A lead.';
  if (item.pipelineStage === 'CLIENT_READY') return 'Prepare onboarding and delivery plan.';
  if (item.pipelineStage === 'CLIENT') return 'Generate client report.';
  if (item.pipelineStage === 'CONTACT_REVIEW') return 'Review contact record and approval checklist.';
  if (item.pipelineStage === 'DISCOVERY_CALL') return 'Use discovery prep and decide next manual step.';
  return item.nextAction;
}

function commandForItem(item: OpportunityItem): string {
  const leadId = item.lead.id;

  if (item.pipelineStage === 'FOLLOW_UP') return `npm run contact:review -- --id ${leadId}`;
  if (item.pipelineStage === 'SOW_READY') return `npm run sow:generate -- --id ${leadId}`;
  if (item.pipelineStage === 'OUTREACH_READY') return `npm run contact:review -- --id ${leadId}`;
  if (item.pipelineStage === 'AUDIT_READY') return `npm run outreach:pack -- --id ${leadId}`;
  if (item.pipelineStage === 'RESEARCH_READY') return item.artifacts.auditPack
    ? `npm run audit:pack -- --id ${leadId}`
    : `npm run lead:pack -- --id ${leadId}`;
  if (item.pipelineStage === 'NEW_LEAD') return `npm run lead:research -- --id ${leadId}`;
  if (item.pipelineStage === 'CLIENT_READY') return `npm run client:onboard -- --id ${leadId}`;
  if (item.pipelineStage === 'CLIENT') return `npm run client:report -- --id ${leadId}`;
  if (item.pipelineStage === 'CONTACT_REVIEW') return `npm run contact:review -- --id ${leadId}`;
  if (item.pipelineStage === 'DISCOVERY_CALL') return `npm run client:prep -- --id ${leadId}`;
  return 'npm run pipeline:opportunities';
}

function buildReadinessGroups(opportunities: OpportunityItem[]): ClientReadinessGroups {
  const active = activeOpportunities(opportunities);

  return {
    readyForOutreach: active.filter((item) => item.pipelineStage === 'OUTREACH_READY' || item.pipelineStage === 'CONTACT_REVIEW'),
    readyForAudit: active.filter((item) => item.pipelineStage === 'AUDIT_READY' || item.pipelineStage === 'RESEARCH_READY'),
    readyForSow: active.filter((item) => item.pipelineStage === 'SOW_READY' || item.artifacts.sow),
    readyForClientPrep: active.filter((item) => item.pipelineStage === 'DISCOVERY_CALL' || item.pipelineStage === 'CLIENT_READY'),
    needsResearch: active.filter((item) => item.pipelineStage === 'NEW_LEAD').slice(0, 10),
    shouldPause: opportunities.filter((item) => item.lead.recommendedOffer === 'not-fit' || item.pipelineStage === 'PAUSED'),
  };
}

function closestToRevenue(opportunities: OpportunityItem[]): OpportunityItem[] {
  const preferredStages = new Set(['FOLLOW_UP', 'SOW_READY', 'DISCOVERY_CALL', 'CLIENT_READY']);
  return activeOpportunities(opportunities)
    .filter((item) => preferredStages.has(item.pipelineStage))
    .slice(0, 10);
}

function activeOpportunities(opportunities: OpportunityItem[]): OpportunityItem[] {
  return opportunities.filter((item) => item.pipelineStage !== 'LOST' && item.pipelineStage !== 'PAUSED' && item.lead.recommendedOffer !== 'not-fit');
}

function renderActions(actions: ClientOpsAction[]): string {
  if (actions.length === 0) return '- No operating priorities found.';

  return actions.map((action, index) => `${index + 1}. ${action.company}
   - Stage: ${action.currentStage}
   - Score: ${action.opportunityScore}
   - Action: ${action.recommendedNextAction}
   - Command: ${action.command}
   - Approval: ${action.manualApprovalNote}`).join('\n');
}

function renderAction(action: ClientOpsAction, index: number): string {
  return `## ${index + 1}. ${action.company}

- Company: ${action.company}
- Current stage: ${action.currentStage}
- Opportunity score: ${action.opportunityScore}
- Recommended next action: ${action.recommendedNextAction}
- Reason: ${action.reason}
- Command to run: ${action.command}
- Manual approval note: ${action.manualApprovalNote}`;
}

function renderOpportunityList(items: OpportunityItem[], emptyText: string): string {
  if (items.length === 0) return `- ${emptyText}`;

  return items.slice(0, 10).map((item) => `- ${item.lead.companyName}: score ${item.opportunityScore}, stage ${item.pipelineStage}, offer ${item.lead.recommendedOffer}; ${item.nextAction}`).join('\n');
}

function renderPauseList(items: OpportunityItem[]): string {
  if (items.length === 0) return '- No additional pause recommendations generated.';

  return items
    .slice(0, 10)
    .map((item) => `- ${item.lead.companyName}: score ${item.opportunityScore}, stage ${item.pipelineStage}, offer ${item.lead.recommendedOffer}; keep paused or review fit manually before any external action.`)
    .join('\n');
}

function renderPipelineHealth(opportunities: OpportunityItem[]): string {
  const active = activeOpportunities(opportunities);
  const followUps = active.filter((item) => item.pipelineStage === 'FOLLOW_UP').length;
  const clientReady = active.filter((item) => item.pipelineStage === 'CLIENT_READY').length;
  const newLeads = active.filter((item) => item.pipelineStage === 'NEW_LEAD').length;

  return [
    `- Active opportunities: ${active.length}`,
    `- Follow-ups: ${followUps}`,
    `- Client-ready: ${clientReady}`,
    `- New leads needing research: ${newLeads}`,
  ].join('\n');
}

function renderClientReporting(center: ClientOpsCenter): string {
  const activeClients = center.clients.filter((client) => client.status === 'active');
  if (activeClients.length === 0) return '- No active clients currently require reports.';

  return activeClients.map((client) => `- ${client.companyName}: run npm run client:report -- --id ${client.id}; last report ${client.lastReportDate || 'not recorded'}.`).join('\n');
}

function renderRisks(center: ClientOpsCenter): string {
  const risks = [
    center.pipelineMarkdownExists ? '' : 'Pipeline tracker markdown is missing; run npm run pipeline:opportunities.',
    center.topOpportunitiesMarkdownExists ? '' : 'Top opportunities markdown is missing; run npm run pipeline:opportunities.',
    center.readiness.shouldPause.length > 0 ? `${center.readiness.shouldPause.length} lead(s) are paused or not-fit and should not receive outreach.` : '',
    center.opportunities.some((item) => item.pipelineStage === 'FOLLOW_UP') ? 'Follow-up dates require manual review before any message is sent.' : '',
    'Do not treat local opportunity scores as guaranteed revenue.',
  ].filter(Boolean);

  return risks.map((risk) => `- ${risk}`).join('\n');
}

function recommendedCommands(center: ClientOpsCenter): string[] {
  const commands = new Set<string>([
    'npm run pipeline:opportunities',
    'npm run dashboard',
  ]);

  for (const action of center.actions.slice(0, 5)) {
    commands.add(action.command);
  }

  const activeClient = center.clients.find((client) => client.status === 'active');
  if (activeClient) commands.add(`npm run client:report -- --id ${activeClient.id}`);

  return Array.from(commands);
}
