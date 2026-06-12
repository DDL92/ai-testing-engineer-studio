export type PlaywrightEvidenceType =
  | 'homepage-evidence'
  | 'navigation-evidence'
  | 'form-evidence'
  | 'cta-evidence'
  | 'mobile-evidence'
  | 'console-evidence'
  | 'network-evidence'
  | 'user-flow-evidence';

export type AllowedFutureFlow =
  | 'Homepage'
  | 'Navigation'
  | 'Demo Request'
  | 'Contact Form'
  | 'Pricing'
  | 'Booking'
  | 'Scheduling'
  | 'Signup'
  | 'Onboarding';

export type ReadinessValue = 'Not Ready' | 'Partially Ready' | 'Ready';

export type ReadinessCategoryName =
  | 'Framework Readiness'
  | 'Storage Readiness'
  | 'Evidence Readiness'
  | 'Audit Readiness'
  | 'Execution Readiness';

export interface PlaywrightTarget {
  companyId: string;
  companyName: string;
  priority: number;
  recommendedFirstFlow: AllowedFutureFlow;
  reason: string;
  researchGaps: string[];
}

export interface PlaywrightReadinessCategory {
  category: ReadinessCategoryName;
  value: ReadinessValue;
  reason: string;
}

export interface PlaywrightReadinessData {
  frameworkName: string;
  status: 'planning-only';
  readinessCategories: PlaywrightReadinessCategory[];
  futureEvidenceTypes: PlaywrightEvidenceType[];
  allowedFutureFlows: AllowedFutureFlow[];
  futureExecutionCommand: string;
  safetyRules: string[];
}

export interface SourceAvailability {
  label: string;
  path: string;
  available: boolean;
}

export interface TargetPriorityReport extends PlaywrightTarget {
  readiness: ReadinessValue;
  sourceAvailability: SourceAvailability[];
}

export interface PlaywrightEvidencePlan {
  targets: TargetPriorityReport[];
  readinessCategories: PlaywrightReadinessCategory[];
  futureEvidenceTypes: PlaywrightEvidenceType[];
  allowedFutureFlows: AllowedFutureFlow[];
  storagePlan: string[];
  futureExecutionCommand: string;
  safetyRules: string[];
}

export interface PlaywrightReadinessReport {
  categories: PlaywrightReadinessCategory[];
  targetPriorities: TargetPriorityReport[];
  storagePlan: string[];
  safetyRules: string[];
  futureExecutionCommand: string;
}
