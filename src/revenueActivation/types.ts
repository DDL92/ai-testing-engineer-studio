import { ApprovedFirstOffer } from '../opportunityEngine/types';

export type RevenueTargetStatus = 'Complete' | 'Current Focus' | 'Next' | 'Blocked';

export interface RevenueTarget {
  order: number;
  title: 'First Audit Sold' | 'First Starter Pack Sold' | 'First Retainer Sold' | '$3,000 MRR';
  status: RevenueTargetStatus;
  currentValue: string;
  nextAction: string;
}

export interface RevenueActivationScore {
  companyId: string;
  companyName: string;
  opportunityScore: number;
  evidenceReadiness: number;
  proposalReadiness: number;
  contactReadiness: number;
  auditReadiness: number;
  activationScore: number;
  bestContact: string;
  bestOffer: ApprovedFirstOffer;
  nextAction: string;
  why: string;
  blockers: string[];
}

export interface RevenueFocusAction {
  priority: 1 | 2 | 3;
  title: string;
  companyName: string;
  reason: string;
  command: string;
  approvalBoundary: string;
}

export interface FirstClientPlan {
  bestCompany: string;
  bestContact: string;
  bestOffer: ApprovedFirstOffer;
  bestNextAction: string;
  why: string;
}

export interface FirstRetainerPlan {
  mostLikelyRetainerCandidate: string;
  recommendedPath: string[];
  expectedBlockers: string[];
  nextAction: string;
}

export interface RevenueActivationReport {
  generatedAt: string;
  targets: RevenueTarget[];
  pipeline: RevenueActivationScore[];
  focusActions: RevenueFocusAction[];
  firstClientPlan: FirstClientPlan;
  firstRetainerPlan: FirstRetainerPlan;
  currentMrr: number;
  safetyRules: string[];
}
