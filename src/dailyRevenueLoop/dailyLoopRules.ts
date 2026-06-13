import fs = require('fs');
import path = require('path');
import { buildClientAuditPortfolio } from '../clientAuditReports/clientAuditReportRules';
import { ClientAuditReport } from '../clientAuditReports/types';
import { buildOpportunitySummary } from '../opportunityEngine/opportunityEngineRules';
import { OpportunityReport } from '../opportunityEngine/types';
import { buildProposalPortfolio } from '../proposalEngine/proposalRules';
import { ProposalPackage } from '../proposalEngine/types';
import { buildUnifiedAuditPortfolio } from '../unifiedAuditGenerator/unifiedAuditRules';
import { UnifiedAuditReport } from '../unifiedAuditGenerator/types';
import {
  CompanyContactGroup,
  CompanyRevenueProfile,
  ContactPerson,
  DailyLoopContextSource,
  DailyRevenueAction,
  DailyRevenueLoopInput,
  DailyRevenuePlan,
  DailyRevenueState,
  DailyRevenueSummary,
  DailyRevenueSummaryMetrics,
  OutreachRecord,
  WeeklyRevenueReview,
  WeeklyRevenueState,
} from './types';

const outputDir = path.join(process.cwd(), 'output', 'daily-revenue');
const dailyStatePath = path.join(process.cwd(), 'data', 'daily-revenue', 'daily-state.json');
const weeklyStatePath = path.join(process.cwd(), 'data', 'daily-revenue', 'weekly-state.json');
const contactsPath = path.join(process.cwd(), 'data', 'contacts', 'contacts.json');
const outreachPath = path.join(process.cwd(), 'data', 'outreach', 'outreach.json');

const safetyNotes = [
  'This is a planning engine only.',
  'Do not send outreach, emails, proposals, invoices, payment links, calendar events, or automated follow-ups from these outputs.',
  'Do not infer replies, meetings, opportunities, revenue, or client interest unless present in local data.',
  'Human approval is required before any external action.',
];

export function loadDailyRevenueLoopInput(): DailyRevenueLoopInput {
  const generatedAt = new Date().toISOString();
  const today = localDate(new Date());
  const contacts = readJson<CompanyContactGroup[]>(contactsPath, []);
  const outreach = readJson<OutreachRecord[]>(outreachPath, []);
  const opportunitySummary = buildOpportunitySummary();
  const unifiedPortfolio = buildUnifiedAuditPortfolio();
  const clientAuditPortfolio = buildClientAuditPortfolio();
  const proposalPortfolio = buildProposalPortfolio();
  const profiles = buildCompanyProfiles({
    today,
    contacts,
    outreach,
    opportunities: opportunitySummary.reports,
    unifiedAudits: unifiedPortfolio.reports,
    clientAudits: clientAuditPortfolio.reports,
    proposals: proposalPortfolio.proposals,
  });

  return {
    generatedAt,
    today,
    dailyState: readJson<DailyRevenueState>(dailyStatePath, defaultDailyState()),
    weeklyState: readJson<WeeklyRevenueState>(weeklyStatePath, defaultWeeklyState()),
    contacts,
    outreach,
    profiles,
    contextSources: contextSources(),
  };
}

export function buildDailyRevenuePlan(input: DailyRevenueLoopInput): DailyRevenuePlan {
  const topActions = buildTopActions(input.profiles, input.today, 5);

  return {
    generatedAt: input.generatedAt,
    today: input.today,
    totalActiveLeads: input.profiles.length,
    totalContacts: input.contacts.reduce((sum, group) => sum + group.contacts.length, 0),
    repliesWaiting: input.profiles.reduce((sum, profile) => sum + profile.repliesWaiting, 0),
    followUpsDue: input.profiles.reduce((sum, profile) => sum + profile.followUpsDue.length, 0),
    proposalCandidates: input.profiles.filter((profile) => isProposalReady(profile)).length,
    auditCandidates: input.profiles.filter((profile) => isAuditReady(profile)).length,
    topActions,
    profiles: input.profiles,
  };
}

export function buildDailyRevenueSummary(input: DailyRevenueLoopInput): DailyRevenueSummary {
  return {
    generatedAt: input.generatedAt,
    today: input.today,
    metrics: buildSummaryMetrics(input),
    contextSources: input.contextSources,
  };
}

