export type AuditStatus = 'Ready' | 'Warning' | 'Missing' | 'Stale' | 'Broken';

export interface FileAuditItem {
  label: string;
  path: string;
  status: AuditStatus;
  detail: string;
}

export interface CommandAuditItem {
  command: string;
  status: AuditStatus;
  script: string;
  detail: string;
}

export interface LinkAuditItem {
  href: string;
  status: AuditStatus;
  resolvedPath: string;
}

export interface DashboardReadiness {
  status: AuditStatus;
  files: FileAuditItem[];
  requiredData: FileAuditItem[];
  brokenLinks: LinkAuditItem[];
  detail: string;
}

export interface PushPressReadiness {
  status: AuditStatus;
  requiredFiles: FileAuditItem[];
  detail: string;
}

export interface HardeningReport {
  generatedAt: string;
  overallStatus: AuditStatus;
  commandAudit: CommandAuditItem[];
  outputAudit: FileAuditItem[];
  staleReports: FileAuditItem[];
  dashboardReadiness: DashboardReadiness;
  pushPressReadiness: PushPressReadiness;
  mondayChecklist: string[];
  criticalIssues: string[];
  warnings: string[];
  safetyRules: string[];
}
