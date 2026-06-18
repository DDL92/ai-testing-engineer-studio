import { ClientRecord } from '../clientConversion/types';

export type RetainerHealthStatus = 'HEALTHY' | 'WATCH' | 'AT RISK';
export type RenewalReadinessStatus = 'NOT READY' | 'READY FOR REVIEW' | 'RECOMMENDED';
export type CoverageFlowStatus = 'AUTOMATED' | 'PLANNED' | 'PENDING';

export interface CoverageFlow {
  name: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  status: CoverageFlowStatus;
  accessBoundary: 'public-only' | 'client-access-required';
  recommendedNextStep: string;
}

export interface RetainerHealth {
  healthScore: number;
  coverageScore: number;
  maintenanceScore: number;
  reportingScore: number;
  relationshipScore: number;
  status: RetainerHealthStatus;
  reasons: string[];
}

export interface RenewalReadiness {
  status: RenewalReadinessStatus;
  businessValueSummary: string[];
  coverageValueSummary: string[];
  recommendedRenewalPath: string[];
  blockers: string[];
}

export interface RetainerOperationalMetrics {
  coveragePercent: number;
  criticalFlowsCount: number;
  automatedFlowsCount: number;
  plannedFlowsCount: number;
  pendingFlowsCount: number;
  maintenanceTasks: number;
  reportStatus: string;
  clientHealthStatus: RetainerHealthStatus;
  renewalReadiness: RenewalReadinessStatus;
}

export interface RetainerOperationsReport {
  generatedAt: string;
  client: ClientRecord;
  retainerStatus: 'PLANNING' | 'READY FOR REVIEW' | 'NEEDS CLIENT INPUT';
  monthlyRoadmap: {
    month1: string[];
    month2: string[];
    month3: string[];
  };
  coverage: CoverageFlow[];
  coverageTarget: string;
  recommendedNextCoverage: string;
  maintenance: {
    weekly: string[];
    monthly: string[];
  };
  weeklyReportTemplate: {
    executiveSummary: string[];
    automationStatus: string[];
    coverageStatus: string[];
    observedSignals: string[];
    recommendations: string[];
    nextActions: string[];
  };
  monthlyReportTemplate: {
    executiveSummary: string[];
    coverageGrowth: string[];
    maintenanceSummary: string[];
    automationStatus: string[];
    recommendations: string[];
    renewalRecommendation: string[];
    expansionRecommendation: string[];
  };
  health: RetainerHealth;
  renewal: RenewalReadiness;
  expansionOpportunities: string[];
  metrics: RetainerOperationalMetrics;
  safetyRules: string[];
}

export interface RetainerOperationsDashboard {
  retainerStatus: string;
  clientHealth: string;
  coverageStatus: string;
  maintenanceStatus: string;
  renewalStatus: string;
  expansionOpportunities: number;
}
