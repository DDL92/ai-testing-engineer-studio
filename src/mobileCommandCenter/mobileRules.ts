import fs = require('fs');
import path = require('path');
import { buildAdaptiveRevenueReport } from '../adaptiveRevenue/adaptiveRules';
import { buildEvidenceReadinessDecision } from '../evidenceEngine/evidenceRules';
import { buildArchitectureAudit } from '../studioArchitecture/architectureRules';
import { buildTestingReportBundle } from '../testing/testingRules';
import { buildWebIntelligenceReport } from '../webIntelligence/intelligenceRules';
import { buildRunnerDashboard } from '../autonomousRunner/runnerRules';
import { buildCommercialUxView } from '../commercialUx/commercialUxRules';
import { buildPwaDashboardData, DashboardLink } from '../dashboard/dashboardDataBuilder';
import { buildFirstRevenueExecutionPack } from '../executionPack/generateFirstRevenueChecklist';
import { buildFinanceReport, loadFinanceInput } from '../financeTracking/financeRules';
import { buildLeadIntelligenceReport } from '../leadIntelligence/leadRules';
import { buildOutcomeLearningAnalysis } from '../outcomeLearning/learningRules';
import { buildOutcomeSummary, loadOutcomes } from '../outcomeTracking/outcomeRules';
import { buildRevenueActivationReport } from '../revenueActivation/revenueRules';
import { getRevenueSourceOfTruth } from '../revenueIntelligence/sourceOfTruth';
import { buildStudioConsolidationReport } from '../studioConsolidation/studioRules';
import { buildTopLeadAuditDashboard } from '../topLeadAudit/topLeadAuditRules';
import { buildWebLeadDiscoveryReport } from '../webLeadDiscovery/webDiscoveryRules';
import { buildLeadQualificationReport } from '../webLeadQualification/normalizationRules';
import { buildPainMiningReport } from '../webPainMining/painMiningRules';
import {
  MobileActionCenterItem,
  MobileCommandCenterSummary,
  MobileLink,
  MobileQueueItem,
  MobileReviewItem,
  MobileReviewPackage,
  MobileState,
} from './types';

const outputDir = path.join(process.cwd(), 'output', 'mobile');
const mobileStatePath = path.join(process.cwd(), 'data', 'mobile', 'mobile-state.json');

const safety = [
  'Read only.',
  'Review focused.',
  'Approval focused.',
  'No outreach, emails, proposals, invoices, payment requests, lead data changes, proposal data changes, APIs, credentials, or external actions are performed.',
];

const sprint82Safety = [
  'No outreach generated or sent.',
  'No emails generated or sent.',
  'No LinkedIn messages generated or sent.',
  'No meetings created.',
  'No invoices or payments created.',
  'No revenue claimed.',
  'No client interest, replies, meetings, proposals, wins, losses, or outcomes are assumed.',
  'Human approval is required before any external action.',
];