export function buildWeeklyRevenueReview(input: DailyRevenueLoopInput): WeeklyRevenueReview {
  const topOpportunities = [...input.profiles].sort(sortProfilesByRevenuePriority).slice(0, 5);
  const researchGaps = input.profiles
    .filter((profile) => profile.researchNeeded || profile.contacts.length === 0)
    .map((profile) => `${profile.companyName}: ${profile.contacts.length === 0 ? 'No local contacts recorded.' : 'Research marked as needed in local audit/proposal data.'}`);
  const evidenceGaps = input.profiles
    .filter((profile) => !profile.evidenceExists || !profile.lighthouseExists || !profile.playwrightEvidenceExists)
    .map((profile) => `${profile.companyName}: ${missingEvidence(profile).join(', ')}`);

  return {
    generatedAt: input.generatedAt,
    today: input.today,
    topOpportunities,
    pipelineHealth: {
      activeLeads: input.profiles.length,
      proposalReady: input.profiles.filter(isProposalReady).length,
      auditReady: input.profiles.filter(isAuditReady).length,
      researchOnly: input.profiles.filter((profile) => !isProposalReady(profile) && !isAuditReady(profile)).length,
      followUpsDue: input.profiles.reduce((sum, profile) => sum + profile.followUpsDue.length, 0),
    },
    researchGaps,
    evidenceGaps,
    nextWeekPriorities: buildTopActions(input.profiles, input.today, 5),
  };
}

export function writeDailyPlanOutputs(plan: DailyRevenuePlan): string[] {
  const outputs = [
    ['today-plan.md', renderTodayPlan(plan)],
    ['highest-priority-actions.md', renderHighestPriorityActions(plan)],
    ['followup-priorities.md', renderFollowupPriorities(plan)],
    ['proposal-priorities.md', renderProposalPriorities(plan)],
    ['audit-priorities.md', renderAuditPriorities(plan)],
    ['revenue-opportunities.md', renderRevenueOpportunities(plan)],
  ] as const;

  return writeOutputs(outputs);
}

export function writeDailySummaryOutput(summary: DailyRevenueSummary): string {
  return writeOutput('today-summary.md', renderTodaySummary(summary));
}

export function writeWeeklyReviewOutput(review: WeeklyRevenueReview): string {
  return writeOutput('week-review.md', renderWeekReview(review));
}

