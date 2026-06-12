export type StabilizationStatus = 'GREEN' | 'YELLOW' | 'RED';
export type WorkflowStageStatus = 'implemented' | 'partial' | 'missing';

export interface OsHealthArea {
  name: string;
  status: StabilizationStatus;
  requiredPaths: string[];
  availablePaths: string[];
  missingPaths: string[];
  notes: string[];
}

export interface CommandAuditItem {
  command: string;
  script: string;
  purpose: string;
  status: StabilizationStatus;
  duplicateRisk: string;
  replacementRecommendation: string;
}

export interface ReportAuditItem {
  path: string;
  status: StabilizationStatus;
  duplicateRisk: string;
  sourceOfTruthRisk: string;
  notes: string[];
}

export interface RevenueAuditResult {
  revenueCommandCenterMrr?: number;
  checkedReports: {
    label: string;
    path: string;
    mrr?: number;
    status: StabilizationStatus;
    warning: string;
  }[];
  demoRevenueWarnings: string[];
  consistencyWarnings: string[];
}

export interface WorkflowAuditStage {
  stage: string;
  status: WorkflowStageStatus;
  evidence: string[];
  missing: string[];
}

export interface DocumentationAuditResult {
  readmeStatus: StabilizationStatus;
  commandReferenceStatus: StabilizationStatus;
  roadmapStatus: StabilizationStatus;
  missingCommands: string[];
  staleReferences: string[];
  notes: string[];
}

export interface ReadinessScore {
  score: number;
  commandConsistency: number;
  reportConsistency: number;
  workflowCompleteness: number;
  revenueConsistency: number;
  documentationCompleteness: number;
  healthStatus: number;
  requiredWorkRemaining: string[];
}

export interface OsStabilizationReport {
  generatedAt: string;
  healthAreas: OsHealthArea[];
  commandAudit: CommandAuditItem[];
  reportAudit: ReportAuditItem[];
  revenueAudit: RevenueAuditResult;
  workflowAudit: WorkflowAuditStage[];
  documentationAudit: DocumentationAuditResult;
  criticalIssues: string[];
  warnings: string[];
  readinessScore: ReadinessScore;
}