export function buildMobileCommandCenterSummary(): MobileCommandCenterSummary {
  const lead = buildLeadIntelligenceReport();
  const revenueTruth = getRevenueSourceOfTruth();
  const revenue = buildRevenueActivationReport();
  const execution = buildFirstRevenueExecutionPack();
  const finance = buildFinanceReport(loadFinanceInput());
  const outcomeRecords = loadOutcomes();
  const outcomes = buildOutcomeSummary(outcomeRecords);
  const learning = buildOutcomeLearningAnalysis();
  const adaptive = buildAdaptiveRevenueReport();
  const manualFollowUps = readJson<{ status?: string }[]>(path.join(process.cwd(), 'data', 'followups', 'followups.json'), []);
  const studio = buildStudioConsolidationReport();
  const webDiscovery = buildWebLeadDiscoveryReport();
  const leadQualification = buildLeadQualificationReport();
  const painMining = buildPainMiningReport();
  const runner = buildRunnerDashboard();
  const topLeadAudit = buildTopLeadAuditDashboard();
  const commercialUx = buildCommercialUxView();
  const architecture = buildArchitectureAudit();
  const testing = buildTestingReportBundle();
  const webIntelligence = buildWebIntelligenceReport();
  const evidenceDecision = buildEvidenceReadinessDecision();
  const today = new Date().toISOString().slice(0, 10);
  const todaysWebLeads = webDiscovery.leads.filter((item) => item.discoveryDate === today);
  const todaysPainSignals = painMining.signals.filter((item) => item.date === today);
  const bestQualifiedLead = leadQualification.topQualifiedLeads[0];
  const highestQaOpportunity = [...leadQualification.topQualifiedLeads].sort((left, right) => right.qaOpportunityScore - left.qaOpportunityScore || right.qualificationScore - left.qualificationScore)[0];
  const topLead = lead.leads[0];
  const studioHealth = studio.modules.some((module) => module.status === 'Not Ready')
    ? 'Not Ready'
    : studio.modules.some((module) => module.status === 'Warning') ? 'Warning' : 'Healthy';
  const revenueStatus = finance.currentMrr > 0
    ? `Current MRR: ${formatCurrency(finance.currentMrr)} from local finance data.`
    : 'Current MRR: $0';
  const topAction = revenueTruth.nextAction || (topLead ? mobileActionFor(topLead.companyName, execution.recommendation) : 'Run npm run lead:intelligence to refresh lead focus.');
  const topLeadName = revenueTruth.topLead;
  const actionableLeadName = revenueTruth.actionableLead;
  const topOffer = revenueTruth.recommendedOffer;
  const studioStatus = studioHealth === 'Healthy'
    ? 'Healthy'
    : studioHealth === 'Warning' ? 'Operational with warnings' : 'Needs Review';

  return {
    generatedAt: new Date().toISOString(),
    topLead: topLeadName,
    actionableLead: actionableLeadName,
    commercialReadiness: revenueTruth.commercialReadiness,
    topOffer,
    topAction,
    estimatedTime: execution.recommendation === 'GO' ? '20 minutes' : '30-60 minutes',
    decisionNeeded: execution.recommendation === 'GO' ? 'SEND / WAIT / REWRITE' : 'RESOLVE BLOCKERS / WAIT / REWRITE',
    followUpsWaiting: outcomeRecords.filter((record) => record.response_status === 'sent' || record.response_status === 'no_reply').length,
    openOpportunities: Math.max(revenue.pipeline.length, manualFollowUps.filter((item) => item.status !== 'Closed Won' && item.status !== 'Closed Lost' && item.status !== 'Paused').length),
    studioStatus,
    revenueStatus,
    todayAtAGlance: [
      `Top Lead: ${topLeadName}`,
      `Actionable Lead: ${actionableLeadName}`,
      `Commercial Readiness: ${revenueTruth.commercialReadiness}`,
      `Top Offer: ${topOffer}`,
      `Action: ${topAction}`,
      `MRR: ${formatCurrency(finance.currentMrr)}`,
      `Studio Health: ${studioHealth}`,
    ].join(' | '),
    currentMrr: finance.currentMrr,
    firstClientStatus: `${revenueTruth.topLead}: ${revenueTruth.revenueDecision}`,
    revenueActivationReadiness: revenue.pipeline[0]
      ? `${revenue.pipeline[0].companyName} activation score ${revenue.pipeline[0].activationScore}/100`
      : 'No revenue activation target found',
    bestAction: topAction,
    studioHealth,
    revenueHealth: revenueStatus,
    nextManualStep: revenueTruth.nextAction,
    outcomeStatus: outcomes.hasOutcomes ? `${outcomes.totalRecords} outcome record(s)` : 'No outcomes recorded yet.',
    todaysDiscoveredLeads: todaysWebLeads.length > 0
      ? todaysWebLeads.slice(0, 3).map((item) => item.companyName).join(', ')
      : 'No web leads discovered today.',
    topPainSignal: painMining.topSignal
      ? `Potential recurring pain signal: ${painMining.topSignal.category} for ${painMining.topSignal.companyName}`
      : 'No pain signals recorded.',
    bestOpportunity: webDiscovery.topLead
      ? `${webDiscovery.topLead.companyName} (${webDiscovery.topLead.score}/100)`
      : 'No web opportunity recorded.',
    bestQualifiedLead: bestQualifiedLead?.normalizedName ?? 'No qualified web lead.',
    topQualifiedLeads: leadQualification.topQualifiedLeads.length > 0
      ? leadQualification.topQualifiedLeads.slice(0, 3).map((item) => item.normalizedName).join(', ')
      : 'No qualified web leads.',
    bestQualifiedOffer: bestQualifiedLead?.recommendedOffer ?? 'No qualified offer.',
    highestQaOpportunity: highestQaOpportunity
      ? `${highestQaOpportunity.normalizedName} (${highestQaOpportunity.qaOpportunityScore}/100)`
      : 'No QA opportunity scored.',
    lastRefresh: runner.lastSuccessfulRun,
    newLeadsToday: String(todaysWebLeads.length),
    newPainSignals: String(todaysPainSignals.length),
    topQualifiedLead: bestQualifiedLead?.normalizedName ?? 'No qualified web lead.',
    todaysRecommendedAction: topAction,
    currentTopLead: topLeadName,
    auditStatus: topLeadAudit.topLeadAuditStatus,
    topLeadAuditStatus: topLeadAudit.topLeadAuditStatus,
    topLeadExecutionReadiness: topLeadAudit.executionReadiness,
    learningStatus: learning.hasOutcomes ? `${learning.totalOutcomes} outcome(s) recorded` : 'No outcomes recorded yet.',
    learningReplyRate: learning.hasOutcomes ? `${learning.overall.replyRate}%` : 'No outcomes recorded yet.',
    learningBestOffer: learning.topPerformingOffer,
    learningBestLeadType: learning.topPerformingCategory,
    adaptiveLearningInfluence: `${adaptive.weights.learningWeight}%`,
    adaptiveBestCategory: adaptive.bestPerformingCategory,
    adaptiveBestOffer: adaptive.bestPerformingOffer,
    adaptiveRecommendation: adaptive.adaptiveRecommendation,
    nextRevenueAction: revenueTruth.nextAction,
    executionPriority: revenueTruth.executionPriority,
    commercialTarget: commercialUx.today.topLead,
    commercialOffer: commercialUx.today.offerLabel,
    commercialPotentialValue: commercialUx.today.potentialValue,
    commercialPriority: commercialUx.today.executionPriority,
    commercialDecision: commercialUx.today.revenueDecision,
    commercialAction: commercialUx.today.nextAction,
    architectureStatus: architecture.architectureStatus,
    commandHealth: architecture.commandHealth,
    runtimeHealth: architecture.runtimeHealth,
    consolidationProgress: architecture.consolidationProgress,
    testingStatus: testing.readiness.testingStatus,
    qualityGateStatus: testing.readiness.qualityGateStatus,
    ciStatus: testing.readiness.ciStatus,
    intelligenceStatus: webIntelligence.readiness.status,
    companyConfidence: `${webIntelligence.readiness.companyConfidence}/100`,
    evidenceConfidence: `${webIntelligence.readiness.evidenceConfidence}/100`,
    evidenceStatus: evidenceDecision.evidenceStatus,
    readinessStatus: evidenceDecision.status,
    lighthouseStatus: evidenceDecision.lighthouseStatus,
    safetyRules: sprint82Safety,
  };
}