function buildCompanyProfiles(input: {
  today: string;
  contacts: CompanyContactGroup[];
  outreach: OutreachRecord[];
  opportunities: OpportunityReport[];
  unifiedAudits: UnifiedAuditReport[];
  clientAudits: ClientAuditReport[];
  proposals: ProposalPackage[];
}): CompanyRevenueProfile[] {
  const ids = new Set<string>();
  for (const item of input.contacts) ids.add(item.companyId);
  for (const item of input.outreach) ids.add(item.companyId);
  for (const item of input.opportunities) ids.add(item.companyId);
  for (const item of input.unifiedAudits) ids.add(item.companyId);
  for (const item of input.clientAudits) ids.add(item.companyId);
  for (const item of input.proposals) ids.add(item.companyId);

  return [...ids].map((companyId) => {
    const contactGroup = input.contacts.find((group) => group.companyId === companyId);
    const outreach = input.outreach.filter((record) => record.companyId === companyId);
    const opportunity = input.opportunities.find((report) => report.companyId === companyId);
    const unifiedAudit = input.unifiedAudits.find((report) => report.companyId === companyId);
    const clientAudit = input.clientAudits.find((report) => report.companyId === companyId);
    const proposal = input.proposals.find((report) => report.companyId === companyId);
    const companyName = proposal?.companyName
      ?? clientAudit?.companyName
      ?? unifiedAudit?.companyName
      ?? opportunity?.companyName
      ?? contactGroup?.companyName
      ?? outreach[0]?.companyName
      ?? companyId;

    return {
      companyId,
      companyName,
      contacts: contactGroup?.contacts ?? [],
      outreach,
      opportunity,
      unifiedAudit,
      clientAudit,
      proposal,
      proposalMarkdownExists: fileExists(path.join('output', 'proposals', `${companyId}-proposal.md`)),
      proposalPdfExists: fileExists(path.join('output', 'proposals', `${companyId}-proposal.pdf`)),
      unifiedAuditExists: fileExists(path.join('output', 'unified-audits', `${companyId}-unified-audit.md`)),
      clientAuditMarkdownExists: fileExists(path.join('output', 'client-audit-reports', `${companyId}-qa-audit-report.md`)),
      clientAuditPdfExists: fileExists(path.join('output', 'client-audit-reports', `${companyId}-qa-audit-report.pdf`)),
      evidenceExists: fileExists(path.join('output', 'evidence', `${companyId}-evidence.md`)),
      lighthouseExists: fileExists(path.join('output', 'lighthouse', `${companyId}-lighthouse.md`)),
      playwrightEvidenceExists: fileExists(path.join('output', 'playwright-runner', `${companyId}-playwright-evidence.md`)),
      repliesWaiting: outreach.filter(isReplyWaiting).length,
      followUpsDue: outreach.filter((record) => isFollowUpDue(record, input.today)),
      scheduledFollowUps: outreach.filter((record) => record.nextFollowUpAt !== null),
      opportunityScore: proposal?.opportunityScore ?? clientAudit?.opportunityScore ?? unifiedAudit?.opportunityScore ?? opportunity?.confidenceScore ?? 0,
      evidenceReadiness: proposal?.evidenceReadiness ?? clientAudit?.evidenceReadiness ?? unifiedAudit?.evidenceReadiness ?? 0,
      researchNeeded: proposal?.sourceAuditReport.sourceReport.researchNeeded ?? clientAudit?.sourceReport.researchNeeded ?? unifiedAudit?.researchNeeded ?? opportunity?.researchRequired ?? false,
    };
  }).sort(sortProfilesByRevenuePriority);
}

function buildTopActions(profiles: CompanyRevenueProfile[], today: string, limit: number): DailyRevenueAction[] {
  return profiles
    .flatMap((profile) => actionsForProfile(profile, today))
    .sort((left, right) => right.score - left.score || left.companyName.localeCompare(right.companyName))
    .slice(0, limit)
    .map((action, index) => ({ ...action, priority: index + 1 }));
}

function actionsForProfile(profile: CompanyRevenueProfile, today: string): DailyRevenueAction[] {
  const actions: DailyRevenueAction[] = [];
  const primaryAction = primaryActionForProfile(profile, today);
  if (primaryAction) actions.push(primaryAction);

  if (profile.followUpsDue.length === 0 && profile.scheduledFollowUps.length > 0) {
    const record = [...profile.scheduledFollowUps].sort((left, right) => (left.nextFollowUpAt ?? '').localeCompare(right.nextFollowUpAt ?? ''))[0];
    actions.push({
      priority: 0,
      type: 'review-follow-up',
      companyId: profile.companyId,
      companyName: profile.companyName,
      title: `Review upcoming follow-up timing for ${record.contactName}`,
      whyItMatters: 'Scheduled follow-up context keeps active conversations from stalling while still respecting due dates.',
      estimatedImpact: approvedImpact(profile, 'Potential future audit or starter-pack conversation if Daniel later approves an external next step.'),
      recommendedNextStep: `Confirm whether the local follow-up date ${record.nextFollowUpAt} still makes sense for ${record.contactName}. Do not send a message from this system.`,
      score: 650 + profile.opportunityScore,
    });
  }

  return actions;
}

