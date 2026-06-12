import { ActionCockpitReport, CockpitApprovalItem, CockpitFollowUpItem, CockpitOpportunity } from '../actionCockpit/types';
import { RevenueCommandCenterReport } from '../revenueCommandCenter/types';

export type OperatorDashboardHealthStatus = 'GREEN' | 'YELLOW' | 'RED';

export interface OperatorDashboardSource {
  label: string;
  path: string;
  exists: boolean;
  excerpt: string;
}

export interface OperatorDashboardHealthGroup {
  label: string;
  status: OperatorDashboardHealthStatus;
  availableReports: string[];
  missingReports: string[];
}

export interface OperatorDashboardExecutiveSummary {
  systemHealth: OperatorDashboardHealthStatus;
  bookedMrr: number;
  projectedMrr: string;
  auditOpportunities: number;
  retainerOpportunities: number;
  commercialLeads: number;
  approvalItems: number;
  topRisk: string;
  topOpportunity: string;
}

export interface OperatorDashboardInput {
  generatedAt: string;
  today: string;
  actionCockpit: ActionCockpitReport;
  revenueReport: RevenueCommandCenterReport;
  commercialLeads: number;
  contextSources: OperatorDashboardSource[];
}

export interface OperatorDashboardReport {
  generatedAt: string;
  today: string;
  executiveSummary: OperatorDashboardExecutiveSummary;
  actionCockpit: ActionCockpitReport;
  revenueReport: RevenueCommandCenterReport;
  opportunities: CockpitOpportunity[];
  approvals: CockpitApprovalItem[];
  followUps: CockpitFollowUpItem[];
  healthGroups: OperatorDashboardHealthGroup[];
  nextRecommendedCommand: string;
  contextSources: OperatorDashboardSource[];
}
