export type RecoveryStatus = 'Ready' | 'Warning' | 'Missing';

export interface SnapshotModule {
  name: string;
  purpose: string;
  inputs: string[];
  outputs: string[];
  commands: string[];
}

export interface CommandInventoryItem {
  command: string;
  module: string;
  description: string;
  script: string;
  expectedOutputs: string[];
}

export interface SourceInventoryItem {
  path: string;
  purpose: string;
  files: string[];
}

export interface RecoveryCheckItem {
  label: string;
  status: RecoveryStatus;
  detail: string;
}

export interface StudioSnapshotReport {
  generatedAt: string;
  projectName: string;
  currentVersion: string;
  currentStatus: string;
  majorModules: SnapshotModule[];
  revenueReadiness: string;
  dashboardStatus: string;
  mobileStatus: string;
  financeStatus: string;
  clientDeliveryStatus: string;
  releaseReadiness: string;
  commands: CommandInventoryItem[];
  dataSources: SourceInventoryItem[];
  outputSources: SourceInventoryItem[];
  recoveryChecks: RecoveryCheckItem[];
  recoveryStatus: RecoveryStatus;
  safetyRules: string[];
}