export function buildMobileActionCenter(summary = buildMobileCommandCenterSummary()): MobileActionCenterItem[] {
  return [
    {
      priority: 1,
      action: summary.topAction,
      why: `${summary.topLead} is the current best lead from local Studio data. Best qualified web lead: ${summary.bestQualifiedLead}. Highest QA opportunity: ${summary.highestQaOpportunity}.`,
      manualStep: summary.nextManualStep,
    },
    {
      priority: 2,
      action: 'Review revenue focus and daily plan.',
      why: `Keeps the first-client workflow aligned before any manual external action. Top pain signal: ${summary.topPainSignal}.`,
      manualStep: 'Run npm run revenue:focus and npm run day:plan, then compare with the mobile Today View.',
    },
    {
      priority: 3,
      action: 'Record only real outcomes after manual action.',
      why: summary.outcomeStatus,
      manualStep: 'If Daniel manually sends a message outside Studio, record the actual result with npm run outcome:add.',
    },
  ];
}

export function writeMobileTodayView(summary: MobileCommandCenterSummary): string {
  return writeOutput('today.md', renderMobileTodayView(summary));
}

export function writeMobileRevenueView(summary: MobileCommandCenterSummary): string {
  return writeOutput('revenue.md', renderMobileRevenueView(summary));
}

export function writeMobilePipelineView(summary: MobileCommandCenterSummary): string {
  return writeOutput('pipeline.md', renderMobilePipelineView(summary));
}

export function writeMobileActionCenter(summary: MobileCommandCenterSummary): string {
  return writeOutput('action-center.md', renderMobileActionCenter(summary, buildMobileActionCenter(summary)));
}

export function writeSprint82MobileSummary(summary: MobileCommandCenterSummary): string {
  return writeOutput('mobile-summary.md', renderSprint82MobileSummary(summary));
}

