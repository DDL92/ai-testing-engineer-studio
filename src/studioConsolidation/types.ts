export type StudioHealthStatus = 'Healthy' | 'Warning' | 'Not Ready';
export type StudioCommandStatus = 'Present' | 'Missing' | 'Needs Review';
export type StudioReadinessStatus = 'Ready' | 'Needs Review' | 'Not Ready';

export interface StudioState {
  schemaVersion: number;
  updatedAt: string;
  releaseName: string;
  dailyOperatorEnabled: boolean;
  mobileDashboardEnabled: boolean;
  notes: string[];
}

export interface StudioModuleHealth {
  module: string;
  status: StudioHealthStatus;
  available: string[];
  missing: string[];
  notes: string[];
}

export interface StudioCommandCheck {
  command: string;
  status: StudioCommandStatus;
  script?: string;
  notes: string[];
}

export interface StudioAssetCheck {
  label: string;
  status: StudioHealthStatus;
  evidence: string[];
  missing: string[];
  notes: string[];
}

export interface RevenueReadiness {
  leadPipelineReady: StudioReadinessStatus;
  auditPipelineReady: StudioReadinessStatus;
  proposalPipelineReady: StudioReadinessStatus;
  clientDeliveryReady: StudioReadinessStatus;
  financeReady: StudioReadinessStatus;
  currentMrr: number;
  notes: string[];
}

export interface DailyOperationPlan {
  canRunDaily: StudioReadinessStatus;
  dailyCommands: string[];
  weeklyCommands: string[];
  monthlyCommands: string[];
  checklist: string[];
}

export interface ReleaseReadiness {
  criticalIssues: string[];
  warnings: string[];
  recommendations: string[];
  readyForOutreach: StudioReadinessStatus;
  readyForAuditSales: StudioReadinessStatus;
  readyForRetainers: StudioReadinessStatus;
  readyForClientDelivery: StudioReadinessStatus;
}

export interface StudioConsolidationReport {
  generatedAt: string;
  state: StudioState;
  modules: StudioModuleHealth[];
  commands: StudioCommandCheck[];
  dashboard: StudioAssetCheck[];
  mobile: StudioAssetCheck[];
  revenueReadiness: RevenueReadiness;
  dailyOperation: DailyOperationPlan;
  releaseReadiness: ReleaseReadiness;
  safetyRules: string[];
}
