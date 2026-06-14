import fs = require('fs');
import path = require('path');
import {
  buildDailyRevenuePlan,
  buildDailyRevenueSummary,
  buildWeeklyRevenueReview,
  loadDailyRevenueLoopInput,
} from '../dailyRevenueLoop/dailyLoopRules';
import { buildRunnerDashboard } from '../autonomousRunner/runnerRules';
import { buildDailyLeadDiscoveryDashboard } from '../dailyLeadDiscovery/discoveryRules';
import { buildLeadIntelligenceReport } from '../leadIntelligence/leadRules';
import { buildOperatorUxSummary } from '../operatorUx/uxRules';
import { buildOpportunitySummary } from '../opportunityEngine/opportunityEngineRules';
import { OpportunityReport } from '../opportunityEngine/types';
import { buildFirstRevenueExecutionPack } from '../executionPack/generateFirstRevenueChecklist';
import { buildFollowUpOperatingReport } from '../followUpEngine/followUpRules';
import { buildOutcomeSummary, loadOutcomes } from '../outcomeTracking/outcomeRules';
import { buildProposalPortfolio } from '../proposalEngine/proposalRules';
import { ProposalPackage } from '../proposalEngine/types';
import { buildRevenueActivationReport } from '../revenueActivation/revenueRules';
import { buildStudioConsolidationReport } from '../studioConsolidation/studioRules';
import { readSnapshotState } from '../studioSnapshot/snapshotRules';
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
  const followUpReport = buildFollowUpOperatingReport();
  const winLossReport = buildWinLossReport();
  const snapshotState = readSnapshotState();
  const leadIntelligenceReport = buildLeadIntelligenceReport();
  const dailyLeadDiscovery = buildDailyLeadDiscoveryDashboard();
  const webDiscoveryLeadDashboard = buildWebDiscoveryDashboard();
  const leadQualificationDashboard = buildLeadQualificationDashboard();
  const autonomousRunnerDashboard = buildRunnerDashboard();
  const painMiningReport = buildPainMiningReport();
  const painMiningDashboard = buildPainMiningDashboard();
  const topLead = leadIntelligenceReport.leads[0];
  const operatorSummary = buildOperatorUxSummary();
  const mobileTopAction = topLead
    ? `Review ${topLead.companyName} message pack, executive summary, audit PDF, and proposal PDF; decide SEND / WAIT / REWRITE manually.`
    : operatorSummary.topAction;
  const outreach = readJson<OutreachRecord[]>(outreachPath, []);
  const proposalReady = proposalPortfolio.proposals.filter((proposal) => proposal.artifacts.markdownPath && proposal.artifacts.pdfPath);
  const topActions = dayPlan.topActions.map((action) => ({
    priority: action.priority,
    title: action.title,
    whyItMatters: action.whyItMatters,
    estimatedImpact: action.estimatedImpact,
    nextStep: action.recommendedNextStep,
  }));
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
      topLeads: toCompanyScores(opportunitySummary.commercialPriorities.slice(0, 5)),
      highestOpportunityScores: toCompanyScores([...opportunitySummary.reports].sort((left, right) => right.confidenceScore - left.confidenceScore).slice(0, 5)),
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
      bestAuditOpportunity,
      bestStarterPackOpportunity,
      bestRetainerOpportunity,
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
      firstClientGoal: revenueActivationReport.firstClientPlan.bestCompany,
      firstRetainerGoal: revenueActivationReport.firstRetainerPlan.mostLikelyRetainerCandidate,
      topRevenueTarget: revenueActivationReport.pipeline[0]?.companyName ?? 'No target found',
      topRevenueAction: revenueActivationReport.focusActions[0]?.title ?? 'Review revenue focus',
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
      nextManualMessage: outcomeSummary.nextManualMessage,
    },
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
      bestLead: topLead?.companyName ?? 'No lead found',
      bestOffer: topLead?.recommendedOffer ?? 'No offer found',
      highestOpportunityScore: topLead?.overallScore ?? 0,
      fastestRevenuePath: topLead?.fastestRevenuePath ?? 'No local revenue path found',
      recommendedNextAction: topLead ? `${topLead.recommendedActionType} - ${topLead.recommendedNextAction}` : 'No local next action found',
    },
    operatorMode: {
      topLead: operatorSummary.topLead,
      topOffer: operatorSummary.topOffer,
      topAction: operatorSummary.topAction,
      studioStatus: operatorSummary.studioStatus,
      todayAtAGlance: operatorSummary.todayAtAGlance.join(' | '),
    },
    mobileCommandCenterSummary: {
      topLead: topLead?.companyName ?? operatorSummary.topLead,
      topOffer: topLead?.recommendedOffer ?? operatorSummary.topOffer,
      topAction: mobileTopAction,
      followUpsWaiting: followUpReport.dashboard.waitingResponses,
      openOpportunities: followUpReport.dashboard.openOpportunities,
      studioStatus: operatorSummary.studioStatus,
      revenueStatus: `Current MRR: $${studioReport.revenueReadiness.currentMrr.toLocaleString('en-US')}`,
      todayAtAGlance: [
        `Top Lead: ${topLead?.companyName ?? operatorSummary.topLead}`,
        `Top Offer: ${topLead?.recommendedOffer ?? operatorSummary.topOffer}`,
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
    mobileCommandCenter: {
      reviewCenter: {
        auditsReady: auditPortfolio.reports.length,
        proposalsReady: proposalReady.length,
        evidenceReady: evidenceAvailable,
        followUpsReady: dayPlan.followUpsDue,
      },
      revenueCenter: {
        bestAuditOpportunity,
        bestStarterPackOpportunity,
        bestRetainerOpportunity,
        highestRevenuePriority: topActions[0]?.title ?? 'No priority action found',
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
