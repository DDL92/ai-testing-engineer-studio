import fs = require('fs');
import path = require('path');
import { buildAdaptiveRevenueDashboard, buildAdaptiveRevenueReport } from '../adaptiveRevenue/adaptiveRules';
import { buildAutomationDeliveryDashboard } from '../automationDelivery/automationRules';
import { buildClientConversionDashboard } from '../clientConversion/conversionRules';
import { buildDeliveryRouterDashboard } from '../deliveryRouter/routerRules';
import { buildRetainerOperationsDashboard } from '../retainerOperations/retainerRules';
import { buildRevenueLearningDashboard } from '../revenueLearning/learningRules';
import { buildDynamicEvidenceSummary, buildEvidenceReadinessDecision } from '../evidenceEngine/evidenceRules';
import { buildArchitectureAudit } from '../studioArchitecture/architectureRules';
import { buildTestingReportBundle } from '../testing/testingRules';
import { buildWebIntelligenceReport } from '../webIntelligence/intelligenceRules';
import {
  buildDailyRevenuePlan,
  buildDailyRevenueSummary,
  buildWeeklyRevenueReview,
  loadDailyRevenueLoopInput,
} from '../dailyRevenueLoop/dailyLoopRules';
import { buildRunnerDashboard } from '../autonomousRunner/runnerRules';
import { buildCommercialUxDashboard } from '../commercialUx/commercialUxRules';
import { buildDailyLeadDiscoveryDashboard } from '../dailyLeadDiscovery/discoveryRules';
import { buildLeadIntelligenceReport } from '../leadIntelligence/leadRules';
import { buildOperatorUxSummary } from '../operatorUx/uxRules';
import { buildOpportunitySummary } from '../opportunityEngine/opportunityEngineRules';
import { OpportunityReport } from '../opportunityEngine/types';
import { buildOutcomeLearningAnalysis, buildOutcomeLearningDashboard } from '../outcomeLearning/learningRules';
import { buildFirstRevenueExecutionPack } from '../executionPack/generateFirstRevenueChecklist';
import { buildFollowUpOperatingReport } from '../followUpEngine/followUpRules';
import { buildOutcomeSummary, loadOutcomes } from '../outcomeTracking/outcomeRules';
import { buildProposalPortfolio } from '../proposalEngine/proposalRules';
import { ProposalPackage } from '../proposalEngine/types';
import { buildRevenueActivationReport } from '../revenueActivation/revenueRules';
import { buildRevenueIntelligenceDashboard, buildRevenueIntelligenceReport } from '../revenueIntelligence/revenueIntelligenceRules';
import { getRevenueSourceOfTruth } from '../revenueIntelligence/sourceOfTruth';
import { buildStudioConsolidationReport } from '../studioConsolidation/studioRules';
import { readSnapshotState } from '../studioSnapshot/snapshotRules';
import { buildTopLeadAuditDashboard } from '../topLeadAudit/topLeadAuditRules';
import { buildUnifiedAuditPortfolio } from '../unifiedAuditGenerator/unifiedAuditRules';
import { buildWebDiscoveryDashboard } from '../webLeadDiscovery/webDiscoveryRules';
import { buildLeadQualificationDashboard } from '../webLeadQualification/normalizationRules';
import { buildPainMiningDashboard, buildPainMiningReport } from '../webPainMining/painMiningRules';
import { buildWinLossReport } from '../winLossEngine/winLossRules';

export interface DashboardActionCard {
  priority: number;
  title: string;
  whyItMatters: string;
  estimatedImpact: string;
  nextStep: string;
}

export interface DashboardCompanyScore {
  companyId: string;
  companyName: string;
  score: number;
  detail: string;
}

export interface DashboardLink {
  label: string;
  href: string;
}

export interface DashboardMobileCenter {
  reviewCenter: {
    auditsReady: number;
    proposalsReady: number;
    evidenceReady: number;
    followUpsReady: number;
  };
  revenueCenter: {
    bestAuditOpportunity: string;
    bestStarterPackOpportunity: string;
    bestRetainerOpportunity: string;
    highestRevenuePriority: string;
  };
  actionQueue: DashboardActionCard[];
  auditCenter: {
    auditReportsAvailable: number;
    unifiedAuditsAvailable: number;
    evidenceAvailable: number;
    auditReadiness: string;
    links: DashboardLink[];
  };
  proposalCenter: {
    proposalPdfs: DashboardLink[];
    proposalStatus: string[];
    retainerCandidates: string[];
  };
  followUpCenter: {
    followUpsDue: number;
    outreachStatus: string;
    contactStatus: string;
    links: DashboardLink[];
  };
}

export interface DashboardStudioStatus {
  studioHealth: string;
  releaseReadiness: string;
  systemStatus: string;
  criticalIssues: number;
  warnings: number;
  currentMrr: number;
  readyForOutreach: string;
  readyForAuditSales: string;
  readyForRetainers: string;
  readyForClientDelivery: string;
}

