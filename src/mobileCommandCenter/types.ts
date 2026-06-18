import { Client } from '../clientReports/types';
import { Lead } from '../leads/types';

export type MobileSystemHealthStatus = 'GREEN' | 'YELLOW' | 'RED';

export interface MobileContextSource {
  label: string;
  path: string;
  exists: boolean;
  excerpt: string;
}

export interface MobileReportGroupHealth {
  label: string;
  status: MobileSystemHealthStatus;
  availableReports: string[];
  missingReports: string[];
}

export interface MobileAction {
  title: string;
  source: string;
  command: string;
  approvalRequired: string;
}

export interface MobileOpportunity {
  company: string;
  score: number;
  status: string;
  recommendedOffer: string;
  nextAction: string;
  source: string;
}

export interface MobileRevenueSnapshot {
  bookedMrr: number;
  projectedMrr: string;
  auditOpportunities: number;
  retainerOpportunities: number;
  revenueSource: string;
  consistencyWarnings: string[];
}

export interface MobileClientStatus {
  active: number;
  pending: number;
  paused: number;
  completed: number;
  notes: string[];
}

export interface MobileFollowUpItem {
  company: string;
  dueDate: string;
  channel: string;
  action: string;
  source: string;
}

export interface MobileCommandCenterInput {
  generatedAt: string;
  today: string;
  leads: Lead[];
  clients: Client[];
  contextSources: MobileContextSource[];
}

export interface MobileCommandCenterReport {
  generatedAt: string;
  today: string;
  topActions: MobileAction[];
  topOpportunities: MobileOpportunity[];
  revenueSnapshot: MobileRevenueSnapshot;
  clientStatus: MobileClientStatus;
  followUpQueue: MobileFollowUpItem[];
  approvalsNeeded: string[];
  systemHealth: MobileSystemHealthStatus;
  reportGroups: MobileReportGroupHealth[];
  contextSources: MobileContextSource[];
}

export interface MobileState {
  version: number;
  mode: 'read-only-review';
  lastGeneratedAt: string | null;
  notes: string[];
}

export interface MobileLink {
  label: string;
  href: string;
}

export interface MobileReviewItem {
  label: string;
  value: string;
  links: MobileLink[];
}

export interface MobileQueueItem {
  priority: number;
  title: string;
  reason: string;
  impact: string;
  recommendedAction: string;
}

export interface MobileReviewPackage {
  generatedAt: string;
  mode: 'read-only-review';
  reviewCenter: MobileReviewItem[];
  revenueCenter: MobileReviewItem[];
  actionQueue: MobileQueueItem[];
  auditCenter: MobileReviewItem[];
  proposalCenter: MobileReviewItem[];
  followUpCenter: MobileReviewItem[];
  safety: string[];
}

export interface MobileCommandCenterSummary {
  generatedAt: string;
  topLead: string;
  actionableLead: string;
  commercialReadiness: string;
  topOffer: string;
  topAction: string;
  estimatedTime: string;
  decisionNeeded: string;
  followUpsWaiting: number;
  openOpportunities: number;
  studioStatus: string;
  revenueStatus: string;
  todayAtAGlance: string;
  currentMrr: number;
  firstClientStatus: string;
  revenueActivationReadiness: string;
  bestAction: string;
  studioHealth: string;
  revenueHealth: string;
  nextManualStep: string;
  outcomeStatus: string;
  todaysDiscoveredLeads: string;
  topPainSignal: string;
  bestOpportunity: string;
  bestQualifiedLead: string;
  topQualifiedLeads: string;
  bestQualifiedOffer: string;
  highestQaOpportunity: string;
  lastRefresh: string;
  newLeadsToday: string;
  newPainSignals: string;
  topQualifiedLead: string;
  todaysRecommendedAction: string;
  currentTopLead: string;
  auditStatus: string;
  topLeadAuditStatus: string;
  topLeadExecutionReadiness: string;
  learningStatus: string;
  learningReplyRate: string;
  learningBestOffer: string;
  learningBestLeadType: string;
  adaptiveLearningInfluence: string;
  adaptiveBestCategory: string;
  adaptiveBestOffer: string;
  adaptiveRecommendation: string;
  nextRevenueAction: string;
  executionPriority: string;
  commercialTarget: string;
  commercialOffer: string;
  commercialPotentialValue: string;
  commercialPriority: string;
  commercialDecision: string;
  commercialAction: string;
  architectureStatus: string;
  commandHealth: string;
  runtimeHealth: string;
  consolidationProgress: string;
  testingStatus: string;
  qualityGateStatus: string;
  ciStatus: string;
  intelligenceStatus: string;
  companyConfidence: string;
  evidenceConfidence: string;
  evidenceStatus: string;
  readinessStatus: string;
  lighthouseStatus: string;
  clientStatus: string;
  clientPackage: string;
  deliveryStatus: string;
  automationStatus: string;
  criticalFlowCount: string;
  retainerStatus: string;
  healthStatus: string;
  coverageStatus: string;
  renewalStatus: string;
  revenueLearningStatus: string;
  learningBestChannel: string;
  revenueLearningBestOffer: string;
  calibrationStatus: string;
  safetyRules: string[];
}

export interface MobileActionCenterItem {
  priority: 1 | 2 | 3;
  action: string;
  why: string;
  manualStep: string;
}
