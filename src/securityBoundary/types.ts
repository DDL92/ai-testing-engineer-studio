export type SecuritySeverity = 'High' | 'Medium' | 'Low';

export interface BoundaryRule {
  id: string;
  label: string;
  severity: SecuritySeverity;
  description: string;
  pathPrefixes?: string[];
  exactPaths?: string[];
  fileNames?: string[];
  remediation: string;
}

export interface InventoryItem {
  path: string;
  ruleId: string;
  label: string;
  severity: SecuritySeverity;
  tracked: boolean;
  sizeBytes: number;
  recommendedAction: string;
}

export interface GitignoreCheck {
  pattern: string;
  present: boolean;
}

export interface SecurityAudit {
  generatedAt: string;
  repoRoot: string;
  inventory: InventoryItem[];
  gitignoreChecks: GitignoreCheck[];
  trackedPrivatePaths: InventoryItem[];
  remediationCommands: string[];
}

export interface DashboardPolicyResult {
  allowed: boolean;
  status: number;
  reason: string;
  filePath?: string;
  contentType?: string;
}

export interface DashboardSecurityCase {
  label: string;
  requestPath: string;
  expectedAllowed: boolean;
  actualAllowed: boolean;
  status: number;
  reason: string;
}
