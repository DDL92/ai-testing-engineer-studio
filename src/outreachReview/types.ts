import { ClientReadinessCandidate } from '../clientReadiness/types';
import { ContactReviewRecord } from '../contactReview/types';
import { RevenuePriorityOpportunity } from '../revenueCommandCenter/types';

export type OutreachReviewStatus = 'READY' | 'PARTIAL' | 'NOT READY';
export type ContactDecisionOutcome = 'SEND' | 'NEEDS RESEARCH' | 'DO NOT SEND';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface OutreachReviewItem {
  rank: number;
  company: string;
  leadId: string;
  readiness: OutreachReviewStatus;
  researchStatus: string;
  outreachStatus: string;
  auditStatus: string;
  proposalStatus: string;
  riskLevel: RiskLevel;
  nextAction: string;
  priority: number;
  offerType: string;
  auditPath: string;
  retainerPath: string;
  confidence: ConfidenceLevel;
  missingData: string[];
  recommendedManualResearch: string[];
  blockingIssues: string[];
  candidate: ClientReadinessCandidate;
  opportunity?: RevenuePriorityOpportunity;
}

export interface ContactDecision {
  outcome: ContactDecisionOutcome;
  why: string[];
  missingItems: string[];
  confidence: ConfidenceLevel;
  nextAction: string;
}

export interface SendReadinessItem {
  item: string;
  ready: boolean;
  evidence: string;
}

export interface OutreachReviewReport {
  generatedAt: string;
  items: OutreachReviewItem[];
  pushPress?: OutreachReviewItem;
  pushPressContact?: ContactReviewRecord;
  contactDecision: ContactDecision;
  sendReadiness: SendReadinessItem[];
  readyPercentage: number;
  notReadyPercentage: number;
}