export function renderMobileTodayView(summary: MobileCommandCenterSummary): string {
  return [
    '# Revenue Command Center',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    '## TODAY',
    '',
    renderSimpleLines([
      `Target: ${summary.commercialTarget}`,
      `Offer: ${summary.commercialOffer}`,
      `Potential Value: ${summary.commercialPotentialValue}`,
      `Priority: ${summary.commercialPriority}`,
      `Decision: ${summary.commercialDecision}`,
    ]),
    '',
    '## NEXT ACTION',
    '',
    summary.commercialAction,
    '',
    '## DISCOVERY SNAPSHOT',
    '',
    renderSimpleLines([
      `New Leads Today: ${summary.newLeadsToday}`,
      `New Pain Signals: ${summary.newPainSignals}`,
      `Qualified Leads: ${summary.topQualifiedLeads}`,
    ]),
    '',
    '## SYSTEM HEALTH',
    '',
    renderSimpleLines([
      `Last Refresh: ${summary.lastRefresh}`,
      `Studio Health: ${summary.studioHealth}`,
      `Runtime Health: ${summary.runtimeHealth}`,
      `Architecture Status: ${summary.architectureStatus}`,
      `Testing Status: ${summary.testingStatus}`,
      `Quality Gate Status: ${summary.qualityGateStatus}`,
      `CI Status: ${summary.ciStatus}`,
      `Intelligence Status: ${summary.intelligenceStatus}`,
      `Company Confidence: ${summary.companyConfidence}`,
      `Evidence Confidence: ${summary.evidenceConfidence}`,
      `Evidence Status: ${summary.evidenceStatus}`,
      `Readiness Status: ${summary.readinessStatus}`,
      `Lighthouse Status: ${summary.lighthouseStatus}`,
      `Execution Readiness: ${summary.topLeadExecutionReadiness}`,
    ]),
    '',
    '## Safety Rules',
    bullets(summary.safetyRules),
    '',
  ].join('\n');
}

export function renderMobileRevenueView(summary: MobileCommandCenterSummary): string {
  return [
    '# Revenue View',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    renderSimpleLines([
      `Current MRR: ${formatCurrency(summary.currentMrr)}`,
      `Revenue Status: ${summary.revenueStatus}`,
      `First Client Status: ${summary.firstClientStatus}`,
      `Revenue Activation Readiness: ${summary.revenueActivationReadiness}`,
    ]),
    '',
    '## Boundary',
    bullets([
      'Future revenue is not estimated here.',
      'Offer ranges, pipeline, and recommendations are not booked revenue.',
    ]),
    '',
    '## Safety Rules',
    bullets(summary.safetyRules),
    '',
  ].join('\n');
}

export function renderMobilePipelineView(summary: MobileCommandCenterSummary): string {
  return [
    '# Pipeline View',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    renderSimpleLines([
      `Top Lead: ${summary.topLead}`,
      `Actionable Lead: ${summary.actionableLead}`,
      `Commercial Readiness: ${summary.commercialReadiness}`,
      `Top Offer: ${summary.topOffer}`,
      `Follow Ups Waiting: ${summary.followUpsWaiting}`,
      `Open Opportunities: ${summary.openOpportunities}`,
      `Today\'s Discovered Leads: ${summary.todaysDiscoveredLeads}`,
      `Top Pain Signal: ${summary.topPainSignal}`,
      `Best Opportunity: ${summary.bestOpportunity}`,
      `Best Qualified Lead: ${summary.bestQualifiedLead}`,
      `Top 3 Qualified Leads: ${summary.topQualifiedLeads}`,
      `Best Offer: ${summary.bestQualifiedOffer}`,
      `Highest QA Opportunity: ${summary.highestQaOpportunity}`,
      `Last Refresh: ${summary.lastRefresh}`,
      `New Leads Today: ${summary.newLeadsToday}`,
      `New Pain Signals: ${summary.newPainSignals}`,
      `Top Qualified Lead: ${summary.topQualifiedLead}`,
      `Today\'s Recommended Action: ${summary.todaysRecommendedAction}`,
      `Current Top Lead: ${summary.currentTopLead}`,
      `Actionable Lead: ${summary.actionableLead}`,
      `Commercial Readiness: ${summary.commercialReadiness}`,
      `Audit Status: ${summary.auditStatus}`,
      `Execution Readiness: ${summary.topLeadExecutionReadiness}`,
      `Learning Status: ${summary.learningStatus}`,
      `Reply Rate: ${summary.learningReplyRate}`,
      `Best Offer: ${summary.learningBestOffer}`,
      `Best Lead Type: ${summary.learningBestLeadType}`,
      `Learning Influence: ${summary.adaptiveLearningInfluence}`,
      `Best Category: ${summary.adaptiveBestCategory}`,
      `Best Offer: ${summary.adaptiveBestOffer}`,
      `Adaptive Recommendation: ${summary.adaptiveRecommendation}`,
      `Recommended Offer: ${summary.topOffer}`,
      `Next Revenue Action: ${summary.nextRevenueAction}`,
      `Execution Priority: ${summary.executionPriority}`,
      `Outcome Status: ${summary.outcomeStatus}`,
      `Next Manual Step: ${summary.nextManualStep}`,
    ]),
    '',
    '## Notes',
    bullets([
      'Pipeline view uses existing lead, follow-up, and outcome data only.',
      'No replies, meetings, proposals, wins, losses, or revenue are inferred.',
    ]),
    '',
    '## Safety Rules',
    bullets(summary.safetyRules),
    '',
  ].join('\n');
}

