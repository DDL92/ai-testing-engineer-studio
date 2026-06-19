export type HealthLevel = 'PASS' | 'WARNING' | 'FAIL';
export type DoctorStatus = 'HEALTHY' | 'WATCH' | 'AT RISK';

export interface HealthIssue {
  level: HealthLevel;
  area: string;
  path: string;
  message: string;
  recommendation: string;
}

export interface CommandHealth {
  status: HealthLevel;
  totalCommands: number;
  healthyCommands: number;
  brokenCommands: number;
  deprecatedCommands: number;
  duplicateCommands: number;
  issues: HealthIssue[];
}

export interface RuntimeHealth {
  status: HealthLevel;
  runtimeFiles: number;
  generatedFiles: number;
  cacheFiles: number;
  temporaryFiles: number;
  duplicateFiles: number;
  emptyFiles: number;
  oversizedFiles: number;
  invalidJsonFiles: number;
  issues: HealthIssue[];
}

export interface OutputHealth {
  status: HealthLevel;
  requiredReports: number;
  presentReports: number;
  missingReports: string[];
  staleReports: string[];
  unexpectedReports: string[];
  issues: HealthIssue[];
}

export interface ComponentHealth {
  status: HealthLevel;
  checkedItems: number;
  healthyItems: number;
  issues: HealthIssue[];
}

export interface SourceOfTruthHealth extends ComponentHealth {
  authorities: Array<{
    authority: string;
    path: string;
    status: 'Healthy' | 'Missing' | 'Inconsistent' | 'Conflicting';
    detail: string;
  }>;
}

export interface StudioHealthReport {
  generatedAt: string;
  score: number;
  doctorStatus: DoctorStatus;
  architectureScore: number;
  commandScore: number;
  runtimeScore: number;
  dashboardScore: number;
  evidenceScore: number;
  testingScore: number;
  commands: CommandHealth;
  runtime: RuntimeHealth;
  outputs: OutputHealth;
  sourceOfTruth: SourceOfTruthHealth;
  dashboard: ComponentHealth;
  mobile: ComponentHealth;
  evidence: ComponentHealth;
  repairRecommendations: string[];
  backupRecommendations: string[];
  cleanupRecommendations: string[];
  safetyRules: string[];
}

export interface StudioHealthDashboard {
  studioHealth: string;
  commandHealth: string;
  runtimeHealth: string;
  evidenceHealth: string;
  doctorStatus: DoctorStatus;
  repairRecommendations: number;
}
