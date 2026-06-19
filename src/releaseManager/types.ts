export type ReleaseValidationStatus = 'PASS' | 'WARNING' | 'FAIL' | 'NOT RUN';
export type ReleaseCommandStatus = 'ACTIVE' | 'LEGACY' | 'DEPRECATED CANDIDATE';
export type ReleaseCommandCategory = 'Core' | 'Revenue' | 'Delivery' | 'Evidence' | 'Health' | 'Archive' | 'Other';

export interface ReleaseCommand {
  name: string;
  script: string;
  category: ReleaseCommandCategory;
  status: ReleaseCommandStatus;
}

export interface ValidationGateResult {
  command: string;
  status: 'PASS' | 'FAIL';
  exitCode: number | null;
  durationMs: number;
  summary: string;
}

export interface StudioVersionMetrics {
  version: string;
  commandCount: number;
  moduleCount: number;
  reportCount: number;
  testSpecCount: number;
  testCaseCount: number;
  fileCount: number;
}

export interface StudioReleaseReport {
  generatedAt: string;
  releaseDate: string;
  version: string;
  releaseStatus: 'RELEASE LOCKED' | 'REVIEW REQUIRED';
  featureStatus: 'FEATURE COMPLETE';
  revenueModeStatus: string;
  testingStatus: string;
  architectureStatus: string;
  validationStatus: ReleaseValidationStatus;
  metrics: StudioVersionMetrics;
  commands: ReleaseCommand[];
  validationResults: ValidationGateResult[];
  safetyRules: string[];
}

export interface ReleaseDashboard {
  studioVersion: string;
  releaseStatus: string;
  revenueModeStatus: string;
  validationStatus: string;
}
