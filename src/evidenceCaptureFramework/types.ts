export type FutureEvidenceType =
  | 'playwright-evidence'
  | 'lighthouse-evidence'
  | 'screenshot-evidence'
  | 'accessibility-evidence'
  | 'performance-evidence'
  | 'console-evidence'
  | 'network-evidence'
  | 'manual-review-evidence';

export type CaptureStatus = 'Not Yet Implemented';

export type ReadinessValue = number | 'Not Yet Implemented';

export interface EvidenceStandardField {
  name: string;
  required: boolean;
  notes: string;
}

export interface FutureEvidenceSource {
  type: FutureEvidenceType;
  source: string;
  status: CaptureStatus;
  purpose: string;
  futureUse: string;
  implementationPriority: number;
}

export interface StorageArchitectureEntry {
  path: string;
  purpose: string;
}

export interface CaptureFrameworkData {
  frameworkName: string;
  status: 'architecture-only';
  standardFields: string[];
  futureEvidenceTypes: FutureEvidenceSource[];
  storageArchitecture: StorageArchitectureEntry[];
  readinessScoring: string[];
  safetyRules: string[];
}

export interface EvidencePriority {
  priority: number;
  source: string;
  evidenceType: FutureEvidenceType;
  why: string;
  status: CaptureStatus;
}

export interface CaptureRoadmapData {
  roadmapName: string;
  status: 'architecture-only';
  recommendedNextSprint: string;
  priorities: EvidencePriority[];
}

export interface ReadinessFramework {
  collectionReadiness: ReadinessValue;
  storageReadiness: ReadinessValue;
  auditReadiness: ReadinessValue;
  proposalReadiness: ReadinessValue;
  retainerReadiness: ReadinessValue;
}

export interface EvidenceCapturePlan {
  currentState: string[];
  futureState: string[];
  missingComponents: string[];
  recommendedNextSprint: string;
  readinessSummary: ReadinessFramework;
  evidenceStandard: EvidenceStandardField[];
  futureEvidenceSources: FutureEvidenceSource[];
  storageArchitecture: StorageArchitectureEntry[];
  safetyRules: string[];
}

export interface EvidenceRoadmap {
  recommendedNextSprint: string;
  priorities: EvidencePriority[];
  readinessSummary: ReadinessFramework;
  safetyRules: string[];
}