export interface DashboardRevenueActivation {
  revenueActivation: string;
  firstClientGoal: string;
  firstRetainerGoal: string;
  topRevenueTarget: string;
  topRevenueAction: string;
  topActivationScore: number;
}

export interface DashboardExecutionPack {
  firstRevenueStatus: string;
  goNoGo: string;
  remainingBlockers: number;
  nextManualAction: string;
  estimatedRevenueValue: string;
  estimatedConfidenceScore: number;
}

export interface DashboardOutcomeTracking {
  status: string;
  messagesSent: number;
  replies: number;
  meetings: number;
  proposals: number;
  wins: number;
  losses: number;
  replyRate: string;
  nextManualMessage: string;
}

export interface DashboardOutcomeLearning {
  outcomesRecorded: number;
  replyRate: string;
  proposalRate: string;
  winRate: string;
  topPerformingOffer: string;
}

export interface DashboardAdaptiveRevenue {
  adaptiveLearningStatus: string;
  bestPerformingCategory: string;
  bestPerformingOffer: string;
  learningInfluence: string;
}

export interface DashboardRevenueLearning {
  revenueLearningStatus: string;
  outcomesRecorded: number;
  bestChannel: string;
  bestOffer: string;
  bestIndustry: string;
  calibrationStatus: string;
  recommendationConfidence: string;
}

export interface DashboardFollowUpEngine {
  followUpQueue: number;
  todaysFollowUps: number;
  waitingResponses: number;
  openOpportunities: number;
  nextBestAction: string;
}

export interface DashboardWinLossIntelligence {
  winRate: string;
  replyRate: string;
  bestOffer: string;
  bestSegment: string;
  topLearning: string;
  topRecommendation: string;
}

export interface DashboardStudioSnapshot {
  studioVersion: string;
  snapshotStatus: string;
  recoveryStatus: string;
  lastSnapshot: string;
}

export interface DashboardLeadIntelligence {
  bestLead: string;
  bestOffer: string;
  highestOpportunityScore: number;
  fastestRevenuePath: string;
  recommendedNextAction: string;
}

export interface DashboardOperatorMode {
  topLead: string;
  topOffer: string;
  topAction: string;
  studioStatus: string;
  todayAtAGlance: string;
}

export interface DashboardMobileCommandCenterSummary {
  topLead: string;
  topOffer: string;
  topAction: string;
  followUpsWaiting: number;
  openOpportunities: number;
  studioStatus: string;
  revenueStatus: string;
  todayAtAGlance: string;
  learningStatus: string;
  replyRate: string;
  bestOffer: string;
  bestLeadType: string;
  adaptiveLearningStatus: string;
  adaptiveLearningInfluence: string;
  adaptiveBestCategory: string;
  adaptiveBestOffer: string;
  adaptiveRecommendation: string;
  runtimeHealth: string;
  architectureStatus: string;
}

export interface DashboardDailyLeadDiscovery {
  newLeadsToday: number;
  topNewLead: string;
  topFiveLeads: string;
  bestOffer: string;
  recommendedNextAction: string;
}

export interface DashboardWebDiscovery {
  newWebLeads: number;
  topWebLead: string;
  topPainSignal: string;
  bestNewQaOpportunity: string;
  recommendedResearchAction: string;
  newLeadsToday: number;
  newPainSignals: number;
  topOpportunity: string;
  bestNewLead: string;
  leadSource: string;
  discoveryDate: string;
}

export interface DashboardLeadQualification {
  bestQualifiedLead: string;
  bestCategory: string;
  highestQaOpportunity: string;
  recommendedOffer: string;
  qualifiedLeadsCount: number;
}

export interface DashboardAutonomousRunner {
  autonomousRunnerStatus: string;
  lastSuccessfulRun: string;
  nextScheduledRun: string;
  runnerHealth: string;
  dailyRefreshStatus: string;
}

export interface DashboardRevenueIntelligence {
  revenueIntelligenceStatus: string;
  currentTopLead: string;
  actionableLead: string;
  commercialReadiness: string;
  evidenceBlockers: string;
  rotationStatus: string;
  revenueTarget: string;
  recommendedOffer: string;
  executionPriority: string;
}

export interface DashboardTopLeadAudit {
  topLeadAuditStatus: string;
  evidenceStatus: string;
  proposalStatus: string;
  executionReadiness: string;
}

export interface DashboardEvidenceEngine {
  evidenceStatus: string;
  lighthouseStatus: string;
  screenshotStatus: string;
  readinessStatus: string;
  pageStatus: string;
  flowStatus: string;
  commercialReadiness: string;
}

export interface DashboardClientDelivery {
  clientName: string;
  clientStatus: string;
  selectedPackage: string;
  deliveryReadiness: string;
  deliveryStatus: string;
  nextDeliveryAction: string;
}

