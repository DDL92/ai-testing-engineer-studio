export type EvidenceProStatus = 'READY' | 'PARTIAL' | 'NOT AVAILABLE';

export interface EvidenceProTarget {
  companyId: string;
  companyName: string;
  website: string;
  source: 'Contact-Ready Operational Lead' | 'Lead Rotation Actionable Lead';
}

export interface HarEvidence {
  path: string | null;
  requestCount: number;
  failedRequests: number;
  redirects: number;
  slowRequests: number;
}

export interface TraceEvidence {
  path: string | null;
  navigationSteps: string[];
  screenshotCount: number;
  consoleTimelineCount: number;
}

export interface VideoEvidence {
  path: string | null;
  viewport: string;
  durationMs: number | null;
}

export interface PerformanceMetrics {
  domContentLoadedMs: number | null;
  loadEventMs: number | null;
  firstPaintMs: number | null;
  largestContentfulPaintMs: number | null;
}

export interface PageWeightMetrics {
  pageSizeBytes: number;
  javascriptBytes: number;
  cssBytes: number;
  imageBytes: number;
  requestCount: number;
}

export interface DependencySignal {
  host: string;
  requestCount: number;
  resourceTypes: string[];
  description: string;
}

export interface GroupedEvidenceSignal {
  source: 'console' | 'network';
  level: 'observed signal' | 'potential area to review';
  signature: string;
  count: number;
  examples: string[];
}

export interface EvidenceProReport {
  generatedAt: string;
  target: EvidenceProTarget;
  requestedUrl: string;
  finalUrl: string;
  statusCode: number | null;
  status: EvidenceProStatus;
  har: HarEvidence;
  trace: TraceEvidence;
  video: VideoEvidence;
  performance: PerformanceMetrics;
  pageWeight: PageWeightMetrics;
  dependencies: DependencySignal[];
  groupedSignals: GroupedEvidenceSignal[];
  screenshotPaths: string[];
  lighthousePaths: string[];
  collectionNotes: string[];
  safetyRules: string[];
}

export interface EvidenceProDashboard {
  evidencePackageStatus: string;
  performanceStatus: string;
  traceStatus: string;
  videoStatus: string;
}
