export type RunnerCommandStatus = 'success' | 'failed' | 'skipped';

export type RunnerHealthStatus = 'Healthy' | 'Warning' | 'Needs Review';

export interface RunnerCommandDefinition {
  script: string;
  description: string;
  phase: 'discovery' | 'qualification' | 'revenue' | 'planning' | 'dashboard' | 'mobile';
}

export interface RunnerCommandResult {
  script: string;
  description: string;
  phase: RunnerCommandDefinition['phase'];
  status: RunnerCommandStatus;
  exitCode: number | null;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  outputTail: string;
  errorTail: string;
}

export interface RunnerState {
  version: number;
  mode: 'local-only-human-approved';
  schedule: {
    weekdays: string[];
    time: string;
    timezone: string;
  };
  sequence: RunnerCommandDefinition[];
  safetyRules: string[];
  updatedAt: string;
}

export interface RunnerLastRun {
  runId: string;
  mode: 'test' | 'scheduled';
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  success: boolean;
  commandsExecuted: RunnerCommandResult[];
  warnings: string[];
}

export interface RunnerPlan {
  generatedAt: string;
  nextScheduledRun: string;
  sequence: RunnerCommandDefinition[];
  safetyRules: string[];
}

export interface RunnerHealthCheck {
  label: string;
  status: RunnerHealthStatus;
  detail: string;
}

export interface RunnerHealthReport {
  generatedAt: string;
  status: RunnerHealthStatus;
  checks: RunnerHealthCheck[];
  warnings: string[];
  lastRun: RunnerLastRun | null;
  nextScheduledRun: string;
}

export interface RunnerDashboardSummary {
  autonomousRunnerStatus: string;
  lastSuccessfulRun: string;
  nextScheduledRun: string;
  runnerHealth: string;
  dailyRefreshStatus: string;
}