export interface DashboardAutomationDelivery {
  automationStatus: string;
  criticalFlowCount: number;
  deliveryAssets: number;
  frameworkStatus: string;
  clientHandoffStatus: string;
  deliveryStatus: string;
}

export interface DashboardRetainerOperations {
  retainerStatus: string;
  clientHealth: string;
  coverageStatus: string;
  maintenanceStatus: string;
  renewalStatus: string;
  expansionOpportunities: number;
}

export interface DashboardCommercialUx {
  todayFocus: string;
  revenueHero: string;
  potentialValue: string;
  nextAction: string;
  target: string;
  offer: string;
  priority: string;
  decision: string;
}

export interface DashboardArchitectureHealth {
  architectureStatus: string;
  commandHealth: string;
  runtimeHealth: string;
  consolidationProgress: string;
  commandsAudited: number;
  duplicateCommandGroups: number;
  legacyCommands: number;
  candidateDeprecations: number;
  runtimeFiles: number;
  duplicateRuntimeCandidates: number;
  sourceOfTruthAuthorities: number;
}

export interface DashboardTestingHealth {
  testingStatus: string;
  coverageStatus: string;
  qualityGateStatus: string;
  ciStatus: string;
  skippedTests: number;
  requiredCategories: number;
  missingCategories: number;
}

export interface DashboardWebIntelligenceQuality {
  intelligenceQuality: string;
  evidenceConfidence: string;
  companyConfidence: string;
  falsePositiveRisk: string;
  readinessStatus: string;
  acceptedEvidence: number;
  suspiciousEvidence: number;
  rejectedEvidence: number;
}

export interface DashboardData {
  generatedAt: string;
  mode: 'read-only';
  today: {
    date: string;
    topActions: DashboardActionCard[];
    revenuePriorities: string[];
    followUpsDue: number;
    proposalReviews: string[];
  };
  leads: {
    totalLeads: number;
    topLeads: DashboardCompanyScore[];
    highestOpportunityScores: DashboardCompanyScore[];
  };
  outreach: {
    invitationsSent: number;
    messagesSent: number;
    connected: number;
    replies: number;
    followUpsDue: number;
  };
  audits: {
    auditReportsGenerated: number;
    unifiedAudits: number;
    evidenceAvailable: number;
  };
  proposals: {
    proposalReady: string[];
    needsReview: string[];
    retainerCandidates: string[];
  };
  revenue: {
    bestAuditOpportunity: string;
    bestStarterPackOpportunity: string;
    bestRetainerOpportunity: string;
  };
  systemHealth: {
    lastUpdate: string;
    leadResearchStatus: string;
    evidenceStatus: string;
    proposalStatus: string;
    dashboardStatus: string;
  };
  studio: DashboardStudioStatus;
  revenueActivation: DashboardRevenueActivation;
  executionPack: DashboardExecutionPack;
  outcomeTracking: DashboardOutcomeTracking;
  outcomeLearning: DashboardOutcomeLearning;
  adaptiveRevenue: DashboardAdaptiveRevenue;
  revenueLearning: DashboardRevenueLearning;
  followUpEngine: DashboardFollowUpEngine;
  winLossIntelligence: DashboardWinLossIntelligence;
  studioSnapshot: DashboardStudioSnapshot;
  leadIntelligence: DashboardLeadIntelligence;
  operatorMode: DashboardOperatorMode;
  mobileCommandCenterSummary: DashboardMobileCommandCenterSummary;
  dailyLeadDiscovery: DashboardDailyLeadDiscovery;
  webDiscovery: DashboardWebDiscovery;
  leadQualification: DashboardLeadQualification;
  autonomousRunner: DashboardAutonomousRunner;
  revenueIntelligence: DashboardRevenueIntelligence;
  topLeadAudit: DashboardTopLeadAudit;
  evidenceEngine: DashboardEvidenceEngine;
  clientDelivery: DashboardClientDelivery;
  automationDelivery: DashboardAutomationDelivery;
  retainerOperations: DashboardRetainerOperations;
  commercialUx: DashboardCommercialUx;
  architecture: DashboardArchitectureHealth;
  testing: DashboardTestingHealth;
  webIntelligence: DashboardWebIntelligenceQuality;
  mobileCommandCenter: DashboardMobileCenter;
  safety: string[];
}

interface OutreachRecord {
  status: string;
  messageType: string;
  nextFollowUpAt: string | null;
}

const outputDir = path.join(process.cwd(), 'output', 'dashboard');
const dashboardDir = path.join(process.cwd(), 'dashboard');
const dashboardStatePath = path.join(process.cwd(), 'data', 'dashboard', 'dashboard.json');
const outreachPath = path.join(process.cwd(), 'data', 'outreach', 'outreach.json');

