import fs = require('fs');
import path = require('path');
import { Client } from '../clientReports/types';
import { Lead, RecommendedOffer } from '../leads/types';
import { buildRevenueSummary } from '../metrics/revenueRules';
import { buildOpportunityTracker } from '../pipeline/pipelineRules';
import { OpportunityItem, OpportunityTracker, PipelineStage } from '../pipeline/types';
import { ContactReviewRecord } from '../contactReview/types';
import { DashboardData, RevenueScenario, RevenueVisibilityData } from './types';
import { DashboardData as PwaDashboardData } from './dashboardDataBuilder';

const stageOrder: PipelineStage[] = [
  'NEW_LEAD',
  'RESEARCH_READY',
  'AUDIT_READY',
  'OUTREACH_READY',
  'CONTACT_REVIEW',
  'FOLLOW_UP',
  'DISCOVERY_CALL',
  'SOW_READY',
  'CLIENT_READY',
  'CLIENT',
  'PAUSED',
  'LOST',
];

const offerRanges: Record<RecommendedOffer, { min: number; max: number; cadence: 'one-time' | 'monthly' }> = {
  'qa-audit': { min: 199, max: 500, cadence: 'one-time' },
  'playwright-starter-pack': { min: 900, max: 1500, cadence: 'one-time' },
  'qa-automation-retainer': { min: 1500, max: 3000, cadence: 'monthly' },
  'agency-partner-retainer': { min: 1500, max: 3000, cadence: 'monthly' },
  'not-fit': { min: 0, max: 0, cadence: 'one-time' },
};

export function buildDashboardData(leads: Lead[], clients: Client[], contactReviews: ContactReviewRecord[]): DashboardData {
  const pipeline = buildOpportunityTracker(leads, contactReviews);
  const revenue = buildRevenueSummary(leads, clients);
  const activeClients = clients.filter((client) => client.status === 'active' && isCommercialClient(client));

  return {
    generatedAt: new Date().toISOString(),
    status: pipeline.totalOpportunities > 0 ? 'local-ready' : 'needs-review',
    pipeline,
    revenue,
    activeClients,
    systemHealth: {
      typecheckStatus: 'Not run by dashboard generator. Run npm run typecheck for current validation.',
      pipelineStatus: `Ready. ${pipeline.totalOpportunities} local opportunities loaded.`,
      readinessStatus: fs.existsSync(path.join(process.cwd(), 'output', 'system-readiness', 'readiness-report.md'))
        ? 'Readiness report detected.'
        : 'No readiness report detected. Run npm run system:check.',
    },
  };
}

export function buildRevenueVisibilityData(leads: Lead[], clients: Client[], contactReviews: ContactReviewRecord[]): RevenueVisibilityData {
  const pipeline = buildOpportunityTracker(leads, contactReviews);
  const revenue = buildRevenueSummary(leads, clients);

  return {
    generatedAt: new Date().toISOString(),
    estimatedMrr: revenue.estimatedMrr,
    activeClients: revenue.activeClients,
    tierAOpportunityEstimate: estimateTierOpportunity(pipeline, 'A'),
    tierBOpportunityEstimate: estimateTierOpportunity(pipeline, 'B'),
    scenarios: buildRevenueScenarios(),
    pipeline,
  };
}

