export type ConsistencyStatus = 'PASS' | 'WARNING' | 'FAIL';
export type ConsistencySeverity = 'INFO' | 'WARNING' | 'FAIL';
export type ConsistencyArea = 'references' | 'dashboard' | 'mobile' | 'runner' | 'outputs' | 'sources';

export interface CommercialReferenceFinding {
  area: ConsistencyArea;
  severity: ConsistencySeverity;
  file: string;
  line: number;
  reference: string;
  detail: string;
  recommendation: string;
}

export interface ConsistencyScan {
  area: ConsistencyArea;
  status: ConsistencyStatus;
  actionableLead: string;
  scannedFiles: number;
  findings: CommercialReferenceFinding[];
}

export interface CommercialConsistencyReport {
  generatedAt: string;
  status: ConsistencyStatus;
  actionableLead: string;
  topRankedLead: string;
  sourceOfTruthStatus: ConsistencyStatus;
  scans: ConsistencyScan[];
  legacyReferences: number;
  conflictingReferences: number;
  hardcodedCommercialReferences: number;
  repairRecommendations: string[];
  safetyRules: string[];
}

export interface CommercialConsistencyDashboard {
  commercialConsistencyStatus: string;
  legacyReferences: number;
  sourceOfTruthStatus: string;
  conflictingReferences: number;
  repairRecommendations: number;
}