export function buildPwaDashboardData(): DashboardData {
  const input = loadDailyRevenueLoopInput();
  const dayPlan = buildDailyRevenuePlan(input);
  const daySummary = buildDailyRevenueSummary(input);
  const weekReview = buildWeeklyRevenueReview(input);
  const opportunitySummary = buildOpportunitySummary();
  const auditPortfolio = buildUnifiedAuditPortfolio();
  const proposalPortfolio = buildProposalPortfolio();
  const studioReport = buildStudioConsolidationReport();
  const revenueActivationReport = buildRevenueActivationReport();
  const executionPack = buildFirstRevenueExecutionPack();
  const outcomeSummary = buildOutcomeSummary(loadOutcomes());
  const outcomeLearning = buildOutcomeLearningDashboard();
  const adaptiveRevenue = buildAdaptiveRevenueDashboard();
  const adaptiveRevenueReport = buildAdaptiveRevenueReport();
  const revenueLearning = buildRevenueLearningDashboard();
  const followUpReport = buildFollowUpOperatingReport();
  const winLossReport = buildWinLossReport();
  const snapshotState = readSnapshotState();
  const leadIntelligenceReport = buildLeadIntelligenceReport();
  const revenueIntelligenceReport = buildRevenueIntelligenceReport();
  const revenueIntelligenceDashboard = buildRevenueIntelligenceDashboard();
  const revenueTruth = getRevenueSourceOfTruth();
  const dailyLeadDiscovery = buildDailyLeadDiscoveryDashboard();
  const webDiscoveryLeadDashboard = buildWebDiscoveryDashboard();
  const leadQualificationDashboard = buildLeadQualificationDashboard();
  const autonomousRunnerDashboard = buildRunnerDashboard();
  const topLeadAuditDashboard = buildTopLeadAuditDashboard();
  const commercialUx = buildCommercialUxDashboard();
  const painMiningReport = buildPainMiningReport();
  const painMiningDashboard = buildPainMiningDashboard();
  const architectureAudit = buildArchitectureAudit();
  const testing = buildTestingReportBundle();
  const webIntelligence = buildWebIntelligenceReport();
  const dynamicEvidenceSummary = buildDynamicEvidenceSummary();
  const dynamicEvidenceDecision = buildEvidenceReadinessDecision(dynamicEvidenceSummary);
  const clientConversion = buildClientConversionDashboard();
  const deliveryRouter = buildDeliveryRouterDashboard();
  const automationDelivery = buildAutomationDeliveryDashboard();
  const retainerOperations = buildRetainerOperationsDashboard();
  const topLead = leadIntelligenceReport.leads[0];
  const unifiedTopLead = revenueIntelligenceReport.topLead;
  const operatorSummary = buildOperatorUxSummary();
  const dashboardTopLeadName = revenueTruth.topLead;
  const dashboardTopOffer = revenueTruth.recommendedOffer;
  const mobileTopAction = revenueTruth.nextAction;
  const outreach = readJson<OutreachRecord[]>(outreachPath, []);
  const proposalReady = proposalPortfolio.proposals.filter((proposal) => proposal.artifacts.markdownPath && proposal.artifacts.pdfPath);
  const topActions = unifiedDashboardActions(dayPlan.topActions, revenueTruth);
  const evidenceAvailable = [
    ...filesMatching('output/evidence', /-evidence\.md$/),
    ...filesMatching('output/lighthouse', /-lighthouse\.md$/),
    ...filesMatching('output/playwright-runner', /-playwright-evidence\.md$/),
  ].length;
  const auditReportLinks = linksForFiles('output/client-audit-reports', /-qa-audit-report\.(md|pdf)$/);
  const unifiedAuditLinks = linksForFiles('output/unified-audits', /-unified-audit\.md$/);
  const evidenceLinks = [
    ...linksForFiles('output/evidence', /-evidence\.md$/),
    ...linksForFiles('output/lighthouse', /-lighthouse\.md$/),
    ...linksForFiles('output/playwright-runner', /-playwright-evidence\.md$/),
  ];
  const proposalPdfLinks = linksForFiles('output/proposals', /-proposal\.pdf$/);
  const followUpLinks = linksForFiles('output/outreach-tracking', /\.(md)$/);
  const bestAuditOpportunity = proposalPortfolio.bestAuditCandidate?.companyName ?? 'No audit opportunity found';
  const bestStarterPackOpportunity = proposalPortfolio.bestStarterPackCandidate?.companyName ?? 'No starter-pack opportunity found';
  const bestRetainerOpportunity = proposalPortfolio.bestRetainerCandidate?.companyName ?? 'No retainer opportunity found';

  return {
    generatedAt: input.generatedAt,
    mode: 'read-only',
    today: {
      date: input.today,
      topActions,
      revenuePriorities: weekReview.nextWeekPriorities.slice(0, 3).map((action) => action.title),
      followUpsDue: dayPlan.followUpsDue,
      proposalReviews: dayPlan.profiles
        .filter((profile) => profile.proposalMarkdownExists || profile.proposalPdfExists)
        .map((profile) => profile.companyName),
    },
    leads: {
      totalLeads: opportunitySummary.reports.length,
      topLeads: [toRevenueTruthCompanyScore(revenueTruth)],
      highestOpportunityScores: [toRevenueTruthCompanyScore(revenueTruth)],
    },
    outreach: {
      invitationsSent: outreach.filter((record) => record.status === 'invitation-sent' || record.messageType.includes('invitation')).length,
      messagesSent: outreach.filter((record) => record.status === 'message-sent' || record.messageType.includes('message')).length,
      connected: outreach.filter((record) => record.status === 'connected').length,
      replies: outreach.filter((record) => record.status.includes('reply') || record.status.includes('replied')).length,
      followUpsDue: dayPlan.followUpsDue,
    },
    audits: {
      auditReportsGenerated: filesMatching('output/client-audit-reports', /-qa-audit-report\.md$/).length,
      unifiedAudits: auditPortfolio.reports.length,
      evidenceAvailable,
    },
    proposals: {
      proposalReady: proposalReady.map((proposal) => proposal.companyName),
      needsReview: proposalPortfolio.proposals.map((proposal) => `${proposal.companyName}: ${proposal.recommendedEngagement}`),
      retainerCandidates: retainerCandidates(proposalPortfolio.proposals),
    },
    revenue: {
      bestAuditOpportunity: dashboardTopLeadName,
      bestStarterPackOpportunity: dashboardTopLeadName,
      bestRetainerOpportunity: dashboardTopLeadName,
    },
    systemHealth: {
      lastUpdate: input.generatedAt,
      leadResearchStatus: `${daySummary.metrics.leadsResearched} research packs found`,
      evidenceStatus: `${daySummary.metrics.evidenceCollected} evidence files found`,
      proposalStatus: `${daySummary.metrics.proposalsGenerated} proposal packages found`,
      dashboardStatus: 'Ready: static local PWA data generated',
    },
    studio: {
      studioHealth: overallStudioHealth(studioReport.modules.map((module) => module.status)),
      releaseReadiness: releaseReadinessLabel(studioReport),
      systemStatus: studioReport.dailyOperation.canRunDaily,
      criticalIssues: studioReport.releaseReadiness.criticalIssues.length,
      warnings: studioReport.releaseReadiness.warnings.length,
      currentMrr: studioReport.revenueReadiness.currentMrr,
      readyForOutreach: studioReport.releaseReadiness.readyForOutreach,
      readyForAuditSales: studioReport.releaseReadiness.readyForAuditSales,
      readyForRetainers: studioReport.releaseReadiness.readyForRetainers,
      readyForClientDelivery: studioReport.releaseReadiness.readyForClientDelivery,
    },
    revenueActivation: {
      revenueActivation: revenueActivationReport.targets.find((target) => target.status === 'Current Focus')?.title ?? 'First Audit Sold',
      firstClientGoal: dashboardTopLeadName,
      firstRetainerGoal: dashboardTopLeadName,
      topRevenueTarget: dashboardTopLeadName,
      topRevenueAction: mobileTopAction,
      topActivationScore: revenueActivationReport.pipeline[0]?.activationScore ?? 0,
    },
    executionPack: {
      firstRevenueStatus: `${executionPack.topTarget.companyName}: ${executionPack.recommendation}`,
      goNoGo: executionPack.recommendation,
      remainingBlockers: executionPack.remainingBlockers.length,
      nextManualAction: executionPack.manualNextAction,
      estimatedRevenueValue: executionPack.estimatedRevenueValue,
      estimatedConfidenceScore: executionPack.estimatedConfidenceScore,
    },
    outcomeTracking: {
      status: outcomeSummary.hasOutcomes ? `${outcomeSummary.totalRecords} outcome record(s)` : 'No outcomes recorded yet.',
      messagesSent: outcomeSummary.messagesSent,
      replies: outcomeSummary.replies,
      meetings: outcomeSummary.meetings,
      proposals: outcomeSummary.proposals,
      wins: outcomeSummary.wins,
      losses: outcomeSummary.losses,
      replyRate: outcomeSummary.replyRate,
      nextManualMessage: `No outcomes recorded yet. Review the ${dashboardTopLeadName} message pack before any manual send.`,
    },
    outcomeLearning,
    adaptiveRevenue,
    revenueLearning,
    followUpEngine: {
      followUpQueue: followUpReport.dashboard.followUpQueue,
      todaysFollowUps: followUpReport.dashboard.todaysFollowUps,
      waitingResponses: followUpReport.dashboard.waitingResponses,
      openOpportunities: followUpReport.dashboard.openOpportunities,
      nextBestAction: followUpReport.dashboard.nextBestAction,
    },
    winLossIntelligence: {
      winRate: winLossReport.hasEnoughData ? winLossReport.metrics.closeRate : 'Insufficient outcome history.',
      replyRate: winLossReport.hasEnoughData ? winLossReport.metrics.replyRate : 'Insufficient outcome history.',
      bestOffer: winLossReport.hasEnoughData ? winLossReport.recommendations.highestConvertingOffer : 'Insufficient outcome history.',
      bestSegment: winLossReport.hasEnoughData ? winLossReport.recommendations.highestConvertingSegment : 'Insufficient outcome history.',
      topLearning: winLossReport.hasEnoughData ? winLossReport.recommendations.topLearning : 'Insufficient outcome history.',
      topRecommendation: winLossReport.hasEnoughData ? winLossReport.recommendations.topRecommendation : 'Insufficient outcome history.',
    },
    studioSnapshot: {
      studioVersion: snapshotState.version,
      snapshotStatus: snapshotState.snapshotStatus,
      recoveryStatus: snapshotState.recoveryStatus,
      lastSnapshot: snapshotState.lastSnapshot,
    },
    leadIntelligence: {
      bestLead: dashboardTopLeadName,
      bestOffer: dashboardTopOffer,
      highestOpportunityScore: unifiedTopLead?.qualificationScore ?? topLead?.overallScore ?? 0,
      fastestRevenuePath: unifiedTopLead ? 'Qualified Ranking -> Revenue Intelligence -> Manual review' : topLead?.fastestRevenuePath ?? 'No local revenue path found',
      recommendedNextAction: unifiedTopLead?.nextRevenueAction ?? (topLead ? `${topLead.recommendedActionType} - ${topLead.recommendedNextAction}` : 'No local next action found'),
    },
    operatorMode: {
      topLead: dashboardTopLeadName,
      topOffer: dashboardTopOffer,
      topAction: mobileTopAction,
      studioStatus: operatorSummary.studioStatus,
      todayAtAGlance: [
        `Top Lead: ${dashboardTopLeadName}`,
        `Offer: ${dashboardTopOffer}`,
        `Action: ${mobileTopAction}`,
      ].join(' | '),
    },
    mobileCommandCenterSummary: {
      topLead: dashboardTopLeadName,
      topOffer: dashboardTopOffer,
      topAction: mobileTopAction,
      followUpsWaiting: followUpReport.dashboard.waitingResponses,
      openOpportunities: followUpReport.dashboard.openOpportunities,
      studioStatus: operatorSummary.studioStatus,
      revenueStatus: `Current MRR: $${studioReport.revenueReadiness.currentMrr.toLocaleString('en-US')}`,
      learningStatus: outcomeLearning.outcomesRecorded > 0 ? `${outcomeLearning.outcomesRecorded} outcome(s) recorded` : 'No outcomes recorded yet.',
      replyRate: outcomeLearning.replyRate,
      bestOffer: outcomeLearning.topPerformingOffer,
      bestLeadType: buildOutcomeLearningAnalysis().topPerformingCategory,
      adaptiveLearningStatus: adaptiveRevenue.adaptiveLearningStatus,
      adaptiveLearningInfluence: adaptiveRevenue.learningInfluence,
      adaptiveBestCategory: adaptiveRevenue.bestPerformingCategory,
      adaptiveBestOffer: adaptiveRevenue.bestPerformingOffer,
      adaptiveRecommendation: adaptiveRevenueReport.adaptiveRecommendation,
      runtimeHealth: architectureAudit.runtimeHealth,
      architectureStatus: architectureAudit.architectureStatus,
      todayAtAGlance: [
        `Top Lead: ${dashboardTopLeadName}`,
        `Top Offer: ${dashboardTopOffer}`,
        `Action: ${mobileTopAction}`,
      ].join(' | '),
    },
    dailyLeadDiscovery,
    webDiscovery: {
      newWebLeads: webDiscoveryLeadDashboard.newWebLeads,
      topWebLead: webDiscoveryLeadDashboard.topWebLead,
      topPainSignal: painMiningDashboard.topPainSignal,
      bestNewQaOpportunity: webDiscoveryLeadDashboard.bestNewQaOpportunity,
      recommendedResearchAction: webDiscoveryLeadDashboard.recommendedResearchAction,
      newLeadsToday: webDiscoveryLeadDashboard.newLeadsToday,
      newPainSignals: painMiningReport.signals.filter((signal) => signal.date === input.today).length,
      topOpportunity: webDiscoveryLeadDashboard.topOpportunity,
      bestNewLead: webDiscoveryLeadDashboard.bestNewLead,
      leadSource: webDiscoveryLeadDashboard.leadSource,
      discoveryDate: webDiscoveryLeadDashboard.discoveryDate,
    },
    leadQualification: leadQualificationDashboard,
    autonomousRunner: autonomousRunnerDashboard,
    revenueIntelligence: revenueIntelligenceDashboard,
    topLeadAudit: topLeadAuditDashboard,
    evidenceEngine: {
      evidenceStatus: dynamicEvidenceDecision.evidenceStatus,
      lighthouseStatus: dynamicEvidenceDecision.lighthouseStatus,
      screenshotStatus: dynamicEvidenceDecision.screenshotStatus,
      readinessStatus: dynamicEvidenceDecision.status,
      pageStatus: dynamicEvidenceDecision.pageStatus,
      flowStatus: dynamicEvidenceDecision.flowStatus,
      commercialReadiness: dynamicEvidenceDecision.commercialReadiness,
    },
    clientDelivery: {
      clientName: clientConversion.clientName,
      clientStatus: clientConversion.clientStatus,
      selectedPackage: clientConversion.selectedPackage,
      deliveryReadiness: deliveryRouter.deliveryReadiness,
      deliveryStatus: deliveryRouter.deliveryStatus,
      nextDeliveryAction: deliveryRouter.nextDeliveryAction,
    },
    automationDelivery,
    retainerOperations,
    commercialUx,
    architecture: {
      architectureStatus: architectureAudit.architectureStatus,
      commandHealth: architectureAudit.commandHealth,
      runtimeHealth: architectureAudit.runtimeHealth,
      consolidationProgress: architectureAudit.consolidationProgress,
      commandsAudited: architectureAudit.commandInventory.totalCommands,
      duplicateCommandGroups: architectureAudit.commandInventory.duplicateCommandGroups.length,
      legacyCommands: architectureAudit.commandInventory.legacyCommands.length,
      candidateDeprecations: architectureAudit.commandInventory.candidateDeprecations.length,
      runtimeFiles: architectureAudit.runtimeInventory.totalFiles,
      duplicateRuntimeCandidates: architectureAudit.runtimeInventory.duplicateDataCandidates.length,
      sourceOfTruthAuthorities: architectureAudit.sourceOfTruth.length,
    },
    testing: {
      testingStatus: testing.readiness.testingStatus,
      coverageStatus: testing.readiness.coverageStatus,
      qualityGateStatus: testing.readiness.qualityGateStatus,
      ciStatus: testing.readiness.ciStatus,
      skippedTests: testing.readiness.skippedTests,
      requiredCategories: testing.readiness.requiredCategories,
      missingCategories: testing.readiness.missingCategories,
    },
    webIntelligence: {
      intelligenceQuality: webIntelligence.readiness.status,
      evidenceConfidence: `${webIntelligence.readiness.evidenceConfidence}/100`,
      companyConfidence: `${webIntelligence.readiness.companyConfidence}/100`,
      falsePositiveRisk: `${webIntelligence.rejectedEvidence.length} rejected, ${webIntelligence.suspiciousEvidence.length} suspicious`,
      readinessStatus: webIntelligence.readiness.status,
      acceptedEvidence: webIntelligence.acceptedEvidence.length,
      suspiciousEvidence: webIntelligence.suspiciousEvidence.length,
      rejectedEvidence: webIntelligence.rejectedEvidence.length,
    },
    mobileCommandCenter: {
      reviewCenter: {
        auditsReady: auditPortfolio.reports.length,
        proposalsReady: proposalReady.length,
        evidenceReady: evidenceAvailable,
        followUpsReady: dayPlan.followUpsDue,
      },
      revenueCenter: {
        bestAuditOpportunity: dashboardTopLeadName,
        bestStarterPackOpportunity: dashboardTopLeadName,
        bestRetainerOpportunity: dashboardTopLeadName,
        highestRevenuePriority: mobileTopAction,
      },
      actionQueue: topActions,
      auditCenter: {
        auditReportsAvailable: auditReportLinks.length,
        unifiedAuditsAvailable: unifiedAuditLinks.length,
        evidenceAvailable,
        auditReadiness: `${auditPortfolio.reports.length} unified audits and ${auditReportLinks.length} client audit report files available`,
        links: [...auditReportLinks, ...unifiedAuditLinks, ...evidenceLinks].slice(0, 12),
      },
      proposalCenter: {
        proposalPdfs: proposalPdfLinks,
        proposalStatus: proposalPortfolio.proposals.map((proposal) => `${proposal.companyName}: ${proposal.recommendedEngagement}`),
        retainerCandidates: retainerCandidates(proposalPortfolio.proposals),
      },
      followUpCenter: {
        followUpsDue: followUpReport.dashboard.todaysFollowUps,
        outreachStatus: `${outreach.length} outreach records, ${outreach.filter((record) => record.status === 'message-sent').length} messages sent, ${outreach.filter((record) => record.status === 'connected').length} connected`,
        contactStatus: `${input.contacts.reduce((sum, group) => sum + group.contacts.length, 0)} contacts recorded`,
        links: followUpLinks,
      },
    },
    safety: [
      'Dashboard is read-only.',
      'No outreach, emails, proposals, invoices, payments, data edits, APIs, credentials, or external actions are performed.',
      'Opportunity rankings are planning signals only; no revenue is invented.',
    ],
  };
}