export function renderDashboardMarkdown(data: DashboardData): string {
  return `# AI Studio OS Dashboard

## Executive Summary

- Status: ${data.status}
- Commercial Mode: ON
- Generated At: ${data.generatedAt}

## Revenue Snapshot

- Estimated MRR: ${formatCurrency(data.revenue.estimatedMrr)}
- Active Clients: ${data.activeClients.length}
- Client-Ready Opportunities: ${data.pipeline.opportunities.filter((item) => item.pipelineStage === 'CLIENT_READY').length}
- Retainer Opportunities: ${data.revenue.retainerOpportunities.length}

## Lead Snapshot

- Total Leads: ${data.pipeline.totalLeads}
- Tier A: ${data.pipeline.tierSummary.A}
- Tier B: ${data.pipeline.tierSummary.B}
- Tier C: ${data.pipeline.tierSummary.C}

## Pipeline Snapshot

${stageOrder.map((stage) => `- ${stage}: ${data.pipeline.pipelineBreakdown[stage]}`).join('\n')}

## Top Opportunities

${renderTopOpportunitiesTable(data.pipeline.topOpportunities.slice(0, 10))}

## Follow-Ups Needed

${renderFollowUpSummary(data.pipeline)}

## Immediate Actions

${data.pipeline.immediateActions.slice(0, 5).map((action) => `- ${action}`).join('\n')}

## System Health

- Typecheck status: ${data.systemHealth.typecheckStatus}
- Pipeline status: ${data.systemHealth.pipelineStatus}
- Readiness status: ${data.systemHealth.readinessStatus}

## Safety Rules

- Local-first dashboard only.
- No APIs, scraping, browsing, CRM integrations, outreach automation, email sending, LinkedIn automation, payment systems, or external databases were used.
- Human approval remains required before outreach, calls, proposals, invoices, client communication, or delivery changes.
`;
}

