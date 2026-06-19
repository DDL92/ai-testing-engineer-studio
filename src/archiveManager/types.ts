export type ArchiveClassification =
  | 'ACTIVE'
  | 'HISTORICAL'
  | 'PORTFOLIO'
  | 'EXAMPLE'
  | 'TEMPORARY'
  | 'ARCHIVE_CANDIDATE';

export type ArchiveStatus = 'HEALTHY' | 'WATCH' | 'AT RISK';

export interface ArchiveArtifact {
  path: string;
  classification: ArchiveClassification;
  reason: string;
  recommendation: string;
  sizeBytes: number;
  modifiedAt: string;
  staleDays: number;
  publicSafe: 'YES' | 'REVIEW' | 'NO';
  containsRuntimeData: boolean;
  portfolioValue: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE';
  duplicateGroup?: string;
}

export interface GeneratedReportSummary {
  activeReports: number;
  historicalReports: number;
  duplicateReports: number;
  staleReports: number;
}

export interface ArchiveScore {
  score: number;
  status: ArchiveStatus;
  operationalCleanliness: number;
  historicalManagement: number;
  portfolioManagement: number;
  temporaryManagement: number;
  retentionCoverage: number;
}

export interface ArchiveReport {
  generatedAt: string;
  artifacts: ArchiveArtifact[];
  historical: ArchiveArtifact[];
  portfolio: ArchiveArtifact[];
  generatedReports: ArchiveArtifact[];
  temporary: ArchiveArtifact[];
  examples: ArchiveArtifact[];
  archiveCandidates: ArchiveArtifact[];
  reportSummary: GeneratedReportSummary;
  totalSizeBytes: number;
  temporarySizeBytes: number;
  score: ArchiveScore;
  retentionPolicy: Record<ArchiveClassification, string>;
  safetyRules: string[];
}

export interface ArchiveDashboard {
  archiveStatus: ArchiveStatus;
  historicalArtifacts: number;
  portfolioAssets: number;
  temporaryAssets: number;
  retentionStatus: string;
  archiveScore: string;
}