function primaryActionForProfile(profile: CompanyRevenueProfile, today: string): DailyRevenueAction | undefined {
  const reply = profile.outreach.find(isReplyWaiting);
  if (reply) {
    return {
      priority: 0,
      type: 'review-reply',
      companyId: profile.companyId,
      companyName: profile.companyName,
      title: `Review waiting reply from ${reply.contactName}`,
      whyItMatters: 'Existing conversations outrank new research because they are closest to revenue.',
      estimatedImpact: approvedImpact(profile, 'Potential next paid step can be confirmed only after manual review.'),
      recommendedNextStep: `Open local outreach context for ${profile.companyName}, review the reply status, and decide the next manual action. Do not send a message from this system.`,
      score: 1200 + profile.opportunityScore,
    };
  }

  if (profile.followUpsDue.length > 0) {
    const record = profile.followUpsDue[0];
    return {
      priority: 0,
      type: 'review-follow-up',
      companyId: profile.companyId,
      companyName: profile.companyName,
      title: `Review due follow-up for ${record.contactName}`,
      whyItMatters: 'A due follow-up is an active pipeline action and should come before internal optimization.',
      estimatedImpact: approvedImpact(profile, 'Potential audit or starter-pack conversation if Daniel approves an external next step.'),
      recommendedNextStep: `Review ${record.contactName}'s local outreach record and decide whether a manual follow-up is appropriate. No message is generated here.`,
      score: 1100 + profile.opportunityScore,
    };
  }

  if (isProposalReady(profile)) {
    return {
      priority: 0,
      type: 'review-proposal',
      companyId: profile.companyId,
      companyName: profile.companyName,
      title: `Review ${profile.companyName} proposal package`,
      whyItMatters: 'A generated proposal is closer to revenue than more research, as long as evidence and scope are reviewed manually.',
      estimatedImpact: approvedImpact(profile, 'Reviewable proposal/SOW package is ready for Daniel approval.'),
      recommendedNextStep: `Review output/proposals/${profile.companyId}-proposal.md and output/proposals/${profile.companyId}-proposal.pdf for scope, claims, and pricing before any external use.`,
      score: 1000 + profile.opportunityScore + profile.evidenceReadiness,
    };
  }

  if (isAuditReady(profile)) {
    return {
      priority: 0,
      type: 'review-audit',
      companyId: profile.companyId,
      companyName: profile.companyName,
      title: `Review ${profile.companyName} audit evidence`,
      whyItMatters: 'Audit-ready evidence can support a paid audit offer or a proposal after review.',
      estimatedImpact: approvedImpact(profile, 'Potential QA Audit path if Daniel approves the next external step.'),
      recommendedNextStep: `Review the unified and client audit outputs for ${profile.companyName}, then decide whether a proposal should be reviewed or more evidence is needed.`,
      score: 850 + profile.opportunityScore + profile.evidenceReadiness,
    };
  }

  if (profile.opportunity && missingEvidence(profile).length > 0) {
    return {
      priority: 0,
      type: 'collect-evidence',
      companyId: profile.companyId,
      companyName: profile.companyName,
      title: `Close evidence gaps for ${profile.companyName}`,
      whyItMatters: 'Evidence collection can unblock a paid audit or proposal path.',
      estimatedImpact: 'Improves audit readiness; no revenue is counted until a paid engagement exists in local client data.',
      recommendedNextStep: `Review missing local evidence for ${profile.companyName}: ${missingEvidence(profile).join(', ')}.`,
      score: 700 + profile.opportunityScore,
    };
  }

  if (profile.opportunity) {
    return {
      priority: 0,
      type: 'research-lead',
      companyId: profile.companyId,
      companyName: profile.companyName,
      title: `Review research gaps for ${profile.companyName}`,
      whyItMatters: 'Research-only leads come after revenue-ready proposal and audit actions.',
      estimatedImpact: 'Can improve future audit readiness; no immediate revenue should be assumed.',
      recommendedNextStep: `Review local opportunity notes for ${profile.companyName} and decide what evidence is required next.`,
      score: 500 + profile.opportunityScore,
    };
  }

  return undefined;
}

function renderTodayPlan(plan: DailyRevenuePlan): string {
  return `# Daily Revenue Plan

## Executive Summary

${bullets([
    `Date: ${plan.today}`,
    `Total Active Leads: ${plan.totalActiveLeads}`,
    `Total Contacts: ${plan.totalContacts}`,
    `Replies Waiting: ${plan.repliesWaiting}`,
    `Follow-Ups Due: ${plan.followUpsDue}`,
    `Proposal Candidates: ${plan.proposalCandidates}`,
    `Audit Candidates: ${plan.auditCandidates}`,
  ])}

## Top 5 Actions

${renderActions(plan.topActions)}

## Follow-Up Queue

${renderFollowupRows(plan)}

## Audit Opportunities

${renderAuditOpportunitySummary(plan)}

## Proposal Opportunities

${renderProposalOpportunitySummary(plan)}

## Revenue Focus

${renderRevenueFocus(plan)}

## Safety Notes

${bullets(safetyNotes)}
`;
}