function overallStudioHealth(statuses: string[]): string {
  if (statuses.includes('Not Ready')) return 'Not Ready';
  if (statuses.includes('Warning')) return 'Warning';
  return 'Healthy';
}

function unifiedDashboardActions(
  legacyActions: Array<{
    priority: number;
    title: string;
    whyItMatters: string;
    estimatedImpact: string;
    recommendedNextStep: string;
    companyName?: string;
  }>,
  source: ReturnType<typeof getRevenueSourceOfTruth>,
): DashboardActionCard[] {
  const warnings = legacyActions
    .filter((action) => action.companyName && action.companyName !== source.topLead)
    .slice(0, 3)
    .map((action) => `Legacy action suppressed: ${action.companyName} is not the Revenue Intelligence top lead.`);

  return [
    {
      priority: 1,
      title: `Review ${source.topLead} package`,
      whyItMatters: `Revenue Intelligence is the source of truth. Current decision: ${source.revenueDecision}.`,
      estimatedImpact: source.executionPriorityDetail,
      nextStep: source.nextAction,
    },
    {
      priority: 2,
      title: `Confirm ${source.topLead} readiness`,
      whyItMatters: 'Keeps daily execution aligned with the unified top lead instead of legacy lead queues.',
      estimatedImpact: `Recommended offer: ${source.recommendedOffer}.`,
      nextStep: 'Review Revenue Intelligence, message pack, evidence, and readiness blockers manually.',
    },
    {
      priority: 3,
      title: 'Review consistency warnings',
      whyItMatters: warnings.length > 0 ? warnings.join(' ') : 'No legacy top-lead conflicts detected in daily plan input.',
      estimatedImpact: 'Prevents legacy leads from becoming the visible revenue priority.',
      nextStep: 'Use Revenue Intelligence as the only source for commercial decisions.',
    },
  ];
}

