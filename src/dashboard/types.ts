import { Client } from '../clientReports/types';
import { RevenueSummary } from '../metrics/types';
import { OpportunityTracker } from '../pipeline/types';

export interface DashboardData {
  generatedAt: string;
  status: 'local-ready' | 'needs-review';
  pipeline: OpportunityTracker;
  revenue: RevenueSummary;
  activeClients: Client[];
  systemHealth: DashboardSystemHealth;
}

export interface DashboardSystemHealth {
  typecheckStatus: string;
  pipelineStatus: string;
  readinessStatus: string;
}

export interface RevenueScenario {
  label: 'Conservative' | 'Expected' | 'Optimistic';
  retainers: number;
  monthlyRange: {
    min: number;
    max: number;
  };
}

export interface RevenueVisibilityData {
  generatedAt: string;
  estimatedMrr: number;
  activeClients: Client[];
  tierAOpportunityEstimate: {
    min: number;
    max: number;
  };
  tierBOpportunityEstimate: {
    min: number;
    max: number;
  };
  scenarios: RevenueScenario[];
  pipeline: OpportunityTracker;
}