function renderHighestPriorityActions(plan: DailyRevenuePlan): string {
  return `# Highest Priority Actions

Generated: ${plan.generatedAt}

${renderActions(plan.topActions)}

## Safety Notes

${bullets(safetyNotes)}
`;
}

function renderFollowupPriorities(plan: DailyRevenuePlan): string {
  return `# Follow-Up Priorities

Generated: ${plan.generatedAt}

## Contacts Needing Follow-Up

${renderFollowupRows(plan)}

## Scheduled Follow-Ups

${scheduledFollowups(plan)}

## Safety Notes

${bullets(safetyNotes)}
`;
}

function renderProposalPriorities(plan: DailyRevenuePlan): string {
  const ready = plan.profiles.filter(isProposalReady);
  const needsReview = plan.profiles.filter((profile) => profile.proposalMarkdownExists || profile.proposalPdfExists);
  const needsMoreEvidence = plan.profiles.filter((profile) => !isProposalReady(profile) || profile.researchNeeded);

  return `# Proposal Priorities

## Proposal Ready

${ready.length > 0 ? bullets(ready.map((profile) => `${profile.companyName}: ${profile.proposal?.recommendedEngagement ?? 'Generated proposal'}; Opportunity Score ${profile.opportunityScore}/100; Evidence Readiness ${profile.evidenceReadiness}/100.`)) : '- No proposal-ready companies found.'}

## Needs Review

${needsReview.length > 0 ? bullets(needsReview.map((profile) => `${profile.companyName}: Review Markdown/PDF proposal manually before external use.`)) : '- No generated proposals found.'}

## Needs More Evidence

${needsMoreEvidence.length > 0 ? bullets(needsMoreEvidence.map((profile) => `${profile.companyName}: ${profile.researchNeeded ? 'Research is marked as needed.' : missingEvidence(profile).join(', ') || 'Proposal package is not generated.'}`)) : '- No proposal evidence gaps found.'}

## Safety Notes

${bullets(safetyNotes)}
`;
}

function renderAuditPriorities(plan: DailyRevenuePlan): string {
  return `# Audit Priorities

${renderAuditOpportunitySummary(plan)}

## Audit Candidate Table

| Company | Opportunity Score | Evidence Readiness | Unified Audit | Client Audit PDF | Research Needed |
| --- | --- | --- | --- | --- | --- |
${plan.profiles.filter(isAuditReady).map((profile) => `| ${profile.companyName} | ${profile.opportunityScore}/100 | ${profile.evidenceReadiness}/100 | ${yesNo(profile.unifiedAuditExists)} | ${yesNo(profile.clientAuditPdfExists)} | ${yesNo(profile.researchNeeded)} |`).join('\n') || '| None | 0/100 | 0/100 | No | No | No |'}

## Safety Notes

${bullets(safetyNotes)}
`;
}

function renderRevenueOpportunities(plan: DailyRevenuePlan): string {
  return `# Revenue Opportunities

${renderRevenueFocus(plan)}

## Ranked Revenue Actions

${renderActions(plan.topActions)}

## Revenue Rule

- Revenue-generating review actions are prioritized over internal optimization unless a local blocker exists.
- No revenue is counted from opportunities or proposals unless booked revenue exists in local client data.

## Safety Notes

${bullets(safetyNotes)}
`;
}

function renderTodaySummary(summary: DailyRevenueSummary): string {
  return `# Daily Revenue Summary

Generated: ${summary.generatedAt}

## Metrics From Local Data

${bullets([
    `Leads Researched: ${summary.metrics.leadsResearched}`,
    `Contacts Added: ${summary.metrics.contactsAdded}`,
    `Outreach Tracked: ${summary.metrics.outreachTracked}`,
    `Audits Generated: ${summary.metrics.auditsGenerated}`,
    `Proposals Generated: ${summary.metrics.proposalsGenerated}`,
    `Evidence Collected: ${summary.metrics.evidenceCollected}`,
  ])}

## Source Availability

${bullets(summary.contextSources.map((source) => `${source.label}: ${source.exists ? 'Available' : 'Missing'} (${source.path})`))}

## Notes

- Counts reflect current local files and JSON records. The local data does not include a reliable created-today timestamp for every artifact.
- No replies, meetings, revenue, or client interest were inferred.

## Safety Notes

${bullets(safetyNotes)}
`;
}