export function renderMobileActionCenter(summary: MobileCommandCenterSummary, actions: MobileActionCenterItem[]): string {
  return [
    '# Action Center',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    renderSimpleLines([
      `Best Qualified Lead: ${summary.bestQualifiedLead}`,
      `Top 3 Qualified Leads: ${summary.topQualifiedLeads}`,
      `Best Offer: ${summary.bestQualifiedOffer}`,
      `Highest QA Opportunity: ${summary.highestQaOpportunity}`,
      `Last Refresh: ${summary.lastRefresh}`,
      `New Leads Today: ${summary.newLeadsToday}`,
      `New Pain Signals: ${summary.newPainSignals}`,
      `Top Qualified Lead: ${summary.topQualifiedLead}`,
      `Today\'s Recommended Action: ${summary.todaysRecommendedAction}`,
      `Current Top Lead: ${summary.currentTopLead}`,
      `Audit Status: ${summary.auditStatus}`,
      `Execution Readiness: ${summary.topLeadExecutionReadiness}`,
      `Learning Status: ${summary.learningStatus}`,
      `Reply Rate: ${summary.learningReplyRate}`,
      `Best Offer: ${summary.learningBestOffer}`,
      `Best Lead Type: ${summary.learningBestLeadType}`,
      `Learning Influence: ${summary.adaptiveLearningInfluence}`,
      `Best Category: ${summary.adaptiveBestCategory}`,
      `Best Offer: ${summary.adaptiveBestOffer}`,
      `Adaptive Recommendation: ${summary.adaptiveRecommendation}`,
      `Recommended Offer: ${summary.topOffer}`,
      `Next Revenue Action: ${summary.nextRevenueAction}`,
      `Execution Priority: ${summary.executionPriority}`,
    ]),
    '',
    ...actions.slice(0, 3).flatMap((action) => [
      `## Priority #${action.priority}`,
      '',
      renderSimpleLines([
        `Action: ${action.action}`,
        `Why: ${action.why}`,
        `Manual Step: ${action.manualStep}`,
      ]),
      '',
    ]),
    '## Safety Rules',
    bullets(summary.safetyRules),
    '',
  ].join('\n');
}

export function renderSprint82MobileSummary(summary: MobileCommandCenterSummary): string {
  return [
    '# Revenue Command Center',
    '',
    `Generated: ${summary.generatedAt}`,
    '',
    '## TODAY',
    '',
    renderSimpleLines([
      `Target: ${summary.commercialTarget}`,
      `Offer: ${summary.commercialOffer}`,
      `Potential Value: ${summary.commercialPotentialValue}`,
      `Priority: ${summary.commercialPriority}`,
      `Decision: ${summary.commercialDecision}`,
    ]),
    '',
    '## NEXT ACTION',
    '',
    summary.commercialAction,
    '',
    '## DISCOVERY SNAPSHOT',
    '',
    renderSimpleLines([
      `New Leads Today: ${summary.newLeadsToday}`,
      `New Pain Signals: ${summary.newPainSignals}`,
      `Qualified Leads: ${summary.topQualifiedLeads}`,
    ]),
    '',
    '## SYSTEM HEALTH',
    '',
    renderSimpleLines([
      `Last Refresh: ${summary.lastRefresh}`,
      `Studio Health: ${summary.studioHealth}`,
      `Execution Readiness: ${summary.topLeadExecutionReadiness}`,
    ]),
    '',
    '## Below The Fold',
    '',
    renderSimpleLines([
      `Best Lead: ${summary.topLead}`,
      `Actionable Lead: ${summary.actionableLead}`,
      `Commercial Readiness: ${summary.commercialReadiness}`,
      `Best Offer: ${summary.topOffer}`,
      `Best Action: ${summary.bestAction}`,
      `Today\'s Discovered Leads: ${summary.todaysDiscoveredLeads}`,
      `Top Pain Signal: ${summary.topPainSignal}`,
      `Best Opportunity: ${summary.bestOpportunity}`,
      `Best Qualified Lead: ${summary.bestQualifiedLead}`,
      `Top 3 Qualified Leads: ${summary.topQualifiedLeads}`,
      `Best Offer: ${summary.bestQualifiedOffer}`,
      `Highest QA Opportunity: ${summary.highestQaOpportunity}`,
      `Last Refresh: ${summary.lastRefresh}`,
      `New Leads Today: ${summary.newLeadsToday}`,
      `New Pain Signals: ${summary.newPainSignals}`,
      `Top Qualified Lead: ${summary.topQualifiedLead}`,
      `Today\'s Recommended Action: ${summary.todaysRecommendedAction}`,
      `Current Top Lead: ${summary.currentTopLead}`,
      `Actionable Lead: ${summary.actionableLead}`,
      `Commercial Readiness: ${summary.commercialReadiness}`,
      `Audit Status: ${summary.auditStatus}`,
      `Execution Readiness: ${summary.topLeadExecutionReadiness}`,
      `Learning Status: ${summary.learningStatus}`,
      `Reply Rate: ${summary.learningReplyRate}`,
      `Best Offer: ${summary.learningBestOffer}`,
      `Best Lead Type: ${summary.learningBestLeadType}`,
      `Learning Influence: ${summary.adaptiveLearningInfluence}`,
      `Best Category: ${summary.adaptiveBestCategory}`,
      `Best Offer: ${summary.adaptiveBestOffer}`,
      `Adaptive Recommendation: ${summary.adaptiveRecommendation}`,
      `Recommended Offer: ${summary.topOffer}`,
      `Next Revenue Action: ${summary.nextRevenueAction}`,
      `Execution Priority: ${summary.executionPriority}`,
      `Studio Health: ${summary.studioHealth}`,
      `Runtime Health: ${summary.runtimeHealth}`,
      `Architecture Status: ${summary.architectureStatus}`,
      `Command Health: ${summary.commandHealth}`,
      `Testing Status: ${summary.testingStatus}`,
      `Quality Gate Status: ${summary.qualityGateStatus}`,
      `CI Status: ${summary.ciStatus}`,
      `Intelligence Status: ${summary.intelligenceStatus}`,
      `Company Confidence: ${summary.companyConfidence}`,
      `Evidence Confidence: ${summary.evidenceConfidence}`,
      `Evidence Status: ${summary.evidenceStatus}`,
      `Readiness Status: ${summary.readinessStatus}`,
      `Lighthouse Status: ${summary.lighthouseStatus}`,
      `Revenue Health: ${summary.revenueHealth}`,
      `Next Manual Step: ${summary.nextManualStep}`,
    ]),
    '',
    '## Safety Rules',
    bullets(summary.safetyRules),
    '',
  ].join('\n');
}