function releaseReadinessLabel(data: ReturnType<typeof buildStudioConsolidationReport>): string {
  if (data.releaseReadiness.criticalIssues.length > 0) return 'Not Ready';
  if (data.releaseReadiness.warnings.length > 0) return 'Needs Review';
  return 'Ready';
}

export function writeDashboardData(data: DashboardData): string[] {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(dashboardDir, { recursive: true });
  fs.mkdirSync(path.dirname(dashboardStatePath), { recursive: true });

  const outputJsonPath = path.join(outputDir, 'dashboard.json');
  const frontendJsonPath = path.join(dashboardDir, 'dashboard.json');
  const stateJson = {
    generatedAt: data.generatedAt,
    mode: data.mode,
    source: 'output/dashboard/dashboard.json',
    notes: data.safety,
  };

  fs.writeFileSync(outputJsonPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  fs.writeFileSync(frontendJsonPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  fs.writeFileSync(dashboardStatePath, `${JSON.stringify(stateJson, null, 2)}\n`, 'utf8');

  return [
    outputJsonPath,
    frontendJsonPath,
    dashboardStatePath,
  ];
}

function toCompanyScores(reports: OpportunityReport[]): DashboardCompanyScore[] {
  return reports.map((report) => ({
    companyId: report.companyId,
    companyName: report.companyName,
    score: report.confidenceScore,
    detail: report.bestFirstOffer,
  }));
}

function toRevenueTruthCompanyScore(source: ReturnType<typeof getRevenueSourceOfTruth>): DashboardCompanyScore {
  return {
    companyId: source.topLead.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'lead',
    companyName: source.topLead,
    score: source.executionPriority === 'HIGH' ? 100 : source.executionPriority === 'MEDIUM' ? 75 : 50,
    detail: source.recommendedOffer,
  };
}

function retainerCandidates(proposals: ProposalPackage[]): string[] {
  return [...proposals]
    .sort((left, right) => {
      const leftScore = left.opportunityScore + left.evidenceReadiness;
      const rightScore = right.opportunityScore + right.evidenceReadiness;
      return rightScore - leftScore || left.companyName.localeCompare(right.companyName);
    })
    .slice(0, 3)
    .map((proposal) => `${proposal.companyName}: ${proposal.retainerPath.join(' -> ')}`);
}

function filesMatching(relativeDir: string, pattern: RegExp): string[] {
  const absoluteDir = path.join(process.cwd(), relativeDir);
  if (!fs.existsSync(absoluteDir)) return [];
  return fs.readdirSync(absoluteDir).filter((fileName) => pattern.test(fileName));
}

function linksForFiles(relativeDir: string, pattern: RegExp): DashboardLink[] {
  return filesMatching(relativeDir, pattern).map((fileName) => ({
    label: fileName,
    href: `../${relativeDir}/${fileName}`,
  }));
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  const raw = fs.readFileSync(filePath, 'utf8').trim();
  if (!raw) return fallback;
  return JSON.parse(raw) as T;
}