function renderWeekReview(review: WeeklyRevenueReview): string {
  return `# Weekly Revenue Review

Generated: ${review.generatedAt}

## Top Opportunities

${review.topOpportunities.length > 0 ? bullets(review.topOpportunities.map((profile) => `${profile.companyName}: Opportunity Score ${profile.opportunityScore}/100, Evidence Readiness ${profile.evidenceReadiness}/100, Proposal Ready ${yesNo(isProposalReady(profile))}.`)) : '- No opportunities found.'}

## Pipeline Health

${bullets([
    `Active Leads: ${review.pipelineHealth.activeLeads}`,
    `Proposal Ready: ${review.pipelineHealth.proposalReady}`,
    `Audit Ready: ${review.pipelineHealth.auditReady}`,
    `Research Only: ${review.pipelineHealth.researchOnly}`,
    `Follow-Ups Due: ${review.pipelineHealth.followUpsDue}`,
  ])}

## Research Gaps

${review.researchGaps.length > 0 ? bullets(review.researchGaps) : '- No research gaps recorded in local data.'}

## Evidence Gaps

${review.evidenceGaps.length > 0 ? bullets(review.evidenceGaps) : '- No evidence gaps detected across active profiles.'}

## Next Week Priorities

${renderActions(review.nextWeekPriorities)}

## Safety Notes

${bullets(safetyNotes)}
`;
}

function renderActions(actions: DailyRevenueAction[]): string {
  if (actions.length === 0) return '- No prioritized actions found in local data.';

  return actions.map((action) => `### Priority ${action.priority}

${bullets([
    `Action: ${action.title}`,
    `Why it matters: ${action.whyItMatters}`,
    `Estimated impact: ${action.estimatedImpact}`,
    `Recommended next step: ${action.recommendedNextStep}`,
  ])}`).join('\n\n');
}

function renderFollowupRows(plan: DailyRevenuePlan): string {
  const due = plan.profiles.flatMap((profile) => profile.followUpsDue.map((record) => ({ profile, record })));
  if (due.length === 0) {
    return '- No contacts have due follow-up dates in local outreach data.';
  }

  return due
    .sort((left, right) => daysSince(right.record.lastTouchAt, plan.today) - daysSince(left.record.lastTouchAt, plan.today))
    .map(({ profile, record }) => bullets([
      `Contact: ${record.contactName} (${profile.companyName})`,
      `Days since contact: ${daysSince(record.lastTouchAt, plan.today)}`,
      'Suggested action: Review local context and decide whether Daniel should take a manual next step. No message is generated.',
    ])).join('\n');
}

function scheduledFollowups(plan: DailyRevenuePlan): string {
  const scheduled = plan.profiles.flatMap((profile) => profile.scheduledFollowUps.map((record) => ({ profile, record })));
  if (scheduled.length === 0) return '- No scheduled follow-up dates found.';

  return scheduled
    .sort((left, right) => (left.record.nextFollowUpAt ?? '').localeCompare(right.record.nextFollowUpAt ?? ''))
    .map(({ profile, record }) => `- ${record.nextFollowUpAt}: ${record.contactName} (${profile.companyName}) - review only; no message generated.`)
    .join('\n');
}

function renderAuditOpportunitySummary(plan: DailyRevenuePlan): string {
  const audits = plan.profiles.filter(isAuditReady);
  const highestConfidence = [...audits].sort((left, right) => right.evidenceReadiness - left.evidenceReadiness || right.opportunityScore - left.opportunityScore)[0];
  const highestOpportunity = [...audits].sort((left, right) => right.opportunityScore - left.opportunityScore || right.evidenceReadiness - left.evidenceReadiness)[0];
  const mostEvidence = highestConfidence;

  return bullets([
    `Highest confidence audit: ${highestConfidence ? `${highestConfidence.companyName} (${highestConfidence.evidenceReadiness}/100 evidence readiness)` : 'No audit candidate found.'}`,
    `Highest opportunity score: ${highestOpportunity ? `${highestOpportunity.companyName} (${highestOpportunity.opportunityScore}/100)` : 'No audit candidate found.'}`,
    `Most evidence available: ${mostEvidence ? `${mostEvidence.companyName} (${evidenceList(mostEvidence).join(', ')})` : 'No evidence-ready audit found.'}`,
  ]);
}