export function renderDashboardHtml(data: DashboardData): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AI Studio OS Dashboard</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f6f7f9;
      --panel: #ffffff;
      --text: #1c2530;
      --muted: #5f6b7a;
      --line: #d9dee7;
      --accent: #0f766e;
      --accent-soft: #d9f0ec;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Arial, Helvetica, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
    }
    main {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
      padding: 24px 0 40px;
    }
    header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 18px;
    }
    h1, h2 { margin: 0; }
    h1 { font-size: 28px; }
    h2 { font-size: 18px; margin-bottom: 12px; }
    .muted { color: var(--muted); }
    .grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }
    section, .metric {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 16px;
    }
    .metric strong {
      display: block;
      font-size: 24px;
      margin-top: 4px;
    }
    .stack {
      display: grid;
      gap: 16px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    th, td {
      text-align: left;
      border-bottom: 1px solid var(--line);
      padding: 9px 8px;
      vertical-align: top;
    }
    th {
      color: var(--muted);
      font-weight: 700;
      background: #fbfcfd;
    }
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
      font-size: 12px;
      font-weight: 700;
    }
    ul { margin: 0; padding-left: 18px; }
    @media (max-width: 860px) {
      header { display: block; }
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      table { display: block; overflow-x: auto; white-space: nowrap; }
    }
    @media (max-width: 520px) {
      main { width: min(100% - 20px, 1180px); padding-top: 16px; }
      .grid { grid-template-columns: 1fr; }
      h1 { font-size: 24px; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>AI Studio OS Dashboard</h1>
        <p class="muted">Generated ${escapeHtml(data.generatedAt)}. Commercial Mode: ON. Local-only business status.</p>
      </div>
      <span class="badge">${escapeHtml(data.status)}</span>
    </header>

    <div class="grid">
      ${metric('Estimated MRR', formatCurrency(data.revenue.estimatedMrr))}
      ${metric('Active Clients', String(data.activeClients.length))}
      ${metric('Tier A', String(data.pipeline.tierSummary.A))}
      ${metric('Follow-Ups', String(data.pipeline.followUpsNeeded.length))}
    </div>

    <div class="stack">
      <section>
        <h2>Pipeline Snapshot</h2>
        ${renderStageTable(data)}
      </section>
      <section>
        <h2>Top Opportunities</h2>
        ${renderHtmlOpportunityTable(data.pipeline.topOpportunities.slice(0, 10))}
      </section>
      <section>
        <h2>Immediate Actions</h2>
        <ul>${data.pipeline.immediateActions.slice(0, 5).map((action) => `<li>${escapeHtml(action)}</li>`).join('')}</ul>
      </section>
      <section>
        <h2>System Health</h2>
        <ul>
          <li>Typecheck status: ${escapeHtml(data.systemHealth.typecheckStatus)}</li>
          <li>Pipeline status: ${escapeHtml(data.systemHealth.pipelineStatus)}</li>
          <li>Readiness status: ${escapeHtml(data.systemHealth.readinessStatus)}</li>
        </ul>
      </section>
    </div>
  </main>
</body>
</html>
`;
}

export function renderRevenueVisibilityMarkdown(data: RevenueVisibilityData): string {
  return `# Revenue Visibility

Generated: ${data.generatedAt}

Commercial Mode: ON

## Current Revenue

- Estimated MRR: ${formatCurrency(data.estimatedMrr)}
- Active Clients: ${data.activeClients.length}

Active clients:

${data.activeClients.length > 0 ? data.activeClients.map((client) => `- ${client.companyName}: ${client.serviceType}, ${formatCurrency(client.monthlyFee)}/month recorded fee`).join('\n') : '- No active clients recorded.'}

## Opportunity Revenue

- Tier A opportunity estimate: ${formatRange(data.tierAOpportunityEstimate)}
- Tier B opportunity estimate: ${formatRange(data.tierBOpportunityEstimate)}
- These are opportunity ranges from local pipeline items, not guaranteed revenue.

## Conversion Scenarios

${data.scenarios.map((scenario) => `- ${scenario.label}: ${scenario.retainers} retainer(s) = ${formatRange(scenario.monthlyRange)}/month`).join('\n')}

## Pricing Assumptions

- QA Audit: $199-$500
- Playwright Starter Pack: $900-$1500
- Retainer: $1500-$3000/month

## Notes

- Do not treat opportunities as booked revenue.
- Revenue estimates use local leads, clients, and pipeline artifacts only.
- No invoices, payment integrations, bank data, CRM, APIs, scraping, or external databases are connected.
- Human approval is required before pricing, proposals, invoices, or client communication.
`;
}

function estimateTierOpportunity(pipeline: OpportunityTracker, tier: 'A' | 'B'): { min: number; max: number } {
  return pipeline.opportunities
    .filter((item) => item.tier === tier)
    .filter((item) => item.lead.status !== 'paused' && item.lead.status !== 'lost' && item.lead.recommendedOffer !== 'not-fit')
    .reduce(
      (total, item) => {
        const range = offerRanges[item.lead.recommendedOffer];
        return {
          min: total.min + range.min,
          max: total.max + range.max,
        };
      },
      { min: 0, max: 0 },
    );
}

function buildRevenueScenarios(): RevenueScenario[] {
  return [
    { label: 'Conservative', retainers: 1, monthlyRange: { min: 1500, max: 3000 } },
    { label: 'Expected', retainers: 3, monthlyRange: { min: 4500, max: 9000 } },
    { label: 'Optimistic', retainers: 5, monthlyRange: { min: 7500, max: 15000 } },
  ];
}

function isCommercialClient(client: Client): boolean {
  const id = client.id.toLowerCase();
  const companyName = client.companyName.toLowerCase();
  const website = client.website.toLowerCase();

  return !(
    id.startsWith('sample-')
    || id.includes('demo')
    || companyName.includes('demo')
    || companyName.includes('sample')
    || companyName.includes('sandbox')
    || companyName.includes('test')
    || website.includes('.example')
  );
}

function renderTopOpportunitiesTable(items: OpportunityItem[]): string {
  if (items.length === 0) return 'No active opportunities found.';

  return [
    '| Company | Opportunity Score | Stage | Offer | Next Action |',
    '| --- | ---: | --- | --- | --- |',
    ...items.map((item) => `| ${escapeTable(item.lead.companyName)} | ${item.opportunityScore} | ${item.pipelineStage} | ${item.lead.recommendedOffer} | ${escapeTable(item.nextAction)} |`),
  ].join('\n');
}

function renderFollowUpSummary(pipeline: OpportunityTracker): string {
  if (pipeline.followUpsNeeded.length === 0) return '- No follow-ups currently required.';

  return pipeline.followUpsNeeded
    .map((item) => `- ${item.lead.companyName}: ${item.contactReview?.nextFollowUpDate || 'date not set'}; ${item.nextAction}`)
    .join('\n');
}

function renderStageTable(data: DashboardData): string {
  return `<table><thead><tr><th>Stage</th><th>Count</th></tr></thead><tbody>${stageOrder
    .map((stage) => `<tr><td>${stage}</td><td>${data.pipeline.pipelineBreakdown[stage]}</td></tr>`)
    .join('')}</tbody></table>`;
}

function renderHtmlOpportunityTable(items: OpportunityItem[]): string {
  if (items.length === 0) return '<p>No active opportunities found.</p>';

  return `<table><thead><tr><th>Company</th><th>Score</th><th>Stage</th><th>Offer</th><th>Next Action</th></tr></thead><tbody>${items
    .map((item) => `<tr><td>${escapeHtml(item.lead.companyName)}</td><td>${item.opportunityScore}</td><td>${item.pipelineStage}</td><td>${item.lead.recommendedOffer}</td><td>${escapeHtml(item.nextAction)}</td></tr>`)
    .join('')}</tbody></table>`;
}

function metric(label: string, value: string): string {
  return `<div class="metric"><span class="muted">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function formatRange(range: { min: number; max: number }): string {
  return `${formatCurrency(range.min)}-${formatCurrency(range.max)}`;
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US')}`;
}

function escapeTable(value: string): string {
  return value.replace(/\|/g, '\\|');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderPwaDashboardSummary(data: PwaDashboardData): string {
  return `# PWA Dashboard Summary

Generated: ${data.generatedAt}

## Today

- Top Actions: ${data.today.topActions.length}
- Revenue Priorities: ${data.today.revenuePriorities.join(', ') || 'None'}
- Follow-Ups Due: ${data.today.followUpsDue}
- Proposal Reviews: ${data.today.proposalReviews.join(', ') || 'None'}

## Leads

- Total Leads: ${data.leads.totalLeads}
- Top Leads: ${data.leads.topLeads.map((lead) => `${lead.companyName} (${lead.score}/100)`).join(', ') || 'None'}
- Highest Opportunity Scores: ${data.leads.highestOpportunityScores.map((lead) => `${lead.companyName} (${lead.score}/100)`).join(', ') || 'None'}

## Outreach

- Invitations Sent: ${data.outreach.invitationsSent}
- Messages Sent: ${data.outreach.messagesSent}
- Connected: ${data.outreach.connected}
- Replies: ${data.outreach.replies}
- Follow-Ups Due: ${data.outreach.followUpsDue}

## Audits

- Audit Reports Generated: ${data.audits.auditReportsGenerated}
- Unified Audits: ${data.audits.unifiedAudits}
- Evidence Available: ${data.audits.evidenceAvailable}

## Proposals

- Proposal Ready: ${data.proposals.proposalReady.join(', ') || 'None'}
- Needs Review: ${data.proposals.needsReview.join(', ') || 'None'}
- Retainer Candidates: ${data.proposals.retainerCandidates.join(', ') || 'None'}

## Revenue

- Best Audit Opportunity: ${data.revenue.bestAuditOpportunity}
- Best Starter Pack Opportunity: ${data.revenue.bestStarterPackOpportunity}
- Best Retainer Opportunity: ${data.revenue.bestRetainerOpportunity}

## Studio Consolidation

- Studio Health: ${data.studio.studioHealth}
- Release Readiness: ${data.studio.releaseReadiness}
- System Status: ${data.studio.systemStatus}
- Critical Issues: ${data.studio.criticalIssues}
- Warnings: ${data.studio.warnings}
- Current MRR: ${formatCurrency(data.studio.currentMrr)}
- Ready For Outreach: ${data.studio.readyForOutreach}
- Ready For Audit Sales: ${data.studio.readyForAuditSales}
- Ready For Retainers: ${data.studio.readyForRetainers}
- Ready For Client Delivery: ${data.studio.readyForClientDelivery}

## Revenue Activation

- Revenue Activation: ${data.revenueActivation.revenueActivation}
- First Client Goal: ${data.revenueActivation.firstClientGoal}
- First Retainer Goal: ${data.revenueActivation.firstRetainerGoal}
- Top Revenue Target: ${data.revenueActivation.topRevenueTarget}
- Top Revenue Action: ${data.revenueActivation.topRevenueAction}
- Top Activation Score: ${data.revenueActivation.topActivationScore}/100

## First Revenue Execution

- First Revenue Status: ${data.executionPack.firstRevenueStatus}
- Go / No Go: ${data.executionPack.goNoGo}
- Remaining Blockers: ${data.executionPack.remainingBlockers}
- Next Manual Action: ${data.executionPack.nextManualAction}
- Estimated Revenue Value: ${data.executionPack.estimatedRevenueValue}
- Estimated Confidence Score: ${data.executionPack.estimatedConfidenceScore}/100

## Outcome Tracking

- Outcome Tracking: ${data.outcomeTracking.status}
- Messages Sent: ${data.outcomeTracking.messagesSent}
- Replies: ${data.outcomeTracking.replies}
- Meetings: ${data.outcomeTracking.meetings}
- Proposals: ${data.outcomeTracking.proposals}
- Wins: ${data.outcomeTracking.wins}
- Losses: ${data.outcomeTracking.losses}
- Reply Rate: ${data.outcomeTracking.replyRate}
- Next Manual Message: ${data.outcomeTracking.nextManualMessage}

## Outcome Learning

- Outcomes Recorded: ${data.outcomeLearning.outcomesRecorded}
- Reply Rate: ${data.outcomeLearning.replyRate}
- Proposal Rate: ${data.outcomeLearning.proposalRate}
- Win Rate: ${data.outcomeLearning.winRate}
- Top Performing Offer: ${data.outcomeLearning.topPerformingOffer}

## Follow-Up Operating System

- Follow-Up Queue: ${data.followUpEngine.followUpQueue}
- Today's Follow-Ups: ${data.followUpEngine.todaysFollowUps}
- Waiting Responses: ${data.followUpEngine.waitingResponses}
- Open Opportunities: ${data.followUpEngine.openOpportunities}
- Next Best Action: ${data.followUpEngine.nextBestAction}

## Win/Loss Intelligence

- Win Rate: ${data.winLossIntelligence.winRate}
- Reply Rate: ${data.winLossIntelligence.replyRate}
- Best Offer: ${data.winLossIntelligence.bestOffer}
- Best Segment: ${data.winLossIntelligence.bestSegment}
- Top Learning: ${data.winLossIntelligence.topLearning}
- Top Recommendation: ${data.winLossIntelligence.topRecommendation}

## Studio Snapshot

- Studio Version: ${data.studioSnapshot.studioVersion}
- Snapshot Status: ${data.studioSnapshot.snapshotStatus}
- Recovery Status: ${data.studioSnapshot.recoveryStatus}
- Last Snapshot: ${data.studioSnapshot.lastSnapshot}

## Lead Intelligence

- Best Lead: ${data.leadIntelligence.bestLead}
- Best Offer: ${data.leadIntelligence.bestOffer}
- Highest Opportunity Score: ${data.leadIntelligence.highestOpportunityScore}/100
- Fastest Revenue Path: ${data.leadIntelligence.fastestRevenuePath}
- Recommended Next Action: ${data.leadIntelligence.recommendedNextAction}

## Operator Mode

- Top Lead: ${data.operatorMode.topLead}
- Top Offer: ${data.operatorMode.topOffer}
- Top Action: ${data.operatorMode.topAction}
- Studio Status: ${data.operatorMode.studioStatus}
- Today At A Glance: ${data.operatorMode.todayAtAGlance}

## Top Lead Audit

- Top Lead Audit Status: ${data.topLeadAudit.topLeadAuditStatus}
- Evidence Status: ${data.topLeadAudit.evidenceStatus}
- Proposal Status: ${data.topLeadAudit.proposalStatus}
- Execution Readiness: ${data.topLeadAudit.executionReadiness}

## Safety

${data.safety.map((item) => `- ${item}`).join('\n')}
`;
}

export function renderPwaDashboardHealth(data: PwaDashboardData): string {
  const requiredFiles = [
    'dashboard/index.html',
    'dashboard/styles.css',
    'dashboard/app.js',
    'dashboard/manifest.json',
    'dashboard/dashboard.json',
    'output/dashboard/dashboard.json',
  ];

  return `# Dashboard Health

Generated: ${data.generatedAt}

## Status

- Last Update: ${data.systemHealth.lastUpdate}
- Lead Research Status: ${data.systemHealth.leadResearchStatus}
- Evidence Status: ${data.systemHealth.evidenceStatus}
- Proposal Status: ${data.systemHealth.proposalStatus}
- Dashboard Status: ${data.systemHealth.dashboardStatus}
- Studio Health: ${data.studio.studioHealth}
- Release Readiness: ${data.studio.releaseReadiness}
- System Status: ${data.studio.systemStatus}
- Critical Issues: ${data.studio.criticalIssues}
- Warnings: ${data.studio.warnings}
- Revenue Activation: ${data.revenueActivation.revenueActivation}
- Top Revenue Target: ${data.revenueActivation.topRevenueTarget}
- Top Activation Score: ${data.revenueActivation.topActivationScore}/100
- First Revenue Status: ${data.executionPack.firstRevenueStatus}
- Go / No Go: ${data.executionPack.goNoGo}
- Remaining Blockers: ${data.executionPack.remainingBlockers}
- Outcome Tracking: ${data.outcomeTracking.status}
- Messages Sent: ${data.outcomeTracking.messagesSent}
- Replies: ${data.outcomeTracking.replies}
- Meetings: ${data.outcomeTracking.meetings}
- Proposals: ${data.outcomeTracking.proposals}
- Wins: ${data.outcomeTracking.wins}
- Losses: ${data.outcomeTracking.losses}
- Reply Rate: ${data.outcomeTracking.replyRate}
- Follow-Up Queue: ${data.followUpEngine.followUpQueue}
- Today's Follow-Ups: ${data.followUpEngine.todaysFollowUps}
- Waiting Responses: ${data.followUpEngine.waitingResponses}
- Open Opportunities: ${data.followUpEngine.openOpportunities}
- Win Rate: ${data.winLossIntelligence.winRate}
- Best Offer: ${data.winLossIntelligence.bestOffer}
- Best Segment: ${data.winLossIntelligence.bestSegment}
- Top Recommendation: ${data.winLossIntelligence.topRecommendation}
- Studio Version: ${data.studioSnapshot.studioVersion}
- Snapshot Status: ${data.studioSnapshot.snapshotStatus}
- Recovery Status: ${data.studioSnapshot.recoveryStatus}
- Last Snapshot: ${data.studioSnapshot.lastSnapshot}
- Best Lead: ${data.leadIntelligence.bestLead}
- Best Offer: ${data.leadIntelligence.bestOffer}
- Highest Opportunity Score: ${data.leadIntelligence.highestOpportunityScore}/100
- Operator Top Action: ${data.operatorMode.topAction}
- Operator Studio Status: ${data.operatorMode.studioStatus}

## PWA Files

${requiredFiles.map((filePath) => `- ${filePath}: ${fs.existsSync(path.join(process.cwd(), filePath)) ? 'Available' : 'Missing'}`).join('\n')}

## Read-Only Rules

${data.safety.map((item) => `- ${item}`).join('\n')}
`;
}
