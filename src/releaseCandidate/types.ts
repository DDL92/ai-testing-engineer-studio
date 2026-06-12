import { ClientReadinessCandidate } from '../clientReadiness/types';
import { CommandAuditItem, OsStabilizationReport, WorkflowAuditStage } from '../osStabilization/types';
import { RevenueCommandCenterReport } from '../revenueCommandCenter/types';

export type ReleaseCheckStatus = 'PASS' | 'WARNING' | 'FAIL';
export type ReleaseRecommendation = 'NOT READY' | 'CANDIDATE' | 'READY';
export type CommandInventoryStatus = 'active' | 'legacy' | 'overlapping';
export type CommandCategory = 'Lead' | 'Revenue' | 'Client' | 'Operations' | 'Reporting' | 'Dashboard' | 'Mobile' | 'System';

export interface ReleaseCheckItem {
  area: string;
  status: ReleaseCheckStatus;
  evidence: string[];
  notes: string[];
}

export interface ReleaseScoreCategory {
  category: 'Architecture' | 'Commands' | 'Reports' | 'Revenue' | 'Workflows' | 'Documentation' | 'System Health';
  score: number;
  status: ReleaseCheckStatus;
  notes: string[];
}

export interface ReleaseScore {
  overall: number;
  recommendation: ReleaseRecommendation;
  categories: ReleaseScoreCategory[];
}

export interface ArchitectureLayer {
  name: string;
  purpose: string;
  inputs: string[];
  outputs: string[];
}

export interface CommandInventoryItem {
  category: CommandCategory;
  command: string;
  purpose: string;
  status: CommandInventoryStatus;
  note: string;
}

export interface WorkflowInventoryItem {
  stage: string;
  status: WorkflowAuditStage['status'];
  supportingReports: string[];
  supportingCommands: string[];
  missing: string[];
}

export interface FirstClientReadinessItem {
  company: string;
  readiness: 'READY' | 'PARTIAL' | 'NOT READY';
  proposalStatus: string;
  outreachStatus: string;
  auditStatus: string;
  nextAction: string;
  sourceLeadId?: string;
}

export interface ReleaseCandidateReport {
  generatedAt: string;
  releaseChecks: ReleaseCheckItem[];
  releaseScore: ReleaseScore;
  architecture: ArchitectureLayer[];
  commands: CommandInventoryItem[];
  workflows: WorkflowInventoryItem[];
  revenue: RevenueCommandCenterReport;
  firstClientReadiness: FirstClientReadinessItem[];
  closestLead?: FirstClientReadinessItem;
  knownWarnings: string[];
  stabilization: OsStabilizationReport;
  clientReadinessCandidates: ClientReadinessCandidate[];
  commandAudit: CommandAuditItem[];
}