function renderProposalOpportunitySummary(plan: DailyRevenuePlan): string {
  const ready = plan.profiles.filter(isProposalReady);
  const review = plan.profiles.filter((profile) => profile.proposalMarkdownExists || profile.proposalPdfExists);
  const needsEvidence = plan.profiles.filter((profile) => !isProposalReady(profile) || profile.researchNeeded);

  return bullets([
    `Proposal ready: ${ready.length > 0 ? ready.map((profile) => profile.companyName).join(', ') : 'None'}`,
    `Needs review: ${review.length > 0 ? review.map((profile) => profile.companyName).join(', ') : 'None'}`,
    `Needs more evidence: ${needsEvidence.length > 0 ? needsEvidence.map((profile) => profile.companyName).join(', ') : 'None'}`,
  ]);
}

function renderRevenueFocus(plan: DailyRevenuePlan): string {
  const audit = [...plan.profiles].filter(isAuditReady).sort(sortProfilesByRevenuePriority)[0];
  const starter = [...plan.profiles]
    .filter((profile) => profile.proposal?.recommendedEngagement === 'Playwright Starter Pack ($900-$1500)')
    .sort(sortProfilesByRevenuePriority)[0];
  const retainer = [...plan.profiles].sort((left, right) => {
    const leftScore = left.evidenceReadiness + left.opportunityScore + (left.proposal ? 25 : 0);
    const rightScore = right.evidenceReadiness + right.opportunityScore + (right.proposal ? 25 : 0);
    return rightScore - leftScore || left.companyName.localeCompare(right.companyName);
  })[0];

  return bullets([
    `Fastest path to first audit: ${audit ? `${audit.companyName} - review audit/proposal evidence and scope manually.` : 'No audit path found.'}`,
    `Fastest path to first starter pack: ${starter ? `${starter.companyName} - generated proposal recommends Playwright Starter Pack.` : 'No starter-pack proposal found.'}`,
    `Fastest path to first retainer: ${retainer ? `${retainer.companyName} - review audit evidence, proposal fit, and retainer path manually.` : 'No retainer path found.'}`,
  ]);
}

function buildSummaryMetrics(input: DailyRevenueLoopInput): DailyRevenueSummaryMetrics {
  return {
    leadsResearched: countFiles(path.join('output', 'research'), /-research-pack\.md$/),
    contactsAdded: input.contacts.reduce((sum, group) => sum + group.contacts.length, 0),
    outreachTracked: input.outreach.length,
    auditsGenerated: countFiles(path.join('output', 'unified-audits'), /-unified-audit\.md$/)
      + countFiles(path.join('output', 'client-audit-reports'), /-qa-audit-report\.md$/),
    proposalsGenerated: countFiles(path.join('output', 'proposals'), /-proposal\.md$/),
    evidenceCollected: countFiles(path.join('output', 'evidence'), /-evidence\.md$/)
      + countFiles(path.join('output', 'lighthouse'), /-lighthouse\.md$/)
      + countFiles(path.join('output', 'playwright-runner'), /-playwright-evidence\.md$/),
  };
}

function isProposalReady(profile: CompanyRevenueProfile): boolean {
  return profile.proposalMarkdownExists && profile.proposalPdfExists && profile.evidenceReadiness >= 90;
}

function isAuditReady(profile: CompanyRevenueProfile): boolean {
  return profile.unifiedAuditExists || profile.clientAuditMarkdownExists || profile.clientAuditPdfExists;
}

function sortProfilesByRevenuePriority(left: CompanyRevenueProfile, right: CompanyRevenueProfile): number {
  const leftScore = profileRevenueScore(left);
  const rightScore = profileRevenueScore(right);
  return rightScore - leftScore || left.companyName.localeCompare(right.companyName);
}

