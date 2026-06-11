import { Client } from '../clientReports/types';
import { Lead } from '../leads/types';
import { OpportunityItem } from '../pipeline/types';
import { PipelinePrioritizationReport, PriorityAction, PrioritizedOpportunity } from '../pipelinePrioritization/types';

export type MacCommandStatus = 'success' | 'failure';
export type MacHealthStatus = 'GREEN' | 'YELLOW' | 'RED';

export interface MacDailyCommand {
  script: string;
  command: string;
  expectedOutputs: string[];
}

export interface MacDailyCommandResult extends MacDailyCommand {
  status: MacCommandStatus;
  startedAt: string;
  completedAt: string;
  generatedOutputs: string[];
  errorMessage?: string;
}

export interface MacSystemHealthCheck {
  label: string;
  status: MacHealthStatus;
  details: string;
}

export interface MacDailyData {
  generatedAt: string;
  totalLeads: number;
  commercialLeads: Lead[];
  demoLeadCount: number;
  clients: Client[];
  estimatedMrr: number;
  topCommercialOpportunities: OpportunityItem[];
  pipelineReport: PipelinePrioritizationReport;
  topActions: PriorityAction[];
  followUps: OpportunityItem[];
  renewalRisks: Client[];
  expansionOpportunities: Client[];
  healthChecks: MacSystemHealthCheck[];
}

export interface MacDailyOutputPaths {
  summary: string;
  executedReports: string;
  systemHealth: string;
  actionCockpit: string;
}

export interface MacDailyRenderInput {
  data: MacDailyData;
  commandResults?: MacDailyCommandResult[];
}

export type MacOpportunityLike = OpportunityItem | PrioritizedOpportunity;
