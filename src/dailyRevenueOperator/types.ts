import { Client } from '../clientReports/types';
import {
  CurrencyRange,
  RevenueAction,
  RevenueCommandCenterReport,
  RevenuePriorityOpportunity,
  RetainerOpportunity,
} from '../revenueCommandCenter/types';

export interface DailyRevenueContextSource {
  label: string;
  path: string;
  exists: boolean;
  excerpt: string;
}

export interface DailyRevenueInput {
  generatedAt: string;
  today: string;
  revenueReport: RevenueCommandCenterReport;
  contextSources: DailyRevenueContextSource[];
}

export interface DailyRevenueSnapshot {
  bookedMrr: number;
  projectedMrr: CurrencyRange;
  auditOpportunities: number;
  retainerOpportunities: number;
}

export interface DailyRevenueOpportunity {
  company: string;
  opportunityType: string;
  readiness: string;
  revenuePotential: string;
  nextStep: string;
  command: string;
  score: number;
}

export interface DailyRevenueRisk {
  category: 'pipeline risk' | 'proposal risk' | 'renewal risk' | 'concentration risk' | 'no-client risk';
  severity: 'GREEN' | 'YELLOW' | 'RED';
  detail: string;
  nextReview: string;
}

export interface DailyRevenueNextAction {
  priority: number;
  title: string;
  reason: string;
  expectedOutcome: string;
  approvalRequired: string;
  command: string;
  sourceAction?: RevenueAction;
}

export interface RevenueConsistencyCheck {
  module: string;
  status: 'PASS' | 'WARNING' | 'FIXED';
  detail: string;
}

export interface RevenueConsistencyReport {
  generatedAt: string;
  revenueCommandCenterBookedMrr: number;
  modulesChecked: RevenueConsistencyCheck[];
  inconsistenciesFound: string[];
  fixesApplied: string[];
  remainingWarnings: string[];
}

export interface DailyRevenueOperatorReport {
  generatedAt: string;
  today: string;
  snapshot: DailyRevenueSnapshot;
  topRevenueOpportunities: DailyRevenueOpportunity[];
  revenueRisks: DailyRevenueRisk[];
  renewalWatch: Client[];
  proposalWatch: RevenuePriorityOpportunity[];
  clientExpansionWatch: Client[];
  recommendedActions: DailyRevenueNextAction[];
  consistencyReport: RevenueConsistencyReport;
  contextSources: DailyRevenueContextSource[];
}

export type RevenueSourceOpportunity = RevenuePriorityOpportunity | RetainerOpportunity;