function profileRevenueScore(profile: CompanyRevenueProfile): number {
  let score = profile.opportunityScore + profile.evidenceReadiness;
  if (profile.repliesWaiting > 0) score += 500;
  if (profile.followUpsDue.length > 0) score += 450;
  if (isProposalReady(profile)) score += 350;
  if (isAuditReady(profile)) score += 200;
  if (profile.researchNeeded) score -= 50;
  return score;
}

function approvedImpact(profile: CompanyRevenueProfile, fallback: string): string {
  if (profile.proposal?.recommendedEngagement) return `Reviewable path to ${profile.proposal.recommendedEngagement}; no revenue is assumed.`;
  if (profile.unifiedAudit?.recommendedFirstOffer) return `Potential path to ${profile.unifiedAudit.recommendedFirstOffer}; no revenue is assumed.`;
  if (profile.opportunity?.bestFirstOffer) return `Potential path to ${profile.opportunity.bestFirstOffer}; no revenue is assumed.`;
  return fallback;
}

function isReplyWaiting(record: OutreachRecord): boolean {
  const status = record.status.toLowerCase();
  return status.includes('reply') || status.includes('replied') || status.includes('response');
}

function isFollowUpDue(record: OutreachRecord, today: string): boolean {
  return record.nextFollowUpAt !== null && record.nextFollowUpAt <= today;
}

function daysSince(dateText: string, today: string): number {
  const start = Date.parse(`${dateText}T00:00:00Z`);
  const end = Date.parse(`${today}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end)) return 0;
  return Math.max(0, Math.floor((end - start) / 86_400_000));
}

function missingEvidence(profile: CompanyRevenueProfile): string[] {
  const missing: string[] = [];
  if (!profile.evidenceExists) missing.push('Evidence report missing');
  if (!profile.lighthouseExists) missing.push('Lighthouse report missing');
  if (!profile.playwrightEvidenceExists) missing.push('Playwright evidence missing');
  if (!profile.clientAuditPdfExists) missing.push('Client audit PDF missing');
  return missing;
}

function evidenceList(profile: CompanyRevenueProfile): string[] {
  const evidence: string[] = [];
  if (profile.evidenceExists) evidence.push('Evidence');
  if (profile.lighthouseExists) evidence.push('Lighthouse');
  if (profile.playwrightEvidenceExists) evidence.push('Playwright');
  if (profile.clientAuditPdfExists) evidence.push('Client Audit PDF');
  return evidence.length > 0 ? evidence : ['No generated evidence files found'];
}

function contextSources(): DailyLoopContextSource[] {
  return [
    source('Outreach data', 'data/outreach/outreach.json'),
    source('Contact data', 'data/contacts/contacts.json'),
    source('Opportunity outputs', 'output/opportunities'),
    source('Unified audit outputs', 'output/unified-audits'),
    source('Client audit report outputs', 'output/client-audit-reports'),
    source('Proposal outputs', 'output/proposals'),
    source('Outreach tracking outputs', 'output/outreach-tracking'),
  ];
}

function source(label: string, relativePath: string): DailyLoopContextSource {
  return {
    label,
    path: relativePath,
    exists: fileExists(relativePath),
  };
}

function countFiles(relativeDir: string, pattern: RegExp): number {
  const absoluteDir = path.join(process.cwd(), relativeDir);
  if (!fs.existsSync(absoluteDir)) return 0;
  return fs.readdirSync(absoluteDir).filter((fileName) => pattern.test(fileName)).length;
}

function writeOutputs(outputs: readonly (readonly [string, string])[]): string[] {
  return outputs.map(([fileName, body]) => writeOutput(fileName, body));
}

function writeOutput(fileName: string, body: string): string {
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, fileName);
  fs.writeFileSync(outputPath, body, 'utf8');
  return outputPath;
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(process.cwd(), relativePath));
}

function defaultDailyState(): DailyRevenueState {
  return {
    version: 1,
    mode: 'local-review-only',
    lastGeneratedAt: null,
    notes: [],
  };
}

function defaultWeeklyState(): WeeklyRevenueState {
  return {
    version: 1,
    mode: 'local-review-only',
    weekStartsOn: 'Monday',
    notes: [],
  };
}

function localDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function bullets(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function yesNo(value: boolean): 'Yes' | 'No' {
  return value ? 'Yes' : 'No';
}