export function buildMobileReviewPackage(): MobileReviewPackage {
  const dashboard = buildPwaDashboardData();
  const center = dashboard.mobileCommandCenter;

  return {
    generatedAt: dashboard.generatedAt,
    mode: 'read-only-review',
    reviewCenter: [
      item('Studio Health', dashboard.studio.studioHealth),
      item('Runtime Health', dashboard.architecture.runtimeHealth),
      item('Architecture Status', dashboard.architecture.architectureStatus),
      item('Command Health', dashboard.architecture.commandHealth),
      item('Testing Status', dashboard.testing.testingStatus),
      item('Quality Gate Status', dashboard.testing.qualityGateStatus),
      item('CI Status', dashboard.testing.ciStatus),
      item('Actionable Lead', dashboard.revenueIntelligence.actionableLead),
      item('Commercial Readiness', dashboard.revenueIntelligence.commercialReadiness),
      item('Intelligence Status', dashboard.webIntelligence.intelligenceQuality),
      item('Company Confidence', dashboard.webIntelligence.companyConfidence),
      item('Evidence Confidence', dashboard.webIntelligence.evidenceConfidence),
      item('Evidence Status', dashboard.evidenceEngine.evidenceStatus),
      item('Readiness Status', dashboard.evidenceEngine.readinessStatus),
      item('Lighthouse Status', dashboard.evidenceEngine.lighthouseStatus),
      item('Audits Ready', String(center.reviewCenter.auditsReady), center.auditCenter.links),
      item('Proposals Ready', String(center.reviewCenter.proposalsReady), center.proposalCenter.proposalPdfs),
      item('Evidence Ready', String(center.reviewCenter.evidenceReady), center.auditCenter.links.filter((link) => link.href.includes('/evidence/') || link.href.includes('/lighthouse/') || link.href.includes('/playwright-runner/'))),
      item('Follow-Ups Ready', String(center.reviewCenter.followUpsReady), center.followUpCenter.links),
    ],
    revenueCenter: [
      item('Best Audit Opportunity', center.revenueCenter.bestAuditOpportunity),
      item('Best Starter Pack Opportunity', center.revenueCenter.bestStarterPackOpportunity),
      item('Best Retainer Opportunity', center.revenueCenter.bestRetainerOpportunity),
      item('Highest Revenue Priority', center.revenueCenter.highestRevenuePriority),
    ],
    actionQueue: center.actionQueue.map((action) => ({
      priority: action.priority,
      title: action.title,
      reason: action.whyItMatters,
      impact: action.estimatedImpact,
      recommendedAction: action.nextStep,
    })),
    auditCenter: [
      item('Audit Reports Available', String(center.auditCenter.auditReportsAvailable), center.auditCenter.links.filter((link) => link.href.includes('/client-audit-reports/'))),
      item('Unified Audits Available', String(center.auditCenter.unifiedAuditsAvailable), center.auditCenter.links.filter((link) => link.href.includes('/unified-audits/'))),
      item('Evidence Available', String(center.auditCenter.evidenceAvailable), center.auditCenter.links.filter((link) => link.href.includes('/evidence/') || link.href.includes('/lighthouse/') || link.href.includes('/playwright-runner/'))),
      item('Audit Readiness', center.auditCenter.auditReadiness, center.auditCenter.links),
    ],
    proposalCenter: [
      item('Proposal PDFs', center.proposalCenter.proposalPdfs.length > 0 ? `${center.proposalCenter.proposalPdfs.length} files` : 'None', center.proposalCenter.proposalPdfs),
      item('Proposal Status', center.proposalCenter.proposalStatus.join(' | ') || 'None'),
      item('Retainer Candidates', center.proposalCenter.retainerCandidates.join(' | ') || 'None'),
    ],
    followUpCenter: [
      item('Follow-Ups Due', String(center.followUpCenter.followUpsDue), center.followUpCenter.links),
      item('Outreach Status', center.followUpCenter.outreachStatus, center.followUpCenter.links),
      item('Contact Status', center.followUpCenter.contactStatus, center.followUpCenter.links),
    ],
    safety,
  };
}

