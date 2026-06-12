import { Client } from '../clientReports/types';
import { CurrencyRange, RevenueCommandCenterReport } from '../revenueCommandCenter/types';

export type ActionCockpitHealthStatus = 'GREEN' | 'YELLOW' | 'RED';

export interface ActionCockpitContextSource {
  label: string;
  path: string;
  exists: boolean;
  excerpt: string;
}

export interface ActionCockpitInput {
  generatedAt: string;
  today: string;
  revenueReport: RevenueCommandCenterReport;
  clients: Client[];
  contextSources: ActionCockpitContextSource[];
}

export interface CockpitAction {
  title: string;
  reason: string;
  expectedOutcome: string;
  command: string;
  approvalRequired: string;
}

export interface CockpitOpportunity {
  company: string;
  opportunityType: string;
  readiness: string;
  nextStep: string;
  revenuePotential: string;
  command: string;
  score: number;
}

export interface CockpitRevenueSnapshot {
  bookedMrr: number;
  projectedMrr: CurrencyRange;
  auditOpportunities: number;
  retainerOpportunities: number;
}

export interface CockpitApprovalItem {
  item: string;
  category: 'outreach review' | 'proposal review' | 'SOW review' | 'audit review' | 'client onboarding review' | 'revenue review';
  reason: string;
  command: string;
  approvalRequired: string;
}

export interface CockpitFollowUpItem {
  company: string;
  reason: string;
  recommendedTiming: string;
  command: string;
}

export interface CockpitSystemHealthGroup {
  label: string;
  status: ActionCockpitHealthStatus;
  availableReports: string[];
  missingReports: string[];
}

export interface ActionCockpitReport {
  generatedAt: string;
  today: string;
  topActions: CockpitAction[];
  topOpportunities: CockpitOpportunity[];
  revenueSnapshot: CockpitRevenueSnapshot;
  activeClients: Client[];
  atRiskClients: Client[];
  pausedClients: Client[];
  renewalWatch: Client[];
  followUpWatchlist: CockpitFollowUpItem[];
  approvalQueue: CockpitApprovalItem[];
  systemHealth: ActionCockpitHealthStatus;
  systemHealthGroups: CockpitSystemHealthGroup[];
  nextRecommendedCommand: string;
  contextSources: ActionCockpitContextSource[];
}