export function writeMobileReviewOutputs(review: MobileReviewPackage): string[] {
  const outputs = [
    ['mobile-review.md', renderMobileReview(review)],
    ['mobile-summary.md', renderMobileSummary(review)],
    ['mobile-queue.md', renderMobileQueue(review)],
    ['mobile-priorities.md', renderMobilePriorities(review)],
    ['mobile-health.md', renderMobileHealth(review)],
  ] as const;
  updateMobileState(review.generatedAt);
  return outputs.map(([fileName, body]) => writeOutput(fileName, body));
}

export function writeMobileSummaryOutput(review: MobileReviewPackage): string {
  updateMobileState(review.generatedAt);
  return writeOutput('mobile-summary.md', renderMobileSummary(review));
}

export function writeMobileQueueOutput(review: MobileReviewPackage): string {
  updateMobileState(review.generatedAt);
  return writeOutput('mobile-queue.md', renderMobileQueue(review));
}

export function renderMobileReview(review: MobileReviewPackage): string {
  return `# Mobile Review

Generated: ${review.generatedAt}

## Review Center

${renderItems(review.reviewCenter)}

## Revenue Center

${renderItems(review.revenueCenter)}

## Action Queue

${renderQueue(review.actionQueue)}

## Audit Center

${renderItems(review.auditCenter)}

## Proposal Center

${renderItems(review.proposalCenter)}

## Follow-Up Center

${renderItems(review.followUpCenter)}

## Safety

${bullets(review.safety)}
`;
}

export function renderMobileSummary(review: MobileReviewPackage): string {
  return `# Mobile Summary

Generated: ${review.generatedAt}

## 20-Second View

${bullets([
    `Top Priority: ${review.actionQueue[0]?.title ?? 'No priority found'}`,
    `Best Audit Opportunity: ${valueFor(review.revenueCenter, 'Best Audit Opportunity')}`,
    `Best Starter Pack Opportunity: ${valueFor(review.revenueCenter, 'Best Starter Pack Opportunity')}`,
    `Best Retainer Opportunity: ${valueFor(review.revenueCenter, 'Best Retainer Opportunity')}`,
    `Follow-Ups Due: ${valueFor(review.followUpCenter, 'Follow-Ups Due')}`,
    `Proposal PDFs: ${valueFor(review.proposalCenter, 'Proposal PDFs')}`,
    `Studio Health: ${valueFor(review.reviewCenter, 'Studio Health')}`,
    `Runtime Health: ${valueFor(review.reviewCenter, 'Runtime Health')}`,
    `Architecture Status: ${valueFor(review.reviewCenter, 'Architecture Status')}`,
    `Testing Status: ${valueFor(review.reviewCenter, 'Testing Status')}`,
    `Quality Gate Status: ${valueFor(review.reviewCenter, 'Quality Gate Status')}`,
    `CI Status: ${valueFor(review.reviewCenter, 'CI Status')}`,
    `Actionable Lead: ${valueFor(review.reviewCenter, 'Actionable Lead')}`,
    `Commercial Readiness: ${valueFor(review.reviewCenter, 'Commercial Readiness')}`,
    `Intelligence Status: ${valueFor(review.reviewCenter, 'Intelligence Status')}`,
    `Company Confidence: ${valueFor(review.reviewCenter, 'Company Confidence')}`,
    `Evidence Confidence: ${valueFor(review.reviewCenter, 'Evidence Confidence')}`,
    `Evidence Status: ${valueFor(review.reviewCenter, 'Evidence Status')}`,
    `Readiness Status: ${valueFor(review.reviewCenter, 'Readiness Status')}`,
    `Lighthouse Status: ${valueFor(review.reviewCenter, 'Lighthouse Status')}`,
  ])}

## Safety

${bullets(review.safety)}
`;
}

export function renderMobileQueue(review: MobileReviewPackage): string {
  return `# Mobile Action Queue

Generated: ${review.generatedAt}

${renderQueue(review.actionQueue)}

## Safety

${bullets(review.safety)}
`;
}

export function renderMobilePriorities(review: MobileReviewPackage): string {
  return `# Mobile Priorities

Generated: ${review.generatedAt}

## Revenue Priorities

${renderItems(review.revenueCenter)}

## Review Priorities

${renderItems(review.reviewCenter)}

## Top Actions

${renderQueue(review.actionQueue.slice(0, 5))}
`;
}

export function renderMobileHealth(review: MobileReviewPackage): string {
  return `# Mobile Health

Generated: ${review.generatedAt}

${bullets([
    'Mobile review package generated.',
    `Action Queue Items: ${review.actionQueue.length}`,
    `Audit Links: ${review.auditCenter.reduce((sum, item) => sum + item.links.length, 0)}`,
    `Proposal Links: ${review.proposalCenter.reduce((sum, item) => sum + item.links.length, 0)}`,
    `Follow-Up Links: ${review.followUpCenter.reduce((sum, item) => sum + item.links.length, 0)}`,
    'Status: Read-only review mode.',
  ])}

## Safety

${bullets(review.safety)}
`;
}

function item(label: string, value: string, links: DashboardLink[] = []): MobileReviewItem {
  return {
    label,
    value,
    links: links.map((link) => ({ label: link.label, href: link.href })),
  };
}

function renderItems(items: MobileReviewItem[]): string {
  return items.map((reviewItem) => `### ${reviewItem.label}

${bullets([
    `Status: ${reviewItem.value}`,
    `Links: ${reviewItem.links.length > 0 ? '' : 'None available'}`,
  ])}
${renderLinks(reviewItem.links)}`).join('\n\n');
}

function renderQueue(queue: MobileQueueItem[]): string {
  if (queue.length === 0) return '- No mobile actions found.';
  return queue.map((action) => `### Priority ${action.priority}

${bullets([
    `Action: ${action.title}`,
    `Reason: ${action.reason}`,
    `Impact: ${action.impact}`,
    `Recommended Action: ${action.recommendedAction}`,
  ])}`).join('\n\n');
}

function renderLinks(links: MobileLink[]): string {
  if (links.length === 0) return '';
  return links.map((link) => `- [${link.label}](${mobileReportHref(link.href)})`).join('\n');
}

function mobileReportHref(href: string): string {
  if (href.startsWith('../output/')) return `../${href.slice('../output/'.length)}`;
  return href;
}

function valueFor(items: MobileReviewItem[], label: string): string {
  return items.find((item) => item.label === label)?.value ?? 'Not available';
}

function writeOutput(fileName: string, body: string): string {
  fs.mkdirSync(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, fileName);
  fs.writeFileSync(outputPath, body, 'utf8');
  return outputPath;
}

function updateMobileState(generatedAt: string): void {
  fs.mkdirSync(path.dirname(mobileStatePath), { recursive: true });
  const current = readJson<MobileState>(mobileStatePath, {
    version: 1,
    mode: 'read-only-review',
    lastGeneratedAt: null,
    notes: [],
  });
  fs.writeFileSync(mobileStatePath, `${JSON.stringify({ ...current, lastGeneratedAt: generatedAt }, null, 2)}\n`, 'utf8');
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

function bullets(items: string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function renderSimpleLines(lines: string[]): string {
  return lines.map((line) => `- ${line}`).join('\n');
}

function formatCurrency(value: number): string {
  return `$${value.toLocaleString('en-US')}`;
}

function mobileActionFor(companyName: string, recommendation: string): string {
  if (recommendation === 'GO') {
    return `Review ${companyName} message pack, executive summary, audit PDF, and proposal PDF; decide SEND / WAIT / REWRITE manually.`;
  }

  return `Resolve ${companyName} first-client readiness blockers before any manual outreach decision.`;
}
